(() => {
  const client = window.NOUS_SUPABASE;
  if (!client) {
    console.error("NOUS authentication configuration is unavailable.");
    const message = document.getElementById("auth-message");
    if (message) {
      message.textContent = "NOUS is not connected to Supabase yet. Add the public project URL and key in js/supabase-config.js.";
      message.className = "auth-message error";
    }
    return;
  }

  const page = document.body.dataset.authPage;
  const form = document.getElementById("auth-form");
  const message = document.getElementById("auth-message");
  const submit = form?.querySelector('button[type="submit"]');
  const returnPath = new URLSearchParams(location.search).get("returnTo");

  function safeReturnPath(value) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app/index.html";
    return value;
  }

  function show(text, type = "") {
    if (!message) return;
    message.textContent = text;
    message.className = `auth-message ${type}`.trim();
  }

  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = busy;
    submit.dataset.original ||= submit.textContent;
    submit.textContent = busy ? "Please wait…" : submit.dataset.original;
  }

  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Show" : "Hide";
    });
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session && (page === "login" || page === "signup")) {
      location.replace(safeReturnPath(returnPath));
    }
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    show("");
    setBusy(true);

    try {
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;

      if (!email || !password) throw new Error("Enter your email address and password.");

      if (page === "signup") {
        const fullName = form.full_name.value.trim();
        const accountType = form.account_type.value;
        const confirmPassword = form.confirm_password.value;
        if (!fullName) throw new Error("Enter your full name.");
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");

        const emailRedirectTo = `${location.origin}/login.html?confirmed=1`;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { full_name: fullName, account_type: accountType }
          }
        });
        if (error) throw error;

        if (data.session) {
          location.replace("/app/index.html");
        } else {
          show("Account created. Check your email to confirm your address, then sign in.", "success");
          form.reset();
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.replace(safeReturnPath(returnPath));
      }
    } catch (error) {
      show(error?.message || "Authentication failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  });

  if (new URLSearchParams(location.search).get("confirmed") === "1") {
    show("Email confirmed. You can now sign in.", "success");
  }
})();
