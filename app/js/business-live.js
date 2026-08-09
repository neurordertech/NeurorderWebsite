console.log(
  "[NOUS FILE] app/js/business-live.js loaded"
);

(() => {
  "use strict";

  const BUSINESS_APPS_KEY =
    "nous-business-applications";

  const BUSINESS_EVENTS_KEY =
    "nous-business-calendar-events";

  const MAX_BUSINESS_APPS = 6;

  const SOUTH_AFRICAN_TIME_ZONE =
    "Africa/Johannesburg";

  const DEFAULT_BUSINESS_APPS = [
    "Microsoft 365",
    "Email",
    "Microsoft Teams",
    "LinkedIn",
    "NOUS Calendar"
  ];

  const BUSINESS_APPLICATIONS = {
    "Microsoft 365": {
      short: "365",
      className: "app-microsoft-live",
      description:
        "Microsoft productivity and organisation tools",
      url: "https://www.microsoft365.com/"
    },

    Email: {
      short: "✉",
      className: "app-email-live",
      description:
        "Business email and communication",
      url: "https://mail.google.com/"
    },

    "Microsoft Teams": {
      short: "T",
      className: "app-teams",
      description:
        "Team communication and meetings",
      url: "https://teams.microsoft.com/"
    },

    LinkedIn: {
      short: "in",
      className: "app-linkedin",
      description:
        "Professional communication and networks",
      url: "https://www.linkedin.com/"
    },

    "NOUS Calendar": {
      short: null,
      className: "app-calendar",
      description:
        "NOUS work scheduling and time intelligence",
      internalAction: "calendar"
    },

    OneDrive: {
      short: "1D",
      className: "app-onedrive",
      description:
        "Cloud documents and storage",
      url: "https://onedrive.live.com/"
    },

    SharePoint: {
      short: "SP",
      className: "app-sharepoint",
      description:
        "Organisation sites and shared resources",
      url:
        "https://www.microsoft.com/microsoft-365/sharepoint/collaboration"
    },

    "Power BI": {
      short: "BI",
      className: "app-powerbi",
      description:
        "Business analytics and reporting",
      url: "https://app.powerbi.com/"
    },

    Slack: {
      short: "SL",
      className: "app-slack",
      description:
        "Organisation messaging",
      url: "https://app.slack.com/"
    },

    Zoom: {
      short: "ZM",
      className: "app-zoom",
      description:
        "Meetings and video calls",
      url: "https://zoom.us/"
    },

    Custom: {
      short: "+",
      className: "app-custom",
      description:
        "Prepare another Business application",
      internalAction: "custom"
    }
  };

  function initialiseBusinessLiveData() {
    const client =
      window.NOUS_SUPABASE;

    const appDock =
      document.getElementById(
        "business-app-dock"
      );

    const manageAppsButton =
      document.getElementById(
        "manage-business-apps"
      );

    const appModal =
      document.getElementById(
        "business-app-modal"
      );

    const appModalClose =
      document.getElementById(
        "business-app-modal-close"
      );

    const appModalBackdrop =
      document.getElementById(
        "business-app-modal-backdrop"
      );

    const appModalNotice =
      document.getElementById(
        "business-app-modal-notice"
      );

    let selectedApplications =
      loadBusinessApplications();

    function readArray(key) {
      try {
        const stored =
          window.localStorage.getItem(key);

        const parsed =
          stored
            ? JSON.parse(stored)
            : [];

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        console.warn(
          `NOUS could not read ${key}:`,
          error
        );

        return [];
      }
    }

    function saveArray(
      key,
      value
    ) {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify(value)
        );
      } catch (error) {
        console.warn(
          `NOUS could not save ${key}:`,
          error
        );
      }
    }

    function loadBusinessApplications() {
      const stored =
        readArray(
          BUSINESS_APPS_KEY
        ).filter(
          (appName) =>
            BUSINESS_APPLICATIONS[
              appName
            ]
        );

      return stored.length
        ? stored.slice(
            0,
            MAX_BUSINESS_APPS
          )
        : [
            ...DEFAULT_BUSINESS_APPS
          ];
    }

    function openApplicationModal() {
      if (!appModal) {
        return;
      }

      appModal.classList.add(
        "is-open"
      );

      appModal.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.style.overflow =
        "hidden";

      renderAvailableApplicationStates();

      appModalClose?.focus();
    }

    function closeApplicationModal() {
      if (!appModal) {
        return;
      }

      appModal.classList.remove(
        "is-open"
      );

      appModal.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.style.overflow =
        "";
    }

    function openCalendar(
      view = "month"
    ) {
      const target =
        view === "today"
          ? "./calendar.html?view=today"
          : "./calendar.html";

      window.location.href =
        target;
    }

    function openApplication(
      application
    ) {
      if (
        application.internalAction ===
        "calendar"
      ) {
        openCalendar("month");
        return;
      }

      if (
        application.internalAction ===
        "custom"
      ) {
        if (appModalNotice) {
          appModalNotice.textContent =
            "Custom provider connections will be added through the NOUS connections system.";
        }

        openApplicationModal();
        return;
      }

      if (application.url) {
        window.open(
          application.url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }

    function initialiseTimeModal() {
      const openButton =
        document.getElementById(
          "business-clock-open"
        );

      const modal =
        document.getElementById(
          "time-modal"
        );

      const backdrop =
        document.getElementById(
          "time-modal-backdrop"
        );

      const closeButton =
        document.getElementById(
          "time-modal-close"
        );

      const scheduleButton =
        document.getElementById(
          "time-open-schedule"
        );

      const todayButton =
        document.getElementById(
          "time-view-today"
        );

      const hoursElement =
        document.querySelector(
          "[data-time-modal-hours]"
        );

      const minutesElement =
        document.querySelector(
          "[data-time-modal-minutes]"
        );

      const secondsElement =
        document.querySelector(
          "[data-time-modal-seconds]"
        );

      const dateElement =
        document.querySelector(
          "[data-time-modal-date]"
        );

      let clockTimer = null;
      let closeTimer = null;

      function getTimePart(
        parts,
        type
      ) {
        return (
          parts.find(
            (part) =>
              part.type === type
          )?.value || "00"
        );
      }

      function updateSouthAfricanClock() {
        const now =
          new Date();

        const timeParts =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              timeZone:
                SOUTH_AFRICAN_TIME_ZONE,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false
            }
          ).formatToParts(now);

        if (hoursElement) {
          hoursElement.textContent =
            getTimePart(
              timeParts,
              "hour"
            );
        }

        if (minutesElement) {
          minutesElement.textContent =
            getTimePart(
              timeParts,
              "minute"
            );
        }

        if (secondsElement) {
          secondsElement.textContent =
            getTimePart(
              timeParts,
              "second"
            );
        }

        if (dateElement) {
          dateElement.textContent =
            new Intl.DateTimeFormat(
              "en-ZA",
              {
                timeZone:
                  SOUTH_AFRICAN_TIME_ZONE,
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              }
            ).format(now);
        }
      }

      function openTimeModal() {
        if (
          !modal ||
          !backdrop
        ) {
          return;
        }

        window.clearTimeout(
          closeTimer
        );

        modal.hidden =
          false;

        backdrop.hidden =
          false;

        modal.setAttribute(
          "aria-hidden",
          "false"
        );

        requestAnimationFrame(
          () => {
            modal.classList.add(
              "is-open"
            );

            backdrop.classList.add(
              "is-open"
            );
          }
        );

        document.body.classList.add(
          "modal-open"
        );

        updateSouthAfricanClock();

        window.clearInterval(
          clockTimer
        );

        clockTimer =
          window.setInterval(
            updateSouthAfricanClock,
            1000
          );

        closeButton?.focus();
      }

      function closeTimeModal() {
        if (
          !modal ||
          !backdrop
        ) {
          return;
        }

        modal.classList.remove(
          "is-open"
        );

        backdrop.classList.remove(
          "is-open"
        );

        modal.setAttribute(
          "aria-hidden",
          "true"
        );

        document.body.classList.remove(
          "modal-open"
        );

        window.clearInterval(
          clockTimer
        );

        closeTimer =
          window.setTimeout(
            () => {
              modal.hidden =
                true;

              backdrop.hidden =
                true;
            },
            180
          );

        openButton?.focus();
      }

      openButton?.addEventListener(
        "click",
        openTimeModal
      );

      closeButton?.addEventListener(
        "click",
        closeTimeModal
      );

      backdrop?.addEventListener(
        "click",
        closeTimeModal
      );

      scheduleButton?.addEventListener(
        "click",
        () => {
          openCalendar("month");
        }
      );

      todayButton?.addEventListener(
        "click",
        () => {
          openCalendar("today");
        }
      );

      document.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Escape" &&
            modal?.classList.contains(
              "is-open"
            )
          ) {
            closeTimeModal();
          }
        }
      );
    }

    function createApplicationIcon(
      appName,
      application
    ) {
      if (
        appName ===
        "NOUS Calendar"
      ) {
        const southAfricanDay =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              timeZone:
                SOUTH_AFRICAN_TIME_ZONE,
              day: "numeric"
            }
          ).format(
            new Date()
          );

        return `
          <span class="business-app-icon app-calendar">
            <span class="calendar-app-top"></span>

            <strong data-current-day>
              ${southAfricanDay}
            </strong>
          </span>
        `;
      }

      if (
        appName ===
        "Microsoft 365"
      ) {
        return `
          <span class="business-app-icon app-microsoft">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        `;
      }

      return `
        <span
          class="business-app-icon ${application.className}"
        >
          <strong>
            ${application.short}
          </strong>
        </span>
      `;
    }

    function renderBusinessApplications() {
      if (!appDock) {
        return;
      }

      appDock.innerHTML =
        "";

      selectedApplications.forEach(
        (appName) => {
          const application =
            BUSINESS_APPLICATIONS[
              appName
            ];

          if (!application) {
            return;
          }

          const button =
            document.createElement(
              "button"
            );

          button.className =
            "business-app";

          button.type =
            "button";

          button.dataset.appName =
            appName;

          button.title =
            appName;

          button.setAttribute(
            "aria-label",
            `Open ${appName}`
          );

          button.innerHTML = `
            ${createApplicationIcon(
              appName,
              application
            )}

            <span class="business-app-label">
              ${appName}
            </span>
          `;

          button.addEventListener(
            "click",
            () => {
              openApplication(
                application
              );
            }
          );

          appDock.appendChild(
            button
          );
        }
      );

      const addButton =
        document.createElement(
          "button"
        );

      addButton.className =
        "business-app add-business-app";

      addButton.type =
        "button";

      addButton.title =
        "Manage applications";

      addButton.setAttribute(
        "aria-label",
        "Manage Business applications"
      );

      addButton.innerHTML = `
        <span class="business-app-icon app-add">
          +
        </span>

        <span class="business-app-label">
          Manage apps
        </span>
      `;

      addButton.addEventListener(
        "click",
        openApplicationModal
      );

      appDock.appendChild(
        addButton
      );
    }

    function renderAvailableApplicationStates() {
      document
        .querySelectorAll(
          "[data-add-app]"
        )
        .forEach(
          (button) => {
            const appName =
              button.getAttribute(
                "data-add-app"
              );

            const selected =
              selectedApplications.includes(
                appName
              );

            button.classList.toggle(
              "is-selected",
              selected
            );

            button.setAttribute(
              "aria-pressed",
              String(selected)
            );
          }
        );
    }

    function toggleApplication(
      appName
    ) {
      if (
        !appName ||
        !BUSINESS_APPLICATIONS[
          appName
        ]
      ) {
        return;
      }

      const existingIndex =
        selectedApplications.indexOf(
          appName
        );

      if (
        existingIndex !== -1
      ) {
        selectedApplications.splice(
          existingIndex,
          1
        );

        if (appModalNotice) {
          appModalNotice.textContent =
            `${appName} was removed from your Business dock.`;
        }
      } else if (
        selectedApplications.length <
        MAX_BUSINESS_APPS
      ) {
        selectedApplications.push(
          appName
        );

        if (appModalNotice) {
          appModalNotice.textContent =
            `${appName} was added to your Business dock.`;
        }
      } else {
        const replacedApplication =
          selectedApplications.shift();

        selectedApplications.push(
          appName
        );

        if (appModalNotice) {
          appModalNotice.textContent =
            `${appName} replaced ${replacedApplication} in your Business dock.`;
        }
      }

      saveArray(
        BUSINESS_APPS_KEY,
        selectedApplications
      );

      renderBusinessApplications();
      renderAvailableApplicationStates();
    }

    function bindApplicationManager() {
      manageAppsButton?.addEventListener(
        "click",
        openApplicationModal
      );

      appModalClose?.addEventListener(
        "click",
        closeApplicationModal
      );

      appModalBackdrop?.addEventListener(
        "click",
        closeApplicationModal
      );

      document
        .querySelectorAll(
          "[data-add-app]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () => {
                const appName =
                  button.getAttribute(
                    "data-add-app"
                  );

                toggleApplication(
                  appName
                );
              }
            );
          }
        );
    }

    async function loadCurrentUserProfile() {
      if (!client) {
        return;
      }

      try {
        const {
          data: {
            session
          },
          error
        } =
          await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session?.user) {
          return;
        }

        const user =
          session.user;

        const displayName =
          user.user_metadata
            ?.display_name ||
          user.user_metadata
            ?.full_name ||
          user.email
            ?.split("@")[0] ||
          "Member";

        const organisation =
          user.user_metadata
            ?.organisation_name ||
          user.user_metadata
            ?.organisation ||
          "Organisation";

        const avatarUrl =
          user.user_metadata
            ?.avatar_url ||
          user.user_metadata
            ?.picture ||
          "";

        const initials =
          displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
              (part) =>
                part[0]
                  ?.toUpperCase()
            )
            .join("") ||
          "NM";

        const profileName =
          document.getElementById(
            "business-profile-name"
          );

        const profileOrganisation =
          document.getElementById(
            "business-profile-organisation"
          );

        const profileAvatar =
          document.getElementById(
            "business-profile-avatar"
          );

        if (profileName) {
          profileName.textContent =
            displayName;
        }

        if (profileOrganisation) {
          profileOrganisation.textContent =
            organisation;
        }

        if (profileAvatar) {
          if (avatarUrl) {
            profileAvatar.textContent =
              "";

            profileAvatar.style.backgroundImage =
              `url("${avatarUrl}")`;

            profileAvatar.style.backgroundSize =
              "cover";

            profileAvatar.style.backgroundPosition =
              "center";
          } else {
            profileAvatar.textContent =
              initials;

            profileAvatar.style.backgroundImage =
              "";
          }
        }
      } catch (error) {
        console.warn(
          "NOUS could not load the Business profile:",
          error
        );
      }
    }

    function makeCardInteractive(
      card,
      action
    ) {
      if (!card) {
        return;
      }

      card.addEventListener(
        "click",
        action
      );

      card.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();
          action();
        }
      );
    }

async function loadTruthfulAnalytics() {
  /* =========================================================
     PROJECT ANALYTICS
     Source of truth: public.nous_projects
  ========================================================= */

  const projectValue =
    document.getElementById(
      "projects-analytics-value"
    );

  const projectChange =
    document.getElementById(
      "projects-analytics-change"
    );

  const projectDescription =
    document.getElementById(
      "projects-analytics-description"
    );

  const analyticsNotice =
    document.getElementById(
      "business-analytics-notice"
    );


  let projects = [];


  if (client) {
    try {
      const {
        data: {
          session
        },
        error: sessionError
      } =
        await client.auth.getSession();


      if (sessionError) {
        throw sessionError;
      }


      if (session?.user) {
        const userId =
          session.user.id;


        const {
          data,
          error
        } =
          await client
            .from(
              "nous_projects"
            )
            .select(
              "id, title, status, created_at, updated_at"
            )
            .eq(
              "user_id",
              userId
            )
            .order(
              "updated_at",
              {
                ascending: false
              }
            );


        if (error) {
          throw error;
        }


        projects =
          data || [];
      }

    } catch (error) {
      console.error(
        "[NOUS BUSINESS ANALYTICS PROJECT ERROR]",
        error
      );


      if (analyticsNotice) {
        analyticsNotice.textContent =
          "NOUS could not refresh project analytics.";
      }
      document.addEventListener(
  "nous:projects-changed",
  () => {
    loadTruthfulAnalytics();
  }
);
    }
  }


  /*
   * A project is considered active when its
   * Supabase status is active or in_progress.
   */

  const activeProjects =
    projects.filter(
      (project) => {
        const status =
          String(
            project?.status || ""
          )
            .trim()
            .toLowerCase();

        return (
          status === "active" ||
          status === "in_progress"
        );
      }
    );


  /*
   * Projects total.
   */

  if (projectValue) {
    projectValue.textContent =
      String(
        projects.length
      ).padStart(
        2,
        "0"
      );
  }


  /*
   * Active project count.
   */

  if (projectChange) {
    projectChange.textContent =
      activeProjects.length
        ? `${String(
            activeProjects.length
          ).padStart(
            2,
            "0"
          )} active`
        : "No active work";
  }


  /*
   * Project description.
   */

  if (projectDescription) {
    if (projects.length === 0) {
      projectDescription.textContent =
        "No projects have been added to this Business workspace yet.";
    } else if (
      projects.length === 1 &&
      activeProjects.length === 1
    ) {
      projectDescription.textContent =
        "1 project is currently active in your Business workspace.";
    } else {
      projectDescription.textContent =
        `${activeProjects.length} of ${projects.length} projects are currently active in your Business workspace.`;
    }
  }


  /* =========================================================
     EXECUTION ANALYTICS
     Keep existing Local Storage source for now.
  ========================================================= */

  const events =
    readArray(
      BUSINESS_EVENTS_KEY
    );


  const completedEvents =
    events.filter(
      (event) =>
        event?.status ===
        "completed"
    );


  const executionPercentage =
    events.length
      ? Math.round(
          (
            completedEvents.length /
            events.length
          ) *
          100
        )
      : 0;


  const executionValue =
    document.getElementById(
      "execution-analytics-value"
    );

  const executionChange =
    document.getElementById(
      "execution-analytics-change"
    );

  const executionProgress =
    document.getElementById(
      "execution-analytics-progress"
    );

  const executionDescription =
    document.getElementById(
      "execution-analytics-description"
    );


  if (executionValue) {
    executionValue.textContent =
      `${executionPercentage}%`;
  }


  if (executionChange) {
    executionChange.textContent =
      events.length
        ? `${completedEvents.length}/${events.length} completed`
        : "No schedule";
  }


  if (executionProgress) {
    executionProgress.style.width =
      `${executionPercentage}%`;
  }


  if (executionDescription) {
    executionDescription.textContent =
      events.length
        ? `${completedEvents.length} of ${events.length} scheduled work items are complete.`
        : "Schedule project work in the NOUS Calendar to begin measuring execution.";
  }


  /* =========================================================
     RESEARCH ANALYTICS
     Do not invent research data yet.
  ========================================================= */

  const researchValue =
    document.getElementById(
      "research-analytics-value"
    );

  const researchChange =
    document.getElementById(
      "research-analytics-change"
    );

  const researchProgressBar =
    document.getElementById(
      "research-analytics-progress"
    );

  const researchLabel =
    document.getElementById(
      "research-project-label"
    );

  const researchDescription =
    document.getElementById(
      "research-analytics-description"
    );


  if (researchValue) {
    researchValue.textContent =
      "0%";
  }


  if (researchProgressBar) {
    researchProgressBar.style.width =
      "0%";
  }


  if (researchLabel) {
    researchLabel.textContent =
      "No active project";
  }


  if (researchChange) {
    researchChange.textContent =
      "Not started";
  }


  if (researchDescription) {
    researchDescription.textContent =
      "Add research milestones to a project to display verified progress.";
  }
}

    makeCardInteractive(
      document.getElementById(
        "projects-analytics-card"
      ),
      () => {
        document
          .querySelector(
            ".business-projects-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );

    makeCardInteractive(
      document.getElementById(
        "execution-analytics-card"
      ),
      () => {
        openCalendar("month");
      }
    );

    makeCardInteractive(
      document.getElementById(
        "research-analytics-card"
      ),
      () => {
        document
          .querySelector(
            ".business-projects-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );

    makeCardInteractive(
      document.getElementById(
        "team-analytics-card"
      ),
      () => {
        const notice =
          document.getElementById(
            "business-analytics-notice"
          );

        if (notice) {
          notice.textContent =
            "The verified organisation team workspace will be connected in the next Business phase.";
        }
      }
    );

    document
      .querySelector(
        ".calendar-open-button"
      )
      ?.addEventListener(
        "click",
        () => {
          openCalendar("month");
        }
      );

    renderBusinessApplications();
    bindApplicationManager();
    loadTruthfulAnalytics();
    loadCurrentUserProfile();
    initialiseTimeModal();

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          appModal?.classList.contains(
            "is-open"
          )
        ) {
          closeApplicationModal();
        }
      }
      
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseBusinessLiveData,
      {
        once: true
      }
    );
  } else {
    initialiseBusinessLiveData();
  }
})();