document.addEventListener("DOMContentLoaded", () => {
  "use strict";

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
      'label[for="drawer-message"]'
    );

  const drawerSubmitButton =
    drawerForm?.querySelector(
      'button[type="submit"]'
    );

  const searchButton =
    document.querySelector(
      'button[aria-label="Search NOUS"]'
    );

  const profileButton =
    document.querySelector(
      'button[aria-label="Open profile"]'
    );

  /*
   * Keep all application routes in one place.
   */
  const routes = {
    Home: "./index.html",
    Business: "./business.html",
    Education: "./education.html",
    Personal: "./personal.html",
    Identity: "./identity.html",
    Membership: "./membership.html"
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

    if (filename === "membership.html") {
      return "Membership";
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
        itemSpace === spaceName
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
        `No route has been configured for ${spaceName}.`
      );

      return;
    }

    window.location.href = route;
  }

  function extractCompanionReply(data) {
    const possibleValues = [
      data?.response,
      data?.reply,
      data?.message,
      data?.answer,
      data?.content,
      data?.output,

      data?.result?.response,
      data?.result?.reply,
      data?.result?.message,
      data?.result?.answer,
      data?.result?.content,
      data?.result?.output,

      data?.orule?.response,
      data?.orule?.message,

      data?.data?.response,
      data?.data?.reply,
      data?.data?.message,
      data?.data?.content
    ];

    const reply = possibleValues.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    );

    return reply?.trim() || null;
  }

  function isSimpleGreeting(message) {
    return /^(hello|hi|hey|howzit|good morning|good afternoon|good evening)[.!?\s]*$/i
      .test(message.trim());
  }

  function createGreeting(user) {
    const name =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "";

    const hour = new Date().getHours();

    let greeting = "Hello";

    if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 18) {
      greeting = "Good afternoon";
    } else {
      greeting = "Good evening";
    }

    return name
      ? `${greeting}, ${name}. What would you like to work on?`
      : `${greeting}. What would you like to work on?`;
  }

  function setDrawerNotice(
    message,
    isError = false
  ) {
    if (!drawerNotice) {
      return;
    }

    drawerNotice.textContent = message;

    drawerNotice.classList.toggle(
      "is-error",
      isError
    );
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

    setDrawerNotice(
      "Connected requests are routed through O.R.U.L.E."
    );
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

    setDrawerNotice(
      "Search across available NOUS pages and spaces."
    );
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
      "false"
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
      "true"
    );

    document.body.style.overflow = "";
  }

  function findLocalSearchMatch(query) {
    const normalisedQuery =
      query.trim().toLowerCase();

    if (!normalisedQuery) {
      return null;
    }

    return [
      ...document.querySelectorAll(
        "a[href], [data-space], [data-nav-space]"
      )
    ].find((element) => {
      const text =
        element.textContent
          ?.trim()
          .toLowerCase() || "";

      const dataSpace =
        element
          .getAttribute("data-space")
          ?.toLowerCase() || "";

      const navSpace =
        element
          .getAttribute("data-nav-space")
          ?.toLowerCase() || "";

      return (
        text.includes(normalisedQuery) ||
        dataSpace.includes(normalisedQuery) ||
        navSpace.includes(normalisedQuery)
      );
    });
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
    () => openDrawer("companion")
  );

  floatingCompanion?.addEventListener(
    "click",
    () => openDrawer("companion")
  );

  searchButton?.addEventListener(
    "click",
    () => openDrawer("search")
  );

  profileButton?.addEventListener(
    "click",
    () => {
      navigateTo("Identity");
    }
  );

  drawerBackdrop?.addEventListener(
    "click",
    closeDrawer
  );

  drawerClose?.addEventListener(
    "click",
    closeDrawer
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const drawerIsOpen =
        companionDrawer?.classList.contains(
          "is-open"
        );

      if (
        event.key === "Escape" &&
        drawerIsOpen
      ) {
        closeDrawer();
        return;
      }

      /*
       * Command + K on Mac.
       * Control + K on Windows.
       */
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        openDrawer("search");
      }
    }
  );

  drawerForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const message =
        drawerMessage?.value.trim();

      if (!message) {
        setDrawerNotice(
          drawerMode === "search"
            ? "Enter something to search for."
            : "Write a message before sending it to O.R.U.L.E.",
          true
        );

        drawerMessage?.focus();
        return;
      }

      if (drawerMode === "search") {
        const match =
          findLocalSearchMatch(message);

        if (match) {
          const href =
            match.getAttribute("href");

          const space =
            match.getAttribute("data-space") ||
            match.getAttribute("data-nav-space");

          if (href) {
            window.location.href = href;
          } else if (space) {
            navigateTo(space);
          }

          return;
        }

        setDrawerNotice(
          `No local NOUS item matched “${message}”.`,
          true
        );

        return;
      }

      const client =
        window.NOUS_SUPABASE;

      if (!client) {
        setDrawerNotice(
          "Supabase is not configured for NOUS yet.",
          true
        );

        return;
      }

      const button =
        drawerSubmitButton;

      const originalButtonContent =
        button?.innerHTML;

      if (button) {
        button.disabled = true;
        button.textContent = "Thinking…";
      }

      setDrawerNotice(
        "O.R.U.L.E. is processing your request…"
      );

      try {
        const {
          data: { session },
          error: sessionError
        } = await client.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        /*
         * Simple greetings are handled locally.
         * This avoids unnecessary model usage and gives
         * an immediate response.
         */
        if (isSimpleGreeting(message)) {
          setDrawerNotice(
            createGreeting(session.user)
          );

          if (drawerMessage) {
            drawerMessage.value = "";
          }

          return;
        }

        const {
          data,
          error
        } = await client.functions.invoke(
          "nous-companion",
          {
            body: {
              message,
              space:
                getCurrentPage().toLowerCase(),
              source: "nous_drawer"
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

        const reply =
          extractCompanionReply(data);

        if (!reply) {
          console.log(
            "Unexpected NOUS drawer response:",
            data
          );

          throw new Error(
            "NOUS responded, but no readable answer was returned."
          );
        }

        setDrawerNotice(reply);

        if (drawerMessage) {
          drawerMessage.value = "";
        }
      } catch (error) {
        console.error(
          "NOUS drawer request failed:",
          error
        );

        setDrawerNotice(
          error?.message ||
            "NOUS could not complete the request.",
          true
        );
      } finally {
        if (button) {
          button.disabled = false;

          button.innerHTML =
            originalButtonContent ||
            'Send to O.R.U.L.E. <span aria-hidden="true">→</span>';
        }
      }
    }
  );

  /*
   * Automatically display the correct active page when
   * this shell is used across multiple workspaces.
   */
  setCurrentSpace(getCurrentPage());
});