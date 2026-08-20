(() => {
  "use strict";

  const client = window.NOUS_SUPABASE;

  if (!client) {
    console.error("NOUS authentication is unavailable because Supabase is not configured.");
    const target = new URL("../login.html", window.location.href);
    target.searchParams.set("error", "config");
    window.location.replace(target.href);
    return;
  }

  async function initialise() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;

    if (!session) {
      const returnTo = encodeURIComponent(location.pathname + location.search);
      location.replace(`../login.html?returnTo=${returnTo}`);
      return;
    }

    const user = session.user;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "NOUS User";
    const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();

    document.querySelectorAll(".profile-avatar").forEach(el => {
      if (el.tagName === "IMG") {
        const avatarUrl = user.user_metadata?.avatar_url;
        if (avatarUrl) el.src = avatarUrl;
        el.alt = `${fullName} profile picture`;
      } else {
        el.textContent = initials || "NU";
      }
    });
    document.querySelectorAll(".profile-copy strong").forEach(el => el.textContent = fullName);
    document.querySelectorAll(".profile-copy small").forEach(el => {
      el.textContent = user.user_metadata?.organisation_name || "Personal workspace";
    });
    document.documentElement.dataset.authReady = "true";
  }

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) location.replace("../login.html");
  });

  initialise().catch(error => {
    console.error("NOUS auth guard failed", error);
    location.replace("../login.html?error=session");
  });
})();
