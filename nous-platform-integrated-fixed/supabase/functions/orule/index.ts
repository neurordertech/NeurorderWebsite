import { createClient } from "supabase";

import {
  runBoyRos,
} from "../_shared/boyros/index.ts";

import type {
  BoyRosInput,
  BoyRosPermission,
  BoyRosSignal,
} from "../_shared/boyros/index.ts";

type OruleRequest = {
  signals?: BoyRosSignal[];
  grantedPermissions?: BoyRosPermission[];
  revokedPermissions?: BoyRosPermission[];
  organisationId?: string | null;
  message?: string;
  space?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "method_not_allowed",
        message:
          "O.R.U.L.E. accepts POST requests only.",
      },
      405,
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        {
          success: false,
          error: "runtime_configuration_error",
          message:
            "The O.R.U.L.E. runtime is not configured.",
        },
        500,
      );
    }

    const authorization =
      request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          error: "authentication_required",
          message:
            "A signed-in NOUS identity is required.",
        },
        401,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse(
        {
          success: false,
          error: "invalid_identity",
          message:
            "The supplied NOUS identity could not be verified.",
        },
        401,
      );
    }

    let body: OruleRequest;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "invalid_json",
          message:
            "The request body must contain valid JSON.",
        },
        400,
      );
    }

    const boyRosInput: BoyRosInput = {
      identity: {
        userId: userData.user.id,
        organisationId:
          body.organisationId ?? null,
        email:
          userData.user.email ?? null,
      },

      consent: {
        grantedPermissions:
          body.grantedPermissions ?? [],
        revokedPermissions:
          body.revokedPermissions ?? [],
      },

      signals:
        Array.isArray(body.signals) ? body.signals : [],
    };

    const result =
      runBoyRos(boyRosInput);

    const safeContext = {
      priority:
        result.priority,

      observations:
        result.observations,

      currentFocus:
        result.contextForOrule
          .currentFocus,

      upcomingCommitments:
        result.contextForOrule
          .upcomingCommitments,

      possibleRisks:
        result.contextForOrule
          .possibleRisks,

      possibleOpportunities:
        result.contextForOrule
          .possibleOpportunities,
    };

    return jsonResponse({
      success: true,
      message:
        "O.R.U.L.E. processed the supplied context.",
      context: safeContext,
      request: {
        space: body.space ?? "home",
        messageReceived: Boolean(body.message?.trim()),
      },
      processing: {
        acceptedSignals:
          result.acceptedSignalCount,
        rejectedSignals:
          result.rejectedSignalCount,
        processedAt:
          result.processedAt,
      },
    });
  } catch (error) {
    console.error(
      "Unhandled O.R.U.L.E. error:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error: "unexpected_error",
        message:
          "An unexpected O.R.U.L.E. error occurred.",
      },
      500,
    );
  }
});