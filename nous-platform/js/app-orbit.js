document.addEventListener("DOMContentLoaded", function () {
    const orbit = document.getElementById("appOrbit");
    const centre = document.getElementById("appOrbitCentre");

    if (!orbit || !centre) {
        console.error("App orbit or centre button not found.");
        return;
    }


    orbit.addEventListener("click", function (event) {
        const node = event.target.closest(".app-node[data-app]");

        if (!node) {
            return;
        }

        const app = node.dataset.app;

        if (app === "calendar") {
            window.location.href = "calendar.html";
            return;
        }

        if (app === "add") {
            window.alert("Adding more applications will be available in a future release.");
            return;
        }

        window.alert(`${node.getAttribute("aria-label") || "This application"} is not connected yet.`);
    });

    centre.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = orbit.classList.toggle("is-open");

        centre.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    document.addEventListener("click", function (event) {
        if (!orbit.contains(event.target)) {
            orbit.classList.remove("is-open");

            centre.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            orbit.classList.remove("is-open");

            centre.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });
});