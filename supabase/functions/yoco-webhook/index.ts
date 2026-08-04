import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const payload = await req.json();
    const eventType = payload?.type || payload?.eventType;
    const checkout = payload?.payload || payload?.data || payload;
    const metadata = checkout?.metadata || checkout?.checkout?.metadata || {};
    const attemptId = metadata.paymentAttemptId;
    if (!attemptId) return new Response("Ignored", { status: 202 });

    // IMPORTANT: enable Yoco's documented webhook-signature verification here
    // once YOCO_WEBHOOK_SECRET is issued/configured. Do not activate memberships
    // from unsigned webhooks in production.
    const webhookSecret = Deno.env.get("YOCO_WEBHOOK_SECRET");
    if (!webhookSecret) return new Response("Webhook secret is not configured", { status: 503 });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const succeeded = ["payment.succeeded", "checkout.payment_succeeded", "payment_succeeded"].includes(eventType);
    const failed = ["payment.failed", "checkout.payment_failed", "payment_failed"].includes(eventType);

    if (succeeded) {
      const { data: attempt } = await admin.from("payment_attempts").update({ status: "succeeded", provider_payload: payload, updated_at: new Date().toISOString() }).eq("id", attemptId).select("user_id,plan_id,checkout_id").single();
      if (attempt) {
        const now = new Date(); const end = new Date(now); end.setMonth(end.getMonth() + 1);
        await admin.from("memberships").upsert({ user_id: attempt.user_id, plan_id: attempt.plan_id, status: "active", provider: "yoco", provider_reference: attempt.checkout_id, current_period_start: now.toISOString(), current_period_end: end.toISOString(), updated_at: now.toISOString() }, { onConflict: "user_id" });
      }
    } else if (failed) {
      await admin.from("payment_attempts").update({ status: "failed", provider_payload: payload, updated_at: new Date().toISOString() }).eq("id", attemptId);
    }
    return new Response("ok");
  } catch (error) {
    console.error(error); return new Response("Webhook processing failed", { status: 500 });
  }
});
