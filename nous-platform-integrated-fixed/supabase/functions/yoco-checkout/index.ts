import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Sign in before choosing a paid plan." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const yocoSecret = Deno.env.get("YOCO_SECRET_KEY");
    if (!yocoSecret) throw new Error("YOCO_SECRET_KEY is not configured.");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Your session has expired. Sign in again." }, 401);

    const { planCode, returnUrl } = await req.json();
    if (!planCode || typeof planCode !== "string") return json({ error: "A valid plan is required." }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: plan, error: planError } = await admin.from("membership_plans").select("id,code,name,price_cents,currency,active").eq("code", planCode).eq("active", true).single();
    if (planError || !plan || plan.price_cents <= 0) return json({ error: "That paid plan is unavailable." }, 400);

    const allowedOrigin = new URL(returnUrl || req.headers.get("origin") || "https://neurorder.com").origin;
    const successUrl = `${allowedOrigin}/?payment=success#membership`;
    const cancelUrl = `${allowedOrigin}/?payment=cancelled#membership`;
    const failureUrl = `${allowedOrigin}/?payment=failed#membership`;

    const { data: attempt, error: attemptError } = await admin.from("payment_attempts").insert({
      user_id: user.id, plan_id: plan.id, amount_cents: plan.price_cents, currency: plan.currency, status: "created"
    }).select("id").single();
    if (attemptError) throw attemptError;

    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${yocoSecret}`, "Content-Type": "application/json", "Idempotency-Key": attempt.id },
      body: JSON.stringify({
        amount: plan.price_cents,
        currency: plan.currency,
        successUrl,
        cancelUrl,
        failureUrl,
        metadata: { paymentAttemptId: attempt.id, userId: user.id, planCode: plan.code, planId: plan.id }
      })
    });
    const checkout = await response.json();
    if (!response.ok) {
      await admin.from("payment_attempts").update({ status: "failed", provider_payload: checkout, updated_at: new Date().toISOString() }).eq("id", attempt.id);
      throw new Error(checkout?.message || checkout?.error || "Yoco rejected the checkout request.");
    }

    await admin.from("payment_attempts").update({ checkout_id: checkout.id, status: "pending", provider_payload: checkout, updated_at: new Date().toISOString() }).eq("id", attempt.id);
    return json({ redirectUrl: checkout.redirectUrl, checkoutId: checkout.id });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Checkout failed." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
