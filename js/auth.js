/* =========================================================
   NEURORDER — PRODUCTION AUTHENTICATION
========================================================= */

function getAuthClient() {
  return (
    window.nousSupabase ||
    window.supabaseClient ||
    null
  );
}

function showAuthMessage(message, type = "") {
  const box = document.getElementById("authMessage");

  if (!box) {
    console.log(`[Auth message] ${message}`);
    return;
  }

  box.textContent = message;

  box.className = type
    ? `auth-message ${type}`
    : "auth-message";

  box.hidden = false;
}

function setAuthButtonLoading(button, loading, text) {
  if (!button) {
    return;
  }

  if (!button.dataset.originalHtml) {
    button.dataset.originalHtml = button.innerHTML;
  }

  button.disabled = loading;

  if (loading) {
    button.innerHTML = `
      <span>${text}</span>
      <i class="fas fa-circle-notch fa-spin"></i>
    `;
  } else {
    button.innerHTML = button.dataset.originalHtml;
  }
}


/* =========================================================
   SIGN UP
========================================================= */

async function signUpWithEmail(event) {
  if (event) {
    event.preventDefault();
  }

  const client = getAuthClient();

  if (!client) {
    showAuthMessage(
      "The authentication service did not load. Refresh the page.",
      "is-error"
    );

    return;
  }

  const nameInput =
    document.getElementById("signupName");

  const emailInput =
    document.getElementById("signupEmail");

  const passwordInput =
    document.getElementById("signupPassword");

  const submitButton =
    document.querySelector(
      "#signupForm button[type='submit']"
    );

  const fullName =
    nameInput?.value.trim() || "";

  const email =
    emailInput?.value.trim().toLowerCase() || "";

  const password =
    passwordInput?.value || "";

  if (!fullName || !email || !password) {
    showAuthMessage(
      "Please complete your name, email and password.",
      "is-error"
    );

    return;
  }

  if (password.length < 8) {
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
    "Creating your Nous account…"
  );

  try {
    const {
      data,
      error
    } = await client.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName
        },

        emailRedirectTo:
          "https://neurorder.com/login.html?confirmed=true"
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

    if (data.session) {
      showAuthMessage(
        "Your account was created and you are signed in.",
        "is-success"
      );

      window.location.href =
        "https://neurorder.com/nous-news.html";

      return;
    }

    showAuthMessage(
      "Your account was created. Check your email and confirm your account before logging in.",
      "is-success"
    );

    if (passwordInput) {
      passwordInput.value = "";
    }
  } catch (error) {
    console.error("Signup error:", error);

    let message =
      error?.message ||
      "Your account could not be created.";

    if (
      message.toLowerCase().includes(
        "user already registered"
      )
    ) {
      message =
        "An account already exists for this email. Please log in instead.";
    }

    if (
      message.toLowerCase().includes(
        "signup is disabled"
      )
    ) {
      message =
        "New account registration is currently disabled in Supabase.";
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

async function loginWithEmail(event) {
  if (event) {
    event.preventDefault();
  }

  const client = getAuthClient();

  if (!client) {
  console.log(
    "Login successful. Opening Nous…"
  );

    return;
  }

  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");

  const submitButton =
    document.querySelector(
      "#loginForm button[type='submit']"
    );

  const email =
    emailInput?.value.trim().toLowerCase() || "";

  const password =
    passwordInput?.value || "";

  if (!email || !password) {
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
    } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data?.user || !data?.session) {
      throw new Error(
        "Supabase did not create a login session."
      );
    }

    showAuthMessage(
      "Login successful. Opening Nous…",
      "is-success"
    );

    const savedDestination =
      localStorage.getItem(
        "neurorderDestination"
      );

    const urlDestination =
      new URLSearchParams(
        window.location.search
      ).get("returnTo");

    localStorage.removeItem(
      "neurorderDestination"
    );

    if (urlDestination) {
      window.location.href =
        urlDestination;

      return;
    }

    if (savedDestination === "nous") {
      window.location.href =
        "https://neurorder.com/nous.html";

      return;
    }

    window.location.href =
      "https://neurorder.com/nous-news.html";
  } catch (error) {
    console.error("Login error:", error);

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

async function logout(event) {
  if (event) {
    event.preventDefault();
  }

  const client = getAuthClient();

  if (client) {
    const { error } =
      await client.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  window.location.href =
    "https://neurorder.com/login.html";
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
        "Supabase authentication client was not loaded."
      );

      showAuthMessage(
        "The authentication service did not load.",
        "is-error"
      );

      return;
    }

    const signupForm =
      document.getElementById("signupForm");

    const loginForm =
      document.getElementById("loginForm");

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

    const logoutButton =
      document.getElementById("logoutBtn");

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logout
      );
    }

    const {
      data,
      error
    } = await client.auth.getSession();

    if (error) {
      console.warn(
        "Could not read authentication session:",
        error
      );
    }

    const user =
      data?.session?.user || null;

    document
      .querySelectorAll(".auth-only")
      .forEach((element) => {
        element.style.display =
          user ? "" : "none";
      });

    document
      .querySelectorAll(".guest-only")
      .forEach((element) => {
        element.style.display =
          user ? "none" : "";
      });

    const parameters =
      new URLSearchParams(
        window.location.search
      );

    if (
      parameters.get("confirmed") === "true"
    ) {
      showAuthMessage(
        "Your email has been confirmed. You may now log in.",
        "is-success"
      );
    }
  }
);


/* =========================================================
   EXPOSE FUNCTIONS FOR EXISTING INLINE HTML
========================================================= */

window.signUpWithEmail =
  signUpWithEmail;

window.loginWithEmail =
  loginWithEmail;

window.logout =
  logout;