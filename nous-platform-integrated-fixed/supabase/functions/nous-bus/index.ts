import { createClient } from "npm:@supabase/supabase-js@2";

type BusPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

type PublishEventRequest = {
  event_type: string;
  source_service: string;
  source_record_id?: string | null;
  space?: string | null;
  priority?: BusPriority;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlation_id?: string | null;
  causation_id?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
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

function isValidEventType(value: string): boolean {
  return /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(value);
}

Deno.serve(async (request: Request) => {
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
        message: "The NOUS BUS accepts POST requests only.",
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing required Supabase environment variables.",
    );

    return jsonResponse(
      {
        success: false,
        error: "runtime_configuration_error",
        message: "The BUS runtime is not configured.",
      },
      500,
    );
  }

  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
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

  /*
   * This client receives the caller's JWT.
   * Therefore database access remains restricted by RLS.
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
    console.error(
      "NOUS BUS authentication failed:",
      userError,
    );

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

  let body: PublishEventRequest;

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

  const eventType = body.event_type?.trim();
  const sourceService =
    body.source_service?.trim();

  if (!eventType) {
    return jsonResponse(
      {
        success: false,
        error: "event_type_required",
        message: "event_type is required.",
      },
      400,
    );
  }

  if (!isValidEventType(eventType)) {
    return jsonResponse(
      {
        success: false,
        error: "invalid_event_type",
        message:
          "event_type must use a dot-separated name such as calendar.event.created.",
      },
      400,
    );
  }

  if (!sourceService) {
    return jsonResponse(
      {
        success: false,
        error: "source_service_required",
        message: "source_service is required.",
      },
      400,
    );
  }

  const validPriorities: BusPriority[] = [
    "low",
    "normal",
    "high",
    "critical",
  ];

  const priority =
    body.priority ?? "normal";

  if (!validPriorities.includes(priority)) {
    return jsonResponse(
      {
        success: false,
        error: "invalid_priority",
        message:
          "priority must be low, normal, high, or critical.",
      },
      400,
    );
  }

  /*
   * Verify that the event type has been registered.
   */
  const {
    data: registeredEvent,
    error: registryError,
  } = await supabase
    .from("nous_event_types")
    .select(
      "event_type, current_version, owning_service, sensitivity",
    )
    .eq("event_type", eventType)
    .eq("is_active", true)
    .maybeSingle();

  if (registryError) {
    console.error(
      "Event registry lookup failed:",
      registryError,
    );

    return jsonResponse(
      {
        success: false,
        error: "registry_lookup_failed",
        message:
          "The BUS could not verify the event type.",
      },
      500,
    );
  }

  if (!registeredEvent) {
    return jsonResponse(
      {
        success: false,
        error: "unregistered_event_type",
        message:
          `The event type "${eventType}" is not registered.`,
      },
      400,
    );
  }

  const correlationId =
    body.correlation_id ?? crypto.randomUUID();

  const {
    data: event,
    error: insertError,
  } = await supabase
    .from("nous_bus_events")
    .insert({
      user_id: userData.user.id,
      event_type: eventType,
      event_version:
        registeredEvent.current_version,
      source_service: sourceService,
      source_record_id:
        body.source_record_id ?? null,
      space: body.space ?? null,
      priority,
      status: "pending",
      payload: body.payload ?? {},
      metadata: {
        ...(body.metadata ?? {}),
        published_by: userData.user.id,
        published_through: "nous-bus",
      },
      correlation_id: correlationId,
      causation_id: body.causation_id ?? null,
    })
    .select()
    .single();

  if (insertError) {
    console.error(
      "BUS event publication failed:",
      insertError,
    );

    return jsonResponse(
      {
        success: false,
        error: "event_publication_failed",
        message:
          "The event could not be published to the NOUS BUS.",
        details: insertError.message,
      },
      500,
    );
  }

  console.log(
    JSON.stringify({
      message: "NOUS BUS event published",
      event_id: event.id,
      event_type: event.event_type,
      user_id: userData.user.id,
    }),
  );

  return jsonResponse(
    {
      success: true,
      message:
        "Event published to the NOUS BUS.",
      event,
      routing: {
        status: "pending",
        next_stage:
          "subscription matching",
      },
    },
    201,
  );
});