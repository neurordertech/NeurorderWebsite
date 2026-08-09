console.log(
  "[NOUS FILE] app/js/membership.js loaded"
);

(() => {
  "use strict";

  const PLAN_NAMES = {
    free: "NOUS Free",
    student_beginner:
      "NOUS Student & Beginner",
    business_education:
      "NOUS Business & Education",
    nous_unlimited:
      "NOUS Unlimited"
  };

  const membershipNameElement =
    document.getElementById(
      "current-membership-name"
    );

  const membershipMessageElement =
    document.getElementById(
      "membership-message"
    );

  const membershipToggle =
    document.getElementById(
      "membership-toggle"
    );

  const membershipOptions =
    document.getElementById(
      "membership-options"
    );

  function getSupabaseClient() {
    const client =
      window.NOUS_SUPABASE;

    if (
      !client ||
      !client.auth ||
      typeof client.auth.getSession !==
        "function"
    ) {
      throw new Error(
        "The NOUS Supabase client is unavailable."
      );
    }

    return client;
  }

  function setMessage(
    message = "",
    type = ""
  ) {
    if (!membershipMessageElement) {
      return;
    }

    membershipMessageElement.textContent =
      message;

    membershipMessageElement.classList.remove(
      "is-error",
      "is-success"
    );

    if (type) {
      membershipMessageElement.classList.add(
        `is-${type}`
      );
    }
  }

  function resetCards() {
    document
      .querySelectorAll(
        "[data-plan-code]"
      )
      .forEach((card) => {
        card.classList.remove(
          "is-current-plan"
        );

        const code =
          card.dataset.planCode;

        const status =
          card.querySelector(
            "[data-plan-status]"
          );

        const button =
          card.querySelector(
            "[data-plan-action]"
          );

        if (status) {
          status.textContent =
            "Available";
        }

        if (!button) {
          return;
        }

        button.disabled =
          code === "free";

        button.textContent =
          code === "free"
            ? "Included with your account"
            : `Choose ${
                PLAN_NAMES[code] ||
                "membership"
              }`;
      });
  }

  function showCurrentPlan(
    planCode
  ) {
    const safePlanCode =
      PLAN_NAMES[planCode]
        ? planCode
        : "free";

    resetCards();

    if (membershipNameElement) {
      membershipNameElement.textContent =
        PLAN_NAMES[safePlanCode];
    }

    const currentCard =
      document.querySelector(
        `[data-plan-code="${safePlanCode}"]`
      );

    if (currentCard) {
      currentCard.classList.add(
        "is-current-plan"
      );

      const status =
        currentCard.querySelector(
          "[data-plan-status]"
        );

      const button =
        currentCard.querySelector(
          "[data-plan-action]"
        );

      if (status) {
        status.textContent =
          "Your current plan";
      }

      if (button) {
        button.disabled = true;

        button.textContent =
          "Current membership";
      }
    }

    document.documentElement
      .dataset.membershipPlan =
      safePlanCode;
  }

  function setMembershipOpen(
    isOpen
  ) {
    if (
      !membershipToggle ||
      !membershipOptions
    ) {
      return;
    }

    membershipToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    membershipToggle.classList.toggle(
      "is-open",
      isOpen
    );

    membershipOptions.hidden =
      !isOpen;

    membershipToggle.setAttribute(
      "aria-label",
      isOpen
        ? "Hide NOUS membership options"
        : "Explore NOUS membership options"
    );

    document.documentElement
      .dataset.membershipOptions =
      isOpen
        ? "open"
        : "closed";
  }

  function bindMembershipDropdown() {
    if (
      !membershipToggle ||
      !membershipOptions
    ) {
      return;
    }

    if (
      membershipToggle.dataset
        .dropdownBound === "true"
    ) {
      return;
    }

    membershipToggle.dataset
      .dropdownBound = "true";

    membershipToggle.addEventListener(
      "click",
      () => {
        const isOpen =
          membershipToggle.getAttribute(
            "aria-expanded"
          ) === "true";

        setMembershipOpen(
          !isOpen
        );
      }
    );

    membershipToggle.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
            "ArrowDown" &&
          membershipOptions.hidden
        ) {
          event.preventDefault();

          setMembershipOpen(true);
        }

        if (
          event.key ===
            "ArrowUp" &&
          !membershipOptions.hidden
        ) {
          event.preventDefault();

          setMembershipOpen(false);
        }
      }
    );
  }

  async function getAuthenticatedUser() {
    const client =
      getSupabaseClient();

    const {
      data: {
        session
      },
      error
    } =
      await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      throw new Error(
        "Your NOUS session has expired. Please sign in again."
      );
    }

    return {
      user:
        session.user,

      session
    };
  }

  async function findActiveMembership(
    userId
  ) {
    const client =
      getSupabaseClient();

    const {
      data,
      error
    } =
      await client
        .from(
          "user_memberships"
        )
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .in(
          "status",
          [
            "active",
            "trialing",
            "paid"
          ]
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      console.warn(
        "NOUS could not read user_memberships:",
        {
          code:
            error.code,

          message:
            error.message,

          details:
            error.details,

          hint:
            error.hint
        }
      );

      return null;
    }

    return data;
  }

  function normalisePlanCode(
    value
  ) {
    if (
      typeof value !==
      "string"
    ) {
      return null;
    }

    const code =
      value
        .trim()
        .toLowerCase();

    if (
      PLAN_NAMES[code]
    ) {
      return code;
    }

    const aliases = {
      student:
        "student_beginner",

      beginner:
        "student_beginner",

      business:
        "business_education",

      education:
        "business_education",

      unlimited:
        "nous_unlimited"
    };

    return (
      aliases[code] ||
      null
    );
  }

 async function resolvePlanCode(
  membership
) {
  if (!membership) {
    return "free";
  }

  /*
   * First try any text-based plan code already
   * stored directly on the membership record.
   */
  const directCode =
    normalisePlanCode(
      membership.plan_code ||
      membership.membership_code ||
      membership.code
    );

  if (directCode) {
    return directCode;
  }

  /*
   * membership_id identifies the membership itself.
   * It must NEVER be used as the membership_plans.id.
   *
   * Only actual plan foreign-key fields belong here.
   */
  const planId =
    membership.membership_plan_id ||
    membership.plan_id ||
    null;

  if (!planId) {
    return "free";
  }

  /*
   * membership_plans.id is UUID.
   * Never send text values such as "free"
   * into a UUID comparison.
   */
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    typeof planId !== "string" ||
    !UUID_PATTERN.test(planId)
  ) {
    console.warn(
      "[NOUS MEMBERSHIP] Invalid plan UUID ignored:",
      planId
    );

    return "free";
  }

  const client =
    getSupabaseClient();

  const {
    data: plan,
    error
  } =
    await client
      .from(
        "membership_plans"
      )
      .select("*")
      .eq(
        "id",
        planId
      )
      .maybeSingle();

  if (error) {
    console.warn(
      "NOUS could not resolve the membership plan:",
      {
        code:
          error.code,

        message:
          error.message,

        details:
          error.details,

        hint:
          error.hint
      }
    );

    return "free";
  }

  return (
    normalisePlanCode(
      plan?.code ||
      plan?.plan_code ||
      plan?.slug
    ) ||
    "free"
  );
}

  async function loadMembership() {
    /*
     * Every account begins safely
     * on NOUS Free while the live
     * membership record is checked.
     */
    showCurrentPlan(
      "free"
    );

    try {
      const {
        user
      } =
        await getAuthenticatedUser();

      const membership =
        await findActiveMembership(
          user.id
        );

      const planCode =
        await resolvePlanCode(
          membership
        );

      showCurrentPlan(
        planCode
      );

      setMessage("");
    } catch (error) {
      console.error(
        "NOUS membership loading failed:",
        error
      );

      showCurrentPlan(
        "free"
      );

      setMessage(
        "NOUS could not verify your membership. Free mode is being shown safely.",
        "error"
      );
    }
  }

  async function readFunctionError(
    error
  ) {
    let message =
      error?.message ||
      "NOUS could not complete the request.";

    try {
      if (
        error?.context instanceof
          Response
      ) {
        const payload =
          await error.context
            .clone()
            .json();

        message =
          payload?.message ||
          payload?.error?.message ||
          payload?.error ||
          message;
      }
    } catch (
      responseError
    ) {
      console.warn(
        "NOUS could not read the function error payload:",
        responseError
      );
    }

    return message;
  }

  async function beginCheckout( 
    planCode,
    button
  ) { 
    if (
      !PLAN_NAMES[planCode] ||
      planCode === "free"
    ) {
      return;
    }
    const YOCO_PLAN_IDS = {
  student_beginner:
    "nous_student_monthly",

  business_education:
    "nous_professional_monthly",

  nous_unlimited:
    "nous_unlimited_monthly"
};

    const originalText =
      button.textContent;

    try {
      const client =
        getSupabaseClient();

      button.disabled = true;

      button.classList.add(
        "is-loading"
      );

      button.textContent =
        "Preparing secure checkout...";

      setMessage(
        `Preparing ${PLAN_NAMES[planCode]} checkout...`
      );

      const {
        session
      } =
        await getAuthenticatedUser();

const planId =
  YOCO_PLAN_IDS[planCode];

if (!planId) {
  throw new Error(
    "This NOUS membership is not connected to Yoco."
  );
}

console.log(
  "[NOUS YOCO] Starting checkout",
  {
    planCode,
    planId
  }
);

const {
  data,
  error
} = await client.functions.invoke(
  "yoco-checkout",
  {
    body: {
      planId
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

      window.location.assign(
        checkoutUrl
      );
    } catch (error) {
      console.error(
        "NOUS checkout failed:",
        error
      );

      const errorMessage =
        await readFunctionError(
          error
        );

      setMessage(
        errorMessage,
        "error"
      );

      button.disabled = false;

      button.classList.remove(
        "is-loading"
      );

      button.textContent =
        originalText;
    }
  }

  function bindPlanButtons() {
    document
      .querySelectorAll(
        "[data-plan-action]"
      )
      .forEach((button) => {
        if (
          button.dataset
            .membershipBound === "true"
        ) {
          return;
        }

        button.dataset
          .membershipBound = "true";

        button.addEventListener(
          "click",
          () => {
            const planCode =
              button.dataset.planAction;

            beginCheckout(
              planCode,
              button
            );
          }
        );
      });
  }

  function handleCheckoutReturn() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    const paymentState =
      parameters.get("payment") ||
      parameters.get("checkout");

    if (!paymentState) {
      return;
    }

    setMembershipOpen(
      true
    );

    if (
      paymentState === "success" ||
      paymentState === "successful"
    ) {
      setMessage(
        "Payment received. NOUS is verifying your membership.",
        "success"
      );

      window.setTimeout(
        () => {
          loadMembership();
        },
        2200
      );

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

    if (
      paymentState === "failed"
    ) {
      setMessage(
        "The payment was not completed. Your membership has not changed.",
        "error"
      );
    }
  }

  function initialiseMembershipInterface() {
    /*
     * Show NOUS Free immediately so the page
     * never remains stuck on a loading state.
     */
    showCurrentPlan(
      "free"
    );

    setMembershipOpen(
      false
    );

    bindMembershipDropdown();
    bindPlanButtons();
    handleCheckoutReturn();
    loadMembership();
  }

  if (
    document.readyState ===
    "loading"
  ) {
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