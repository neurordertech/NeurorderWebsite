document.addEventListener(
    "DOMContentLoaded",
    () => {

        const moduleGrid =
            document.getElementById(
                "educationModuleGrid"
            );

        const workspace =
            document.getElementById(
                "educationModuleWorkspace"
            );

        const moduleLabel =
            document.getElementById(
                "educationModuleLabel"
            );

        const moduleTitle =
            document.getElementById(
                "educationModuleTitle"
            );

        const moduleDescription =
            document.getElementById(
                "educationModuleDescription"
            );

        const moduleContent =
            document.getElementById(
                "educationModuleContent"
            );

        const closeButton =
            document.getElementById(
                "closeEducationModule"
            );

        if (
            !moduleGrid ||
            !workspace ||
            !moduleContent
        ) {
            return;
        }

        const modules = [
            {
                id: "classroom",
                number: "01",
                title: "Nous Classroom",
                description:
                    "Manage classrooms, announcements and learning resources."
            },

            {
                id: "lesson-room",
                number: "02",
                title: "AI Lesson Room",
                description:
                    "Generate lesson plans, learning activities and explanations."
            },

            {
                id: "pulse",
                number: "03",
                title: "Nous Pulse",
                description:
                    "Create interactive quizzes and learning challenges."
            },

            {
                id: "assignments",
                number: "04",
                title: "Assignment Planner",
                description:
                    "Create assignments, deadlines and Calendar study plans."
            },

            {
                id: "insights",
                number: "05",
                title: "Learning Insights",
                description:
                    "Understand progress, activity and areas requiring support."
            },

            {
                id: "community",
                number: "06",
                title: "Class Community",
                description:
                    "Join structured education communities and study discussions."
            }
        ];

        moduleGrid.innerHTML =
            modules
                .map(module => `
                    <button
                        type="button"
                        class="education-module-card"
                        data-education-module="${module.id}"
                    >
                        <small>
                            ${module.number}
                        </small>

                        <div>
                            <span>NOUS</span>

                            <strong>
                                ${module.title}
                            </strong>

                            <p>
                                ${module.description}
                            </p>
                        </div>

                        <b aria-hidden="true">
                            ↗
                        </b>
                    </button>
                `)
                .join("");

        moduleGrid
            .querySelectorAll(
                "[data-education-module]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        openModule(
                            button.dataset
                                .educationModule
                        );
                    }
                );

            });

        document
            .querySelectorAll(
                "[data-open-module]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        openModule(
                            button.dataset
                                .openModule
                        );
                    }
                );

            });

        closeButton?.addEventListener(
            "click",
            () => {
                workspace.hidden = true;
            }
        );

        function openModule(moduleId) {
            const module =
                modules.find(
                    item =>
                        item.id === moduleId
                );

            if (!module) {
                return;
            }

            moduleLabel.textContent =
                "EDUCATION MODULE";

            moduleTitle.textContent =
                module.title;

            moduleDescription.textContent =
                module.description;

            moduleContent.innerHTML =
                getModuleContent(
                    moduleId
                );

            workspace.hidden = false;

            workspace.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            bindModuleActions(
                moduleId
            );
        }

        function getModuleContent(moduleId) {

            if (moduleId === "classroom") {
                return `
                   <article class="education-tool-card education-tool-card-branded">

    <img
        src="assets/apps/googleclassroom.png"
        alt=""
        class="education-tool-corner-logo"
    >

    <span>CLASSROOM</span>

    <h3>
        Open Google Classroom
    </h3>

    <p>
        Access your current Google Classroom
        account in a new tab. Secure account
        connection will be added later.
    </p>

    <a
        href="https://classroom.google.com"
        target="_blank"
        rel="noopener noreferrer"
        class="education-tool-link"
    >
        Open Google Classroom
        <span aria-hidden="true">↗</span>
    </a>

</article>
<article class="education-tool-card education-tool-card-branded">

    <img
        src="assets/apps/nouslearners.png"
        alt=""
        class="education-tool-corner-logo"
    >

    <span>NOUS CLASSROOM</span>

    <h3>
        Internal classroom
    </h3>

    <p>
        Create announcements, learning resources,
        assignments and class spaces inside Nous.
    </p>

    <button
        type="button"
        class="education-tool-button"
        data-education-action="create-class"
    >
        Open Nous Classroom
    </button>

</article>

                    </div>
                `;
            }

            if (moduleId === "lesson-room") {
                return `
                    <div class="education-module-card-grid">

                        <article class="education-tool-card">
                            <span>AI LESSON ROOM</span>

                            <h3>
                                Generate a lesson
                            </h3>

                            <p>
                                Ask Nous to prepare a lesson structure,
                                activities, questions and homework.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="open-ai"
                            >
                                Open lesson generator
                            </button>
                        </article>

                        <article class="education-tool-card">
                            <span>STUDENT MODE</span>

                            <h3>
                                Explain a topic
                            </h3>

                            <p>
                                Ask Nous for a simpler explanation,
                                examples, revision notes or practice.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="open-ai"
                            >
                                Ask Nous
                            </button>
                        </article>

                    </div>
                `;
            }

            if (moduleId === "pulse") {
                return `
                    <div class="education-module-card-grid">

                        <article class="education-tool-card">
                            <span>NOUS PULSE</span>

                            <h3>
                                Create a quiz
                            </h3>

                            <p>
                                Prepare an interactive quiz for a class
                                or study group.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="create-quiz"
                            >
                                Create quiz
                            </button>
                        </article>

                        <article class="education-tool-card">
                            <span>JOIN</span>

                            <h3>
                                Enter a room
                            </h3>

                            <p>
                                Learners will later join a live quiz
                                using a secure room code.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="join-quiz"
                            >
                                Join quiz
                            </button>
                        </article>

                    </div>
                `;
            }

            if (moduleId === "assignments") {
                return `
                    <div class="education-module-card-grid">

                        <article class="education-tool-card">
                            <span>ASSIGNMENTS</span>

                            <h3>
                                Assignment Planner
                            </h3>

                            <p>
                                Create an assignment and organise its due
                                date through the Nous Calendar.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="open-calendar"
                            >
                                Open Calendar
                            </button>
                        </article>

                        <article class="education-tool-card">
                            <span>NOUS PLAN</span>

                            <h3>
                                Break work into steps
                            </h3>

                            <p>
                                Ask Nous to turn one deadline into a
                                realistic study or teaching plan.
                            </p>

                            <button
                                type="button"
                                class="education-tool-button"
                                data-education-action="open-ai"
                            >
                                Plan with Nous
                            </button>
                        </article>

                    </div>
                `;
            }

            if (moduleId === "insights") {
                return `
                    <div class="education-module-card-grid">

                        <article class="education-tool-card">
                            <span>PROGRESS</span>

                            <h3>
                                Learning activity
                            </h3>

                            <p>
                                Track completed tasks, upcoming deadlines
                                and quiz performance.
                            </p>
                        </article>

                        <article class="education-tool-card">
                            <span>SUPPORT</span>

                            <h3>
                                Areas to practise
                            </h3>

                            <p>
                                Nous will later identify topics that may
                                benefit from more revision or support.
                            </p>
                        </article>

                    </div>
                `;
            }

            return `
                <div class="education-module-card-grid">

                    <article class="education-tool-card">
                        <span>COMMUNITY PREVIEW</span>

                        <h3>
                            High School
                        </h3>

                        <p>
                            General discussion, study help and learning
                            opportunities for high-school learners.
                        </p>
                    </article>

                    <article class="education-tool-card">
                        <span>COMMUNITY PREVIEW</span>

                        <h3>
                            Grade 12 Seniors
                        </h3>

                        <p>
                            Matric preparation, examinations, university
                            applications and peer support.
                        </p>
                    </article>

                    <article class="education-tool-card">
                        <span>COMMUNITY PREVIEW</span>

                        <h3>
                            College and University
                        </h3>

                        <p>
                            Coursework, assignments, technology, events
                            and professional development.
                        </p>
                    </article>

                </div>
            `;
        }

        function bindModuleActions() {

            moduleContent
                .querySelectorAll(
                    "[data-education-action]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const action =
                                button.dataset
                                    .educationAction;

                            if (
                                action ===
                                "open-calendar"
                            ) {
                                window.location.href =
                                    "calendar.html";

                                return;
                            }

                            if (
                                action ===
                                "open-ai"
                            ) {
                                document
                                    .querySelector(
                                        ".education-ai-lab"
                                    )
                                    ?.scrollIntoView({
                                        behavior:
                                            "smooth",

                                        block:
                                            "start"
                                    });

                                document
                                    .getElementById(
                                        "educationAiPrompt"
                                    )
                                    ?.focus();

                                return;
                            }

                            window.alert(
                                "This Education feature is being prepared for the Alpha release."
                            );

                        }
                    );

                });

        }

    }
);