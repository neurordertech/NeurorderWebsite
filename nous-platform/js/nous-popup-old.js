document.addEventListener("DOMContentLoaded", () => {
    const greeting = document.getElementById("timeGreeting");
    const commandForm = document.getElementById("nousCommand");
    const commandInput = document.getElementById("nousInput");
    const rosView = document.getElementById("rosView");

    const currentHour = new Date().getHours();

    let greetingText = "GOOD EVENING";

    if (currentHour < 12) {
        greetingText = "GOOD MORNING";
    } else if (currentHour < 18) {
        greetingText = "GOOD AFTERNOON";
    }

    if (greeting) {
        greeting.textContent = greetingText;
    }

    if (!commandForm || !commandInput || !rosView) {
        return;
    }

    commandForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const request = commandInput.value.trim();
        if (!request) { commandInput.focus(); return; }
        if (!window.NousAccess?.requireAI()) return;

        rosView.innerHTML = `<p class="ros-view-label">CONNECTING TO NOUS</p><h2>Listening</h2><p>Please wait…</p>`;
        const result = await window.Nous.ask("home", request);
        rosView.innerHTML = `<p class="ros-view-label">${result.success ? "NOUS COMPANION" : "CONNECTION ISSUE"}</p><h2>${result.success ? "Response" : "Unable to connect"}</h2><p>${escapeHTML(result.reply)}</p>`;
        commandInput.value = "";
    });
});

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    updateCurrentYear();
    updateGreeting();
});

function updateCurrentYear() {
    const currentYearElement =
        document.getElementById("currentYear");

    if (!currentYearElement) {
        return;
    }

    currentYearElement.textContent =
        new Date().getFullYear();
}

function updateGreeting() {
    const timeGreeting =
        document.getElementById("timeGreeting");

    const workspaceGreeting =
        document.getElementById("workspaceGreeting");

    const userFirstName =
        document.getElementById("userFirstName");

    if (
        !timeGreeting ||
        !workspaceGreeting ||
        !userFirstName
    ) {
        return;
    }

    const now = new Date();
    const hour = now.getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
    } else if (hour >= 12 && hour < 18) {
        greeting = "Good afternoon";
    } else {
        greeting = "Good evening";
    }

    timeGreeting.textContent =
        greeting.toUpperCase();

    const userName =
        userFirstName.textContent
            .replace(".", "")
            .trim();

    workspaceGreeting.innerHTML = `
        ${greeting},
        <span id="userFirstName">${userName}.</span>
    `;
}

