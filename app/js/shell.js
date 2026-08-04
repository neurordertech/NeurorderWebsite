document.addEventListener("DOMContentLoaded", () => {
  const currentSpaceLabel =
    document.getElementById("current-space-label");

  const navigationItems =
    document.querySelectorAll(".nav-item[data-nav-space]");

  const spaceCards =
    document.querySelectorAll(".space-card[data-space]");

  const companionInput =
    document.getElementById("companion-input");

  const floatingCompanion =
    document.getElementById("floating-companion");

  const companionDrawer =
    document.getElementById("companion-drawer");

  const drawerBackdrop =
    document.getElementById("drawer-backdrop");

  const drawerClose =
    document.getElementById("drawer-close");

  const drawerForm =
    document.getElementById("drawer-form");

  const drawerMessage =
    document.getElementById("drawer-message");

  const drawerNotice =
    document.getElementById("drawer-notice");

  const drawerTitle =
    document.querySelector(".drawer-header h2");

  const drawerLabel =
    document.querySelector(
      'label[for="drawer-message"]',
    );

  const drawerSubmitButton =
    drawerForm?.querySelector(
      'button[type="submit"]',
    );

  const searchButton =
    document.querySelector(
      'button[aria-label="Search NOUS"]',
    );

  const profileButton =
    document.querySelector(
      'button[aria-label="Open profile"]',
    );

  /*
   * Keep all application routes in one place.
   *
   * Update a filename here if one of your pages uses
   * a different name.
   */
  const routes = {
    Home: "./index.html",
    Business: "./business.html",
    Education: "./education.html",
    Personal: "./personal.html",
    Identity: "./identity.html",
  };

  let drawerMode = "companion";

  function getCurrentPage() {
    const pathname = window.location.pathname;
    const filename =
      pathname.split("/").pop()?.toLowerCase() || "";

    if (
      filename === "" ||
      filename === "index.html"
    ) {
      return "Home";
    }

    if (filename === "business.html") {
      return "Business";
    }

    if (filename === "education.html") {
      return "Education";
    }

    if (filename === "personal.html") {
      return "Personal";
    }

    if (filename === "companion.html") {
      return "Companion";
    }

    if (filename === "identity.html") {
      return "Identity";
    }

    return "Home";
  }

  function setCurrentSpace(spaceName) {
    if (currentSpaceLabel) {
      currentSpaceLabel.textContent = spaceName;
    }

    navigationItems.forEach((item) => {
      const itemSpace =
        item.getAttribute("data-nav-space");

      item.classList.toggle(
        "is-active",
        itemSpace === spaceName,
      );

      if (itemSpace === spaceName) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  function navigateTo(spaceName) {
    const route = routes[spaceName];

    if (!route) {
      console.warn(
        `No route has been configured for ${spaceName}.`,
      );

      return;
    }

    window.location.href = route;
  }

  function configureCompanionDrawer() {
    drawerMode = "companion";

    if (drawerTitle) {
      drawerTitle.textContent = "Begin with NOUS";
    }

    if (drawerLabel) {
      drawerLabel.textContent =
        "What is on your mind?";
    }

    if (drawerMessage) {
      drawerMessage.placeholder =
        "Ask NOUS something...";
    }

    if (drawerSubmitButton) {
      drawerSubmitButton.innerHTML = `
        Send to O.R.U.L.E.
        <span aria-hidden="true">→</span>
      `;
    }

    if (drawerNotice) {
      drawerNotice.textContent =
        "Connected requests are routed through O.R.U.L.E.";
    }
  }

  function configureSearchDrawer() {
    drawerMode = "search";

    if (drawerTitle) {
      drawerTitle.textContent = "Search NOUS";
    }

    if (drawerLabel) {
      drawerLabel.textContent =
        "What are you looking for?";
    }

    if (drawerMessage) {
      drawerMessage.placeholder =
        "Search spaces, work, research or ask NOUS...";
    }

    if (drawerSubmitButton) {
      drawerSubmitButton.innerHTML = `
        Search
        <span aria-hidden="true">→</span>
      `;
    }

    if (drawerNotice) {
      drawerNotice.textContent =
        "Search will connect to your NOUS spaces and O.R.U.L.E. in the next phase.";
    }
  }

  function openDrawer(mode = "companion") {
    if (!companionDrawer) {
      return;
    }

    if (mode === "search") {
      configureSearchDrawer();
    } else {
      configureCompanionDrawer();
    }

    companionDrawer.classList.add("is-open");
    companionDrawer.setAttribute(
      "aria-hidden",
      "false",
    );

    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      drawerMessage?.focus();
    }, 380);
  }

  function closeDrawer() {
    if (!companionDrawer) {
      return;
    }

    companionDrawer.classList.remove("is-open");
    companionDrawer.setAttribute(
      "aria-hidden",
      "true",
    );

    document.body.style.overflow = "";
  }

  navigationItems.forEach((item) => {
    item.addEventListener("click", () => {
      const spaceName =
        item.getAttribute("data-nav-space");

      if (!spaceName) {
        return;
      }

      if (spaceName === "Companion") {
        openDrawer("companion");
        return;
      }

      navigateTo(spaceName);
    });
  });

  spaceCards.forEach((card) => {
    card.addEventListener("click", () => {
      const spaceName =
        card.getAttribute("data-space");

      if (!spaceName) {
        return;
      }

      navigateTo(spaceName);
    });
  });

  companionInput?.addEventListener(
    "click",
    () => openDrawer("companion"),
  );

  floatingCompanion?.addEventListener(
    "click",
    () => openDrawer("companion"),
  );

  searchButton?.addEventListener(
    "click",
    () => openDrawer("search"),
  );

  profileButton?.addEventListener("click", () => {
    navigateTo("Identity");
  });

  drawerBackdrop?.addEventListener(
    "click",
    closeDrawer,
  );

  drawerClose?.addEventListener(
    "click",
    closeDrawer,
  );

  document.addEventListener("keydown", (event) => {
    const drawerIsOpen =
      companionDrawer?.classList.contains("is-open");

    if (
      event.key === "Escape" &&
      drawerIsOpen
    ) {
      closeDrawer();
      return;
    }

    /*
     * Command + K on Mac
     * Control + K on Windows
     */
    if (
      event.key.toLowerCase() === "k" &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      openDrawer("search");
    }
  });

  drawerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = drawerMessage?.value.trim();

    if (!message) {
      if (drawerNotice) {
        drawerNotice.textContent = drawerMode === "search"
          ? "Enter something to search for."
          : "Write a message before sending it to O.R.U.L.E.";
      }
      drawerMessage?.focus();
      return;
    }

    if (drawerMode === "search") {
      const match = [...document.querySelectorAll("a[href], [data-space]")]
        .find((element) => element.textContent?.toLowerCase().includes(message.toLowerCase()));
      if (match) {
        const href = match.getAttribute("href");
        const space = match.getAttribute("data-space");
        if (href) window.location.href = href;
        else if (space) navigateTo(space);
        return;
      }
      if (drawerNotice) drawerNotice.textContent = `No local NOUS item matched “${message}”.`;
      return;
    }

    const client = window.NOUS_SUPABASE;
    if (!client) {
      if (drawerNotice) drawerNotice.textContent = "Supabase is not configured for NOUS yet.";
      return;
    }

    const button = drawerSubmitButton;
    const original = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.textContent = "Thinking…";
    }
    if (drawerNotice) drawerNotice.textContent = "O.R.U.L.E. is processing your request…";

    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Your session has expired. Please sign in again.");

      const { data, error } = await client.functions.invoke("nous-companion", {
        body: { message, space: getCurrentPage().toLowerCase(), source: "nous_drawer" },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) throw error;

      const reply = data?.response || data?.message || "NOUS completed the request.";
      if (drawerNotice) drawerNotice.textContent = reply;
      if (drawerMessage) drawerMessage.value = "";
    } catch (error) {
      console.error("NOUS drawer request failed", error);
      if (drawerNotice) drawerNotice.textContent = error?.message || "NOUS could not complete the request.";
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = original || 'Send to O.R.U.L.E. <span aria-hidden="true">→</span>';
      }
    }
  });

  /*
   * Automatically display the correct active page when
   * this same shell is used across the other workspaces.
   */
  setCurrentSpace(getCurrentPage());
});