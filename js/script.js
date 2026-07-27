/* =========================================================
   NEURORDER — MAIN WEBSITE JAVASCRIPT
========================================================= */


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const button = document.querySelector(".mobile-menu-btn");

  if (!menu || !button) {
    return;
  }

  const isOpen = menu.classList.toggle("open");

  button.classList.toggle("active", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
}

document.addEventListener("click", (event) => {
  const menu = document.getElementById("mobileMenu");
  const button = document.querySelector(".mobile-menu-btn");

  if (!menu || !button) {
    return;
  }

  const clickedInsideMenu = menu.contains(event.target);
  const clickedButton = button.contains(event.target);

  if (!clickedInsideMenu && !clickedButton) {
    menu.classList.remove("open");
    button.classList.remove("active");
    button.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("resize", () => {
  const menu = document.getElementById("mobileMenu");
  const button = document.querySelector(".mobile-menu-btn");

  if (!menu || !button) {
    return;
  }

  if (window.innerWidth > 900) {
    menu.classList.remove("open");
    button.classList.remove("active");
    button.setAttribute("aria-expanded", "false");
  }
});


/* =========================================================
   NEWS SIDEBAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const sidebarButtons =
    document.querySelectorAll(".news-sidebar button");

  sidebarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sidebarButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
    });
  });
});


/* =========================================================
   NOUS PANEL
========================================================= */

function toggleNous() {
  const panel = document.getElementById("nousePanel");

  if (panel) {
    panel.classList.toggle("open");
  }
}

function openNousFromToast() {
  const toast = document.getElementById("nouseToast");
  const panel = document.getElementById("nousePanel");

  if (toast) {
    toast.classList.remove("show");
  }

  if (panel) {
    panel.classList.add("open");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const toast = document.getElementById("nouseToast");

  if (!toast) {
    return;
  }

  window.setTimeout(() => {
    toast.classList.add("show");
  }, 6000);

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 16000);
});


/* =========================================================
   YOCO MEMBERSHIP CHECKOUT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const checkoutButtons =
    document.querySelectorAll(".yoco-checkout-button");

  const statusMessage =
    document.getElementById("membershipStatus");

  if (!checkoutButtons.length) {
    return;
  }

  const planMap = {
    student_beginner: "nous_student_monthly",
    business_education: "nous_professional_monthly",
    nous_unlimited: "nous_unlimited_monthly",

    nous_student_monthly: "nous_student_monthly",
    nous_professional_monthly: "nous_professional_monthly",
    nous_unlimited_monthly: "nous_unlimited_monthly"
  };

  function setCheckoutStatus(message, type = "") {
    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;
    statusMessage.className = type;
  }

  function getSupabaseClient() {
    return (
      window.nousSupabase ||
      window.supabaseClient ||
      window.supabaseInstance ||
      null
    );
  }

  function getSupabaseUrl() {
    return (
      window.SUPABASE_URL ||
      window.supabaseUrl ||
      ""
    );
  }

  function getSupabaseAnonKey() {
    return (
      window.SUPABASE_ANON_KEY ||
      window.supabaseAnonKey ||
      ""
    );
  }

  function getPlanId(button) {
    const rawPlan =
      button.dataset.planId ||
      button.dataset.plan ||
      "";

    return planMap[rawPlan] || rawPlan;
  }

  function getPlanName(button, planId) {
    return (
      button.dataset.planName ||
      {
        nous_student_monthly:
          "Student & Beginner",

        nous_professional_monthly:
          "Business & Education",

        nous_unlimited_monthly:
          "Nous Unlimited"
      }[planId] ||
      "Nous membership"
    );
  }

  function getLoginReturnUrl(planId) {
    localStorage.setItem(
      "nous-selected-plan-id",
      planId
    );

    localStorage.setItem(
      "selectedMembershipPlan",
      planId
    );

    const returnTo =
      encodeURIComponent("news.html#membership");

    return `login.html?returnTo=${returnTo}`;
  }

  async function getCurrentSession(client) {
    if (!client?.auth?.getSession) {
      return null;
    }

    const {
      data,
      error
    } = await client.auth.getSession();

    if (error) {
      console.error(
        "Supabase session error:",
        error
      );

      throw new Error(
        "We could not verify your Nous account."
      );
    }

    return data?.session || null;
  }

  async function readFunctionError(error) {
    let message =
      error?.message ||
      "The secure checkout could not be created.";

    const context = error?.context;

    if (!context) {
      return message;
    }

    try {
      if (typeof context.clone === "function") {
        const responseCopy = context.clone();

        try {
          const json = await responseCopy.json();

          return (
            json?.error ||
            json?.message ||
            message
          );
        } catch {
          // Continue to text parsing.
        }
      }

      if (typeof context.text === "function") {
        const text = await context.text();

        if (!text) {
          return message;
        }

        try {
          const parsed = JSON.parse(text);

          return (
            parsed?.error ||
            parsed?.message ||
            text
          );
        } catch {
          return text;
        }
      }
    } catch (contextError) {
      console.warn(
        "Could not read function error response:",
        contextError
      );
    }

    return message;
  }

  async function createCheckoutWithInvoke(
    client,
    planId
  ) {
    if (!client?.functions?.invoke) {
      throw new Error(
        "The Supabase function client is unavailable."
      );
    }

    const {
      data,
      error
    } = await client.functions.invoke(
      "yoco-checkout",
      {
        body: {
          planId
        }
      }
    );

    if (error) {
      const message =
        await readFunctionError(error);

      throw new Error(message);
    }

    return data || {};
  }

  async function safelyReadResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return {
        message: responseText
      };
    }
  }

  async function createCheckoutWithFetch(
    planId,
    session
  ) {
    const supabaseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!supabaseUrl) {
      throw new Error(
        "The Supabase URL is missing from js/supabase.js."
      );
    }

    if (!anonKey) {
      throw new Error(
        "The Supabase public key is missing from js/supabase.js."
      );
    }

    if (!session?.access_token) {
      throw new Error(
        "Please log in before choosing a paid membership."
      );
    }

    const endpoint =
      `${supabaseUrl.replace(/\/$/, "")}` +
      "/functions/v1/yoco-checkout";

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization":
          `Bearer ${session.access_token}`
      },

      body: JSON.stringify({
        planId
      })
    });

    const result =
      await safelyReadResponse(response);

    if (!response.ok) {
      const message =
        result?.error ||
        result?.message ||
        `Checkout request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return result;
  }

  function getCheckoutUrl(result) {
    return (
      result?.checkoutUrl ||
      result?.redirectUrl ||
      result?.redirect_url ||
      result?.url ||
      result?.checkout?.redirectUrl ||
      result?.checkout?.url ||
      ""
    );
  }

  checkoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const originalContent =
        button.innerHTML;

      const planId =
        getPlanId(button);

      const planName =
        getPlanName(button, planId);

      if (!planId) {
        setCheckoutStatus(
          "This membership plan is not configured correctly.",
          "is-error"
        );

        return;
      }

      if (!planMap[planId]) {
        setCheckoutStatus(
          `The membership plan "${planId}" is not recognised.`,
          "is-error"
        );

        return;
      }

      button.disabled = true;

      button.innerHTML = `
        <span>Preparing secure checkout…</span>
        <i class="fas fa-circle-notch fa-spin"></i>
      `;

      setCheckoutStatus(
        `Checking your account for ${planName}…`
      );

      try {
        const supabaseClient =
          getSupabaseClient();

        if (!supabaseClient) {
          throw new Error(
            "The secure membership service did not load. Refresh the page and try again."
          );
        }

        const session =
          await getCurrentSession(
            supabaseClient
          );

        if (!session?.user) {
          setCheckoutStatus(
            "Please log in before choosing a paid membership."
          );

          window.location.href =
            getLoginReturnUrl(planId);

          return;
        }

        setCheckoutStatus(
          `Creating your secure ${planName} checkout…`
        );

        let checkoutResult;

        try {
          checkoutResult =
            await createCheckoutWithInvoke(
              supabaseClient,
              planId
            );
        } catch (invokeError) {
          console.warn(
            "Supabase invoke failed. Trying direct request:",
            invokeError
          );

          checkoutResult =
            await createCheckoutWithFetch(
              planId,
              session
            );
        }

        const checkoutUrl =
          getCheckoutUrl(checkoutResult);

        if (!checkoutUrl) {
          console.error(
            "Unexpected checkout response:",
            checkoutResult
          );

          throw new Error(
            "Yoco did not return a secure checkout link."
          );
        }

        setCheckoutStatus(
          "Secure checkout created. Opening Yoco…",
          "is-success"
        );

        window.location.assign(checkoutUrl);
      } catch (error) {
        console.error(
          "Yoco checkout error:",
          error
        );

        let errorMessage =
          error instanceof Error
            ? error.message
            : "We could not open the secure checkout.";

        if (
          errorMessage.includes("405") ||
          errorMessage.toLowerCase().includes(
            "method not allowed"
          )
        ) {
          errorMessage =
            "The Yoco checkout server is rejecting payment requests. The Supabase yoco-checkout function must allow POST and OPTIONS requests.";
        }

        if (
          errorMessage.toLowerCase().includes(
            "failed to fetch"
          )
        ) {
          errorMessage =
            "The checkout server could not be reached. Check the Supabase function deployment and CORS settings.";
        }

        setCheckoutStatus(
          errorMessage,
          "is-error"
        );

        button.disabled = false;
        button.innerHTML = originalContent;
      }
    });
  });
});


/* =========================================================
   EXPOSE FUNCTIONS USED BY INLINE HTML
========================================================= */

window.toggleMobileMenu =
  toggleMobileMenu;

window.toggleNous =
  toggleNous;

window.openNousFromToast =
  openNousFromToast;