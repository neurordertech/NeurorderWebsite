console.log(
  "[NOUS FILE] js/membership.js loaded"
);
(() => {
  const config = window.NOUS_SUPABASE_CONFIG;
  const message = document.getElementById("checkoutMessage");
  const buttons = document.querySelectorAll(".checkout-button");

  if (!config?.url || !config?.publishableKey || !window.supabase) return;
  const client = window.supabase.createClient(config.url, config.publishableKey);

  function show(text, type = "") {
    if (!message) return;
    message.textContent = text;
    message.className = `checkout-message ${type}`.trim();
  }

  async function beginCheckout(button) {
    const planCode = button.dataset.plan;
    const original = button.textContent;
    show("");
    button.disabled = true;
    button.textContent = "Opening secure checkout…";

    try {
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        const returnTo = encodeURIComponent(`/?plan=${planCode}#membership`);
        location.href = `/login.html?returnTo=${returnTo}`;
        return;
      }

      const { data, error } = await client.functions.invoke("yoco-checkout", {
        body: { planCode, returnUrl: `${location.origin}/?payment=return#membership` }
      });
      if (error) throw error;
      if (!data?.redirectUrl) throw new Error(data?.error || "Checkout could not be created.");
      location.assign(data.redirectUrl);
    } catch (error) {
      console.error(error);
      show(error?.message || "We could not open checkout. Please try again.");
      button.disabled = false;
      button.textContent = original;
    }
  }

  buttons.forEach(button => button.addEventListener("click", () => beginCheckout(button)));

  const params = new URLSearchParams(location.search);
  if (params.get("payment") === "success") show("Payment received. Your membership is being activated.", "success");
  if (params.get("payment") === "cancelled") show("Checkout was cancelled. No payment was taken.");
  if (params.get("payment") === "failed") show("The payment did not complete. Please try again.");

  const requestedPlan = params.get("plan");
  if (requestedPlan) {
    const button = document.querySelector(`[data-plan="${CSS.escape(requestedPlan)}"]`);
    if (button) setTimeout(() => beginCheckout(button), 350);
  }
})();
