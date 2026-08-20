(() => {
  "use strict";

  const form = document.getElementById("nousCommand");
  const input = document.getElementById("nousInput");
  const notice = document.getElementById("commandNotice");
  const client = window.NOUS_SUPABASE;

  function showNotice(message) {
    if (notice) notice.textContent = message || "";
  }

  async function hasSession() {
    if (!client) return false;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return Boolean(data?.session);
    } catch (error) {
      console.error("[NOUS PUBLIC] Session check failed", error);
      return false;
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input?.value?.trim() || "";
    if (!message) {
      showNotice("Enter a question to continue with NOUS.");
      input?.focus();
      return;
    }

    showNotice("");
    sessionStorage.setItem("nous_pending_message", message);

    if (await hasSession()) {
      location.href = "./app/personal-nous.html?from=public";
      return;
    }

    const returnTo = encodeURIComponent("/app/personal-nous.html?from=public");
    location.href = `./login.html?returnTo=${returnTo}`;
  });
})();
