import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

type ConsentAction =
  | "list"
  | "grant"
  | "deny"
  | "withdraw"
  | "check";

type ConsentRequest = {
  action?: ConsentAction;
  purposeKey?: string;
  policyVersion?: string;
  evidence?: Record<string, unknown>;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        {
          error: "Server configuration is incomplete.",
        },
        500,
      );
    }

    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          error: "Authentication is required.",
        },
        401,
      );
    }

    /*
     * This client receives the caller's access token.
     * Database Row Level Security therefore applies as that user.
     */
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
          error: "The supplied user session is invalid or expired.",
        },
        401,
      );
    }

    const userId = userData.user.id;

    let body: ConsentRequest = {};

    if (request.method !== "GET") {
      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          {
            error: "The request body must contain valid JSON.",
          },
          400,
        );
      }
    }

    const url = new URL(request.url);

    const action =
      body.action ??
      url.searchParams.get("action") as ConsentAction | null ??
      "list";

    const purposeKey =
      body.purposeKey ??
      url.searchParams.get("purposeKey") ??
      undefined;

    /*
     * GET /nous-consent
     * POST { "action": "list" }
     */
    if (action === "list") {
      const {
        data,
        error,
      } = await supabase
        .from("nous_consent_purposes")
        .select(`
          id,
          purpose_key,
          name,
          description,
          category,
          lawful_basis,
          is_required,
          can_be_withdrawn,
          current_policy_version,
          is_active,
          nous_user_consents (
            id,
            status,
            policy_version,
            collection_method,
            granted_at,
            denied_at,
            withdrawn_at,
            expires_at,
            updated_at
          )
        `)
        .eq("is_active", true)
        .order("category", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error("Consent list error:", error);

        return jsonResponse(
          {
            error: "Unable to load consent preferences.",
            details: error.message,
          },
          500,
        );
      }

      return jsonResponse({
        success: true,
        userId,
        purposes: data ?? [],
      });
    }

    if (!purposeKey) {
      return jsonResponse(
        {
          error: "purposeKey is required for this action.",
        },
        400,
      );
    }

    const {
      data: purpose,
      error: purposeError,
    } = await supabase
      .from("nous_consent_purposes")
      .select(`
        id,
        purpose_key,
        name,
        is_required,
        can_be_withdrawn,
        current_policy_version,
        is_active
      `)
      .eq("purpose_key", purposeKey)
      .eq("is_active", true)
      .maybeSingle();

    if (purposeError) {
      console.error("Consent purpose lookup error:", purposeError);

      return jsonResponse(
        {
          error: "Unable to locate the consent purpose.",
          details: purposeError.message,
        },
        500,
      );
    }

    if (!purpose) {
      return jsonResponse(
        {
          error: `Unknown or inactive consent purpose: ${purposeKey}`,
        },
        404,
      );
    }

    /*
     * POST {
     *   "action": "check",
     *   "purposeKey": "content_personalisation"
     * }
     */
    if (action === "check") {
      const {
        data: hasConsent,
        error,
      } = await supabase.rpc(
        "has_nous_consent",
        {
          requested_user_id: userId,
          requested_purpose_key: purposeKey,
        },
      );

      if (error) {
        console.error("Consent check error:", error);

        return jsonResponse(
          {
            error: "Unable to check consent.",
            details: error.message,
          },
          500,
        );
      }

      return jsonResponse({
        success: true,
        purposeKey,
        allowed: Boolean(hasConsent),
      });
    }

    if (
      action !== "grant" &&
      action !== "deny" &&
      action !== "withdraw"
    ) {
      return jsonResponse(
        {
          error: `Unsupported consent action: ${action}`,
        },
        400,
      );
    }

    if (
      action === "deny" &&
      purpose.is_required
    ) {
      return jsonResponse(
        {
          error:
            "This purpose is required for essential account operation and cannot be denied.",
        },
        409,
      );
    }

    if (
      action === "withdraw" &&
      (
        purpose.is_required ||
        !purpose.can_be_withdrawn
      )
    ) {
      return jsonResponse(
        {
          error:
            "This consent purpose cannot be withdrawn.",
        },
        409,
      );
    }

    const now = new Date().toISOString();

    const consentRecord = {
      user_id: userId,
      purpose_id: purpose.id,
      status:
        action === "grant"
          ? "granted"
          : action === "deny"
          ? "denied"
          : "withdrawn",
      policy_version:
        body.policyVersion ??
        purpose.current_policy_version,
      collection_method: "consent_interface",
      granted_at:
        action === "grant"
          ? now
          : null,
      denied_at:
        action === "deny"
          ? now
          : null,
      withdrawn_at:
        action === "withdraw"
          ? now
          : null,
      expires_at: null,
      evidence: {
        ...(body.evidence ?? {}),
        source: "nous-consent-edge-function",
        request_method: request.method,
      },
    };

    const {
      data: consent,
      error: consentError,
    } = await supabase
      .from("nous_user_consents")
      .upsert(
        consentRecord,
        {
          onConflict: "user_id,purpose_id",
        },
      )
      .select(`
        id,
        user_id,
        purpose_id,
        status,
        policy_version,
        collection_method,
        granted_at,
        denied_at,
        withdrawn_at,
        expires_at,
        created_at,
        updated_at
      `)
      .single();

    if (consentError) {
      console.error("Consent update error:", consentError);

      return jsonResponse(
        {
          error: "Unable to update consent.",
          details: consentError.message,
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      message: `Consent ${action} action completed.`,
      purpose: {
        key: purpose.purpose_key,
        name: purpose.name,
      },
      consent,
    });
  } catch (error) {
    console.error("Unhandled NOUS consent error:", error);

    return jsonResponse(
      {
        error: "An unexpected server error occurred.",
      },
      500,
    );
  }
});