console.log(
  "[NOUS FILE] app/js/projects.js loaded"
);


(() => {
  "use strict";


  /* =========================================================
     PROJECT MEMBERSHIP RULES
  ========================================================= */

  const PROJECT_LIMITS = {
    free: 1,
    student_beginner: 5,
    business_education: 15,
    nous_unlimited: 30
  };


  const PROJECT_PLAN_NAMES = {
    free:
      "NOUS Free",

    student_beginner:
      "Student & Beginner",

    business_education:
      "Business & Education",

    nous_unlimited:
      "NOUS Unlimited"
  };


  const PROJECT_PLAN_ALIASES = {
    free:
      "free",

    student_beginner:
      "student_beginner",

    nous_student_monthly:
      "student_beginner",

    business_education:
      "business_education",

    organisation:
      "business_education",

    organization:
      "business_education",

    nous_professional_monthly:
      "business_education",

    nous_unlimited:
      "nous_unlimited",

    nous_unlimited_monthly:
      "nous_unlimited"
  };


  /* =========================================================
     STATE
  ========================================================= */

    const state = {
    user:
        null,

    projects:
        [],

    filter:
        "active",

    search:
        "",

    membership: {
      planId:
        "free",

      planName:
        PROJECT_PLAN_NAMES.free,

      projectLimit:
        PROJECT_LIMITS.free
    }
  };


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const elements = {
    currentCount:
      document.getElementById(
        "projects-current-count"
      ),

    limitCount:
      document.getElementById(
        "projects-limit-count"
      ),

    membershipLabel:
      document.getElementById(
        "projects-membership-label"
      ),

    visibleCount:
      document.getElementById(
        "projects-visible-count"
      ),

    grid:
      document.getElementById(
        "projects-grid"
      ),

    emptyState:
      document.getElementById(
        "projects-empty-state"
      ),

    createPrimary:
      document.getElementById(
        "projects-create-primary"
      ),

    createSecondary:
      document.getElementById(
        "projects-create-secondary"
      ),

    modal:
      document.getElementById(
        "project-create-modal"
      ),

    backdrop:
      document.getElementById(
        "project-create-backdrop"
      ),

    close:
      document.getElementById(
        "project-create-close"
      ),

    cancel:
      document.getElementById(
        "project-create-cancel"
      ),

    form:
      document.getElementById(
        "project-create-form"
      ),

    title:
      document.getElementById(
        "project-title"
      ),

    category:
      document.getElementById(
        "project-category"
      ),

    description:
      document.getElementById(
        "project-description"
      ),

    status:
      document.getElementById(
        "project-status"
      ),

        notice:
        document.getElementById(
            "project-create-notice"
        ),

        searchButton:
        document.getElementById(
            "projects-search-button"
        )
        };


        let searchPanel =
        null;

        let searchInput =
        null;

        let searchClose =
        null;


  const filterButtons =
    [
      ...document.querySelectorAll(
        "[data-project-filter]"
      )
    ];


  /* =========================================================
     HELPERS
  ========================================================= */

  function escapeHTML(value) {
    const element =
      document.createElement(
        "div"
      );

    element.textContent =
      String(
        value || ""
      );

    return element.innerHTML;
  }


  function normaliseStatus(value) {
    return String(
      value ||
      "active"
    )
      .trim()
      .toLowerCase();
  }


  function statusLabel(value) {
    return normaliseStatus(
      value
    )
      .replaceAll(
        "_",
        " "
      )
      .toUpperCase();
  }


  function isActiveProject(project) {
    const status =
      normaliseStatus(
        project?.status
      );

    return (
      status ===
        "active" ||
      status ===
        "planning" ||
      status ===
        "in_progress"
    );
  }


  function formatDate(value) {
    if (!value) {
      return "Recently";
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently";
    }


    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric"
      }
    ).format(
      date
    );
  }


  function setNotice(
    message = "",
    type = ""
  ) {
    if (!elements.notice) {
      return;
    }


    elements.notice.textContent =
      message;


    elements.notice.classList.remove(
      "is-error",
      "is-success"
    );


    if (type) {
      elements.notice.classList.add(
        `is-${type}`
      );
    }
  }


  function hasReachedProjectLimit() {
    return (
      state.projects.length >=
      state.membership.projectLimit
    );
  }


  /* =========================================================
     AUTHENTICATED USER
  ========================================================= */

  async function loadCurrentUser() {
    const client =
      window.NOUS_SUPABASE;


    if (!client) {
      throw new Error(
        "NOUS Supabase client is unavailable."
      );
    }


    const {
      data: {
        session
      },
      error
    } =
      await client.auth
        .getSession();


    if (error) {
      throw error;
    }


    if (!session?.user) {
      throw new Error(
        "A signed-in NOUS account is required."
      );
    }


    state.user =
      session.user;
  }


  /* =========================================================
     MEMBERSHIP
  ========================================================= */

  async function loadMembership() {
    const client =
      window.NOUS_SUPABASE;


    if (
      !client ||
      !state.user
    ) {
      return;
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
            state.user.id
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
          .limit(
            1
          )
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


      state.membership = {
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
        "[NOUS PROJECTS] Membership lookup failed:",
        error
      );


      state.membership = {
        planId:
          "free",

        planName:
          PROJECT_PLAN_NAMES.free,

        projectLimit:
          PROJECT_LIMITS.free
      };
    }
  }


  /* =========================================================
     LOAD PROJECTS
  ========================================================= */

  async function loadProjects() {
    const client =
      window.NOUS_SUPABASE;


    if (
      !client ||
      !state.user
    ) {
      return;
    }


    const {
      data,
      error
    } =
      await client
        .from(
          "nous_projects"
        )
        .select(
          "id, user_id, title, description, status, created_at, updated_at"
        )
        .eq(
          "user_id",
          state.user.id
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        );


    if (error) {
      throw error;
    }


    state.projects =
      data || [];
  }


  /* =========================================================
     FILTERING
  ========================================================= */

function getFilteredProjects() {
  let projects =
    [
      ...state.projects
    ];


  /* =====================================================
     STATUS
  ====================================================== */

  if (
    state.filter ===
    "archived"
  ) {
    projects =
      projects.filter(
        (project) =>
          normaliseStatus(
            project.status
          ) ===
          "archived"
      );

  } else if (
    state.filter ===
    "active"
  ) {
    projects =
      projects.filter(
        isActiveProject
      );
  }


  /* =====================================================
     SEARCH
  ====================================================== */

  const query =
    String(
      state.search ||
      ""
    )
      .trim()
      .toLowerCase();


  if (query) {
    projects =
      projects.filter(
        (project) => {

          const title =
            String(
              project.title ||
              ""
            ).toLowerCase();


          const description =
            String(
              project.description ||
              ""
            ).toLowerCase();


          const status =
            String(
              project.status ||
              ""
            ).toLowerCase();


          return (
            title.includes(query) ||
            description.includes(query) ||
            status.includes(query)
          );
        }
      );
  }


  return projects;
}

  /* =========================================================
   PROJECT SEARCH
========================================================= */

function ensureSearchPanel() {
  if (searchPanel) {
    return;
  }


  const toolbar =
    document.querySelector(
      ".projects-toolbar"
    );


  if (!toolbar) {
    console.warn(
      "[NOUS PROJECTS] Projects toolbar not found."
    );

    return;
  }


  searchPanel =
    document.createElement(
      "div"
    );


  searchPanel.className =
    "projects-search-panel";


  searchPanel.hidden =
    true;


  searchPanel.innerHTML = `
    <div class="projects-search-field">

      <input
        id="projects-search-input"
        type="search"
        placeholder="Search your projects..."
        autocomplete="off"
        aria-label="Search your projects"
      >

      <button
        id="projects-search-close"
        type="button"
        aria-label="Close project search"
      >
        ×
      </button>

    </div>
  `;


  toolbar.insertAdjacentElement(
    "afterend",
    searchPanel
  );


  searchInput =
    searchPanel.querySelector(
      "#projects-search-input"
    );


  searchClose =
    searchPanel.querySelector(
      "#projects-search-close"
    );


  searchInput?.addEventListener(
    "input",
    () => {

      state.search =
        searchInput.value;


      renderProjects();
    }
  );


  searchClose?.addEventListener(
    "click",
    closeProjectSearch
  );
}


function openProjectSearch() {
  ensureSearchPanel();


  if (!searchPanel) {
    return;
  }


  searchPanel.hidden =
    false;


  window.setTimeout(
    () => {
      searchInput?.focus();
    },
    20
  );
}


function closeProjectSearch() {
  if (!searchPanel) {
    return;
  }


  state.search =
    "";


  if (searchInput) {
    searchInput.value =
      "";
  }


  searchPanel.hidden =
    true;


  renderProjects();


  elements.searchButton
    ?.focus();
}

  /* =========================================================
     OPEN PROJECT
  ========================================================= */

  function openProject(project) {
    if (!project?.id) {
      return;
    }


    console.log(
      "[NOUS PROJECTS] Opening project workspace",
      {
        projectId:
          project.id,

        title:
          project.title
      }
    );


    const projectUrl =
      new URL(
        "/app/project-workspace.html",
        window.location.origin
      );


    projectUrl.searchParams.set(
      "id",
      project.id
    );


    window.location.href =
      projectUrl.href;
  }


  /* =========================================================
     PROJECT CARD
  ========================================================= */

  function createProjectCard(project) {
    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "project-card";


    button.dataset.projectId =
      project.id;


    button.innerHTML = `
      <span
        class="project-card-status"
        data-status="${escapeHTML(
          normaliseStatus(
            project.status
          )
        )}"
      >
        ${escapeHTML(
          statusLabel(
            project.status
          )
        )}
      </span>


      <span
        class="project-card-folder"
        aria-hidden="true"
      ></span>


      <span class="project-card-copy">

        <small>
          Updated ${escapeHTML(
            formatDate(
              project.updated_at
            )
          )}
        </small>

        <strong>
          ${escapeHTML(
            project.title ||
            "Untitled project"
          )}
        </strong>

        <span>
          ${escapeHTML(
            project.description ||
            "No description yet."
          )}
        </span>

      </span>


      <span
        class="project-card-arrow"
        aria-hidden="true"
      >
        ↗
      </span>
    `;


    button.addEventListener(
      "click",
      () => {
        openProject(
          project
        );
      }
    );


    return button;
  }


  /* =========================================================
     CAPACITY
  ========================================================= */

  function updateCapacity() {
    const current =
      state.projects.length;


    const limit =
      state.membership
        .projectLimit;


    if (elements.currentCount) {
      elements.currentCount.textContent =
        String(
          current
        );
    }


    if (elements.limitCount) {
      elements.limitCount.textContent =
        String(
          limit
        );
    }


    if (elements.membershipLabel) {
      elements.membershipLabel.textContent =
        `${current} of ${limit} projects · ${state.membership.planName}`;
    }


    const reached =
      hasReachedProjectLimit();


    if (elements.createPrimary) {
      elements.createPrimary.disabled =
        reached;


      elements.createPrimary.innerHTML =
        reached
          ? `
              Project limit reached
            `
          : `
              New project
              <span aria-hidden="true">+</span>
            `;
    }


    if (elements.createSecondary) {
      elements.createSecondary.disabled =
        reached;


      elements.createSecondary.textContent =
        reached
          ? "Project limit reached"
          : "Create first project";
    }
  }


  /* =========================================================
     RENDER PROJECTS
  ========================================================= */

  function renderProjects() {
    if (!elements.grid) {
      return;
    }


    const projects =
      getFilteredProjects();


    elements.grid.innerHTML =
      "";


    projects.forEach(
      (project) => {
        elements.grid.appendChild(
          createProjectCard(
            project
          )
        );
      }
    );


    const hasProjects =
      projects.length > 0;


    elements.grid.hidden =
      !hasProjects;


    if (elements.emptyState) {
      elements.emptyState.hidden =
        hasProjects;
    }


    if (elements.visibleCount) {
      elements.visibleCount.textContent =
        `${projects.length} ${
          projects.length === 1
            ? "project"
            : "projects"
        }`;
    }


    updateCapacity();
  }


  /* =========================================================
     CREATE MODAL
  ========================================================= */

  function openCreateModal() {
    if (!elements.modal) {
      return;
    }


    if (
      hasReachedProjectLimit()
    ) {
      setNotice(
        `${state.membership.planName} allows ${state.membership.projectLimit} project${
          state.membership.projectLimit ===
          1
            ? ""
            : "s"
        }.`,
        "error"
      );

      return;
    }


    elements.modal.classList.add(
      "is-open"
    );


    elements.modal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";


    setNotice(
      ""
    );


    window.setTimeout(
      () => {
        elements.title?.focus();
      },
      100
    );
  }


  function closeCreateModal() {
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


    document.body.style.overflow =
      "";


    setNotice(
      ""
    );
  }


  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  async function handleCreateProject(
    event
  ) {
    event.preventDefault();


    const client =
      window.NOUS_SUPABASE;


    if (
      !client ||
      !state.user
    ) {
      setNotice(
        "NOUS could not verify your account.",
        "error"
      );

      return;
    }


    if (
      hasReachedProjectLimit()
    ) {
      setNotice(
        `${state.membership.planName} allows ${state.membership.projectLimit} project${
          state.membership.projectLimit ===
          1
            ? ""
            : "s"
        }.`,
        "error"
      );

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


    const status =
      elements.status
        ?.value ||
      "active";


    if (!title) {
      setNotice(
        "Enter a project name.",
        "error"
      );

      elements.title?.focus();

      return;
    }


    /*
     * Category exists in the HTML form,
     * but we are not writing it yet because
     * the confirmed nous_projects schema
     * has not established a category column.
     */


    setNotice(
      "Creating project…"
    );


    try {
      /*
       * Re-count directly from Supabase before
       * creating. Never rely only on the UI.
       */

      const {
        count,
        error: countError
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
            state.user.id
          );


      if (countError) {
        throw countError;
      }


      const actualCount =
        count || 0;


      if (
        actualCount >=
        state.membership.projectLimit
      ) {
        throw new Error(
          `${state.membership.planName} allows ${state.membership.projectLimit} project${
            state.membership.projectLimit ===
            1
              ? ""
              : "s"
          }.`
        );
      }


      const {
        data,
        error
      } =
        await client
          .from(
            "nous_projects"
          )
          .insert({
            user_id:
              state.user.id,

            title,

            description,

            status
          })
          .select(
            "id, user_id, title, description, status, created_at, updated_at"
          )
          .single();


      if (error) {
        throw error;
      }


      state.projects.unshift(
        data
      );


      elements.form?.reset();


      if (elements.status) {
        elements.status.value =
          "active";
      }


      closeCreateModal();


      renderProjects();


      document.dispatchEvent(
        new CustomEvent(
          "nous:projects-changed"
        )
      );


      console.log(
        "[NOUS PROJECTS] Project created",
        data
      );


    } catch (error) {
      console.error(
        "[NOUS PROJECT CREATE ERROR]",
        error
      );


      setNotice(
        error?.message ||
        "NOUS could not create the project.",
        "error"
      );
    }
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  function bindEvents() {
    filterButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {

            state.filter =
              button.dataset
                .projectFilter ||
              "active";


            updateFilterButtons();
            filterButtons.forEach(
            (item) => {

                item.classList.toggle(
                "is-active",
                item.dataset
                    .projectFilter ===
                    state.filter
                );

            }
            );

            renderProjects();
          }
        );
      }
    );

    elements.searchButton
  ?.addEventListener(
    "click",
    () => {

      if (
        searchPanel &&
        !searchPanel.hidden
      ) {
        closeProjectSearch();

        return;
      }


      openProjectSearch();
    }
  );

    elements.createPrimary
      ?.addEventListener(
        "click",
        openCreateModal
      );


    elements.createSecondary
      ?.addEventListener(
        "click",
        openCreateModal
      );


    elements.close
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.cancel
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.backdrop
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.form
      ?.addEventListener(
        "submit",
        handleCreateProject
      );


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
            "Escape" &&
          elements.modal
            ?.classList
            .contains(
              "is-open"
            )
        ) {
          closeCreateModal();
        }

      }
    );
  }


  /* =========================================================
     INITIALISE
  ========================================================= */

async function initialiseProjects() {
  try {

    await loadCurrentUser();

    await loadMembership();

    await loadProjects();


    ensureSearchPanel();

    bindEvents();


    /*
     * Set the correct active filter directly.
     * This avoids the broken updateFilterButtons
     * reference.
     */

    filterButtons.forEach(
      (button) => {

        button.classList.toggle(
          "is-active",
          button.dataset
            .projectFilter ===
            state.filter
        );

      }
    );


    renderProjects();


    console.log(
      "[NOUS PROJECTS] Ready",
      {
        projects:
          state.projects.length,

        membership:
          state.membership.planName,

        projectLimit:
          state.membership.projectLimit
      }
    );


  } catch (error) {

    console.error(
      "[NOUS PROJECTS INIT ERROR]",
      error
    );


    if (
      elements.membershipLabel
    ) {
      elements.membershipLabel.textContent =
        "NOUS could not load your projects.";
    }


    if (
      elements.visibleCount
    ) {
      elements.visibleCount.textContent =
        "0 projects";
    }
  }
}


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseProjects,
      {
        once: true
      }
    );
  } else {
    initialiseProjects();
  }

})();