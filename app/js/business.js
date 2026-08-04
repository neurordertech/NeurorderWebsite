document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  function openOverlay(element) {
    if (!element) return;

    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
  }

  function closeOverlay(element) {
    if (!element) return;

    element.classList.remove("is-open");
    element.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
  }

  /* =======================================================
     COLLAPSIBLE BUSINESS NAVIGATION
     ======================================================= */

  const navigationShell =
    document.querySelector(".business-navigation-shell");

  const navigationToggle =
    document.getElementById("business-navigation-toggle");

  navigationToggle?.addEventListener("click", () => {
    const isOpen =
      navigationShell?.classList.toggle("is-open") ?? false;

    navigationToggle.setAttribute(
      "aria-expanded",
      String(isOpen),
    );

    navigationToggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close primary navigation"
        : "Open primary navigation",
    );
  });

  /* =======================================================
     BUSINESS SEARCH
     ======================================================= */

  const searchButton =
    document.getElementById("business-search-button");

  const searchPanel =
    document.getElementById("business-search-panel");

  const searchBackdrop =
    document.getElementById("business-search-backdrop");

  const searchClose =
    document.getElementById("business-search-close");

  const searchInput =
    document.getElementById("business-search-input");

  const searchResults =
    document.querySelectorAll(
      "#business-search-results [data-search-item]",
    );

  const searchMessage =
    document.getElementById("business-search-message");

  searchButton?.addEventListener("click", () => {
    openOverlay(searchPanel);

    window.setTimeout(() => {
      searchInput?.focus();
    }, 360);
  });

  searchBackdrop?.addEventListener(
    "click",
    () => closeOverlay(searchPanel),
  );

  searchClose?.addEventListener(
    "click",
    () => closeOverlay(searchPanel),
  );

  searchInput?.addEventListener("input", () => {
    const query =
      searchInput.value.trim().toLowerCase();

    let visibleCount = 0;

    searchResults.forEach((item) => {
      const searchableText =
        item.textContent?.toLowerCase() ?? "";

      const visible =
        query.length === 0 ||
        searchableText.includes(query);

      item.hidden = !visible;

      if (visible) {
        visibleCount += 1;
      }
    });

    if (searchMessage) {
      searchMessage.textContent =
        visibleCount > 0
          ? `${visibleCount} result${visibleCount === 1 ? "" : "s"} available.`
          : "No matching Business items were found.";
    }
  });

  searchResults.forEach((item) => {
    item.addEventListener("click", () => {
      const itemName =
        item.getAttribute("data-search-item");

      if (searchMessage) {
        searchMessage.textContent =
          `${itemName} selected. Its dedicated view will be connected next.`;
      }
    });
  });

  /* =======================================================
     NOUS CLOCK
     ======================================================= */

  const clockPanel =
    document.getElementById("nous-clock-panel");

  const clockOpen =
    document.getElementById("business-clock-open");

  const clockBackdrop =
    document.getElementById("nous-clock-backdrop");

  const clockClose =
    document.getElementById("nous-clock-close");

  const clockDateInput =
    document.getElementById("nous-clock-date-input");

  const clockTimeInput =
    document.getElementById("nous-clock-time-input");

  const clockCurrent =
    document.getElementById("nous-clock-current");

  const clock2030 =
    document.getElementById("nous-clock-2030");

  const clockApply =
    document.getElementById("nous-clock-apply");

  const previewLabel =
    document.getElementById("nous-clock-preview-label");

  const previewTime =
    document.getElementById("nous-clock-preview-time");

  const previewDate =
    document.getElementById("nous-clock-preview-date");

  const heroHours =
    document.querySelector("[data-clock-hours]");

  const heroMinutes =
    document.querySelector("[data-clock-minutes]");

  const heroSeconds =
    document.querySelector("[data-clock-seconds]");

  const heroDate =
    document.querySelector("[data-clock-date]");

  let clockMode = "live";
  let selectedDate = null;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function dateToInputValue(date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join("-");
  }

  function timeToInputValue(date) {
    return [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join(":");
  }

  function formatFullDate(date) {
    return new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(date);
  }

  function updateClockDisplay(date, label) {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const formattedDate = formatFullDate(date);

    if (heroHours) heroHours.textContent = hours;
    if (heroMinutes) heroMinutes.textContent = minutes;
    if (heroSeconds) heroSeconds.textContent = seconds;
    if (heroDate) {
      heroDate.textContent =
        formattedDate.toUpperCase();
    }

    if (previewTime) {
      previewTime.textContent =
        `${hours}:${minutes}:${seconds}`;
    }

    if (previewDate) {
      previewDate.textContent = formattedDate;
    }

    if (previewLabel) {
      previewLabel.textContent = label;
    }
  }

  function setInputsFromDate(date) {
    if (clockDateInput) {
      clockDateInput.value =
        dateToInputValue(date);
    }

    if (clockTimeInput) {
      clockTimeInput.value =
        timeToInputValue(date);
    }
  }

  function returnToCurrentTime() {
    clockMode = "live";
    selectedDate = null;

    const now = new Date();

    setInputsFromDate(now);
    updateClockDisplay(now, "Current local time");
  }

  function showJanuary2030() {
    clockMode = "selected";

    selectedDate =
      new Date(2030, 0, 1, 9, 0, 0);

    setInputsFromDate(selectedDate);

    updateClockDisplay(
      selectedDate,
      "Future planning view",
    );
  }

  function applySelectedTime() {
    if (
      !clockDateInput?.value ||
      !clockTimeInput?.value
    ) {
      return;
    }

    const timeParts =
      clockTimeInput.value.split(":");

    selectedDate = new Date(
      `${clockDateInput.value}T${
        timeParts.length === 2
          ? `${clockTimeInput.value}:00`
          : clockTimeInput.value
      }`,
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return;
    }

    clockMode = "selected";

    updateClockDisplay(
      selectedDate,
      "Selected planning time",
    );
  }

  clockOpen?.addEventListener("click", () => {
    const currentDate =
      clockMode === "selected" && selectedDate
        ? selectedDate
        : new Date();

    setInputsFromDate(currentDate);

    updateClockDisplay(
      currentDate,
      clockMode === "live"
        ? "Current local time"
        : "Selected planning time",
    );

    openOverlay(clockPanel);
  });

  clockBackdrop?.addEventListener(
    "click",
    () => closeOverlay(clockPanel),
  );

  clockClose?.addEventListener(
    "click",
    () => closeOverlay(clockPanel),
  );

  clockCurrent?.addEventListener(
    "click",
    returnToCurrentTime,
  );

  clock2030?.addEventListener(
    "click",
    showJanuary2030,
  );

  clockApply?.addEventListener(
    "click",
    applySelectedTime,
  );

  window.setInterval(() => {
    if (clockMode === "live") {
      updateClockDisplay(
        new Date(),
        "Current local time",
      );
    }
  }, 1000);

  returnToCurrentTime();

  /* =======================================================
     ESCAPE KEY
     ======================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeOverlay(searchPanel);
    closeOverlay(clockPanel);
  });
});