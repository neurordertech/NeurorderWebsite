import { createClient } from "supabase";
import { runBoyRos } from "../_shared/boyros/index.ts";
import type { BoyRosSignal } from "../_shared/boyros/index.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed", message: "POST requests only." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const auth = request.headers.get("Authorization");
    if (!url || !anon) return json({ error: "runtime_configuration_error", message: "NOUS runtime is not configured." }, 500);
    if (!auth?.startsWith("Bearer ")) return json({ error: "authentication_required", message: "Sign in to use NOUS Companion." }, 401);

    const client = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "invalid_identity", message: "Your NOUS identity could not be verified." }, 401);

    const body = await request.json().catch(() => null) as { message?: string; space?: string; signals?: BoyRosSignal[] } | null;
    const message = body?.message?.trim();
    if (!message) return json({ error: "message_required", message: "Enter a message for NOUS." }, 400);
    if (message.length > 8000) return json({ error: "message_too_long", message: "Keep the message below 8,000 characters." }, 400);

    const result = runBoyRos({
      identity: { userId: user.id, email: user.email ?? null, organisationId: null },
      consent: { grantedPermissions: ["profile.read", "activity.read"], revokedPermissions: [] },
      signals: Array.isArray(body?.signals) ? body!.signals : [],
    });

    const context = result.contextForOrule;
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({
        response: `O.R.U.L.E. received your request in ${body?.space || "NOUS"}. The reasoning route is working, but the language-model secret has not been configured yet.`,
        orule: { priority: result.priority, context, acceptedSignals: result.acceptedSignalCount },
      });
    }

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5-mini";
    const ai = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: "You are NOUS Companion. Be practical, calm and direct. Use only the supplied permitted context. Never claim access to data not supplied.",
        input: [{ role: "user", content: [{ type: "input_text", text: `Space: ${body?.space || "home"}\nPermitted O.R.U.L.E. context: ${JSON.stringify(context)}\n\nUser request: ${message}` }] }],
      }),
    });
    const payload = await ai.json();
    if (!ai.ok) throw new Error(payload?.error?.message || "The language model request failed.");
    const response = payload?.output_text || payload?.output?.flatMap((item: any) => item?.content || []).find((item: any) => item?.type === "output_text")?.text;
    if (!response) throw new Error("The language model returned no readable response.");

    return json({ response, orule: { priority: result.priority, context, acceptedSignals: result.acceptedSignalCount } });
  } catch (error) {
    console.error("NOUS Companion error", error);
    return json({ error: "unexpected_error", message: error instanceof Error ? error.message : "NOUS Companion failed." }, 500);
  }
});
