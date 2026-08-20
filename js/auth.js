/* =========================================================
   NEURORDER — PRODUCTION AUTHENTICATION
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_AUTH_DESTINATION =
  "/nous-news.html";

const NOUS_DESTINATION =
  "/nous.html";


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getAuthClient() {
  return (
    window.NOUS_SUPABASE ||
    window.nousSupabase ||
    window.supabaseClient ||
    null
  );
}


/* =========================================================
   SAFE RETURN DESTINATION
========================================================= */

function getSafeReturnTo() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const returnTo =
    parameters.get(
      "returnTo"
    );

  if (!returnTo) {
    return null;
  }

  /*
   * Only allow local site paths.
   *
   * Valid:
   * /nous-news.html
   * /nous.html
   * /about.html
   *
   * Invalid:
   * https://another-site.com
   * javascript:...
   */

  if (
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    console.warn(
      "[AUTH] Unsafe returnTo rejected:",
      returnTo
    );

    return null;
  }

  return returnTo;
}


/* =========================================================
   BUILD ABSOLUTE SITE URL
========================================================= */

function buildSiteUrl(path) {
  return new URL(
    path,
    window.location.origin
  ).href;
}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(
  message,
  type = ""
) {
  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) {
    console.log(
      `[Auth message] ${message}`
    );

    return;
  }

  box.textContent =
    message;

  box.className =
    type
      ? `auth-message ${type}`
      : "auth-message";

  box.hidden =
    false;
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setAuthButtonLoading(
  button,
  loading,
  text
) {
  if (!button) {
    return;
  }

  if (
    !button.dataset.originalHtml
  ) {
    button.dataset.originalHtml =
      button.innerHTML;
  }

  button.disabled =
    loading;

  if (loading) {
    button.innerHTML = `
      <span>${text}</span>
      <i class="fas fa-circle-notch fa-spin"></i>
    `;
  } else {
    button.innerHTML =
      button.dataset.originalHtml;
  }
}


/* =========================================================
   POST-AUTH REDIRECT
========================================================= */

function redirectAfterAuth() {
  /*
   * Priority 1:
   * Explicit ?returnTo=/...
   */

  const returnTo =
    getSafeReturnTo();

  if (returnTo) {
    window.location.href =
      buildSiteUrl(
        returnTo
      );

    return;
  }


  /*
   * Priority 2:
   * Existing saved destination.
   */

  const savedDestination =
    localStorage.getItem(
      "neurorderDestination"
    );

  localStorage.removeItem(
    "neurorderDestination"
  );


  if (
    savedDestination ===
    "nous"
  ) {
    window.location.href =
      buildSiteUrl(
        NOUS_DESTINATION
      );

    return;
  }


  /*
   * Default:
   * NOUS News.
   */

  window.location.href =
    buildSiteUrl(
      DEFAULT_AUTH_DESTINATION
    );
}


/* =========================================================
   SIGN UP
========================================================= */

async function signUpWithEmail(
  event
) {
  if (event) {
    event.preventDefault();
  }

  const client =
    getAuthClient();

  if (!client) {
    showAuthMessage(
      "The authentication service did not load. Refresh the page.",
      "is-error"
    );

    console.error(
      "[AUTH] Supabase client unavailable during signup."
    );

    return;
  }


  const nameInput =
    document.getElementById(
      "signupName"
    );

  const emailInput =
    document.getElementById(
      "signupEmail"
    );

  const passwordInput =
    document.getElementById(
      "signupPassword"
    );

  const submitButton =
    document.querySelector(
      "#signupForm button[type='submit']"
    );


  const fullName =
    nameInput
      ?.value
      .trim() ||
    "";

  const email =
    emailInput
      ?.value
      .trim()
      .toLowerCase() ||
    "";

  const password =
    passwordInput
      ?.value ||
    "";


  if (
    !fullName ||
    !email ||
    !password
  ) {
    showAuthMessage(
      "Please complete your name, email and password.",
      "is-error"
    );

    return;
  }


  if (
    password.length <
    8
  ) {
    showAuthMessage(
      "Your password must contain at least 8 characters.",
      "is-error"
    );

    return;
  }


  setAuthButtonLoading(
    submitButton,
    true,
    "Creating account…"
  );


  showAuthMessage(
    "Creating your NOUS account…"
  );


  try {
    /*
     * Preserve returnTo through email confirmation.
     */

    const returnTo =
      getSafeReturnTo() ||
      DEFAULT_AUTH_DESTINATION;


    const confirmationUrl =
      new URL(
        "/login.html",
        window.location.origin
      );


    confirmationUrl
      .searchParams
      .set(
        "confirmed",
        "true"
      );


    confirmationUrl
      .searchParams
      .set(
        "returnTo",
        returnTo
      );


    const {
      data,
      error
    } =
      await client.auth
        .signUp({
          email,
          password,

          options: {
            data: {
              full_name:
                fullName
            },

            emailRedirectTo:
              confirmationUrl.href
          }
        });


    if (error) {
      throw error;
    }


    if (!data?.user) {
      throw new Error(
        "Supabase did not return a user account."
      );
    }


    /*
     * Some Supabase configurations sign
     * users in immediately.
     */

    if (data.session) {
      showAuthMessage(
        "Your account was created and you are signed in.",
        "is-success"
      );


      setTimeout(
        redirectAfterAuth,
        350
      );


      return;
    }


    /*
     * Email confirmation required.
     */

    showAuthMessage(
      "Your account was created. Check your email and confirm your account before logging in.",
      "is-success"
    );


    if (passwordInput) {
      passwordInput.value =
        "";
    }


  } catch (error) {
    console.error(
      "[AUTH] Signup error:",
      error
    );


    let message =
      error?.message ||
      "Your account could not be created.";


    const lowerMessage =
      message.toLowerCase();


    if (
      lowerMessage.includes(
        "user already registered"
      )
    ) {
      message =
        "An account already exists for this email. Please log in instead.";
    }


    if (
      lowerMessage.includes(
        "signup is disabled"
      )
    ) {
      message =
        "New account registration is currently disabled.";
    }


    showAuthMessage(
      message,
      "is-error"
    );


  } finally {
    setAuthButtonLoading(
      submitButton,
      false
    );
  }
}


/* =========================================================
   LOGIN
========================================================= */

async function loginWithEmail(
  event
) {
  if (event) {
    event.preventDefault();
  }


  const client =
    getAuthClient();


  if (!client) {
    console.error(
      "[AUTH] Supabase client unavailable during login."
    );


    showAuthMessage(
      "The authentication service did not load. Refresh the page.",
      "is-error"
    );


    return;
  }


  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const submitButton =
    document.querySelector(
      "#loginForm button[type='submit']"
    );


  const email =
    emailInput
      ?.value
      .trim()
      .toLowerCase() ||
    "";

  const password =
    passwordInput
      ?.value ||
    "";


  if (
    !email ||
    !password
  ) {
    showAuthMessage(
      "Please enter your email and password.",
      "is-error"
    );

    return;
  }


  setAuthButtonLoading(
    submitButton,
    true,
    "Signing in…"
  );


  showAuthMessage(
    "Signing you in…"
  );


  try {
    const {
      data,
      error
    } =
      await client.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {
      throw error;
    }


    if (
      !data?.user ||
      !data?.session
    ) {
      throw new Error(
        "Supabase did not create a login session."
      );
    }


    showAuthMessage(
      "Login successful. Opening NOUS…",
      "is-success"
    );


    /*
     * Important:
     *
     * If NOUS News sent:
     *
     * login.html?returnTo=/nous-news.html
     *
     * this now returns directly to NOUS News.
     */

    setTimeout(
      redirectAfterAuth,
      250
    );


  } catch (error) {
    console.error(
      "[AUTH] Login error:",
      error
    );


    let message =
      error?.message ||
      "Login was unsuccessful.";


    const lowerMessage =
      message.toLowerCase();


    if (
      lowerMessage.includes(
        "invalid login credentials"
      )
    ) {
      message =
        "The email or password is incorrect, or this account has not been created.";
    }


    if (
      lowerMessage.includes(
        "email not confirmed"
      )
    ) {
      message =
        "Confirm your email address before logging in.";
    }


    showAuthMessage(
      message,
      "is-error"
    );


  } finally {
    setAuthButtonLoading(
      submitButton,
      false
    );
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout(
  event
) {
  if (event) {
    event.preventDefault();
  }


  const client =
    getAuthClient();


  if (client) {
    const {
      error
    } =
      await client.auth
        .signOut();


    if (error) {
      console.error(
        "[AUTH] Logout error:",
        error
      );
    }
  }


  window.location.href =
    buildSiteUrl(
      "/login.html"
    );
}


/* =========================================================
   AUTH PAGE SETUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const client =
      getAuthClient();


    if (!client) {
      console.error(
        "[AUTH] Supabase authentication client was not loaded."
      );


      showAuthMessage(
        "The authentication service did not load.",
        "is-error"
      );


      return;
    }


    /* =====================================================
       FORMS
    ====================================================== */

    const signupForm =
      document.getElementById(
        "signupForm"
      );


    const loginForm =
      document.getElementById(
        "loginForm"
      );


    if (signupForm) {
      signupForm.addEventListener(
        "submit",
        signUpWithEmail
      );
    }


    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        loginWithEmail
      );
    }


    /* =====================================================
       LOGOUT
    ====================================================== */

    const logoutButton =
      document.getElementById(
        "logoutBtn"
      );


    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logout
      );
    }


    /* =====================================================
       SESSION
    ====================================================== */

    const {
      data,
      error
    } =
      await client.auth
        .getSession();


    if (error) {
      console.warn(
        "[AUTH] Could not read authentication session:",
        error
      );
    }


    const user =
      data?.session?.user ||
      null;


    /* =====================================================
       AUTH / GUEST UI
    ====================================================== */

    document
      .querySelectorAll(
        ".auth-only"
      )
      .forEach(
        (
          element
        ) => {
          element.style.display =
            user
              ? ""
              : "none";
        }
      );


    document
      .querySelectorAll(
        ".guest-only"
      )
      .forEach(
        (
          element
        ) => {
          element.style.display =
            user
              ? "none"
              : "";
        }
      );


    /* =====================================================
       CONFIRMATION MESSAGE
    ====================================================== */

    const parameters =
      new URLSearchParams(
        window.location.search
      );


    if (
      parameters.get(
        "confirmed"
      ) ===
      "true"
    ) {
      showAuthMessage(
        "Your email has been confirmed. You may now log in.",
        "is-success"
      );
    }


    /* =====================================================
       ALREADY SIGNED IN + RETURN TO
    ====================================================== */

    /*
     * Example:
     *
     * User presses Sign In from NOUS News,
     * but they already have an active session.
     *
     * We can send them directly back instead
     * of making them authenticate again.
     */

    const returnTo =
      getSafeReturnTo();


    if (
      user &&
      returnTo &&
      (
        document.body.dataset.authPage ===
          "login" ||
        loginForm
      )
    ) {
      window.location.href =
        buildSiteUrl(
          returnTo
        );
    }

  }
);


/* =========================================================
   EXPOSE FUNCTIONS
========================================================= */

window.signUpWithEmail =
  signUpWithEmail;

window.loginWithEmail =
  loginWithEmail;

window.logout =
  logout;