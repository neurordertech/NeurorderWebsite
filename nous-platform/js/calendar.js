document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const LOCAL_KEY = "nous-calendar-events-v2";

    const colours = {
        personal: "#8fdfff",
        business: "#d6a04a",
        education: "#9a8cff"
    };

    const state = {
        selectedDate: dayStart(new Date()),
        currentDate: new Date(),
        view: "today",
        filter: "all",
        events: []
    };

    const $ = id => document.getElementById(id);

    const el = {
        dayPart: $("dayPart"),
        summary: $("summary"),
        period: $("periodLabel"),
        selected: $("selectedDate"),
        count: $("eventCount"),

        agenda: $("agenda"),
        weekStrip: $("weekStrip"),
        weekAgenda: $("weekAgenda"),
        monthGrid: $("monthGrid"),
        timeline: $("timeline"),
        upcoming: $("upcomingList"),

        prev: $("prev"),
        next: $("next"),
        today: $("today"),

        views:
            document.querySelectorAll(
                ".view[data-view]"
            ),

        filters:
            document.querySelectorAll(
                ".filter[data-category]"
            ),

        open: $("newEvent"),
        fab: $("fab"),

        backdrop: $("modal"),
        close: $("closeModal"),

        form: $("eventForm"),
        sheetTitle: $("sheetTitle"),

        id: $("eventId"),
        title: $("title"),
        date: $("date"),
        start: $("start"),
        end: $("end"),
        location: $("location"),
        description: $("notes"),

        del: $("deleteEvent"),

        ask: $("askNous"),
        planner: $("nousPlanner"),

        nousForm: $("nousForm"),
        nousInput: $("nousInput"),
        nousStatus: $("nousStatus"),
        nousResponse: $("nousResponse")
    };

    init();

    async function init() {
        setGreeting();
        bindEvents();
        await loadEvents();
        render();
    }

    function setGreeting() {
        if (!el.dayPart) {
            return;
        }

        const hour =
            new Date().getHours();

        el.dayPart.textContent =
            hour < 12
                ? "morning"
                : hour < 18
                    ? "afternoon"
                    : "evening";
    }

    function bindEvents() {
        el.prev?.addEventListener(
            "click",
            () => move(-1)
        );

        el.next?.addEventListener(
            "click",
            () => move(1)
        );

        el.today?.addEventListener(
            "click",
            () => {
                state.selectedDate =
                    dayStart(new Date());

                state.currentDate =
                    new Date();

                render();
            }
        );

        el.views.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    setView(
                        button.dataset.view
                    );
                }
            );
        });

        el.filters.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.filter =
                        button.dataset.category ||
                        "all";

                    el.filters.forEach(item => {
                        item.classList.toggle(
                            "active",
                            item === button
                        );

                        item.classList.toggle(
                            "is-active",
                            item === button
                        );
                    });

                    render();
                }
            );
        });

        [el.open, el.fab].forEach(button => {
            button?.addEventListener(
                "click",
                () => openSheet()
            );
        });

        el.close?.addEventListener(
            "click",
            closeSheet
        );

        el.backdrop?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    el.backdrop
                ) {
                    closeSheet();
                }
            }
        );

        el.form?.addEventListener(
            "submit",
            saveFromForm
        );

        el.del?.addEventListener(
            "click",
            deleteCurrent
        );

        el.ask?.addEventListener(
            "click",
            () => {
                el.planner?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                el.nousInput?.focus();
            }
        );

        el.nousForm?.addEventListener(
            "submit",
            askNous
        );

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Escape" &&
                    el.backdrop &&
                    !el.backdrop.hidden
                ) {
                    closeSheet();
                }
            }
        );
    }

    async function loadEvents() {
        try {
            const remote =
                await window.CalendarDB
                    ?.getEvents?.();

            if (Array.isArray(remote)) {
                state.events =
                    remote.map(
                        normaliseEvent
                    );

                return;
            }
        } catch (error) {
            console.warn(
                "Calendar database unavailable; using local storage.",
                error
            );
        }

        try {
            const stored =
                JSON.parse(
                    localStorage.getItem(
                        LOCAL_KEY
                    ) || "[]"
                );

            state.events =
                Array.isArray(stored)
                    ? stored.map(
                        normaliseEvent
                    )
                    : [];
        } catch (error) {
            console.warn(
                "Could not read local calendar events.",
                error
            );

            state.events = [];
        }
    }

    async function createEvent(event) {
        try {
            const remote =
                await window.CalendarDB
                    ?.createEvent?.(
                        event
                    );

            if (remote) {
                return normaliseEvent(
                    remote
                );
            }
        } catch (error) {
            console.error(
                "Could not save event to Supabase:",
                error
            );
        }

        const localEvent =
            normaliseEvent(event);

        const localEvents =
            readLocalEvents();

        localEvents.push(
            localEvent
        );

        writeLocalEvents(
            localEvents
        );

        return localEvent;
    }

    async function updateEvent(
        id,
        event
    ) {
        try {
            const remote =
                await window.CalendarDB
                    ?.updateEvent?.(
                        id,
                        event
                    );

            if (remote) {
                return normaliseEvent(
                    remote
                );
            }
        } catch (error) {
            console.error(
                "Could not update event in Supabase:",
                error
            );
        }

        const localEvents =
            readLocalEvents();

        const index =
            localEvents.findIndex(
                item => item.id === id
            );

        const updated =
            normaliseEvent({
                ...event,
                id
            });

        if (index >= 0) {
            localEvents[index] =
                updated;
        } else {
            localEvents.push(
                updated
            );
        }

        writeLocalEvents(
            localEvents
        );

        return updated;
    }

    async function removeEvent(id) {
        try {
            const removed =
                await window.CalendarDB
                    ?.deleteEvent?.(
                        id
                    );

            if (removed) {
                return true;
            }
        } catch (error) {
            console.error(
                "Could not delete event from Supabase:",
                error
            );
        }

        writeLocalEvents(
            readLocalEvents().filter(
                item => item.id !== id
            )
        );

        return true;
    }

    function readLocalEvents() {
        try {
            const stored =
                JSON.parse(
                    localStorage.getItem(
                        LOCAL_KEY
                    ) || "[]"
                );

            return Array.isArray(stored)
                ? stored.map(
                    normaliseEvent
                )
                : [];
        } catch {
            return [];
        }
    }

    function writeLocalEvents(events) {
        localStorage.setItem(
            LOCAL_KEY,
            JSON.stringify(events)
        );
    }

    function normaliseEvent(event) {
        return {
            id:
                event.id ||
                String(Date.now()),

            title:
                event.title ||
                "Untitled event",

            category:
                event.category ||
                "personal",

            startsAt:
                event.startsAt ||
                event.starts_at,

            endsAt:
                event.endsAt ||
                event.ends_at,

            location:
                event.location ||
                "",

            description:
                event.description ||
                "",

            allDay:
                Boolean(
                    event.allDay ??
                    event.all_day ??
                    false
                )
        };
    }

    function setView(view) {
        if (
            ![
                "today",
                "week",
                "month",
                "timeline"
            ].includes(view)
        ) {
            return;
        }

        state.view = view;

        const sections = {
            today: $("todayView"),
            week: $("weekView"),
            month: $("monthView"),
            timeline: $("timelineView")
        };

        Object.entries(
            sections
        ).forEach(
            ([name, section]) => {
                if (section) {
                    section.hidden =
                        name !== view;
                }
            }
        );

        el.views.forEach(button => {
            const active =
                button.dataset.view ===
                view;

            button.classList.toggle(
                "active",
                active
            );

            button.classList.toggle(
                "is-active",
                active
            );

            button.setAttribute(
                "aria-selected",
                String(active)
            );
        });

        render();
    }

    function move(direction) {
        if (state.view === "month") {
            state.currentDate =
                new Date(
                    state.currentDate
                        .getFullYear(),

                    state.currentDate
                        .getMonth() +
                        direction,

                    1
                );

            state.selectedDate =
                new Date(
                    state.currentDate
                );
        } else if (
            state.view === "week"
        ) {
            state.selectedDate =
                addDays(
                    state.selectedDate,
                    direction * 7
                );

            state.currentDate =
                new Date(
                    state.selectedDate
                );
        } else {
            state.selectedDate =
                addDays(
                    state.selectedDate,
                    direction
                );

            state.currentDate =
                new Date(
                    state.selectedDate
                );
        }

        render();
    }

    function filteredEvents() {
        return state.events.filter(
            event => {
                return (
                    state.filter ===
                        "all" ||
                    event.category ===
                        state.filter
                );
            }
        );
    }

    function eventsForDate(date) {
        return filteredEvents()
            .filter(event => {
                return (
                    event.startsAt &&
                    sameDay(
                        new Date(
                            event.startsAt
                        ),
                        date
                    )
                );
            })
            .sort(
                (first, second) => {
                    return (
                        new Date(
                            first.startsAt
                        ) -
                        new Date(
                            second.startsAt
                        )
                    );
                }
            );
    }

    function render() {
        renderPeriod();
        renderSummary();
        renderToday();
        renderWeek();
        renderMonth();
        renderTimeline();
        renderUpcoming();
    }

    function renderPeriod() {
        if (!el.period) {
            return;
        }

        if (
            state.view === "month"
        ) {
            el.period.textContent =
                state.currentDate
                    .toLocaleDateString(
                        "en-ZA",
                        {
                            month:
                                "long",

                            year:
                                "numeric"
                        }
                    );
        } else if (
            state.view === "week"
        ) {
            const start =
                weekStart(
                    state.selectedDate
                );

            const end =
                addDays(
                    start,
                    6
                );

            el.period.textContent =
                `${shortDate(start)} – ${shortDate(end)}`;
        } else {
            el.period.textContent =
                state.selectedDate
                    .toLocaleDateString(
                        "en-ZA",
                        {
                            weekday:
                                "long",

                            day:
                                "numeric",

                            month:
                                "long"
                        }
                    );
        }
    }

    function renderSummary() {
        if (!el.summary) {
            return;
        }

        const count =
            eventsForDate(
                new Date()
            ).length;

        el.summary.textContent =
            count
                ? `You have ${count} ${
                    count === 1
                        ? "event"
                        : "events"
                } today.`
                : "Your day is open.";
    }

    function renderToday() {
        const events =
            eventsForDate(
                state.selectedDate
            );

        if (el.selected) {
            el.selected.textContent =
                state.selectedDate
                    .toLocaleDateString(
                        "en-ZA",
                        {
                            weekday:
                                "long",

                            day:
                                "numeric",

                            month:
                                "long"
                        }
                    );
        }

        if (el.count) {
            el.count.textContent =
                `${events.length} ${
                    events.length === 1
                        ? "event"
                        : "events"
                }`;
        }

        if (!el.agenda) {
            return;
        }

        el.agenda.innerHTML =
            events.length
                ? events
                    .map(
                        renderCard
                    )
                    .join("")

                : renderEmpty(
                    "Your day is open.",
                    "Create an event or ask Nous to plan your time."
                );

        bindCards(
            el.agenda
        );
    }

    function renderWeek() {
        if (
            !el.weekStrip ||
            !el.weekAgenda
        ) {
            return;
        }

        const start =
            weekStart(
                state.selectedDate
            );

        el.weekStrip.innerHTML =
            Array.from(
                {
                    length: 7
                },

                (_, index) => {
                    const date =
                        addDays(
                            start,
                            index
                        );

                    const count =
                        eventsForDate(
                            date
                        ).length;

                    return `
                        <button
                            type="button"
                            class="
                                week-day

                                ${
                                    sameDay(
                                        date,
                                        state.selectedDate
                                    )
                                        ? "is-selected"
                                        : ""
                                }

                                ${
                                    sameDay(
                                        date,
                                        new Date()
                                    )
                                        ? "is-today"
                                        : ""
                                }
                            "
                            data-date="${date.toISOString()}"
                        >
                            <span>
                                ${
                                    date.toLocaleDateString(
                                        "en-ZA",
                                        {
                                            weekday:
                                                "short"
                                        }
                                    )
                                }
                            </span>

                            <strong>
                                ${date.getDate()}
                            </strong>

                            <small>
                                ${count}
                                ${
                                    count === 1
                                        ? "event"
                                        : "events"
                                }
                            </small>
                        </button>
                    `;
                }
            ).join("");

        el.weekStrip
            .querySelectorAll(
                "[data-date]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        state.selectedDate =
                            dayStart(
                                new Date(
                                    button.dataset.date
                                )
                            );

                        render();
                    }
                );
            });

        const events =
            eventsForDate(
                state.selectedDate
            );

        el.weekAgenda.innerHTML =
            events.length
                ? events
                    .map(
                        renderCard
                    )
                    .join("")

                : renderEmpty(
                    "No events on this day.",
                    "Choose another day or add one."
                );

        bindCards(
            el.weekAgenda
        );
    }

    function renderMonth() {
        if (!el.monthGrid) {
            return;
        }

        const first =
            new Date(
                state.currentDate
                    .getFullYear(),

                state.currentDate
                    .getMonth(),

                1
            );

        const start =
            weekStart(first);

        el.monthGrid.innerHTML =
            Array.from(
                {
                    length: 42
                },

                (_, index) => {
                    const date =
                        addDays(
                            start,
                            index
                        );

                    const events =
                        eventsForDate(
                            date
                        );

                    return `
                        <button
                            type="button"
                            class="
                                month-day

                                ${
                                    date.getMonth() !==
                                    state.currentDate.getMonth()
                                        ? "is-outside"
                                        : ""
                                }

                                ${
                                    sameDay(
                                        date,
                                        new Date()
                                    )
                                        ? "is-today"
                                        : ""
                                }

                                ${
                                    sameDay(
                                        date,
                                        state.selectedDate
                                    )
                                        ? "is-selected"
                                        : ""
                                }
                            "
                            data-date="${date.toISOString()}"
                        >
                            <span class="month-number">
                                ${date.getDate()}
                            </span>

                            <span class="month-dots">
                                ${
                                    events
                                        .slice(
                                            0,
                                            4
                                        )
                                        .map(
                                            event => `
                                                <i
                                                    class="month-dot"
                                                    style="
                                                        --dot:
                                                        ${
                                                            colours[
                                                                event.category
                                                            ] ||
                                                            colours.personal
                                                        }
                                                    "
                                                ></i>
                                            `
                                        )
                                        .join("")
                                }
                            </span>
                        </button>
                    `;
                }
            ).join("");

        el.monthGrid
            .querySelectorAll(
                "[data-date]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        state.selectedDate =
                            dayStart(
                                new Date(
                                    button.dataset.date
                                )
                            );

                        state.currentDate =
                            new Date(
                                state.selectedDate
                            );

                        setView(
                            "today"
                        );
                    }
                );
            });
    }

    function renderTimeline() {
        if (!el.timeline) {
            return;
        }

        const events =
            filteredEvents()
                .filter(event => {
                    return (
                        event.endsAt &&
                        new Date(
                            event.endsAt
                        ) >=
                        dayStart(
                            new Date()
                        )
                    );
                })
                .sort(
                    (first, second) => {
                        return (
                            new Date(
                                first.startsAt
                            ) -
                            new Date(
                                second.startsAt
                            )
                        );
                    }
                );

        if (!events.length) {
            el.timeline.innerHTML =
                renderEmpty(
                    "Your timeline is empty.",
                    "Future events will appear here."
                );

            return;
        }

        const groups = {};

        events.forEach(event => {
            const key =
                inputDate(
                    new Date(
                        event.startsAt
                    )
                );

            (
                groups[key] ??= []
            ).push(event);
        });

        el.timeline.innerHTML =
            Object.entries(groups)
                .map(
                    ([key, items]) => `
                        <section class="timeline-group">

                            <h3>
                                ${
                                    new Date(
                                        `${key}T00:00:00`
                                    ).toLocaleDateString(
                                        "en-ZA",
                                        {
                                            weekday:
                                                "long",

                                            day:
                                                "numeric",

                                            month:
                                                "long"
                                        }
                                    )
                                }
                            </h3>

                            ${
                                items
                                    .map(
                                        renderCard
                                    )
                                    .join("")
                            }

                        </section>
                    `
                )
                .join("");

        bindCards(
            el.timeline
        );
    }

    function renderUpcoming() {
        if (!el.upcoming) {
            return;
        }

        const events =
            filteredEvents()
                .filter(event => {
                    return (
                        event.startsAt &&
                        new Date(
                            event.startsAt
                        ) >
                        new Date()
                    );
                })
                .sort(
                    (first, second) => {
                        return (
                            new Date(
                                first.startsAt
                            ) -
                            new Date(
                                second.startsAt
                            )
                        );
                    }
                )
                .slice(
                    0,
                    3
                );

        if (!events.length) {
            el.upcoming.innerHTML =
                renderEmpty(
                    "Nothing upcoming.",
                    "Your next events will appear here."
                );

            return;
        }

        el.upcoming.innerHTML =
            events
                .map(event => {
                    const start =
                        new Date(
                            event.startsAt
                        );

                    return `
                        <article
                            class="upcoming-card"
                            data-id="${event.id}"
                            tabindex="0"
                        >
                            <span>
                                ${
                                    start
                                        .toLocaleDateString(
                                            "en-ZA",
                                            {
                                                weekday:
                                                    "short",

                                                day:
                                                    "numeric",

                                                month:
                                                    "short"
                                            }
                                        )
                                        .toUpperCase()
                                }
                            </span>

                            <h3>
                                ${escapeHtml(event.title)}
                            </h3>

                            <p>
                                ${formatTime(start)}

                                ${
                                    event.location
                                        ? ` • ${escapeHtml(event.location)}`
                                        : ""
                                }
                            </p>
                        </article>
                    `;
                })
                .join("");

        bindCards(
            el.upcoming
        );
    }

    function renderCard(event) {
        const start =
            new Date(
                event.startsAt
            );

        const end =
            new Date(
                event.endsAt
            );

        return `
            <article
                class="event-card"
                style="
                    --accent:
                    ${
                        colours[
                            event.category
                        ] ||
                        colours.personal
                    }
                "
                data-id="${event.id}"
                tabindex="0"
            >
                <div class="event-time">
                    ${formatTime(start)}

                    <small>
                        ${formatTime(end)}
                    </small>
                </div>

                <div class="event-copy">
                    <strong>
                        ${escapeHtml(event.title)}
                    </strong>

                    ${
                        event.location
                            ? `
                                <span>
                                    ${escapeHtml(event.location)}
                                </span>
                            `
                            : ""
                    }

                    ${
                        event.description
                            ? `
                                <small>
                                    ${escapeHtml(event.description)}
                                </small>
                            `
                            : ""
                    }
                </div>

                <span class="event-badge">
                    ${escapeHtml(event.category)}
                </span>
            </article>
        `;
    }

    function renderEmpty(
        title,
        message
    ) {
        return `
            <div class="empty-state">
                <div>
                    <strong>
                        ${escapeHtml(title)}
                    </strong>

                    <p>
                        ${escapeHtml(message)}
                    </p>
                </div>
            </div>
        `;
    }

    function bindCards(root) {
        if (!root) {
            return;
        }

        root
            .querySelectorAll(
                "[data-id]"
            )
            .forEach(card => {
                const open = () => {
                    const event =
                        state.events.find(
                            item =>
                                item.id ===
                                card.dataset.id
                        );

                    if (event) {
                        openSheet(event);
                    }
                };

                card.addEventListener(
                    "click",
                    open
                );

                card.addEventListener(
                    "keydown",
                    event => {
                        if (
                            event.key ===
                                "Enter" ||
                            event.key ===
                                " "
                        ) {
                            event.preventDefault();
                            open();
                        }
                    }
                );
            });
    }

    function openSheet(
        event = null
    ) {
        if (
            !el.form ||
            !el.backdrop
        ) {
            return;
        }

        el.form.reset();

        const base =
            event
                ? new Date(
                    event.startsAt
                )
                : state.selectedDate;

        if (el.sheetTitle) {
            el.sheetTitle.textContent =
                event
                    ? "Edit event"
                    : "New event";
        }

        if (el.id) {
            el.id.value =
                event?.id ||
                "";
        }

        if (el.title) {
            el.title.value =
                event?.title ||
                "";
        }

        if (el.date) {
            el.date.value =
                inputDate(base);
        }

        if (el.start) {
            el.start.value =
                event
                    ? inputTime(
                        new Date(
                            event.startsAt
                        )
                    )
                    : "09:00";
        }

        if (el.end) {
            el.end.value =
                event
                    ? inputTime(
                        new Date(
                            event.endsAt
                        )
                    )
                    : "10:00";
        }

        if (el.location) {
            el.location.value =
                event?.location ||
                "";
        }

        if (el.description) {
            el.description.value =
                event?.description ||
                "";
        }

        if (el.del) {
            el.del.hidden =
                !event;
        }

        const categoryValue =
            event?.category ||
            "personal";

        const radio =
            el.form.querySelector(
                `input[name="category"][value="${categoryValue}"]`
            );

        if (radio) {
            radio.checked = true;
        }

        el.backdrop.hidden = false;

        window.setTimeout(
            () => {
                el.title?.focus();
            },
            80
        );
    }

    function closeSheet() {
        if (el.backdrop) {
            el.backdrop.hidden = true;
        }
    }

    async function saveFromForm(event) {
        event.preventDefault();

        const title =
            el.title?.value.trim();

        const date =
            el.date?.value;

        const start =
            el.start?.value;

        const end =
            el.end?.value;

        if (
            !title ||
            !date ||
            !start ||
            !end
        ) {
            return;
        }

        const startsAt =
            new Date(
                `${date}T${start}:00`
            );

        const endsAt =
            new Date(
                `${date}T${end}:00`
            );

        if (
            endsAt <= startsAt
        ) {
            window.alert(
                "The end time must be after the start time."
            );

            return;
        }

        const id =
            el.id?.value ||
            (
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : String(
                        Date.now()
                    )
            );

        const payload = {
            id,

            title,

            category:
                el.form.querySelector(
                    'input[name="category"]:checked'
                )?.value ||
                "personal",

            startsAt:
                startsAt.toISOString(),

            endsAt:
                endsAt.toISOString(),

            location:
                el.location
                    ?.value
                    .trim() ||
                "",

            description:
                el.description
                    ?.value
                    .trim() ||
                "",

            allDay:
                false
        };

        const existingIndex =
            state.events.findIndex(
                item =>
                    item.id === id
            );

        const saved =
            existingIndex >= 0
                ? await updateEvent(
                    id,
                    payload
                )
                : await createEvent(
                    payload
                );

        if (
            existingIndex >= 0
        ) {
            state.events[
                existingIndex
            ] = saved;
        } else {
            state.events.push(
                saved
            );
        }

        state.selectedDate =
            dayStart(
                startsAt
            );

        state.currentDate =
            new Date(
                startsAt
            );

        closeSheet();
        render();
    }

    async function deleteCurrent() {
        const id =
            el.id?.value;

        if (
            !id ||
            !window.confirm(
                "Delete this event?"
            )
        ) {
            return;
        }

        await removeEvent(id);

        state.events =
            state.events.filter(
                item =>
                    item.id !== id
            );

        closeSheet();
        render();
    }

    async function askNous(event) {
        event.preventDefault();

        const prompt =
            el.nousInput
                ?.value
                .trim();

        if (!prompt) {
            if (el.nousStatus) {
                el.nousStatus.textContent =
                    "Enter a request first";
            }

            return;
        }

        if (!window.Nous) {
            if (el.nousStatus) {
                el.nousStatus.textContent =
                    "Nous Core unavailable";
            }

            return;
        }

        if (el.nousStatus) {
            el.nousStatus.textContent =
                "Connecting to Nous...";
        }

        if (el.nousResponse) {
            el.nousResponse.hidden =
                true;
        }

        try {
            const context =
                filteredEvents()
                    .filter(item => {
                        return (
                            item.endsAt &&
                            new Date(
                                item.endsAt
                            ) >=
                            dayStart(
                                new Date()
                            )
                        );
                    })
                    .slice(
                        0,
                        15
                    )
                    .map(item => {
                        return {
                            title:
                                item.title,

                            category:
                                item.category,

                            startsAt:
                                item.startsAt,

                            endsAt:
                                item.endsAt,

                            location:
                                item.location
                        };
                    });

            const result =
                await window.Nous.ask(
                    "calendar",

                    `${prompt}

Current calendar context:
${JSON.stringify(context, null, 2)}

Give a proposal only. Do not claim any event was created, moved or deleted.`
                );

            if (!result?.success) {
                throw new Error(
                    result?.error ||
                    "Nous could not prepare a proposal."
                );
            }

            if (el.nousStatus) {
                el.nousStatus.textContent =
                    "Proposal ready";
            }

            if (el.nousResponse) {
                el.nousResponse.textContent =
                    result.reply;

                el.nousResponse.hidden =
                    false;
            }
        } catch (error) {
            console.error(
                "Calendar Nous error:",
                error
            );

            if (el.nousStatus) {
                el.nousStatus.textContent =
                    "Connection issue";
            }

            if (el.nousResponse) {
                el.nousResponse.textContent =
                    error instanceof Error
                        ? error.message
                        : "Unable to connect to Nous.";

                el.nousResponse.hidden =
                    false;
            }
        }
    }

    function dayStart(date) {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    }

    function addDays(
        date,
        days
    ) {
        const result =
            new Date(date);

        result.setDate(
            result.getDate() +
            days
        );

        return result;
    }

    function weekStart(date) {
        const result =
            dayStart(date);

        const day =
            result.getDay();

        result.setDate(
            result.getDate() -
            (
                day === 0
                    ? 6
                    : day - 1
            )
        );

        return result;
    }

    function sameDay(
        first,
        second
    ) {
        return (
            first.getFullYear() ===
                second.getFullYear() &&

            first.getMonth() ===
                second.getMonth() &&

            first.getDate() ===
                second.getDate()
        );
    }

    function formatTime(date) {
        return date.toLocaleTimeString(
            "en-ZA",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false
            }
        );
    }

    function inputTime(date) {
        return (
            `${String(
                date.getHours()
            ).padStart(2, "0")}:` +

            `${String(
                date.getMinutes()
            ).padStart(2, "0")}`
        );
    }

    function inputDate(date) {
        return (
            `${date.getFullYear()}-` +

            `${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-` +

            `${String(
                date.getDate()
            ).padStart(2, "0")}`
        );
    }

    function shortDate(date) {
        return date.toLocaleDateString(
            "en-ZA",
            {
                day:
                    "numeric",

                month:
                    "short"
            }
        );
    }

    function escapeHtml(value) {
        const node =
            document.createElement(
                "div"
            );

        node.textContent =
            String(value ?? "");

        return node.innerHTML;
    }
});