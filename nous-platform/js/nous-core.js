const identityPortal =
    document.getElementById("identityPortal");

const identityTransition =
    document.getElementById("identityTransition");

const transitionUsername =
    document.getElementById("transitionUsername");

if (
    identityPortal &&
    identityTransition
) {
    let transitionRunning = false;

    identityPortal.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            if (transitionRunning) {
                return;
            }

            transitionRunning = true;

            const destination =
                identityPortal.getAttribute("href");

            const navbarUsername =
                document.getElementById(
                    "navbarUsername"
                );

            if (
                navbarUsername &&
                transitionUsername
            ) {
                transitionUsername.textContent =
                    navbarUsername.textContent.trim();
            }

            document.body.classList.add(
                "identity-transition-running"
            );

            identityTransition.classList.add(
                "active"
            );

            identityTransition.setAttribute(
                "aria-hidden",
                "false"
            );

            window.setTimeout(() => {
                identityTransition.classList.add(
                    "leaving"
                );
            }, 1150);

            window.setTimeout(() => {
                window.location.href =
                    destination || "identity.html";
            }, 1750);
        }
    );
}