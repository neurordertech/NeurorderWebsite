document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    const date = document.getElementById("businessDate");
    if (year) year.textContent = new Date().getFullYear();
    if (date) date.textContent = new Intl.DateTimeFormat("en-ZA", {weekday:"long",day:"numeric",month:"long"}).format(new Date());

    const response = document.createElement("div");
    response.className = "nous-ai-response";
    response.hidden = true;
    const firstForm = document.getElementById("businessCommandForm");
    firstForm?.insertAdjacentElement("afterend", response);

    async function submit(input) {
        const message = input.value.trim();
        if (!message) { input.focus(); return; }
        if (!window.NousAccess?.requireAI()) return;
        response.hidden = false;
        response.classList.remove("has-error");
        response.innerHTML = '<span class="nous-ai-response-label">CONNECTING TO NOUS</span>Please wait…';
        const result = await window.Nous.ask("business", message);
        response.classList.toggle("has-error", !result.success);
        response.innerHTML = `<span class="nous-ai-response-label">${result.success ? "NOUS • BUSINESS" : "CONNECTION ISSUE"}</span>${escapeHtml(result.reply)}`;
        input.value = "";
    }

    [["businessCommandForm","businessCommandInput"],["companionEndForm","companionEndInput"]].forEach(([formId,inputId]) => {
        const form = document.getElementById(formId), input = document.getElementById(inputId);
        form?.addEventListener("submit", e => { e.preventDefault(); submit(input); });
    });
});
function escapeHtml(v){const d=document.createElement("div");d.textContent=v;return d.innerHTML;}

/* ==================================================
   BUSINESS → NOUS COMPANION
================================================== */

const businessCommandForm =
    document.getElementById("businessCommandForm");

const businessCommandInput =
    document.getElementById("businessCommandInput");

const businessNousPanel =
    document.getElementById("businessNousPanel");

const businessNousMessage =
    document.getElementById("businessNousMessage");

if (
    businessCommandForm &&
    businessCommandInput &&
    businessNousPanel &&
    businessNousMessage
) {
    businessCommandForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const message =
                businessCommandInput.value.trim();

            if (!message) {
                businessCommandInput.focus();
                return;
            }

            const submitButton =
                businessCommandForm.querySelector(
                    'button[type="submit"]'
                );

            businessNousPanel.hidden = false;

            businessNousMessage.textContent =
                "Connecting to Nous...";

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                if (!window.Nous) {
                    throw new Error(
                        "Nous Core has not loaded."
                    );
                }

                const result =
                    await window.Nous.ask(
                        "business",
                        message
                    );

                if (
                    !result ||
                    result.success !== true
                ) {
                    throw new Error(
                        result?.error ||
                        "Nous could not complete the request."
                    );
                }

                businessNousMessage.textContent =
                    result.reply;

                businessCommandInput.value = "";

                businessNousPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            } catch (error) {
                console.error(
                    "Business Nous error:",
                    error
                );

                businessNousMessage.textContent =
                    error instanceof Error
                        ? error.message
                        : "Unable to connect to Nous.";
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        }
    );
}

/* ==================================================
   BOTTOM BUSINESS COMMAND → SAME NOUS PANEL
================================================== */

const companionEndForm =
    document.getElementById("companionEndForm");

const companionEndInput =
    document.getElementById("companionEndInput");

if (
    companionEndForm &&
    companionEndInput &&
    businessNousPanel &&
    businessNousMessage
) {
    companionEndForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const message =
                companionEndInput.value.trim();

            if (!message) {
                companionEndInput.focus();
                return;
            }

            const submitButton =
                companionEndForm.querySelector(
                    'button[type="submit"]'
                );

            businessNousPanel.hidden = false;

            businessNousMessage.textContent =
                "Connecting to Nous...";

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                if (!window.Nous) {
                    throw new Error(
                        "Nous Core has not loaded."
                    );
                }

                const result =
                    await window.Nous.ask(
                        "business",
                        message
                    );

                if (
                    !result ||
                    result.success !== true
                ) {
                    throw new Error(
                        result?.error ||
                        "Nous could not complete the request."
                    );
                }

                businessNousMessage.textContent =
                    result.reply;

                companionEndInput.value = "";

                businessNousPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            } catch (error) {
                console.error(
                    "Bottom Business Nous error:",
                    error
                );

                businessNousMessage.textContent =
                    error instanceof Error
                        ? error.message
                        : "Unable to connect to Nous.";
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        }
    );
}