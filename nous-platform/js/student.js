document.addEventListener(
    "DOMContentLoaded",
    () => {

        const year =
            document.getElementById(
                "currentYear"
            );

        if (year) {
            year.textContent =
                new Date().getFullYear();
        }

        const levelButtons =
            document.querySelectorAll(
                "[data-student-level]"
            );

        levelButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const level =
                        button.dataset
                            .studentLevel;

                    localStorage.setItem(
                        "nous-student-level",
                        level
                    );

                    console.log(
                        "Selected student level:",
                        level
                    );

                }
            );

        });

    }
);