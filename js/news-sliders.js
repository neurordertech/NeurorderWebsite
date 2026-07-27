document.addEventListener("DOMContentLoaded", function () {
  const sliders = document.querySelectorAll(
    ".public-signal-button"
  );

  sliders.forEach(function (slider) {
    const handle = slider.querySelector(
      ".public-signal-button-icon"
    );

    if (!handle) {
      console.warn("Slider handle not found:", slider);
      return;
    }

    let dragging = false;
    let activePointerId = null;

    let startingPointerX = 0;
    let startingPosition = 0;

    let currentPosition = 0;
    let maximumPosition = 0;

    function calculateMaximumPosition() {
      const sliderStyle =
        window.getComputedStyle(slider);

      const leftPadding =
        parseFloat(sliderStyle.paddingLeft) || 0;

      const rightPadding =
        parseFloat(sliderStyle.paddingRight) || 0;

      maximumPosition = Math.max(
        0,
        slider.clientWidth -
          handle.offsetWidth -
          leftPadding -
          rightPadding
      );
    }

    function updatePosition(position, animate = false) {
      currentPosition = Math.max(
        0,
        Math.min(position, maximumPosition)
      );

      const ratio =
        maximumPosition > 0
          ? currentPosition / maximumPosition
          : 0;

      if (animate) {
        slider.classList.remove("is-dragging");
      }

      /*
       * Moves the complete blue circle,
       * including the arrow inside it.
       */
      handle.style.transform =
        `translateX(${currentPosition}px)`;

      slider.style.setProperty(
        "--slide-x",
        `${currentPosition}px`
      );

      slider.style.setProperty(
        "--slide-ratio",
        ratio.toFixed(3)
      );
    }

    function resetSlider() {
      dragging = false;
      activePointerId = null;

      slider.classList.remove(
        "is-dragging",
        "is-complete",
        "is-shaking"
      );

      updatePosition(0, true);
    }

    function openDestination() {
      const destination =
        slider.getAttribute("href");

      if (!destination || destination === "#") {
        resetSlider();
        return;
      }

      slider.classList.add("is-complete");

      updatePosition(maximumPosition, true);

      if (
        typeof navigator.vibrate === "function"
      ) {
        navigator.vibrate(25);
      }

      window.setTimeout(function () {
        window.location.href = destination;
      }, 250);
    }

    function beginDragging(event) {
      if (
        event.pointerType === "mouse" &&
        event.button !== 0
      ) {
        return;
      }

      calculateMaximumPosition();

      dragging = true;
      activePointerId = event.pointerId;

      startingPointerX = event.clientX;
      startingPosition = currentPosition;

      slider.classList.add("is-dragging");
      slider.classList.remove(
        "is-complete",
        "is-shaking"
      );

      slider.setPointerCapture(
        activePointerId
      );

      event.preventDefault();
    }

    function continueDragging(event) {
      if (
        !dragging ||
        event.pointerId !== activePointerId
      ) {
        return;
      }

      const distance =
        event.clientX - startingPointerX;

      updatePosition(
        startingPosition + distance
      );

      event.preventDefault();
    }

    function finishDragging(event) {
      if (
        !dragging ||
        event.pointerId !== activePointerId
      ) {
        return;
      }

      dragging = false;

      if (
        slider.hasPointerCapture(
          activePointerId
        )
      ) {
        slider.releasePointerCapture(
          activePointerId
        );
      }

      slider.classList.remove("is-dragging");

      const completion =
        maximumPosition > 0
          ? currentPosition / maximumPosition
          : 0;

      activePointerId = null;

      if (completion >= 0.72) {
        slider.classList.add("is-shaking");

        window.setTimeout(
          openDestination,
          100
        );
      } else {
        resetSlider();
      }
    }

    /*
     * Prevent normal clicking.
     * The page opens only after sliding.
     */
    slider.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
      }
    );

    slider.addEventListener(
      "dragstart",
      function (event) {
        event.preventDefault();
      }
    );

    slider.addEventListener(
      "pointerdown",
      beginDragging
    );

    slider.addEventListener(
      "pointermove",
      continueDragging
    );

    slider.addEventListener(
      "pointerup",
      finishDragging
    );

    slider.addEventListener(
      "pointercancel",
      finishDragging
    );

    slider.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }

        event.preventDefault();

        calculateMaximumPosition();
        openDestination();
      }
    );

    window.addEventListener(
      "resize",
      function () {
        calculateMaximumPosition();
        resetSlider();
      }
    );

    calculateMaximumPosition();
    resetSlider();
  });
});