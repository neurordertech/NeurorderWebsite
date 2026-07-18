document.addEventListener("DOMContentLoaded", () => {
    initialisePersonalWorkspace();
});

function initialisePersonalWorkspace() {
    const personalContext = loadPersonalContext();

    updatePersonalIdentity(personalContext);
    updatePersonalDate();
    initialiseMood();
    initialiseTimeline();
    initialiseConstellations();
    initialiseCompanionForms();
    initialisePersonalNavigation();
    updateCopyrightYear();
}

function loadPersonalContext() {
    const savedContext =
        localStorage.getItem("nousPersonalContext");

    if (savedContext) {
        try {
            return JSON.parse(savedContext);
        } catch (error) {
            console.warn(
                "Nous could not read the saved personal context.",
                error
            );
        }
    }

    return {
        userName: "Ntokozo",
        profileImage: "assets/logo/nouslogo.png",
        mood: null,
        timeline: []
    };
}

function updatePersonalIdentity(context) {
    const userName =
        document.getElementById("personalUserName");

    const profileImage =
        document.getElementById("personalProfileImage");

    if (userName) {
        userName.textContent =
            `${context.userName || "there"}.`;
    }

    if (profileImage) {
        profileImage.src =
            context.profileImage ||
            "assets/logo/nouslogo.png";
    }

    updatePersonalGreeting();
}

function updatePersonalGreeting() {
    const greeting =
        document.getElementById("personalGreeting");

    const userName =
        document.getElementById("personalUserName");

    if (!greeting || !userName) {
        return;
    }

    const hour =
        new Date().getHours();

    let welcomeText =
        "Welcome home";

    if (hour >= 5 && hour < 12) {
        welcomeText =
            "Good morning";
    } else if (hour >= 12 && hour < 18) {
        welcomeText =
            "Welcome back";
    }

    greeting.innerHTML = `
        ${welcomeText},
        <span id="personalUserName">
            ${userName.textContent}
        </span>
    `;
}

function updatePersonalDate() {
    const dateElement =
        document.getElementById("personalDate");

    if (!dateElement) {
        return;
    }

    const now =
        new Date();

    dateElement.textContent =
        new Intl.DateTimeFormat(
            "en-ZA",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        ).format(now);

    dateElement.dateTime =
        now.toISOString();
}

function initialiseMood() {
    const moodButtons =
        document.querySelectorAll(
            ".mood-options [data-mood]"
        );

    const selectedMood =
        document.getElementById("selectedMood");

    moodButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const mood =
                button.dataset.mood;

            moodButtons.forEach((item) => {
                item.classList.remove("is-active");
            });

            button.classList.add("is-active");

            if (selectedMood) {
                selectedMood.textContent =
                    `You feel ${mood.toLowerCase()} today.`;
            }

            updatePersonalBriefForMood(mood);
        });
    });
}

function updatePersonalBriefForMood(mood) {
    const title =
        document.getElementById(
            "personalBriefTitle"
        );

    const message =
        document.getElementById(
            "personalBriefMessage"
        );

    if (!title || !message) {
        return;
    }

    const moodMessages = {
        Calm: {
            title:
                "You seem grounded today.",
            message:
                "Keep the pace gentle. Your timeline and personal spaces are here whenever you need them."
        },

        Okay: {
            title:
                "You do not have to have everything figured out.",
            message:
                "We can begin with one small thought, one task or simply a conversation."
        },

        Heavy: {
            title:
                "You do not have to carry everything alone.",
            message:
                "Take your time. You can write, reflect or speak freely with Nous Companion."
        }
    };

    const response =
        moodMessages[mood];

    if (!response) {
        return;
    }

    title.textContent =
        response.title;

    message.textContent =
        response.message;
}

function initialiseTimeline() {
    document
        .getElementById("openTimelineButton")
        ?.addEventListener("click", () => {
            document
                .getElementById("lifeTimeline")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        });

    document
        .getElementById("addTimelineItemButton")
        ?.addEventListener("click", () => {
            const timelineList =
                document.getElementById(
                    "timelineList"
                );

            if (!timelineList) {
                return;
            }

            const entry =
                document.createElement("article");

            entry.className =
                "timeline-entry";

            entry.innerHTML = `
                <span class="timeline-time">
                    New
                </span>

                <div class="timeline-marker">
                    <span></span>
                </div>

                <div class="timeline-content">
                    <strong>
                        A new moment
                    </strong>

                    <p>
                        This temporary entry will later be saved
                        securely to your Nous profile.
                    </p>
                </div>
            `;

            timelineList.appendChild(entry);

            entry.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
}

function initialiseConstellations() {
    const constellationButtons =
        document.querySelectorAll(
            ".constellation-bubble"
        );

    const constellationView =
        document.getElementById(
            "constellationView"
        );

    const constellationData = {
        messages: {
            title: "Messages",
            description:
                "Bring your everyday conversations into one calm space.",
            apps: [
                "WhatsApp",
                "Messages",
                "Signal",
                "Messenger"
            ]
        },

        music: {
            title: "Music",
            description:
                "Listen through the services that already belong in your life.",
            apps: [
                "Spotify",
                "Apple Music",
                "YouTube Music"
            ]
        },

        family: {
            title: "People",
            description:
                "Stay close to family, friends and the people who matter.",
            apps: [
                "Family",
                "Friends",
                "Partner",
                "Important dates"
            ]
        },

        journal: {
            title: "Journal",
            description:
                "Write privately, reflect and keep meaningful thoughts.",
            apps: [
                "New reflection",
                "Daily notes",
                "Private memories"
            ]
        },

        calendar: {
            title: "Calendar",
            description:
                "Bring personal events, reminders and plans together.",
            apps: [
                "Google Calendar",
                "Apple Calendar",
                "Personal reminders"
            ]
        },

        finance: {
            title: "Finance",
            description:
                "Understand your financial life without pressure or confusion.",
            apps: [
                "Financial Story",
                "Budget",
                "Savings",
                "Credit"
            ]
        },

        photos: {
            title: "Memories",
            description:
                "Return to meaningful photographs, moments and personal history.",
            apps: [
                "Photos",
                "Albums",
                "Shared memories"
            ]
        },

        settings: {
            title: "Personal Settings",
            description:
                "Choose which spaces and services belong in your Personal home.",
            apps: [
                "Add an app",
                "Remove a space",
                "Rearrange home",
                "Privacy controls"
            ]
        }
    };

    constellationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const constellationName =
                button.dataset.constellation;

            const constellation =
                constellationData[
                    constellationName
                ];

            if (
                !constellation ||
                !constellationView
            ) {
                return;
            }

            constellationButtons.forEach(
                (item) => {
                    item.classList.remove(
                        "is-active"
                    );
                }
            );

            button.classList.add(
                "is-active"
            );

            setText(
                "constellationViewTitle",
                constellation.title
            );

            setText(
                "constellationViewDescription",
                constellation.description
            );

            renderConstellationApps(
                constellation.apps
            );

            constellationView.hidden =
                false;

            constellationView.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
    });

    document
        .getElementById(
            "closeConstellationView"
        )
        ?.addEventListener("click", () => {
            if (constellationView) {
                constellationView.hidden =
                    true;
            }

            constellationButtons.forEach(
                (button) => {
                    button.classList.remove(
                        "is-active"
                    );
                }
            );
        });
}

function renderConstellationApps(apps) {
    const appContainer =
        document.getElementById(
            "constellationApps"
        );

    if (!appContainer) {
        return;
    }

    appContainer.innerHTML = "";

    apps.forEach((appName) => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "constellation-app";

        button.innerHTML = `
            <span>
                <strong>${appName}</strong>
                <small>
                    Not connected yet
                </small>
            </span>

            <span aria-hidden="true">
                ↗
            </span>
        `;

        button.addEventListener(
            "click",
            () => {
                showPersonalMessage(
                    `${appName} will be available through secure connected services or future native Nous tools.`
                );
            }
        );

        appContainer.appendChild(button);
    });
}

function initialiseCompanionForms() {
    const forms = [
        ["personalCommandForm", "personalCommandInput"],
        ["personalEndForm", "personalEndInput"]
    ];

    forms.forEach(([formId, inputId]) => {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        if (!form || !input) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = input.value.trim();
            if (!message) { input.focus(); return; }
            if (!window.NousAccess?.requireAI()) return;

            showPersonalMessage("Connecting to Nous…");
            const result = await window.Nous.ask("personal", message);
            showPersonalMessage(result.reply);
            input.value = "";
        });
    });
}

function showPersonalMessage(message) {
    setText(
        "personalBriefTitle",
        "Companion is listening."
    );

    setText(
        "personalBriefMessage",
        message
    );

    document
        .querySelector(".personal-today")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}

function initialisePersonalNavigation() {
    document
        .getElementById(
            "openConstellationsButton"
        )
        ?.addEventListener("click", () => {
            document
                .getElementById(
                    "personalConstellations"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        });

    document
        .getElementById(
            "personalProfileButton"
        )
        ?.addEventListener("click", () => {
            const settingsButton =
                document.querySelector(
                    '[data-constellation="settings"]'
                );

            settingsButton?.click();
        });
}

function updateCopyrightYear() {
    setText(
        "currentYear",
        new Date().getFullYear()
    );
}

function setText(elementId, value) {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.textContent =
            String(value);
    }
}