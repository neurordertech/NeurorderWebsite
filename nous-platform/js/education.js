document.addEventListener("DOMContentLoaded", () => {

    const gate =
        document.getElementById("educationRoleGate");

    const workspace =
        document.getElementById("educationInterface");

    const roleButtons =
        document.querySelectorAll(".role-option");

    const changeRole =
        document.getElementById("changeEducationRole");

    const moduleGrid =
        document.getElementById("educationModuleGrid");

    const currentYear =
        document.getElementById("currentYear");

    const currentDate =
        document.getElementById("educationDate");

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }

    if (currentDate) {

        currentDate.textContent =
            new Intl.DateTimeFormat(
                "en-ZA",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                }
            ).format(new Date());

    }

    const profiles = {

        educator: {

            roleLabel:
                "Educator Workspace",

            eyebrow:
                "EDUCATOR",

            role:
                "Educator",

            description:
                "Teach, organise and understand your classroom through Nous.",

            command:
                "Let us teach",

            placeholder:
                "Ask Nous about today's lesson...",

            briefTitle:
                "Your classroom is ready.",

            briefMessage:
                "Create a lesson, manage learners and understand classroom progress.",

            primary:
                "Plan lesson",

            secondary:
                "Open classroom",

            stats: [

                {
                    label: "Classes",
                    value: "4",
                    note: "Active"
                },

                {
                    label: "Learners",
                    value: "86",
                    note: "Across all classes"
                },

                {
                    label: "Tasks",
                    value: "7",
                    note: "Need review"
                }

            ],

            modules: [

                {
                    title: "Nous Classroom",
                    description:
                        "Manage classrooms, announcements and learning resources."
                },

                {
                    title: "AI Lesson Studio",
                    description:
                        "Generate lesson plans, activities and explanations."
                },

                {
                    title: "Live Quiz",
                    description:
                        "Run Kahoot-style quizzes with live results."
                },

                {
                    title: "Assignments",
                    description:
                        "Create and review learner submissions."
                },

                {
                    title: "Learning Insights",
                    description:
                        "Track learner progress using AI."
                },

                {
                    title: "Class Community",
                    description:
                        "Keep your class connected."
                }

            ]

        },

        student: {

            roleLabel:
                "Student Workspace",

            eyebrow:
                "STUDENT",

            role:
                "Student",

            description:
                "Learn, revise and grow with Nous Companion.",

            command:
                "Let us learn",

            placeholder:
                "Explain today's lesson...",

            briefTitle:
                "Ready to learn.",

            briefMessage:
                "Continue where you left off or ask Companion for help.",

            primary:
                "Continue learning",

            secondary:
                "View assignments",

            stats: [

                {
                    label: "Subjects",
                    value: "6",
                    note: "This term"
                },

                {
                    label: "Assignments",
                    value: "3",
                    note: "Due soon"
                },

                {
                    label: "Progress",
                    value: "72%",
                    note: "Average"
                }

            ],

            modules: [

                {
                    title: "My Classroom",
                    description:
                        "Access all of your lessons."
                },

                {
                    title: "Study Companion",
                    description:
                        "Receive AI explanations and examples."
                },

                {
                    title: "Practice Arena",
                    description:
                        "Answer adaptive practice questions."
                },

                {
                    title: "Assignments",
                    description:
                        "Complete and submit coursework."
                },

                {
                    title: "My Progress",
                    description:
                        "Track your learning journey."
                },

                {
                    title: "Learning Library",
                    description:
                        "Store notes and learning resources."
                }

            ]

        }

    };

    function updateRole(role) {

        const profile = profiles[role];

        if (!profile) return;

        gate.hidden = true;
        workspace.hidden = false;

        document.getElementById("activeRoleLabel").textContent =
            profile.roleLabel;

        document.getElementById("educationEyebrow").textContent =
            profile.eyebrow;

        document.getElementById("educationRoleText").textContent =
            profile.role;

        document.getElementById("educationDescription").textContent =
            profile.description;

        document.getElementById("educationCommandText").textContent =
            profile.command;

        document.getElementById("educationCommandInput").placeholder =
            profile.placeholder;

        document.getElementById("educationBriefTitle").textContent =
            profile.briefTitle;

        document.getElementById("educationBriefMessage").textContent =
            profile.briefMessage;

        document.getElementById("primaryBriefAction").textContent =
            profile.primary;

        document.getElementById("secondaryBriefAction").textContent =
            profile.secondary;

        document.getElementById("platformModeLabel").textContent =
            profile.role + " Tools";

        const statNames =
            ["One", "Two", "Three"];

        profile.stats.forEach((stat, index) => {

            document.getElementById(
                "stat" +
                statNames[index] +
                "Label"
            ).textContent =
                stat.label;

            document.getElementById(
                "stat" +
                statNames[index] +
                "Value"
            ).textContent =
                stat.value;

            document.getElementById(
                "stat" +
                statNames[index] +
                "Note"
            ).textContent =
                stat.note;

        });

        moduleGrid.innerHTML = "";

        profile.modules.forEach(module => {

            const card =
                document.createElement("article");

            card.className =
                "education-module";

            card.innerHTML = `

                <span>NOUS</span>

                <h3>${module.title}</h3>

                <p>${module.description}</p>

            `;

            moduleGrid.appendChild(card);

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    roleButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                updateRole(
                    button.dataset.role
                );

            }
        );

    });

    if (changeRole) {

        changeRole.addEventListener(
            "click",
            () => {

                workspace.hidden = true;

                gate.hidden = false;

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }

    const commandForm =
        document.getElementById("educationCommandForm");

    if (commandForm) {
        commandForm.addEventListener("submit", async event => {
            event.preventDefault();

            const commandInput =
                document.getElementById("educationCommandInput");

            if (!commandInput?.value.trim()) {
                commandInput?.focus();
                return;
            }

            if (!window.NousAccess?.requireAI()) return;

            const result = await window.Nous.ask(
                "education",
                commandInput.value
            );

            showNousResponse(result);
        });
    }

    const generateButton =
        document.getElementById("generateEducationAi");

    const aiPrompt =
        document.getElementById("educationAiPrompt");

    const aiStatus =
        document.getElementById("educationAiStatus");

    const aiResponse =
        document.getElementById("educationAiResponse");

    const aiResponseText =
        document.getElementById("educationAiResponseText");

    function showNousResponse(result) {
        if (aiStatus) {
            aiStatus.textContent = result.success
                ? "Nous is connected"
                : "Connection issue";
        }

        if (aiResponse && aiResponseText) {
            aiResponse.hidden = false;
            aiResponse.classList.toggle(
                "has-error",
                !result.success
            );
            aiResponseText.textContent = result.reply;
            aiResponse.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    }

    if (generateButton && aiPrompt && aiStatus) {
        generateButton.addEventListener("click", async () => {
            const prompt = aiPrompt.value.trim();

            if (!prompt) {
                aiStatus.textContent = "Please enter a request first.";
                aiPrompt.focus();
                return;
            }

            if (!window.NousAccess?.requireAI()) return;

            generateButton.disabled = true;
            generateButton.textContent = "Connecting...";
            aiStatus.textContent = "Connecting to Nous...";

            if (aiResponse) {
                aiResponse.hidden = true;
            }

            const result = await window.Nous.ask(
                "education",
                prompt
            );

            showNousResponse(result);

            generateButton.disabled = false;
            generateButton.textContent = "Connect to Nous";
        });
    }

});
