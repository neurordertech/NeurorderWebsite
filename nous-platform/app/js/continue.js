console.log(
  "[NOUS FILE] app/js/continue.js loaded"
);

document.addEventListener(
  "DOMContentLoaded",
  () => {
    "use strict";

    const STORAGE_KEY =
      "nous-last-workspace";

    const workspaceCard =
      document.getElementById(
        "recent-workspace-card"
      );

    const workspaceStatus =
      document.getElementById(
        "recent-workspace-status"
      );

    const workspaceTitle =
      document.getElementById(
        "recent-workspace-title"
      );

    const workspaceDescription =
      document.getElementById(
        "recent-workspace-description"
      );

    const workspaceButton =
      document.getElementById(
        "continue-workspace-button"
      );

    const workspaceButtonLabel =
      document.getElementById(
        "continue-workspace-label"
      );

    const companionButton =
      document.getElementById(
        "continue-companion-button"
      );

    const viewSpacesButton =
      document.getElementById(
        "view-spaces-button"
      );

    const spacesSection =
      document.querySelector(
        ".spaces-section"
      );

    const companionInput =
      document.getElementById(
        "companion-input"
      );

    const floatingCompanion =
      document.getElementById(
        "floating-companion"
      );

    const workspaceConfiguration = {
      Business: {
        route:
          "./business.html",

        title:
          "Business",

        status:
          "Recent workspace",

        description:
          "Continue your projects, decisions and organisational work.",

        button:
          "Continue Business"
      },

      Education: {
        route:
          "./education.html",

        title:
          "Education",

        status:
          "Recent workspace",

        description:
          "Return to your learning pathway, study plans and academic work.",

        button:
          "Continue Education"
      },

      Personal: {
        route:
          "./personal.html",

        title:
          "Personal",

        status:
          "Recent workspace",

        description:
          "Return to your private NOUS environment and continue your day.",

        button:
          "Continue Personal"
      },

      Community: {
        route:
          "./community/chki-executive-briefing-v3/index.html",

        title:
          "Community",

        status:
          "Recent programme",

        description:
          "Return to CHKI, community programmes and partner collaboration.",

        button:
          "Continue Community"
      }
    };

    function getStoredWorkspace() {
      try {
        const value =
          window.localStorage.getItem(
            STORAGE_KEY
          );

        if (
          value &&
          workspaceConfiguration[value]
        ) {
          return value;
        }
      } catch (error) {
        console.warn(
          "NOUS could not read the recent workspace:",
          error
        );
      }

      return null;
    }

    function saveWorkspace(
      workspaceName
    ) {
      if (
        !workspaceConfiguration[
          workspaceName
        ]
      ) {
        return;
      }

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          workspaceName
        );
      } catch (error) {
        console.warn(
          "NOUS could not save the recent workspace:",
          error
        );
      }
    }

    function renderWorkspace(
      workspaceName
    ) {
      const configuration =
        workspaceConfiguration[
          workspaceName
        ];

      if (!configuration) {
        if (workspaceStatus) {
          workspaceStatus.textContent =
            "Start here";
        }

        if (workspaceTitle) {
          workspaceTitle.textContent =
            "Choose your first space";
        }

        if (workspaceDescription) {
          workspaceDescription.textContent =
            "Open Business, Education, Personal or Community to begin building your NOUS activity.";
        }

        if (workspaceButtonLabel) {
          workspaceButtonLabel.textContent =
            "View spaces";
        }

        workspaceButton?.setAttribute(
          "data-workspace-route",
          "#spaces"
        );

        return;
      }

      if (workspaceStatus) {
        workspaceStatus.textContent =
          configuration.status;
      }

      if (workspaceTitle) {
        workspaceTitle.textContent =
          configuration.title;
      }

      if (workspaceDescription) {
        workspaceDescription.textContent =
          configuration.description;
      }

      if (workspaceButtonLabel) {
        workspaceButtonLabel.textContent =
          configuration.button;
      }

      workspaceButton?.setAttribute(
        "data-workspace-route",
        configuration.route
      );

      workspaceCard?.setAttribute(
        "data-recent-workspace",
        workspaceName.toLowerCase()
      );
    }

    function scrollToSpaces() {
      spacesSection?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });
    }

    function openCompanion() {
      if (companionInput) {
        companionInput.click();
        return;
      }

      if (floatingCompanion) {
        floatingCompanion.click();
      }
    }

    /*
     * Remember workspace choices made from
     * the homepage space cards.
     */
    document
      .querySelectorAll(
        "[data-space]"
      )
      .forEach((element) => {
        element.addEventListener(
          "click",
          () => {
            const workspaceName =
              element.getAttribute(
                "data-space"
              );

            saveWorkspace(
              workspaceName
            );
          }
        );
      });

    /*
     * Community is an anchor instead of a
     * data-space button in the current HTML.
     */
    const communityLink =
      document.querySelector(
        ".community-space"
      );

    communityLink?.addEventListener(
      "click",
      () => {
        saveWorkspace(
          "Community"
        );
      }
    );

    workspaceButton?.addEventListener(
      "click",
      () => {
        const route =
          workspaceButton.getAttribute(
            "data-workspace-route"
          );

        if (
          !route ||
          route === "#spaces"
        ) {
          scrollToSpaces();
          return;
        }

        window.location.href =
          route;
      }
    );

    workspaceCard?.addEventListener(
      "dblclick",
      () => {
        workspaceButton?.click();
      }
    );

    companionButton?.addEventListener(
      "click",
      openCompanion
    );

    viewSpacesButton?.addEventListener(
      "click",
      scrollToSpaces
    );

    const storedWorkspace =
      getStoredWorkspace();

    renderWorkspace(
      storedWorkspace
    );
  }
);

