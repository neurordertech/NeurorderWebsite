console.log(
  "[NOUS FILE] app/js/education.js loaded"
);

(() => {
  "use strict";

  const EDUCATION_ROLE_KEY =
    "nous-education-role";

  function initialiseEducationPage() {
    const entryCards =
      document.querySelectorAll(
        "[data-education-route]"
      );

    function saveEducationRole(role) {
      try {
        window.localStorage.setItem(
          EDUCATION_ROLE_KEY,
          role
        );
      } catch (error) {
        console.warn(
          "NOUS could not save the education role:",
          error
        );
      }
    }

    entryCards.forEach((card) => {
      card.addEventListener(
        "click",
        () => {
          const route =
            card.getAttribute(
              "data-education-route"
            );

          const role =
            card.id ===
            "open-educator-workspace"
              ? "educator"
              : "south_africa_senior";

          saveEducationRole(role);

          if (route) {
            window.location.assign(
              route
            );
          }
        }
      );

      card.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();
          card.click();
        }
      );
    });
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseEducationPage,
      {
        once: true
      }
    );
  } else {
    initialiseEducationPage();
  }
})();