document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY =
        "nous-business-dashboard";

    const defaultState = {
        meetings: [],
        priorities: [],
        decisions: [],
        projects: [],
        documents: []
    };

    function loadState() {
        try {
            const saved =
                localStorage.getItem(STORAGE_KEY);

            return saved
                ? {
                    ...defaultState,
                    ...JSON.parse(saved)
                }
                : { ...defaultState };
        } catch (error) {
            console.error(
                "Could not load Business dashboard:",
                error
            );

            return { ...defaultState };
        }
    }

    function saveState() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

        updateDashboard();
    }

    const state = loadState();

    const meetingCount =
        document.getElementById("meetingCount");

    const priorityCount =
        document.getElementById("priorityCount");

    const decisionCount =
        document.getElementById("decisionCount");

    const briefTitle =
        document.getElementById("briefTitle");

    const briefMessage =
        document.getElementById("briefMessage");

    const reviewPrioritiesButton =
        document.getElementById(
            "reviewPrioritiesButton"
        );

    const connectServicesButton =
        document.getElementById(
            "connectServicesButton"
        );

    const moduleButtons =
        document.querySelectorAll(
            ".business-module"
        );

    const moduleView =
        document.getElementById(
            "businessModuleView"
        );

    const moduleViewLabel =
        document.getElementById(
            "moduleViewLabel"
        );

    const moduleViewTitle =
        document.getElementById(
            "moduleViewTitle"
        );

    const moduleViewDescription =
        document.getElementById(
            "moduleViewDescription"
        );

    const moduleEmptyState =
        document.getElementById(
            "moduleEmptyState"
        );

    const modulePrimaryAction =
        document.getElementById(
            "modulePrimaryAction"
        );

    const closeModuleView =
        document.getElementById(
            "closeModuleView"
        );

    const connectedServicesSection =
        document.getElementById(
            "connectedServicesSection"
        );

    const serviceButtons =
        document.querySelectorAll(
            ".service-button"
        );

    const modules = {
        projects: {
            label: "BUSINESS MODULE",
            title: "Projects",
            description:
                "Organise active work, teams and milestones.",
            action: "Add project"
        },

        communication: {
            label: "BUSINESS MODULE",
            title: "Communication",
            description:
                "Bring email, messages and meetings into one coordinated view.",
            action: "View services"
        },

        documents: {
            label: "BUSINESS MODULE",
            title: "Documents",
            description:
                "Organise business documents and connected storage locations.",
            action: "Add document"
        },

        analytics: {
            label: "BUSINESS MODULE",
            title: "Analytics",
            description:
                "Review dashboard activity, priorities and organisational progress.",
            action: "Refresh analytics"
        },

        organisation: {
            label: "BUSINESS MODULE",
            title: "Organisation",
            description:
                "Manage people, roles, governance and approvals.",
            action: "Add decision"
        },

        services: {
            label: "BUSINESS MODULE",
            title: "Connected Services",
            description:
                "Manage the external platforms used by your organisation.",
            action: "Browse services"
        }
    };

    let activeModule = null;

    function updateDashboard() {
        if (meetingCount) {
            meetingCount.textContent =
                state.meetings.length;
        }

        if (priorityCount) {
            priorityCount.textContent =
                state.priorities.filter(
                    item => !item.completed
                ).length;
        }

        if (decisionCount) {
            decisionCount.textContent =
                state.decisions.filter(
                    item => !item.completed
                ).length;
        }

        const openPriorities =
            state.priorities.filter(
                item => !item.completed
            );

        if (
            briefTitle &&
            briefMessage
        ) {
            if (openPriorities.length > 0) {
                briefTitle.textContent =
                    `${openPriorities.length} ${
                        openPriorities.length === 1
                            ? "priority requires"
                            : "priorities require"
                    } attention.`;

                briefMessage.textContent =
                    openPriorities
                        .slice(0, 3)
                        .map(item => item.title)
                        .join(" • ");
            } else {
                briefTitle.textContent =
                    "Your organisation is ready.";

                briefMessage.textContent =
                    "There are no urgent items requiring attention. Add a priority or connect a service to begin building your daily business view.";
            }
        }
    }

    function openModule(moduleName) {
        const module =
            modules[moduleName];

        if (
            !module ||
            !moduleView
        ) {
            return;
        }

        activeModule = moduleName;

        if (moduleViewLabel) {
            moduleViewLabel.textContent =
                module.label;
        }

        if (moduleViewTitle) {
            moduleViewTitle.textContent =
                module.title;
        }

        if (moduleViewDescription) {
            moduleViewDescription.textContent =
                module.description;
        }

        if (modulePrimaryAction) {
            modulePrimaryAction.textContent =
                module.action;
        }

        renderModuleContent();

        moduleView.hidden = false;

        moduleView.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function createList(items) {
        if (!items.length) {
            return `
                <span>
                    Nothing has been added yet.
                </span>
            `;
        }

        return `
            <div class="business-dashboard-list">
                ${items.map(item => `
                    <article class="business-dashboard-item">
                        <strong>
                            ${escapeHtml(item.title)}
                        </strong>

                        ${
                            item.note
                                ? `<small>${escapeHtml(item.note)}</small>`
                                : ""
                        }
                    </article>
                `).join("")}
            </div>
        `;
    }

    function renderModuleContent() {
        if (
            !moduleEmptyState ||
            !activeModule
        ) {
            return;
        }

        switch (activeModule) {
            case "projects":
                moduleEmptyState.innerHTML =
                    createList(state.projects);
                break;

            case "documents":
                moduleEmptyState.innerHTML =
                    createList(state.documents);
                break;

            case "organisation":
                moduleEmptyState.innerHTML =
                    createList(state.decisions);
                break;

            case "analytics":
                moduleEmptyState.innerHTML = `
                    <div class="business-dashboard-summary">

                        <article>
                            <span>Projects</span>
                            <strong>${state.projects.length}</strong>
                        </article>

                        <article>
                            <span>Priorities</span>
                            <strong>${state.priorities.length}</strong>
                        </article>

                        <article>
                            <span>Meetings</span>
                            <strong>${state.meetings.length}</strong>
                        </article>

                        <article>
                            <span>Decisions</span>
                            <strong>${state.decisions.length}</strong>
                        </article>

                    </div>
                `;
                break;

            case "communication":
            case "services":
                moduleEmptyState.innerHTML = `
                    <span>
                        Connect an approved platform to begin.
                    </span>
                `;
                break;
        }

        if (modulePrimaryAction) {
            moduleEmptyState.appendChild(
                modulePrimaryAction
            );
        }
    }

    function addItem(
        collection,
        titlePrompt,
        notePrompt
    ) {
        const title =
            window.prompt(titlePrompt);

        if (!title?.trim()) {
            return;
        }

        const note =
            notePrompt
                ? window.prompt(notePrompt) || ""
                : "";

        state[collection].push({
            id:
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : String(Date.now()),

            title: title.trim(),
            note: note.trim(),
            completed: false,
            createdAt:
                new Date().toISOString()
        });

        saveState();
        renderModuleContent();
    }

    moduleButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                openModule(
                    button.dataset.module
                );
            }
        );
    });

    reviewPrioritiesButton?.addEventListener(
        "click",
        () => {
            const title =
                window.prompt(
                    "What priority should be added?"
                );

            if (!title?.trim()) {
                return;
            }

            state.priorities.push({
                id:
                    crypto.randomUUID
                        ? crypto.randomUUID()
                        : String(Date.now()),

                title: title.trim(),
                completed: false,
                createdAt:
                    new Date().toISOString()
            });

            saveState();
        }
    );

    connectServicesButton?.addEventListener(
        "click",
        () => {
            connectedServicesSection
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        }
    );

    closeModuleView?.addEventListener(
        "click",
        () => {
            moduleView.hidden = true;
            activeModule = null;
        }
    );

    modulePrimaryAction?.addEventListener(
        "click",
        () => {
            switch (activeModule) {
                case "projects":
                    addItem(
                        "projects",
                        "Project name:",
                        "Optional project note:"
                    );
                    break;

                case "documents":
                    addItem(
                        "documents",
                        "Document name:",
                        "Optional document description:"
                    );
                    break;

                case "organisation":
                    addItem(
                        "decisions",
                        "Decision requiring review:",
                        "Optional decision note:"
                    );
                    break;

                case "communication":
                case "services":
                    connectedServicesSection
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    break;

                case "analytics":
                    updateDashboard();
                    renderModuleContent();
                    break;
            }
        }
    );

    serviceButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                const service =
                    button.dataset.service ||
                    "Service";

                window.alert(
                    `${service}\n\n` +
                    "This integration has not yet been connected. " +
                    "A secure authorisation process will be added before account data can be accessed."
                );
            }
        );
    });

    function escapeHtml(value) {
        const element =
            document.createElement("div");

        element.textContent =
            String(value);

        return element.innerHTML;
    }

    updateDashboard();
});