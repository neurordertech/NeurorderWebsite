document.addEventListener("DOMContentLoaded", () => {
    const capsule =
        document.getElementById("nousCapsule");

    const backdrop =
        document.getElementById("nousMotionBackdrop");

    const title =
        document.getElementById("nousCapsuleTitle");

    const message =
        document.getElementById("nousCapsuleMessage");

    if (!capsule || !backdrop) {
        console.warn(
            "Nous Motion System elements were not found."
        );

        return;
    }

    let transitionRunning = false;

    function connectTo({
        destination,
        titleText = "Establishing connection",
        messageText = "Preparing workspace",
        completedText = "Connection established"
    }) {
        if (transitionRunning) {
            return;
        }

        transitionRunning = true;

        if (title) {
            title.textContent = titleText;
        }

        if (message) {
            message.textContent = messageText;
        }

        document.body.classList.add(
            "nous-motion-running"
        );

        backdrop.classList.add("active");
        capsule.classList.add("active");

        capsule.setAttribute(
            "aria-hidden",
            "false"
        );

        backdrop.setAttribute(
            "aria-hidden",
            "false"
        );

        window.setTimeout(() => {
            capsule.classList.add("expanded");
        }, 700);

        window.setTimeout(() => {
            if (title) {
                title.textContent = completedText;
            }

            if (message) {
                message.textContent = "Opening now";
            }

            capsule.classList.add("complete");
        }, 1450);

        window.setTimeout(() => {
            window.location.href = destination;
        }, 2200);
    }

    window.NousMotion = {
        connectTo
    };

    const identityPortal =
        document.getElementById("identityPortal");

    if (identityPortal) {
        identityPortal.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                connectTo({
                    destination:
                        identityPortal.getAttribute("href") ||
                        "identity.html",

                    titleText:
                        "Establishing connection",

                    messageText:
                        "Preparing Identity Layer",

                    completedText:
                        "Identity verified"
                });
            }
        );
    }
});