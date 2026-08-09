class NousPrecisionClock {
  constructor(element) {
    this.element = element;

    this.hoursElement =
      element.querySelector("[data-clock-hours]");

    this.minutesElement =
      element.querySelector("[data-clock-minutes]");

    this.secondsElement =
      element.querySelector("[data-clock-seconds]");

    this.dateElement =
      element.querySelector("[data-clock-date]");

    this.zoneElement =
      element.querySelector("[data-clock-zone]");

    this.timer = null;
  }

  formatNumber(value) {
    return String(value).padStart(2, "0");
  }

  formatDate(date) {
    return new Intl.DateTimeFormat("en-ZA", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
      .format(date)
      .toUpperCase();
  }

  formatTimeZone(date) {
    const parts = new Intl.DateTimeFormat("en-ZA", {
      timeZoneName: "short",
    }).formatToParts(date);

    const zonePart = parts.find(
      (part) => part.type === "timeZoneName",
    );

    return zonePart?.value || "LOCAL TIME";
  }

  update() {
    const now = new Date();

    if (this.hoursElement) {
      this.hoursElement.textContent =
        this.formatNumber(now.getHours());
    }

    if (this.minutesElement) {
      this.minutesElement.textContent =
        this.formatNumber(now.getMinutes());
    }

    if (this.secondsElement) {
      this.secondsElement.textContent =
        this.formatNumber(now.getSeconds());

      this.secondsElement.classList.remove(
        "is-changing",
      );

      requestAnimationFrame(() => {
        this.secondsElement?.classList.add(
          "is-changing",
        );
      });
    }

    if (this.dateElement) {
      this.dateElement.textContent =
        this.formatDate(now);
    }

    if (this.zoneElement) {
      this.zoneElement.textContent =
        this.formatTimeZone(now);
    }
  }

  start() {
    this.update();

    const millisecondsUntilNextSecond =
      1000 - new Date().getMilliseconds();

    window.setTimeout(() => {
      this.update();

      this.timer = window.setInterval(
        () => this.update(),
        1000,
      );
    }, millisecondsUntilNextSecond);
  }

  stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const clocks = document.querySelectorAll(
    "[data-nous-clock]",
  );

  clocks.forEach((clockElement) => {
    const clock =
      new NousPrecisionClock(clockElement);

    clock.start();
  });
});