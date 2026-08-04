console.log(
  "[NOUS FILE] js/membership.js loaded"
);
(() => {
  "use strict";

  const PLAN_NAMES = {
    free: "NOUS Free",
    student_beginner: "NOUS Student & Beginner",
    business_education: "NOUS Business & Education",
    nous_unlimited: "NOUS Unlimited"
  };

  const membershipNameElement = document.getElementById(
    "current-membership-name"
  );

  const membershipMessageElement = document.getElementById(
    "membership-message"
  );

  function getSupabaseClient() {
  
    if (
      !client ||
      !client.auth ||
      typeof client.auth.getSession !== "function"
    ) {
      throw new Error(
        "Supabase client is not available. Ensure supabase-config.js loads before membership.js."
      );
    }

    return client;
  }

  function setMessage(message = "", type = "") {
    if (!membershipMessageElement) {
      return;
    }

    membershipMessageElement.textContent = message;

    membershipMessageElement.classList.remove(
      "is-error",
      "is-success"
    );

    if (type) {
      membershipMessageElement.classList.add(`is-${type}`);
    }
  }

  function resetCards() {
    document
      .querySelectorAll("[data-plan-code]")
      .forEach((card) => {
        card.classList.remove("is-current-plan");

        const code = card.dataset.planCode;
        const status = card.querySelector("[data-plan-status]");
        const button = card.querySelector("[data-plan-action]");

        if (status) {
          status.textContent = "Available";
        }

        if (!button) {
          return;
        }

        button.disabled = code === "free";

        if (code === "free") {
          button.textContent = "Included with your account";
        } else {
          button.textContent =
            `Choose ${PLAN_NAMES[code] || "membership"}`;
        }
      });
  }

  function showCurrentPlan(planCode) {
    const safePlanCode = PLAN_NAMES[planCode]
      ? planCode
      : "free";

    const planName = PLAN_NAMES[safePlanCode];

    resetCards();

    if (membershipNameElement) {
      membershipNameElement.textContent = planName;
    }

    const currentCard = document.querySelector(
      `[data-plan-code="${safePlanCode}"]`
    );

    if (currentCard) {
      currentCard.classList.add("is-current-plan");

      const status = currentCard.querySelector(
        "[data-plan-status]"
      );

      const button = currentCard.querySelector(
        "[data-plan-action]"
      );

      if (status) {
        status.textContent = "Your current plan";
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Current membership";
      }
    }

    document.documentElement.dataset.membershipPlan =
      safePlanCode;
  }

  async function getAuthenticatedUser() {
    const client = getSupabaseClient();

    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      throw new Error(
        "Your NOUS session has expired. Please sign in again."
      );
    }

    return {
      user: session.user,
      session
    };
  }

  async function findActiveMembership(userId) {
    const client = getSupabaseClient();

    const {
      data,
      error
    } = await client
      .from("user_memberships")
      .select("*")
      .eq("user_id", userId)
      .in("status", [
        "active",
        "trialing",
        "paid"
      ])
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "NOUS could not read user_memberships:",
        error
      );

      return null;
    }

    return data;
  }

  async function resolvePlanCode(membership) {
    if (!membership) {
      return "free";
    }

    if (
      typeof membership.plan_code === "string" &&
      PLAN_NAMES[membership.plan_code]
    ) {
      return membership.plan_code;
    }

    if (
      typeof membership.membership_code === "string" &&
      PLAN_NAMES[membership.membership_code]
    ) {
      return membership.membership_code;
    }

    const planId =
      membership.membership_plan_id ||
      membership.plan_id ||
      membership.membership_id;

    if (!planId) {
      return "free";
    }

    const client = getSupabaseClient();

    const {
      data: plan,
      error
    } = await client
      .from("membership_plans")
      .select("code")
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      console.warn(
        "NOUS could not resolve the membership plan:",
        error
      );

      return "free";
    }

    if (!plan?.code) {
      return "free";
    }

    return PLAN_NAMES[plan.code]
      ? plan.code
      : "free";
  }

  async function loadMembership() {
    try {
      showCurrentPlan("free");

      const { user } = await getAuthenticatedUser();

      const membership = await findActiveMembership(
        user.id
      );

      const planCode = await resolvePlanCode(
        membership
      );

      showCurrentPlan(planCode);

      setMessage("");
    } catch (error) {
      console.error(
        "NOUS membership loading failed:",
        error
      );

      showCurrentPlan("free");

      setMessage(
        "NOUS could not verify your membership. Free mode is being shown safely.",
        "error"
      );
    }
  }

  async function beginCheckout(planCode, button) {
    if (
      !PLAN_NAMES[planCode] ||
      planCode === "free"
    ) {
      return;
    }

    const originalText = button.textContent;

    try {
      const client = getSupabaseClient();

      button.disabled = true;
      button.classList.add("is-loading");
      button.textContent =
        "Preparing secure checkout...";

      setMessage(
        `Preparing ${PLAN_NAMES[planCode]} checkout...`
      );

      const { session } =
        await getAuthenticatedUser();

      const {
        data,
        error
      } = await client.functions.invoke(
        "yoco-checkout",
        {
          body: {
            planCode
          },
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

      if (error) {
        throw error;
      }

      const checkoutUrl =
        data?.redirectUrl ||
        data?.checkoutUrl ||
        data?.url;

      if (!checkoutUrl) {
        throw new Error(
          "The checkout service did not return a payment URL."
        );
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error(
        "NOUS checkout failed:",
        error
      );

      setMessage(
        error?.message ||
          "NOUS could not start the payment checkout.",
        "error"
      );

      button.disabled = false;
      button.classList.remove("is-loading");
      button.textContent = originalText;
    }
  }

  function bindPlanButtons() {
    document
      .querySelectorAll("[data-plan-action]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const planCode =
            button.dataset.planAction;

          beginCheckout(planCode, button);
        });
      });
  }

  function handleCheckoutReturn() {
    const parameters = new URLSearchParams(
      window.location.search
    );

    const paymentState =
      parameters.get("payment") ||
      parameters.get("checkout");

    if (!paymentState) {
      return;
    }

    if (
      paymentState === "success" ||
      paymentState === "successful"
    ) {
      setMessage(
        "Payment received. NOUS is verifying your membership.",
        "success"
      );

      window.setTimeout(() => {
        loadMembership();
      }, 2200);

      return;
    }

    if (
      paymentState === "cancelled" ||
      paymentState === "canceled"
    ) {
      setMessage(
        "The checkout was cancelled. Your current membership has not changed."
      );

      return;
    }

    if (paymentState === "failed") {
      setMessage(
        "The payment was not completed. Your membership has not changed.",
        "error"
      );
    }
  }

  function initialiseMembershipInterface() {
    resetCards();
    bindPlanButtons();
    handleCheckoutReturn();
    loadMembership();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseMembershipInterface,
      {
        once: true
      }
    );
  } else {
    initialiseMembershipInterface();
  }
})();