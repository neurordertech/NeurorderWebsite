(() => {
  "use strict";

  const client = window.NOUS_SUPABASE;
  const view = document.getElementById("rosView");
  const routes = {
    business: "/app/business.html",
    education: "/app/education.html",
    personal: "/app/personal.html"
  };

  function setView(message) {
    const p = view?.querySelector("p");
    if (p) p.textContent = message;
  }

  async function openSpace(space) {
    const route = routes[space];
    if (!route) return;

    setView(`Opening ${space.charAt(0).toUpperCase() + space.slice(1)}…`);

    let signedIn = false;
    if (client) {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        signedIn = Boolean(data?.session);
      } catch (error) {
        console.error("[NOUS ROS] Session check failed", error);
      }
    }

    if (signedIn) {
      location.href = route;
      return;
    }

    location.href = `./login.html?returnTo=${encodeURIComponent(route)}`;
  }

  document.querySelectorAll(".ros-navigation [data-space]").forEach((button) => {
    button.addEventListener("click", () => openSpace(button.dataset.space));
  });
})();
