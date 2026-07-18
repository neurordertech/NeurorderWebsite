document.addEventListener("DOMContentLoaded", () => {
    const spaceButtons =
        document.querySelectorAll(
            ".companion-space[data-space]"
        );

    const rosView =
        document.getElementById("rosView");

    const rosViewNumber =
        document.getElementById("rosViewNumber");

    const rosViewTitle =
        document.getElementById("rosViewTitle");

    const rosViewDescription =
        document.getElementById("rosViewDescription");

    const rosEnterButton =
        document.getElementById("rosEnterButton");

    const rosEnterText =
        document.getElementById("rosEnterText");

    const workspaceData = {
        business: {
            number: "01",
            title: "Business",
            action: "Enter Business",
            description:
                "Operate your organisation, review priorities and bring your work together through Nous.",
            destination: "business.html"
        },

        education: {
            number: "02",
            title: "Education",
            action: "Enter Education",
            description:
                "Organise your learning, understand your progress and continue developing your knowledge.",
            destination: "education.html"
        },

        personal: {
            number: "03",
            title: "Personal",
            action: "Enter Personal",
            description:
                "Return to a calm private space for your routines, relationships, memories and everyday life.",
            destination: "personal.html"
        }
    };

    let selectedWorkspace = null;

    function selectWorkspace(spaceName) {
        const workspace =
            workspaceData[spaceName];

        if (!workspace) {
            return;
        }

        selectedWorkspace = spaceName;

        if (rosViewNumber) {
            rosViewNumber.textContent =
                workspace.number;
        }

        if (rosViewTitle) {
            rosViewTitle.textContent =
                workspace.title;
        }

        if (rosViewDescription) {
            rosViewDescription.textContent =
                workspace.description;
        }

        if (rosEnterText) {
            rosEnterText.textContent =
                workspace.action;
        }

        if (rosEnterButton) {
            rosEnterButton.hidden = false;
        }

        spaceButtons.forEach((button) => {
            const isActive =
                button.dataset.space === spaceName;

            button.classList.toggle(
                "is-active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        rosView?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    spaceButtons.forEach((button) => {
        button.setAttribute(
            "aria-pressed",
            "false"
        );

        button.addEventListener("click", () => {
            const selectedSpace =
                button.dataset.space;

            selectWorkspace(selectedSpace);
        });
    });

    rosEnterButton?.addEventListener(
        "click",
        () => {
            if (!selectedWorkspace) {
                return;
            }

            const destination =
                workspaceData[selectedWorkspace]
                    ?.destination;

            if (!destination) {
                return;
            }

            window.location.href =
                destination;
        }
    );
});

