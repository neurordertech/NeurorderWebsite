document.addEventListener(
    "DOMContentLoaded",
    () => {

        const careerSelect =
            document.getElementById(
                "businessCareerSelect"
            );

        const carousel =
            document.getElementById(
                "businessTrendCarousel"
            );

        const viewport =
            document.getElementById(
                "businessTrendViewport"
            );

        const track =
            document.getElementById(
                "businessTrendTrack"
            );

        const dotsContainer =
            document.getElementById(
                "businessTrendDots"
            );

        const previousButton =
            document.getElementById(
                "businessTrendPrevious"
            );

        const nextButton =
            document.getElementById(
                "businessTrendNext"
            );

        if (
            !careerSelect ||
            !carousel ||
            !viewport ||
            !track ||
            !dotsContainer
        ) {
            return;
        }

        const trendData = {

            technology: [
                {
                    category:
                        "Future signal",

                    title:
                        "AI is becoming operational infrastructure.",

                    description:
                        "The strongest technology organisations are moving beyond experimentation and embedding intelligence into research, planning, communication and customer workflows.",

                    action:
                        "Explore the signal",

                    secondary:
                        "Ask Nous",

                    tool:
                        "Nous Companion"
                },

                {
                    category:
                        "Digital advantage",

                    title:
                        "Connected workflows will outperform disconnected tools.",

                    description:
                        "Documents, communication, calendars and intelligence become more valuable when they operate as one coordinated working environment.",

                    action:
                        "Review your workflow",

                    secondary:
                        "View tools",

                    tool:
                        "Workspace integration"
                },

                {
                    category:
                        "Opportunity",

                    title:
                        "Technical visibility creates serious partnerships.",

                    description:
                        "Publishing credible research, prototypes and development progress helps organisations attract collaborators, institutions and early adopters.",

                    action:
                        "Prepare an update",

                    secondary:
                        "Find opportunities",

                    tool:
                        "LinkedIn and industry events"
                }
            ],

            finance: [
                {
                    category:
                        "Future signal",

                    title:
                        "Financial intelligence is becoming deeply personalised.",

                    description:
                        "Organisations are investing in clearer explanations, real-time indicators and responsible financial decision support.",

                    action:
                        "Explore the signal",

                    secondary:
                        "Ask Nous",

                    tool:
                        "Financial intelligence"
                },

                {
                    category:
                        "Digital advantage",

                    title:
                        "Automation is changing routine financial administration.",

                    description:
                        "Reporting, reconciliation, document preparation and internal reviews can increasingly be supported by structured digital workflows.",

                    action:
                        "Review your systems",

                    secondary:
                        "View tools",

                    tool:
                        "Excel, analytics and Nous"
                },

                {
                    category:
                        "Opportunity",

                    title:
                        "Regulation and responsible innovation create demand.",

                    description:
                        "Professionals who understand both digital systems and regulatory responsibility will become increasingly valuable.",

                    action:
                        "Track developments",

                    secondary:
                        "Find events",

                    tool:
                        "Professional networks"
                }
            ],

            education: [
                {
                    category:
                        "Future signal",

                    title:
                        "Education is moving toward adaptive support.",

                    description:
                        "Learners and educators increasingly expect explanations, practice and resources that adjust to different needs.",

                    action:
                        "Explore adaptive learning",

                    secondary:
                        "Ask Nous",

                    tool:
                        "Nous Education"
                },

                {
                    category:
                        "Digital advantage",

                    title:
                        "Teaching platforms must connect learning and insight.",

                    description:
                        "Educators need learning materials, communication, assessment and progress information in one environment.",

                    action:
                        "Review the journey",

                    secondary:
                        "View tools",

                    tool:
                        "Classroom platform"
                },

                {
                    category:
                        "Opportunity",

                    title:
                        "Digital teaching skills are becoming career assets.",

                    description:
                        "Educators who understand AI, online engagement and responsible assessment will have wider opportunities.",

                    action:
                        "Build your skills",

                    secondary:
                        "Find events",

                    tool:
                        "Professional development"
                }
            ],

            entrepreneurship: [
                {
                    category:
                        "Future signal",

                    title:
                        "Small teams can now operate with greater intelligence.",

                    description:
                        "AI and connected platforms allow early-stage companies to research, communicate and organise with fewer resources.",

                    action:
                        "Explore the signal",

                    secondary:
                        "Ask Nous",

                    tool:
                        "Nous Business"
                },

                {
                    category:
                        "Digital advantage",

                    title:
                        "Operational discipline distinguishes serious ventures.",

                    description:
                        "Clear governance, controlled documents and measurable priorities make young companies more credible.",

                    action:
                        "Review operations",

                    secondary:
                        "Open dashboard",

                    tool:
                        "Business workspace"
                },

                {
                    category:
                        "Opportunity",

                    title:
                        "Founders must be visible in the right rooms.",

                    description:
                        "Industry programmes, accelerators and focused partnerships can create access that online activity alone cannot.",

                    action:
                        "Find opportunities",

                    secondary:
                        "Prepare outreach",

                    tool:
                        "Professional networks"
                }
            ]
        };

        trendData.marketing =
            trendData.entrepreneurship;

        trendData.engineering =
            trendData.technology;

        trendData.healthcare =
            trendData.education;

        trendData["public-sector"] =
            trendData.finance;

        let currentIndex = 0;
        let autoplayTimer = null;

        let pointerStartX = 0;
        let pointerCurrentX = 0;
        let isDragging = false;

        function escapeHtml(value) {
            const element =
                document.createElement("div");

            element.textContent =
                String(value);

            return element.innerHTML;
        }

        function getSlideBackground(industry, index) {
            const backgrounds = {
                technology: [
                    "radial-gradient(circle at 78% 24%, rgba(59, 174, 255, .42), transparent 26%), linear-gradient(135deg, #07121f 0%, #102d43 48%, #02050a 100%)",
                    "radial-gradient(circle at 22% 18%, rgba(122, 215, 255, .30), transparent 28%), linear-gradient(135deg, #071017 0%, #143445 52%, #04080d 100%)",
                    "radial-gradient(circle at 75% 22%, rgba(132, 111, 255, .34), transparent 28%), linear-gradient(135deg, #090b17 0%, #20234b 52%, #03050b 100%)"
                ],
                finance: [
                    "radial-gradient(circle at 80% 20%, rgba(214, 160, 74, .38), transparent 28%), linear-gradient(135deg, #151006 0%, #493416 52%, #050402 100%)",
                    "radial-gradient(circle at 18% 20%, rgba(137, 220, 195, .27), transparent 27%), linear-gradient(135deg, #061310 0%, #17473a 52%, #020706 100%)",
                    "radial-gradient(circle at 78% 18%, rgba(255, 197, 104, .28), transparent 26%), linear-gradient(135deg, #161006 0%, #3c2a13 52%, #050301 100%)"
                ],
                education: [
                    "radial-gradient(circle at 80% 20%, rgba(154, 140, 255, .42), transparent 28%), linear-gradient(135deg, #0c0a1c 0%, #322b68 52%, #04030a 100%)",
                    "radial-gradient(circle at 20% 18%, rgba(92, 189, 255, .34), transparent 27%), linear-gradient(135deg, #07101d 0%, #1b4264 52%, #02050a 100%)",
                    "radial-gradient(circle at 76% 22%, rgba(238, 142, 255, .26), transparent 27%), linear-gradient(135deg, #130819 0%, #492251 52%, #050207 100%)"
                ],
                entrepreneurship: [
                    "radial-gradient(circle at 78% 20%, rgba(143, 223, 255, .34), transparent 28%), linear-gradient(135deg, #07101a 0%, #183b50 52%, #02050a 100%)",
                    "radial-gradient(circle at 20% 20%, rgba(214, 160, 74, .31), transparent 28%), linear-gradient(135deg, #130f07 0%, #3e3018 52%, #050402 100%)",
                    "radial-gradient(circle at 76% 20%, rgba(119, 156, 255, .32), transparent 27%), linear-gradient(135deg, #080d1b 0%, #26365f 52%, #02040a 100%)"
                ]
            };

            const resolvedIndustry =
                industry === "marketing"
                    ? "entrepreneurship"
                    : industry === "engineering"
                        ? "technology"
                        : industry === "healthcare"
                            ? "education"
                            : industry === "public-sector"
                                ? "finance"
                                : industry;

            const set = backgrounds[resolvedIndustry] || backgrounds.technology;
            return set[index % set.length];
        }

        function renderSlides() {
            const selectedIndustry =
                careerSelect.value;

            const slides =
                trendData[selectedIndustry] ||
                trendData.technology;

            track.innerHTML =
                slides
                    .map(
                        (slide, index) => `
                            <article
                                class="business-cinematic-slide"
                                data-slide-index="${index}"
                            >

                                <div
                                    class="business-cinematic-background"
                                    style="background: ${getSlideBackground(selectedIndustry, index)};"
                                ></div>

                                <div class="business-cinematic-content">

                                    <div class="business-cinematic-topline">

                                        <span class="business-cinematic-category">
                                            ${escapeHtml(slide.category)}
                                        </span>

                                        <span class="business-cinematic-index">
                                            0${index + 1} / 03
                                        </span>

                                    </div>

                                    <div class="business-cinematic-copy">

                                        <h3>
                                            ${escapeHtml(slide.title)}
                                        </h3>

                                        <p class="business-cinematic-description">
                                            ${escapeHtml(slide.description)}
                                        </p>

                                        <div class="business-cinematic-tool">

                                            <span>
                                                Recommended
                                            </span>

                                            <span>
                                                ${escapeHtml(slide.tool)}
                                            </span>

                                        </div>

                                        <div class="business-cinematic-actions">

                                            <button
                                                type="button"
                                                class="
                                                    business-cinematic-button
                                                    business-cinematic-button-primary
                                                "
                                                data-trend-action="primary"
                                            >
                                                ${escapeHtml(slide.action)}

                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                class="
                                                    business-cinematic-button
                                                    business-cinematic-button-secondary
                                                "
                                                data-trend-action="secondary"
                                            >
                                                ${escapeHtml(slide.secondary)}
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </article>
                        `
                    )
                    .join("");

            dotsContainer.innerHTML =
                slides
                    .map(
                        (_, index) => `
                            <button
                                type="button"
                                class="business-carousel-dot"
                                data-dot-index="${index}"
                                aria-label="Open business intelligence slide ${index + 1}"
                            ></button>
                        `
                    )
                    .join("");

            dotsContainer
                .querySelectorAll(
                    ".business-carousel-dot"
                )
                .forEach(dot => {

                    dot.addEventListener(
                        "click",
                        () => {

                            showSlide(
                                Number(
                                    dot.dataset.dotIndex
                                )
                            );

                            restartAutoplay();

                        }
                    );

                });

            track
                .querySelectorAll(
                    ".business-cinematic-slide"
                )
                .forEach((slide, index) => {

                    slide.addEventListener(
                        "click",
                        event => {

                            if (
                                event.target.closest(
                                    "button"
                                )
                            ) {
                                return;
                            }

                            if (
                                index !==
                                currentIndex
                            ) {
                                showSlide(index);
                                restartAutoplay();
                            }

                        }
                    );

                });

            currentIndex = 0;

            requestAnimationFrame(
                () => {
                    showSlide(0, false);
                }
            );
        }

        function getSlideOffset(index) {
            const slides =
                Array.from(
                    track.children
                );

            const slide =
                slides[index];

            if (!slide) {
                return 0;
            }

            const viewportWidth =
                viewport.clientWidth;

            return (
                slide.offsetLeft +
                slide.offsetWidth / 2 -
                viewportWidth / 2
            );
        }

        function showSlide(
            index,
            animate = true
        ) {
            const slides =
                Array.from(
                    track.children
                );

            if (!slides.length) {
                return;
            }

            currentIndex =
                (
                    index +
                    slides.length
                ) %
                slides.length;

            track.style.transition =
                animate
                    ? ""
                    : "none";

            const offset =
                getSlideOffset(
                    currentIndex
                );

            track.style.transform =
                `translateX(${-offset}px)`;

            slides.forEach(
                (slide, slideIndex) => {

                    slide.classList.toggle(
                        "is-active",
                        slideIndex === currentIndex
                    );

                    slide.setAttribute(
                        "aria-hidden",
                        String(
                            slideIndex !==
                            currentIndex
                        )
                    );

                }
            );

            dotsContainer
                .querySelectorAll(
                    ".business-carousel-dot"
                )
                .forEach(
                    (dot, dotIndex) => {

                        dot.classList.toggle(
                            "is-active",
                            dotIndex === currentIndex
                        );

                    }
                );

            if (!animate) {
                requestAnimationFrame(
                    () => {
                        track.style.transition =
                            "";
                    }
                );
            }
        }

        function nextSlide() {
            showSlide(
                currentIndex + 1
            );
        }

        function previousSlide() {
            showSlide(
                currentIndex - 1
            );
        }

        function restartAutoplay() {
            window.clearInterval(
                autoplayTimer
            );

            autoplayTimer =
                window.setInterval(
                    nextSlide,
                    8000
                );
        }

        previousButton
            ?.addEventListener(
                "click",
                () => {

                    previousSlide();
                    restartAutoplay();

                }
            );

        nextButton
            ?.addEventListener(
                "click",
                () => {

                    nextSlide();
                    restartAutoplay();

                }
            );

        careerSelect.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "nous-business-career",
                    careerSelect.value
                );

                renderSlides();
                restartAutoplay();

            }
        );

        viewport.addEventListener(
            "pointerdown",
            event => {

                isDragging = true;

                pointerStartX =
                    event.clientX;

                pointerCurrentX =
                    pointerStartX;

                viewport.classList.add(
                    "is-dragging"
                );

                viewport.setPointerCapture(
                    event.pointerId
                );

                window.clearInterval(
                    autoplayTimer
                );

            }
        );

        viewport.addEventListener(
            "pointermove",
            event => {

                if (!isDragging) {
                    return;
                }

                pointerCurrentX =
                    event.clientX;

            }
        );

        viewport.addEventListener(
            "pointerup",
            event => {

                if (!isDragging) {
                    return;
                }

                isDragging = false;

                viewport.classList.remove(
                    "is-dragging"
                );

                const movement =
                    pointerCurrentX -
                    pointerStartX;

                if (movement < -55) {
                    nextSlide();
                } else if (movement > 55) {
                    previousSlide();
                } else {
                    showSlide(
                        currentIndex
                    );
                }

                restartAutoplay();

                try {
                    viewport.releasePointerCapture(
                        event.pointerId
                    );
                } catch {
                    // Pointer capture may already be released.
                }

            }
        );

        viewport.addEventListener(
            "pointercancel",
            () => {

                isDragging = false;

                viewport.classList.remove(
                    "is-dragging"
                );

                showSlide(
                    currentIndex
                );

                restartAutoplay();

            }
        );

        carousel.addEventListener(
            "mouseenter",
            () => {
                window.clearInterval(
                    autoplayTimer
                );
            }
        );

        carousel.addEventListener(
            "mouseleave",
            restartAutoplay
        );

        window.addEventListener(
            "resize",
            () => {

                showSlide(
                    currentIndex,
                    false
                );

            }
        );

        const savedIndustry =
            localStorage.getItem(
                "nous-business-career"
            );

        if (
            savedIndustry &&
            careerSelect.querySelector(
                `option[value="${savedIndustry}"]`
            )
        ) {
            careerSelect.value =
                savedIndustry;
        }

        renderSlides();
        restartAutoplay();

    }
);