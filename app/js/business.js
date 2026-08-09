console.log(
  "[NOUS FILE] app/js/business.js loaded"
);

(() => {
  "use strict";

  const SIGNAL_INTERVAL_MS = 3000;

  let signalTimer = null;
  let activeSignalIndex = 0;

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(date);
  }

  function formatZone(date) {
    const parts =
      new Intl.DateTimeFormat(
        "en-ZA",
        {
          timeZoneName: "short"
        }
      ).formatToParts(date);

    return (
      parts.find(
        (part) =>
          part.type ===
          "timeZoneName"
      )?.value ||
      "LOCAL TIME"
    );
  }

  function initialisePrecisionClock() {
    const clocks =
      document.querySelectorAll(
        "[data-nous-clock]"
      );

    const currentDayElements =
      document.querySelectorAll(
        "[data-current-day]"
      );

    if (
      clocks.length === 0 &&
      currentDayElements.length === 0
    ) {
      return;
    }

    function updateClock() {
      const now = new Date();

      clocks.forEach((clock) => {
        const hours =
          clock.querySelector(
            "[data-clock-hours]"
          );

        const minutes =
          clock.querySelector(
            "[data-clock-minutes]"
          );

        const seconds =
          clock.querySelector(
            "[data-clock-seconds]"
          );

        const date =
          clock.querySelector(
            "[data-clock-date]"
          );

        const zone =
          clock.querySelector(
            "[data-clock-zone]"
          );

        if (hours) {
          hours.textContent =
            padNumber(
              now.getHours()
            );
        }

        if (minutes) {
          minutes.textContent =
            padNumber(
              now.getMinutes()
            );
        }

        if (seconds) {
          const nextSeconds =
            padNumber(
              now.getSeconds()
            );

          if (
            seconds.textContent !==
            nextSeconds
          ) {
            seconds.textContent =
              nextSeconds;

            seconds.classList.remove(
              "is-changing"
            );

            void seconds.offsetWidth;

            seconds.classList.add(
              "is-changing"
            );
          }
        }

        if (date) {
          date.textContent =
            formatLongDate(now);
        }

        if (zone) {
          zone.textContent =
            formatZone(now);
        }
      });

      currentDayElements.forEach(
        (element) => {
          element.textContent =
            String(
              now.getDate()
            );
        }
      );
    }

    updateClock();

    window.setInterval(
      updateClock,
      1000
    );
  }

  function initialiseSignalSlider() {
    const slider =
      document.getElementById(
        "business-slider"
      );

    if (!slider) {
      return;
    }

    const slides = [
      ...slider.querySelectorAll(
        "[data-business-slide]"
      )
    ];

    const progressItems = [
      ...slider.querySelectorAll(
        "[data-slide-index]"
      )
    ];

    const previousButton =
      document.getElementById(
        "business-slider-previous"
      );

    const nextButton =
      document.getElementById(
        "business-slider-next"
      );

    if (slides.length === 0) {
      return;
    }

    function normaliseIndex(index) {
      return (
        index +
        slides.length
      ) % slides.length;
    }

    function showSignal(index) {
      activeSignalIndex =
        normaliseIndex(index);

      slides.forEach(
        (slide, slideIndex) => {
          const isActive =
            slideIndex ===
            activeSignalIndex;

          slide.classList.toggle(
            "is-active",
            isActive
          );

          slide.setAttribute(
            "aria-hidden",
            String(!isActive)
          );
        }
      );

      progressItems.forEach(
        (item, itemIndex) => {
          const isActive =
            itemIndex ===
            activeSignalIndex;

          item.classList.toggle(
            "is-active",
            isActive
          );

          item.setAttribute(
            "aria-current",
            isActive
              ? "true"
              : "false"
          );
        }
      );
    }

    function showNextSignal() {
      showSignal(
        activeSignalIndex + 1
      );
    }

    function showPreviousSignal() {
      showSignal(
        activeSignalIndex - 1
      );
    }

    function stopAutomaticSignals() {
      if (signalTimer) {
        window.clearInterval(
          signalTimer
        );

        signalTimer = null;
      }
    }

    function startAutomaticSignals() {
      stopAutomaticSignals();

      signalTimer =
        window.setInterval(
          showNextSignal,
          SIGNAL_INTERVAL_MS
        );
    }

    previousButton?.addEventListener(
      "click",
      () => {
        showPreviousSignal();
        startAutomaticSignals();
      }
    );

    nextButton?.addEventListener(
      "click",
      () => {
        showNextSignal();
        startAutomaticSignals();
      }
    );

    progressItems.forEach(
      (item) => {
        item.addEventListener(
          "click",
          () => {
            const index =
              Number(
                item.dataset
                  .slideIndex
              );

            if (
              Number.isInteger(index)
            ) {
              showSignal(index);
              startAutomaticSignals();
            }
          }
        );
      }
    );

    /*
     * Pause while the user is reading or interacting.
     */
    slider.addEventListener(
      "mouseenter",
      stopAutomaticSignals
    );

    slider.addEventListener(
      "mouseleave",
      startAutomaticSignals
    );

    slider.addEventListener(
      "focusin",
      stopAutomaticSignals
    );

    slider.addEventListener(
      "focusout",
      (event) => {
        if (
          !slider.contains(
            event.relatedTarget
          )
        ) {
          startAutomaticSignals();
        }
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          stopAutomaticSignals();
        } else {
          startAutomaticSignals();
        }
      }
    );

    showSignal(0);
    startAutomaticSignals();
  }

  function initialiseCalendar() {
    const calendarSection =
      document.querySelector(
        ".business-calendar-section"
      );

    const calendarApp =
      document.querySelector(
        '[data-app-name="NOUS Calendar"]'
      );

    const calendarOpenButton =
      document.querySelector(
        ".calendar-open-button"
      );

    const timelineEntries = [
      ...document.querySelectorAll(
        ".timeline-entry"
      )
    ];

    function minutesFromTimeString(
      value
    ) {
      const [
        hours,
        minutes
      ] =
        value
          .split(":")
          .map(Number);

      return (
        hours * 60 +
        minutes
      );
    }

    function updateCurrentTimelineEntry() {
      if (
        timelineEntries.length === 0
      ) {
        return;
      }

      const now = new Date();

      const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

      let closestIndex = 0;
      let closestDistance =
        Number.POSITIVE_INFINITY;

      timelineEntries.forEach(
        (entry, index) => {
          const time =
            entry.querySelector(
              "time"
            );

          const value =
            time?.getAttribute(
              "datetime"
            );

          if (!value) {
            return;
          }

          const distance =
            Math.abs(
              minutesFromTimeString(
                value
              ) -
              currentMinutes
            );

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestIndex =
              index;
          }
        }
      );

      timelineEntries.forEach(
        (entry, index) => {
          entry.classList.toggle(
            "is-current",
            index ===
              closestIndex
          );
        }
      );
    }

    function openCalendarSection() {
      if (!calendarSection) {
        return;
      }

      calendarSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      window.setTimeout(
        () => {
          calendarSection.classList.add(
            "is-calendar-focused"
          );

          window.setTimeout(
            () => {
              calendarSection.classList.remove(
                "is-calendar-focused"
              );
            },
            1200
          );
        },
        450
      );
    }

    calendarApp?.addEventListener(
      "click",
      openCalendarSection
    );

    calendarOpenButton?.addEventListener(
      "click",
      () => {
        /*
         * Keep this working inside the Business page now.
         * Later this can become:
         * window.location.href = "./calendar.html";
         */
        openCalendarSection();
      }
    );

    updateCurrentTimelineEntry();

    window.setInterval(
      updateCurrentTimelineEntry,
      60000
    );
  }

  function initialiseClockPanel() {
    createClockPanel();

    const panel =
      document.getElementById(
        "nous-clock-panel"
      );

    const openButton =
      document.getElementById(
        "business-clock-open"
      );

    const businessClockButton = document.getElementById(
      "business-clock-open"
    );

    businessClockButton?.addEventListener("click", () => {
      window.location.href = "./calendar.html";
    });

    const backdrop =
      document.getElementById(
        "nous-clock-backdrop"
      );

    const previewTime =
      document.getElementById(
        "nous-clock-preview-time"
      );

    const previewDate =
      document.getElementById(
        "nous-clock-preview-date"
      );

    const todayButton =
      document.getElementById(
        "nous-clock-today"
      );

    const calendarButton =
      document.getElementById(
        "nous-clock-open-calendar"
      );

    const calendarSection =
      document.querySelector(
        ".business-calendar-section"
      );

    function updatePreview() {
      const now = new Date();

      if (previewTime) {
        previewTime.textContent =
          [
            padNumber(
              now.getHours()
            ),
            padNumber(
              now.getMinutes()
            ),
            padNumber(
              now.getSeconds()
            )
          ].join(":");
      }

      if (previewDate) {
        previewDate.textContent =
          `${formatLongDate(now)} · ${formatZone(now)}`;
      }
    }

    function openPanel() {
      if (!panel) {
        return;
      }

      updatePreview();

      panel.classList.add(
        "is-open"
      );

      panel.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.style.overflow =
        "hidden";
    }

    function closePanel() {
      if (!panel) {
        return;
      }

      panel.classList.remove(
        "is-open"
      );

      panel.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.style.overflow =
        "";
    }

    function openSchedule() {
      closePanel();

      calendarSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    openButton?.addEventListener(
      "click",
      openPanel
    );

    closeButton?.addEventListener(
      "click",
      closePanel
    );

    backdrop?.addEventListener(
      "click",
      closePanel
    );

    todayButton?.addEventListener(
      "click",
      updatePreview
    );

    calendarButton?.addEventListener(
      "click",
      openSchedule
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
            "Escape" &&
          panel?.classList.contains(
            "is-open"
          )
        ) {
          closePanel();
        }
      }
    );

    updatePreview();

    window.setInterval(
      updatePreview,
      1000
    );
  }

  function initialiseSignalActions() {
    const actions =
      document.querySelectorAll(
        ".business-slide-action"
      );

    const destinations = [
      ".business-analytics-section",
      ".business-applications-section",
      ".business-projects-section"
    ];

    actions.forEach(
      (button, index) => {
        button.addEventListener(
          "click",
          () => {
            document
              .querySelector(
                destinations[index]
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
              });
          }
        );
      }
    );
  }

  async function loadWorkspaceObservation() {
  const observationElement =
    document.getElementById(
      "workspace-observation-text"
    );

  const organiseButton =
    document.getElementById(
      "organise-with-nous-button"
    );

  if (!observationElement) {
    return;
  }

  const client =
    window.NOUS_SUPABASE;

  if (!client) {
    observationElement.textContent =
      "Your Business workspace is ready. Add a task, project or calendar item to receive a focused observation.";

    if (organiseButton) {
      organiseButton.textContent =
        "Plan with NOUS →";
    }

    return;
  }

  try {
    const {
      data: { session },
      error: sessionError
    } =
      await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.user) {
      observationElement.textContent =
        "Sign in to receive workspace observations based on your tasks, calendar and active projects.";

      if (organiseButton) {
        organiseButton.disabled = true;
      }

      return;
    }

    const userId =
      session.user.id;

    /*
     * Read only data that actually exists.
     * Empty results are valid and must not become invented insights.
     */
    const [
      tasksResult,
      projectsResult
    ] =
      await Promise.all([
        client
          .from("nous_tasks")
          .select(
            "id, title, status, due_at, priority"
          )
          .eq("user_id", userId)
          .neq("status", "completed")
          .order("due_at", {
            ascending: true,
            nullsFirst: false
          })
          .limit(5),

        client
          .from("nous_projects")
          .select(
            "id, title, status, updated_at"
          )
          .eq("user_id", userId)
          .in("status", [
            "active",
            "in_progress"
          ])
          .order("updated_at", {
            ascending: false
          })
          .limit(3)
      ]);

    /*
     * A missing table should not break the whole interface.
     * Treat unavailable sources as empty until their schema is connected.
     */
    if (tasksResult.error) {
      console.warn(
        "NOUS tasks observation source unavailable:",
        tasksResult.error
      );
    }

    if (projectsResult.error) {
      console.warn(
        "NOUS projects observation source unavailable:",
        projectsResult.error
      );
    }

    const tasks =
      tasksResult.error
        ? []
        : tasksResult.data || [];

    const projects =
      projectsResult.error
        ? []
        : projectsResult.data || [];

    const openTaskCount =
      tasks.length;

    const activeProjectCount =
      projects.length;

    if (
      openTaskCount === 0 &&
      activeProjectCount === 0
    ) {
      observationElement.textContent =
        "Your Business workspace has no active tasks or projects yet. Create your first item, or ask NOUS to help you plan what should come next.";

      if (organiseButton) {
        organiseButton.disabled = false;

        organiseButton.innerHTML = `
          Plan with NOUS
          <span aria-hidden="true">→</span>
        `;
      }

      observationElement.dataset
        .observationState =
        "empty";

      return;
    }

    if (
      openTaskCount > 0 &&
      activeProjectCount === 0
    ) {
      observationElement.textContent =
        `You have ${openTaskCount} open ${
          openTaskCount === 1
            ? "task"
            : "tasks"
        } and no active projects. Review the next task or group related work into a project.`;
    } else if (
      openTaskCount === 0 &&
      activeProjectCount > 0
    ) {
      observationElement.textContent =
        `You have ${activeProjectCount} active ${
          activeProjectCount === 1
            ? "project"
            : "projects"
        } and no open tasks. Add the next action required for each active project.`;
    } else {
      observationElement.textContent =
        `You have ${openTaskCount} open ${
          openTaskCount === 1
            ? "task"
            : "tasks"
        } across ${activeProjectCount} active ${
          activeProjectCount === 1
            ? "project"
            : "projects"
        }. Review the highest-priority item before adding more work.`;
    }

    observationElement.dataset
      .observationState =
      "active";

    if (organiseButton) {
      organiseButton.disabled = false;

      organiseButton.innerHTML = `
        Organise with NOUS
        <span aria-hidden="true">→</span>
      `;
    }
  } catch (error) {
    console.error(
      "NOUS workspace observation failed:",
      error
    );

    observationElement.textContent =
      "NOUS could not review your workspace right now. Your account remains available, and no task information has been assumed.";

    observationElement.dataset
      .observationState =
      "unavailable";
  }
}

function initialiseWorkspaceIntelligence() {
  const organiseButton =
    document.getElementById(
      "organise-with-nous-button"
    );

  const observationElement =
    document.getElementById(
      "workspace-observation-text"
    );

  const companionDrawer =
    document.getElementById(
      "companion-drawer"
    );

  const drawerMessage =
    document.getElementById(
      "drawer-message"
    );

  const floatingCompanion =
    document.getElementById(
      "floating-companion"
    );

  if (
    !organiseButton ||
    !observationElement
  ) {
    return;
  }

  function openCompanion() {
    if (floatingCompanion) {
      floatingCompanion.click();
      return;
    }

    companionDrawer?.classList.add(
      "is-open"
    );

    companionDrawer?.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  }

  organiseButton.addEventListener(
    "click",
    () => {
      const observation =
        observationElement
          .textContent
          .replace(/\s+/g, " ")
          .trim();

      const isEmpty =
        observationElement.dataset
          .observationState ===
        "empty";

      openCompanion();

      window.setTimeout(
        () => {
          if (!drawerMessage) {
            return;
          }

          drawerMessage.value =
            isEmpty
              ? "My Business workspace has no active tasks or projects yet. Help me decide what I should create first."
              : `Help me organise this verified Business workspace observation: ${observation}`;

          drawerMessage.focus();

          drawerMessage.dispatchEvent(
            new Event(
              "input",
              {
                bubbles: true
              }
            )
          );
        },
        320
      );
    }
  );
}

/* =========================================================
   BUSINESS WORKSPACE
   Membership-aware project system
========================================================= */

const PROJECT_LIMITS = {
  free: 1,
  student_beginner: 5,
  business_education: 15,
  nous_unlimited: 30
};

const PROJECT_PLAN_NAMES = {
  free: "NOUS Free",
  student_beginner: "Student & Beginner",
  business_education: "Business & Education",
  nous_unlimited: "NOUS Unlimited"
};

/*
 * Support both NOUS frontend plan codes
 * and Yoco/server plan identifiers.
 */
const PROJECT_PLAN_ALIASES = {
  free: "free",

  student_beginner:
    "student_beginner",

  nous_student_monthly:
    "student_beginner",

  business_education:
    "business_education",

  nous_professional_monthly:
    "business_education",

  nous_unlimited:
    "nous_unlimited",

  nous_unlimited_monthly:
    "nous_unlimited"
};


let currentWorkspaceMembership = {
  planId: "free",
  planName:
    PROJECT_PLAN_NAMES.free,
  projectLimit:
    PROJECT_LIMITS.free
};

let currentWorkspaceProjectCount =
  0;

let projectCreatorBound =
  false;


/* =========================================================
   MEMBERSHIP LOOKUP
========================================================= */

async function getBusinessMembership(
  userId
) {
  const client =
    window.NOUS_SUPABASE;

  if (
    !client ||
    !userId
  ) {
    return {
      planId: "free",
      planName:
        PROJECT_PLAN_NAMES.free,
      projectLimit:
        PROJECT_LIMITS.free
    };
  }

  try {
    const {
      data,
      error
    } =
      await client
        .from(
          "user_memberships"
        )
        .select(
          "plan_id, status, updated_at"
        )
        .eq(
          "user_id",
          userId
        )
        .in(
          "status",
          [
            "active",
            "trialing",
            "paid"
          ]
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      throw error;
    }

    const rawPlan =
      String(
        data?.plan_id ||
        "free"
      )
        .trim()
        .toLowerCase();

    const planId =
      PROJECT_PLAN_ALIASES[
        rawPlan
      ] ||
      "free";

    return {
      planId,

      planName:
        PROJECT_PLAN_NAMES[
          planId
        ],

      projectLimit:
        PROJECT_LIMITS[
          planId
        ]
    };

  } catch (error) {
    console.warn(
      "[NOUS BUSINESS] Membership lookup failed:",
      error
    );

    return {
      planId: "free",
      planName:
        PROJECT_PLAN_NAMES.free,
      projectLimit:
        PROJECT_LIMITS.free
    };
  }
}


/* =========================================================
   PROJECT MODAL
========================================================= */

function getProjectModalElements() {
  return {
    modal:
      document.getElementById(
        "business-project-modal"
      ),

    backdrop:
      document.getElementById(
        "business-project-modal-backdrop"
      ),

    close:
      document.getElementById(
        "business-project-modal-close"
      ),

    cancel:
      document.getElementById(
        "business-project-cancel"
      ),

    form:
      document.getElementById(
        "business-project-form"
      ),

    title:
      document.getElementById(
        "business-project-title"
      ),

    description:
      document.getElementById(
        "business-project-description"
      ),

    notice:
      document.getElementById(
        "business-project-form-notice"
      ),

    save:
      document.getElementById(
        "business-project-save"
      )
  };
}


function openBusinessProjectModal() {
  const elements =
    getProjectModalElements();

  if (!elements.modal) {
    console.error(
      "[NOUS BUSINESS] Project modal HTML is missing."
    );

    return;
  }

  if (
    currentWorkspaceProjectCount >=
    currentWorkspaceMembership
      .projectLimit
  ) {
    window.alert(
      `Your ${currentWorkspaceMembership.planName} membership allows ${currentWorkspaceMembership.projectLimit} project${
        currentWorkspaceMembership
          .projectLimit === 1
          ? ""
          : "s"
      }.`
    );

    return;
  }

  if (
    elements.notice
  ) {
    elements.notice.textContent =
      `${currentWorkspaceProjectCount} of ${currentWorkspaceMembership.projectLimit} projects used · ${currentWorkspaceMembership.planName}`;
  }

  elements.modal.hidden =
    false;

  elements.modal.setAttribute(
    "aria-hidden",
    "false"
  );

  elements.modal.classList.add(
    "is-open"
  );

  document.body.style.overflow =
    "hidden";

  window.setTimeout(
    () => {
      elements.title?.focus();
    },
    50
  );
}


function closeBusinessProjectModal() {
  const elements =
    getProjectModalElements();

  if (!elements.modal) {
    return;
  }

  elements.modal.classList.remove(
    "is-open"
  );

  elements.modal.setAttribute(
    "aria-hidden",
    "true"
  );

  elements.modal.hidden =
    true;

  document.body.style.overflow =
    "";

  elements.form?.reset();

  if (
    elements.notice
  ) {
    elements.notice.textContent =
      "";
  }
}


/* =========================================================
   PROJECT CREATOR BINDINGS
========================================================= */

function bindBusinessProjectCreator() {
  if (projectCreatorBound) {
    return;
  }

  const elements =
    getProjectModalElements();

  if (
    !elements.modal ||
    !elements.form
  ) {
    return;
  }

  projectCreatorBound =
    true;


  elements.close?.addEventListener(
    "click",
    closeBusinessProjectModal
  );


  elements.cancel?.addEventListener(
    "click",
    closeBusinessProjectModal
  );


  elements.backdrop?.addEventListener(
    "click",
    closeBusinessProjectModal
  );


  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
          "Escape" &&
        elements.modal &&
        !elements.modal.hidden
      ) {
        closeBusinessProjectModal();
      }
    }
  );


  elements.form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const client =
        window.NOUS_SUPABASE;

      if (!client) {
        return;
      }

      const title =
        elements.title
          ?.value
          .trim();

      const description =
        elements.description
          ?.value
          .trim() ||
        null;


      if (!title) {
        if (
          elements.notice
        ) {
          elements.notice
            .textContent =
            "Give the project a name.";
        }

        return;
      }


      if (
        elements.save
      ) {
        elements.save.disabled =
          true;

        elements.save.textContent =
          "Creating...";
      }


      try {
        const {
          data: {
            session
          },
          error:
            sessionError
        } =
          await client.auth
            .getSession();


        if (sessionError) {
          throw sessionError;
        }


        if (!session?.user) {
          throw new Error(
            "Your NOUS session has expired."
          );
        }


        const userId =
          session.user.id;


        /*
         * Re-check membership immediately
         * before creation.
         */

        const membership =
          await getBusinessMembership(
            userId
          );


        currentWorkspaceMembership =
          membership;


        /*
         * Count the user's real projects.
         * Do not trust the visible UI count.
         */

        const {
          count,
          error:
            countError
        } =
          await client
            .from(
              "nous_projects"
            )
            .select(
              "id",
              {
                count:
                  "exact",

                head:
                  true
              }
            )
            .eq(
              "user_id",
              userId
            );


        if (countError) {
          throw countError;
        }


        const actualCount =
          count || 0;


        if (
          actualCount >=
          membership.projectLimit
        ) {
          throw new Error(
            `${membership.planName} allows ${membership.projectLimit} project${
              membership.projectLimit ===
              1
                ? ""
                : "s"
            }. Upgrade your membership to create more.`
          );
        }


        const {
          data:
            createdProject,
          error:
            createError
        } =
          await client
            .from(
              "nous_projects"
            )
            .insert({
              user_id:
                userId,

              title,

              description,

              status:
                "active"
            })
            .select()
            .single();


        if (createError) {
          throw createError;
        }


        console.log(
          "[NOUS BUSINESS] Project created",
          createdProject
        );


        if (
          elements.notice
        ) {
          elements.notice
            .textContent =
            "Project created.";
        }


        closeBusinessProjectModal();


await loadBusinessWorkspace();


/*
 * Tell Business Analytics that
 * the Supabase project source changed.
 */

document.dispatchEvent(
  new CustomEvent(
    "nous:projects-changed"
  )
);


/*
 * Refresh workspace intelligence
 * so NOUS sees the new project.
 */

loadWorkspaceObservation();


      } catch (error) {
        console.error(
          "[NOUS BUSINESS PROJECT CREATE ERROR]",
          error
        );


        if (
          elements.notice
        ) {
          elements.notice.textContent =
            error?.message ||
            "NOUS could not create the project.";
        }

      } finally {
        if (
          elements.save
        ) {
          elements.save.disabled =
            false;

          elements.save.textContent =
            "Create project";
        }
      }
    }
  );
}


/* =========================================================
   NEW PROJECT CARD
========================================================= */

function createNewProjectCard(
  projectCount,
  membership
) {
  const atLimit =
    projectCount >=
    membership.projectLimit;


  const element =
    document.createElement(
      atLimit
        ? "article"
        : "button"
    );


  if (!atLimit) {
    element.type =
      "button";
  }


  element.className =
    atLimit
      ? "business-project business-project-limit"
      : "business-project business-project-create";


  if (atLimit) {
    element.innerHTML = `
      <span
        class="project-folder"
        aria-hidden="true"
      >
        <span class="project-folder-tab"></span>
        <span class="project-folder-body"></span>
      </span>

      <span class="project-copy">

        <small>
          PROJECT LIMIT
        </small>

        <strong>
          Limit reached
        </strong>

        <span>
          ${projectCount} of ${membership.projectLimit} projects · ${membership.planName}
        </span>

      </span>
    `;

    return element;
  }


  element.innerHTML = `
    <span
      class="project-folder"
      aria-hidden="true"
    >
      <span class="project-folder-tab"></span>
      <span class="project-folder-body"></span>
    </span>

    <span class="project-copy">

      <small>
        NEW PROJECT
      </small>

      <strong>
        + Create project
      </strong>

      <span>
        ${projectCount} of ${membership.projectLimit} projects · ${membership.planName}
      </span>

    </span>

    <span
      class="project-arrow"
      aria-hidden="true"
    >
      +
    </span>
  `;


  element.addEventListener(
    "click",
    openBusinessProjectModal
  );


  return element;
}


/* =========================================================
   LOAD BUSINESS WORKSPACE
========================================================= */

async function loadBusinessWorkspace() {
  const grid =
    document.getElementById(
      "business-workspace-grid"
    );

  const notice =
    document.getElementById(
      "business-workspace-notice"
    );


  if (!grid) {
    return;
  }


  bindBusinessProjectCreator();


  const client =
    window.NOUS_SUPABASE;


  if (!client) {
    grid.setAttribute(
      "aria-busy",
      "false"
    );

    grid.innerHTML = `
      <article class="business-workspace-state">

        <span
          class="project-copy"
        >
          <small>
            NOUS WORKSPACE
          </small>

          <strong>
            Workspace unavailable
          </strong>

          <span>
            NOUS could not reach your workspace data.
          </span>
        </span>

      </article>
    `;

    return;
  }


  try {
    const {
      data: {
        session
      },
      error:
        sessionError
    } =
      await client.auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {
      throw new Error(
        "A signed-in NOUS account is required."
      );
    }


    const userId =
      session.user.id;


    /* =====================================================
       MEMBERSHIP
    ====================================================== */

    const membership =
      await getBusinessMembership(
        userId
      );


    currentWorkspaceMembership =
      membership;


    /* =====================================================
       PROJECTS
    ====================================================== */

    const {
      data,
      error
    } =
      await client
        .from(
          "nous_projects"
        )
        .select(
          "id, title, description, status, created_at, updated_at"
        )
        .eq(
          "user_id",
          userId
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        )
        .limit(
          30
        );


    if (error) {
      throw error;
    }


    const projects =
      data || [];


    currentWorkspaceProjectCount =
      projects.length;


    grid.setAttribute(
      "aria-busy",
      "false"
    );


    grid.innerHTML =
      "";


    /* =====================================================
       RENDER PROJECTS
    ====================================================== */

    projects.forEach(
      (project) => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "business-project";


        button.dataset.projectId =
          project.id;


        const status =
          String(
            project.status ||
            "project"
          )
            .replaceAll(
              "_",
              " "
            )
            .toUpperCase();


        let updatedText =
          "Project";


        if (
          project.updated_at
        ) {
          const updated =
            new Date(
              project.updated_at
            );


          if (
            !Number.isNaN(
              updated.getTime()
            )
          ) {
            updatedText =
              `Updated ${
                new Intl.DateTimeFormat(
                  "en-ZA",
                  {
                    day:
                      "numeric",

                    month:
                      "short",

                    year:
                      "numeric"
                  }
                ).format(
                  updated
                )
              }`;
          }
        }


        button.innerHTML = `
          <span
            class="project-folder"
            aria-hidden="true"
          >
            <span class="project-folder-tab"></span>
            <span class="project-folder-body"></span>
          </span>

          <span class="project-copy">

            <small>
              ${status}
            </small>

            <strong></strong>

            <span>
              ${updatedText}
            </span>

          </span>

          <span
            class="project-arrow"
            aria-hidden="true"
          >
            ↗
          </span>
        `;


        const title =
          button.querySelector(
            ".project-copy strong"
          );


        if (title) {
          title.textContent =
            project.title ||
            "Untitled project";
        }


button.addEventListener(
  "click",
  () => {

    console.log(
      "[NOUS BUSINESS] Opening project",
      {
        projectId:
          project.id,

        title:
          project.title
      }
    );


    const projectUrl =
      new URL(
        "/app/project.html",
        window.location.origin
      );


    projectUrl.searchParams.set(
      "id",
      project.id
    );


    window.location.href =
      projectUrl.href;
  }
);


        grid.appendChild(
          button
        );
      }
    );


    /* =====================================================
       CREATE / LIMIT CARD
    ====================================================== */

    const newProjectCard =
      createNewProjectCard(
        projects.length,
        membership
      );


    grid.appendChild(
      newProjectCard
    );


    /* =====================================================
       WORKSPACE NOTICE
    ====================================================== */

    if (notice) {
      notice.textContent =
        `${projects.length} of ${membership.projectLimit} projects · ${membership.planName}`;
    }


    console.log(
      "[NOUS BUSINESS] Workspace loaded",
      {
        projects:
          projects.length,

        limit:
          membership.projectLimit,

        membership:
          membership.planId
      }
    );


  } catch (error) {

    console.error(
      "[NOUS BUSINESS WORKSPACE ERROR]",
      error
    );


    grid.setAttribute(
      "aria-busy",
      "false"
    );


    grid.innerHTML = `
      <article class="business-workspace-state">

        <span class="project-copy">

          <small>
            NOUS WORKSPACE
          </small>

          <strong>
            Could not load your work
          </strong>

          <span>
            Your existing data has not been changed.
          </span>

        </span>

      </article>
    `;


    if (notice) {
      notice.textContent =
        "NOUS could not load your Business workspace.";
    }
  }
}

function initialiseBusinessPage() {
  initialisePrecisionClock();
  initialiseSignalSlider();
  initialiseCalendar();

  /*
   * Disabled for now.
   * The old clock panel calls createClockPanel(),
   * which no longer exists.
   *
   * The visible Business clock already links
   * directly to calendar.html.
   */
  // initialiseClockPanel();

  initialiseSignalActions();
  loadWorkspaceObservation();
  initialiseWorkspaceIntelligence();
  loadBusinessWorkspace();
}

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseBusinessPage,
      {
        once: true
      }
    );
  } else {
    initialiseBusinessPage();
  }
})();