console.log(
  "[NOUS FILE] app/js/project-workspace.js loaded"
);


(() => {
  "use strict";


  /* =========================================================
     STATE
  ========================================================= */

  const state = {
    client:
      window.NOUS_SUPABASE,

    user:
      null,

    project:
      null,

    tasks:
      [],

    activeView:
      "overview"
  };


  /* =========================================================
     PROJECT ELEMENTS
  ========================================================= */

  const loadingState =
    document.getElementById(
      "project-loading-state"
    );


  const errorState =
    document.getElementById(
      "project-error-state"
    );


  const errorMessage =
    document.getElementById(
      "project-error-message"
    );


  const workspace =
    document.getElementById(
      "project-workspace"
    );


  const titleElement =
    document.getElementById(
      "project-title"
    );


  const topbarTitle =
    document.getElementById(
      "project-topbar-title"
    );


  const descriptionElement =
    document.getElementById(
      "project-description"
    );


  const statusElement =
    document.getElementById(
      "project-status"
    );


  const updatedElement =
    document.getElementById(
      "project-updated"
    );


  /* =========================================================
     TASK ELEMENTS
  ========================================================= */

  const taskCount =
    document.getElementById(
      "project-task-count"
    );


  const taskList =
    document.getElementById(
      "project-task-list"
    );


  const taskEmpty =
    document.getElementById(
      "project-task-empty"
    );


  const addTaskButton =
    document.getElementById(
      "project-add-task"
    );


  const taskModal =
    document.getElementById(
      "project-task-modal"
    );


  const taskModalBackdrop =
    document.getElementById(
      "project-task-modal-backdrop"
    );


  const taskModalClose =
    document.getElementById(
      "project-task-modal-close"
    );


  const taskCancel =
    document.getElementById(
      "project-task-cancel"
    );


  const taskForm =
    document.getElementById(
      "project-task-form"
    );


  const taskTitle =
    document.getElementById(
      "project-task-title"
    );


  const taskPriority =
    document.getElementById(
      "project-task-priority"
    );


  const taskDue =
    document.getElementById(
      "project-task-due"
    );


  const taskNotice =
    document.getElementById(
      "project-task-form-notice"
    );


  const taskSave =
    document.getElementById(
      "project-task-save"
    );


  /* =========================================================
     WORKSPACE SECTIONS
  ========================================================= */

  const overviewSection =
    document.querySelector(
      ".project-overview"
    );


  const tasksSection =
    document.getElementById(
      "project-tasks-section"
    );


  const activitySection =
    document.querySelector(
      ".project-activity"
    );


  const navigationItems =
    [
      ...document.querySelectorAll(
        ".project-navigation-item"
      )
    ];


  const tasksModule =
    document.getElementById(
      "project-tasks-module"
    );


  const filesModule =
    document.getElementById(
      "project-files-module"
    );


  const calendarModule =
    document.getElementById(
      "project-calendar-module"
    );


  const intelligenceModule =
    document.getElementById(
      "project-intelligence-module"
    );


  /* =========================================================
     HELPERS
  ========================================================= */

  function showError(message) {
    loadingState &&
      (loadingState.hidden = true);


    workspace &&
      (workspace.hidden = true);


    errorState &&
      (errorState.hidden = false);


    if (errorMessage) {
      errorMessage.textContent =
        message;
    }
  }


  function formatStatus(value) {
    return String(
      value ||
      "active"
    )
      .trim()
      .replaceAll(
        "_",
        " "
      )
      .toUpperCase();
  }


  function formatDate(value) {
    if (!value) {
      return "Updated recently";
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
      return "Updated recently";
    }


    return `Updated ${
      new Intl.DateTimeFormat(
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
      )
    }`;
  }


  function formatDueDate(value) {
    if (!value) {
      return "No due date";
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
      return "No due date";
    }


    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        day:
          "2-digit",

        month:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    ).format(
      date
    );
  }


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


  /* =========================================================
     VIEWS
  ========================================================= */

  function showView(view) {
    state.activeView =
      view;


    /*
     * Hide view-specific content.
     */

    if (overviewSection) {
      overviewSection.hidden =
        view !==
        "overview";
    }


    if (tasksSection) {
      tasksSection.hidden =
        view !==
        "tasks";
    }


    /*
     * Activity belongs to overview for now.
     */

    if (activitySection) {
      activitySection.hidden =
        view !==
        "overview";
    }


    navigationItems.forEach(
      (button) => {

        const buttonView =
          button.textContent
            .trim()
            .toLowerCase();


        button.classList.toggle(
          "is-active",
          buttonView ===
            view
        );

      }
    );
  }


  /* =========================================================
     PROJECT
  ========================================================= */

  async function loadProject() {
    const client =
      state.client;


    if (!client) {
      throw new Error(
        "NOUS Supabase client is unavailable."
      );
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const projectId =
      params.get(
        "id"
      );


    if (!projectId) {
      throw new Error(
        "No project was selected."
      );
    }


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
        "Please sign in to open this project."
      );
    }


    state.user =
      session.user;


    const {
      data:
        project,

      error:
        projectError
    } =
      await client
        .from(
          "nous_projects"
        )
        .select(
          "id, user_id, title, description, status, created_at, updated_at"
        )
        .eq(
          "id",
          projectId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .maybeSingle();


    if (projectError) {
      throw projectError;
    }


    if (!project) {
      throw new Error(
        "This project does not exist or you do not have permission to open it."
      );
    }


    state.project =
      project;


    document.documentElement
      .dataset.projectId =
      project.id;


    window.NOUS_PROJECT = {
      ...project
    };


    renderProject();
  }


  function renderProject() {
    const project =
      state.project;


    if (!project) {
      return;
    }


    const title =
      project.title ||
      "Untitled project";


    titleElement &&
      (titleElement.textContent =
        title);


    topbarTitle &&
      (topbarTitle.textContent =
        title);


    descriptionElement &&
      (descriptionElement.textContent =
        project.description ||
        "No description has been added to this project.");


    if (statusElement) {
      statusElement.textContent =
        formatStatus(
          project.status
        );


      statusElement.dataset.status =
        String(
          project.status ||
          "active"
        ).toLowerCase();
    }


    updatedElement &&
      (updatedElement.textContent =
        formatDate(
          project.updated_at
        ));


    document.title =
      `${title} — NOUS`;
  }


  /* =========================================================
     TASKS
  ========================================================= */

  async function loadTasks() {
    if (
      !state.client ||
      !state.user ||
      !state.project
    ) {
      return;
    }


    const {
      data,
      error
    } =
      await state.client
        .from(
          "nous_tasks"
        )
        .select(
          "id, user_id, project_id, title, status, priority, due_at, created_at, updated_at"
        )
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "project_id",
          state.project.id
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


    if (error) {
      throw error;
    }


    state.tasks =
      data || [];


    renderTasks();
  }


  function renderTasks() {
    const tasks =
      state.tasks;


    if (taskCount) {
      taskCount.textContent =
        String(
          tasks.length
        ).padStart(
          2,
          "0"
        );
    }


    if (!taskList) {
      return;
    }


    taskList.innerHTML =
      "";


    if (taskEmpty) {
      taskEmpty.hidden =
        tasks.length !==
        0;
    }


    tasks.forEach(
      (task) => {

        const row =
          document.createElement(
            "article"
          );


        const completed =
          task.status ===
          "completed";


        row.className =
          completed
            ? "project-task-row is-completed"
            : "project-task-row";


        row.innerHTML = `
          <button
            class="project-task-toggle"
            type="button"
            aria-label="${
              completed
                ? "Reopen task"
                : "Complete task"
            }"
          >
            ${
              completed
                ? "✓"
                : ""
            }
          </button>


          <div class="project-task-copy">

            <strong>
              ${escapeHTML(
                task.title
              )}
            </strong>

            <span>
              ${escapeHTML(
                task.priority ||
                "normal"
              )} priority
              ·
              ${escapeHTML(
                formatDueDate(
                  task.due_at
                )
              )}
            </span>

          </div>


          <button
            class="project-task-delete"
            type="button"
            aria-label="Delete task"
          >
            ×
          </button>
        `;


        row
          .querySelector(
            ".project-task-toggle"
          )
          ?.addEventListener(
            "click",
            () => {
              toggleTask(
                task
              );
            }
          );


        row
          .querySelector(
            ".project-task-delete"
          )
          ?.addEventListener(
            "click",
            () => {
              deleteTask(
                task
              );
            }
          );


        taskList.appendChild(
          row
        );

      }
    );
  }


  async function createTask(
    event
  ) {
    event.preventDefault();


    if (
      !state.client ||
      !state.user ||
      !state.project
    ) {
      return;
    }


    const title =
      taskTitle
        ?.value
        .trim();


    if (!title) {
      if (taskNotice) {
        taskNotice.textContent =
          "Give the task a name.";
      }

      return;
    }


    if (taskSave) {
      taskSave.disabled =
        true;

      taskSave.textContent =
        "Creating...";
    }


    try {
      const {
        data,
        error
      } =
        await state.client
          .from(
            "nous_tasks"
          )
          .insert({
            user_id:
              state.user.id,

            project_id:
              state.project.id,

            title,

            status:
              "open",

            priority:
              taskPriority
                ?.value ||
              "normal",

            due_at:
              taskDue?.value
                ? new Date(
                    taskDue.value
                  ).toISOString()
                : null
          })
          .select(
            "id, user_id, project_id, title, status, priority, due_at, created_at, updated_at"
          )
          .single();


      if (error) {
        throw error;
      }


      state.tasks.unshift(
        data
      );


      closeTaskModal();

      renderTasks();


    } catch (error) {
      console.error(
        "[NOUS PROJECT TASK CREATE ERROR]",
        error
      );


      if (taskNotice) {
        taskNotice.textContent =
          error?.message ||
          "NOUS could not create this task.";
      }

    } finally {

      if (taskSave) {
        taskSave.disabled =
          false;

        taskSave.textContent =
          "Create task";
      }

    }
  }


  async function toggleTask(task) {
    const nextStatus =
      task.status ===
      "completed"
        ? "open"
        : "completed";


    const {
      error
    } =
      await state.client
        .from(
          "nous_tasks"
        )
        .update({
          status:
            nextStatus,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          task.id
        )
        .eq(
          "user_id",
          state.user.id
        );


    if (error) {
      console.error(
        "[NOUS TASK UPDATE ERROR]",
        error
      );

      return;
    }


    task.status =
      nextStatus;


    renderTasks();
  }


  async function deleteTask(task) {
    const {
      error
    } =
      await state.client
        .from(
          "nous_tasks"
        )
        .delete()
        .eq(
          "id",
          task.id
        )
        .eq(
          "user_id",
          state.user.id
        );


    if (error) {
      console.error(
        "[NOUS TASK DELETE ERROR]",
        error
      );

      return;
    }


    state.tasks =
      state.tasks.filter(
        (item) =>
          item.id !==
          task.id
      );


    renderTasks();
  }


  /* =========================================================
     TASK MODAL
  ========================================================= */

  function openTaskModal() {
    if (!taskModal) {
      return;
    }


    taskModal.hidden =
      false;


    taskModal.setAttribute(
      "aria-hidden",
      "false"
    );


    taskModal.classList.add(
      "is-open"
    );


    document.body.style.overflow =
      "hidden";


    if (taskNotice) {
      taskNotice.textContent =
        "";
    }


    window.setTimeout(
      () => {
        taskTitle?.focus();
      },
      50
    );
  }


  function closeTaskModal() {
    if (!taskModal) {
      return;
    }


    taskModal.classList.remove(
      "is-open"
    );


    taskModal.setAttribute(
      "aria-hidden",
      "true"
    );


    taskModal.hidden =
      true;


    document.body.style.overflow =
      "";


    taskForm?.reset();


    if (taskNotice) {
      taskNotice.textContent =
        "";
    }
  }


  /* =========================================================
     FILES / CALENDAR / INTELLIGENCE
  ========================================================= */

  function openFiles() {
    window.alert(
      "Project files will be populated from connected applications. No file source is connected yet."
    );
  }


  function openCalendar() {
    const url =
      new URL(
        "./calendar.html",
        window.location.href
      );


    url.searchParams.set(
      "project",
      state.project.id
    );


    window.location.href =
      url.href;
  }


  function openIntelligence() {
    const floatingCompanion =
      document.getElementById(
        "floating-companion"
      );


    if (floatingCompanion) {
      floatingCompanion.click();

      return;
    }


    window.alert(
      `NOUS project intelligence for ${state.project.title} will use project tasks, files and calendar context as those sources become available.`
    );
  }


  /* =========================================================
     NAVIGATION
  ========================================================= */

  function bindNavigation() {
    navigationItems.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const view =
              button.textContent
                .trim()
                .toLowerCase();


            if (
              view ===
              "overview"
            ) {
              showView(
                "overview"
              );

              return;
            }


            if (
              view ===
              "tasks"
            ) {
              showView(
                "tasks"
              );

              return;
            }


            if (
              view ===
              "files"
            ) {
              openFiles();

              return;
            }


            if (
              view ===
              "calendar"
            ) {
              openCalendar();

              return;
            }


            if (
              view ===
              "intelligence"
            ) {
              openIntelligence();
            }

          }
        );

      }
    );


    tasksModule?.addEventListener(
      "click",
      () => {
        showView(
          "tasks"
        );
      }
    );


    filesModule?.addEventListener(
      "click",
      openFiles
    );


    calendarModule?.addEventListener(
      "click",
      openCalendar
    );


    intelligenceModule?.addEventListener(
      "click",
      openIntelligence
    );
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  function bindEvents() {
    bindNavigation();


    addTaskButton?.addEventListener(
      "click",
      openTaskModal
    );


    taskModalBackdrop
      ?.addEventListener(
        "click",
        closeTaskModal
      );


    taskModalClose
      ?.addEventListener(
        "click",
        closeTaskModal
      );


    taskCancel
      ?.addEventListener(
        "click",
        closeTaskModal
      );


    taskForm
      ?.addEventListener(
        "submit",
        createTask
      );


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
            "Escape" &&
          taskModal &&
          !taskModal.hidden
        ) {
          closeTaskModal();
        }

      }
    );
  }


  /* =========================================================
     INITIALISE
  ========================================================= */

  async function initialise() {
    try {
      await loadProject();

      await loadTasks();


      loadingState &&
        (loadingState.hidden =
          true);


      errorState &&
        (errorState.hidden =
          true);


      workspace &&
        (workspace.hidden =
          false);


      bindEvents();

      showView(
        "overview"
      );


      console.log(
        "[NOUS PROJECT] Workspace ready",
        {
          project:
            state.project?.title,

          tasks:
            state.tasks.length
        }
      );


    } catch (error) {
      console.error(
        "[NOUS PROJECT WORKSPACE ERROR]",
        error
      );


      showError(
        error?.message ||
        "NOUS could not load this project right now."
      );
    }
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialise,
      {
        once: true
      }
    );

  } else {

    initialise();

  }

})();