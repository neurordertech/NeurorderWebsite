/**
 * =========================================================
 * NOUS CALENDAR
 * Universal Calendar Interface
 * =========================================================
 *
 * Timezone:
 * Africa/Johannesburg
 *
 * Responsibilities:
 * - Live South African date/time
 * - Zodiac calendar identity
 * - Day / Week / Month / Year views
 * - Date selection
 * - Universal NOUS calendar events
 * - Supabase event persistence
 * - Event creation
 * - Event selection
 * - Event deletion
 *
 * Universal event source:
 * public.calendar_events
 *
 * =========================================================
 */

console.log(
  "[NOUS FILE] app/js/calendar.js loaded"
);

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    "use strict";

    /* ======================================================
       CONSTANTS
    ====================================================== */

    const TIMEZONE =
      "Africa/Johannesburg";

    const DEFAULT_START_TIME =
      "09:00";

    const DEFAULT_END_TIME =
      "10:00";


    /* ======================================================
       PERIOD ENGINE CHECK
    ====================================================== */

    if (!window.NOUS_CALENDAR) {
      console.warn(
        "[NOUS CALENDAR] Zodiac period engine is unavailable."
      );
    }


    /* ======================================================
       APPLICATION STATE
    ====================================================== */

    const state = {
      view:
        "month",

      activeDate:
        new Date(),

      selectedDate:
        null,

      selectedEvent:
        null,

      events:
        [],

      loadingEvents:
        false,

      deletingEvent:
        false
    };


    /* ======================================================
       DOM ELEMENTS
    ====================================================== */

    const elements = {

      icon:
        document.getElementById(
          "nous-calendar-icon"
        ),

      periodSummary:
        document.getElementById(
          "calendar-period-summary"
        ),

      liveDate:
        document.getElementById(
          "calendar-live-date"
        ),

      liveTime:
        document.getElementById(
          "calendar-live-time"
        ),

      viewTitle:
        document.getElementById(
          "calendar-view-title"
        ),

      selectedDate:
        document.getElementById(
          "calendar-selected-date"
        ),

      viewport:
        document.getElementById(
          "calendar-viewport"
        ),

      previous:
        document.getElementById(
          "calendar-previous"
        ),

      today:
        document.getElementById(
          "calendar-today"
        ),

      next:
        document.getElementById(
          "calendar-next"
        ),

      contextPanel:
        document.getElementById(
          "calendar-context-panel"
        ),

      contextTitle:
        document.getElementById(
          "calendar-context-title"
        ),

      contextCopy:
        document.getElementById(
          "calendar-context-copy"
        ),

      create:
        document.getElementById(
          "calendar-create"
        ),

      createModal:
        document.getElementById(
          "calendar-create-modal"
        ),

      createBackdrop:
        document.getElementById(
          "calendar-create-backdrop"
        ),

      createClose:
        document.getElementById(
          "calendar-create-close"
        ),

      eventForm:
        document.getElementById(
          "calendar-event-form"
        ),

      eventTitle:
        document.getElementById(
          "calendar-event-title"
        ),

      eventDate:
        document.getElementById(
          "calendar-event-date"
        ),

      eventStart:
        document.getElementById(
          "calendar-event-start"
        ),

      eventEnd:
        document.getElementById(
          "calendar-event-end"
        ),

      eventAllDay:
        document.getElementById(
          "calendar-event-all-day"
        ),

      eventLocation:
        document.getElementById(
          "calendar-event-location"
        ),

      eventDescription:
        document.getElementById(
          "calendar-event-description"
        ),

      eventType:
        document.getElementById(
          "calendar-event-type"
        ),

      eventSource:
        document.getElementById(
          "calendar-event-source"
        ),

      eventNotice:
        document.getElementById(
          "calendar-event-notice"
        ),

      eventCancel:
        document.getElementById(
          "calendar-event-cancel"
        ),

      eventSave:
        document.getElementById(
          "calendar-event-save"
        ),

      deleteEvent:
        null
    };


    /* ======================================================
       CREATE DELETE BUTTON AUTOMATICALLY
    ====================================================== */

    function createDeleteButton() {
      if (
        !elements.contextPanel
      ) {
        return;
      }

      let button =
        document.getElementById(
          "calendar-delete-event"
        );

      if (!button) {
        button =
          document.createElement(
            "button"
          );

        button.id =
          "calendar-delete-event";

        button.type =
          "button";

        button.className =
          "calendar-event-secondary";

        button.textContent =
          "Delete event";

        button.hidden =
          true;

        button.style.marginTop =
          "18px";

        button.style.width =
          "100%";

        elements.contextPanel
          .appendChild(
            button
          );
      }

      elements.deleteEvent =
        button;
    }


    createDeleteButton();


    /* ======================================================
       VIEW BUTTONS
    ====================================================== */

    const viewButtons =
      document.querySelectorAll(
        "[data-calendar-view]"
      );


    /* ======================================================
       JOHANNESBURG DATE HELPERS
    ====================================================== */

    function getJohannesburgParts(
      date = new Date()
    ) {
      const formatter =
        new Intl.DateTimeFormat(
          "en-ZA",
          {
            timeZone:
              TIMEZONE,

            year:
              "numeric",

            month:
              "numeric",

            day:
              "numeric"
          }
        );

      const parts =
        formatter.formatToParts(
          date
        );

      return {
        year:
          Number(
            parts.find(
              (part) =>
                part.type ===
                "year"
            )?.value
          ),

        month:
          Number(
            parts.find(
              (part) =>
                part.type ===
                "month"
            )?.value
          ),

        day:
          Number(
            parts.find(
              (part) =>
                part.type ===
                "day"
            )?.value
          )
      };
    }


    function getJohannesburgCivilDate(
      date = new Date()
    ) {
      const {
        year,
        month,
        day
      } =
        getJohannesburgParts(
          date
        );

      return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0
      );
    }


    function isSameCivilDate(
      dateA,
      dateB
    ) {
      if (
        !dateA ||
        !dateB
      ) {
        return false;
      }

      return (
        dateA.getFullYear() ===
          dateB.getFullYear() &&

        dateA.getMonth() ===
          dateB.getMonth() &&

        dateA.getDate() ===
          dateB.getDate()
      );
    }


    function formatInputDate(
      date
    ) {
      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(
          2,
          "0"
        );

      const day =
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        );

      return (
        `${year}-${month}-${day}`
      );
    }


    function parseEventDate(
      timestamp
    ) {
      if (!timestamp) {
        return null;
      }

      const date =
        new Date(
          timestamp
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    }


    function createJohannesburgTimestamp(
      date,
      time
    ) {
      return (
        `${date}T${time}:00+02:00`
      );
    }


    /* ======================================================
       HTML SAFETY
    ====================================================== */

    function escapeHTML(
      value
    ) {
      return String(
        value ?? ""
      )
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        );
    }


    /* ======================================================
       LIVE NOUS TIME
    ====================================================== */

    function updateLiveTime() {
      const now =
        new Date();

      if (
        elements.liveDate
      ) {
        elements.liveDate.textContent =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              timeZone:
                TIMEZONE,

              weekday:
                "long",

              day:
                "numeric",

              month:
                "long",

              year:
                "numeric"
            }
          ).format(
            now
          );
      }

      if (
        elements.liveTime
      ) {
        elements.liveTime.textContent =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              timeZone:
                TIMEZONE,

              hour:
                "2-digit",

              minute:
                "2-digit",

              second:
                "2-digit",

              hour12:
                false
            }
          ).format(
            now
          );
      }
    }


    /* ======================================================
       ZODIAC VISUAL IDENTITY
    ====================================================== */

    function updateCalendarPeriod() {
      if (
        !window.NOUS_CALENDAR ||
        typeof window.NOUS_CALENDAR
          .getCurrentPeriod !==
          "function"
      ) {
        return;
      }

      const period =
        window.NOUS_CALENDAR
          .getCurrentPeriod();

      if (!period) {
        return;
      }

      if (
        elements.icon
      ) {
        elements.icon.src =
          period.icon;

        elements.icon.alt =
          `NOUS Calendar — ${period.sign}`;
      }

      if (
        elements.periodSummary
      ) {
        elements.periodSummary.textContent =
          `${period.sign} · ${period.start} – ${period.end}`;
      }
    }


    /* ======================================================
       VIEW HEADER
    ====================================================== */

    function updateViewHeader() {
      const date =
        state.activeDate;

      let title =
        "";

      if (
        state.view ===
        "day"
      ) {
        title =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              weekday:
                "long",

              day:
                "numeric",

              month:
                "long",

              year:
                "numeric"
            }
          ).format(
            date
          );
      }

      if (
        state.view ===
        "week"
      ) {
        title =
          `Week of ${
            new Intl.DateTimeFormat(
              "en-ZA",
              {
                day:
                  "numeric",

                month:
                  "long",

                year:
                  "numeric"
              }
            ).format(
              date
            )
          }`;
      }

      if (
        state.view ===
        "month"
      ) {
        title =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              month:
                "long",

              year:
                "numeric"
            }
          ).format(
            date
          );
      }

      if (
        state.view ===
        "year"
      ) {
        title =
          String(
            date.getFullYear()
          );
      }

      if (
        elements.viewTitle
      ) {
        elements.viewTitle.textContent =
          title;
      }

      if (
        elements.selectedDate
      ) {
        elements.selectedDate.textContent =
          state.selectedDate
            ? new Intl.DateTimeFormat(
                "en-ZA",
                {
                  weekday:
                    "short",

                  day:
                    "numeric",

                  month:
                    "short",

                  year:
                    "numeric"
                }
              ).format(
                state.selectedDate
              )
            : "";
      }
    }


    /* ======================================================
       EVENT HELPERS
    ====================================================== */

    function getEventsForDate(
      date
    ) {
      return state.events.filter(
        (event) => {
          const eventDate =
            parseEventDate(
              event.start_at
            );

          return (
            eventDate &&
            isSameCivilDate(
              eventDate,
              date
            )
          );
        }
      );
    }


    function formatEventTime(
      event
    ) {
      if (
        event.all_day
      ) {
        return "All day";
      }

      const start =
        parseEventDate(
          event.start_at
        );

      if (!start) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "en-ZA",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          hour12:
            false,

          timeZone:
            TIMEZONE
        }
      ).format(
        start
      );
    }


    /* ======================================================
       EVENT SELECTION
    ====================================================== */

    function selectEvent(
      eventId
    ) {
      const selected =
        state.events.find(
          (event) =>
            String(
              event.id
            ) ===
            String(
              eventId
            )
        );

      if (!selected) {
        state.selectedEvent =
          null;

        if (
          elements.deleteEvent
        ) {
          elements.deleteEvent.hidden =
            true;
        }

        return;
      }

      state.selectedEvent =
        selected;

      if (
        elements.deleteEvent
      ) {
        elements.deleteEvent.hidden =
          false;
      }

      renderSelectedEvent();
    }


    function renderSelectedEvent() {
      const event =
        state.selectedEvent;

      if (
        !event ||
        !elements.contextCopy
      ) {
        return;
      }

      const time =
        formatEventTime(
          event
        );

      if (
        elements.contextTitle
      ) {
        elements.contextTitle.textContent =
          event.title ||
          "Calendar event";
      }

      elements.contextCopy.innerHTML = `
        <article
          class="calendar-context-event"
        >
          <small>
            ${escapeHTML(
              event.event_type ||
              "event"
            )}
          </small>

          <strong>
            ${escapeHTML(
              event.title
            )}
          </strong>

          <span>
            ${escapeHTML(
              time
            )}
          </span>

          ${
            event.location
              ? `
                <span>
                  ${escapeHTML(
                    event.location
                  )}
                </span>
              `
              : ""
          }

          ${
            event.description
              ? `
                <span>
                  ${escapeHTML(
                    event.description
                  )}
                </span>
              `
              : ""
          }

          <span>
            From:
            ${escapeHTML(
              event.source_space ||
              "calendar"
            )}
          </span>
        </article>
      `;
    }


    /* ======================================================
       CONTEXT PANEL
    ====================================================== */

    function updateContextPanel(
      date
    ) {
      state.selectedDate =
        date;

      state.selectedEvent =
        null;

      if (
        elements.deleteEvent
      ) {
        elements.deleteEvent.hidden =
          true;
      }

      const events =
        getEventsForDate(
          date
        );

      if (
        elements.contextTitle
      ) {
        elements.contextTitle.textContent =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              weekday:
                "long",

              day:
                "numeric",

              month:
                "long"
            }
          ).format(
            date
          );
      }

      if (
        !elements.contextCopy
      ) {
        updateViewHeader();

        return;
      }

      if (
        !events.length
      ) {
        elements.contextCopy.innerHTML = `
          <span>
            No events yet.
            This date is ready for events,
            tasks, reminders and time blocks.
          </span>
        `;

        updateViewHeader();

        return;
      }

      elements.contextCopy.innerHTML =
        events
          .map(
            (event) => {
              const time =
                formatEventTime(
                  event
                );

              return `
                <button
                  type="button"
                  class="calendar-context-event"
                  data-calendar-event-id="${escapeHTML(
                    event.id
                  )}"
                >

                  <small>
                    ${escapeHTML(
                      event.event_type ||
                      "event"
                    )}
                  </small>

                  <strong>
                    ${escapeHTML(
                      event.title
                    )}
                  </strong>

                  <span>
                    ${escapeHTML(
                      time
                    )}
                  </span>

                  ${
                    event.location
                      ? `
                        <span>
                          ${escapeHTML(
                            event.location
                          )}
                        </span>
                      `
                      : ""
                  }

                </button>
              `;
            }
          )
          .join("");

      elements.contextCopy
        .querySelectorAll(
          "[data-calendar-event-id]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () => {
                selectEvent(
                  button.dataset
                    .calendarEventId
                );
              }
            );
          }
        );

      updateViewHeader();
    }


    /* ======================================================
       MONTH VIEW
    ====================================================== */

    function renderMonth() {
      if (
        !elements.viewport
      ) {
        return;
      }

      const year =
        state.activeDate
          .getFullYear();

      const month =
        state.activeDate
          .getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const startDay =
        firstDay.getDay();

      const gridStart =
        new Date(
          year,
          month,
          1 - startDay
        );

      const today =
        getJohannesburgCivilDate();

      const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
      ];

      elements.viewport.innerHTML =
        "";

      const weekdayHeader =
        document.createElement(
          "div"
        );

      weekdayHeader.className =
        "calendar-weekday-header";

      weekdays.forEach(
        (day) => {
          const cell =
            document.createElement(
              "div"
            );

          cell.className =
            "calendar-weekday";

          cell.textContent =
            day;

          weekdayHeader.appendChild(
            cell
          );
        }
      );

      const grid =
        document.createElement(
          "div"
        );

      grid.className =
        "calendar-month-grid calendar-grid";

      for (
        let i = 0;
        i < 42;
        i++
      ) {
        const date =
          new Date(
            gridStart
          );

        date.setDate(
          gridStart.getDate() +
            i
        );

        const cell =
          document.createElement(
            "button"
          );

        cell.type =
          "button";

        cell.className =
          "calendar-cell calendar-month-cell";

        if (
          date.getMonth() !==
          month
        ) {
          cell.classList.add(
            "is-outside-month"
          );
        }

        if (
          isSameCivilDate(
            date,
            today
          )
        ) {
          cell.classList.add(
            "is-today"
          );
        }

        if (
          state.selectedDate &&
          isSameCivilDate(
            date,
            state.selectedDate
          )
        ) {
          cell.classList.add(
            "is-selected"
          );
        }

        const number =
          document.createElement(
            "span"
          );

        number.className =
          "calendar-date-number";

        number.textContent =
          String(
            date.getDate()
          );

        if (
          isSameCivilDate(
            date,
            today
          )
        ) {
          number.classList.add(
            "is-today"
          );
        }

        cell.appendChild(
          number
        );

        const dateEvents =
          getEventsForDate(
            date
          );

        if (
          dateEvents.length
        ) {
          const eventWrap =
            document.createElement(
              "div"
            );

          eventWrap.className =
            "calendar-cell-events";

          dateEvents
            .slice(
              0,
              3
            )
            .forEach(
              (event) => {
                const eventChip =
                  document.createElement(
                    "span"
                  );

                eventChip.className =
                  "calendar-event-chip";

                eventChip.textContent =
                  event.title;

                eventWrap.appendChild(
                  eventChip
                );
              }
            );

          if (
            dateEvents.length >
            3
          ) {
            const more =
              document.createElement(
                "span"
              );

            more.className =
              "calendar-event-more";

            more.textContent =
              `+${
                dateEvents.length -
                3
              }`;

            eventWrap.appendChild(
              more
            );
          }

          cell.appendChild(
            eventWrap
          );
        }

        cell.addEventListener(
          "click",
          () => {
            state.activeDate =
              new Date(
                date
              );

            updateContextPanel(
              new Date(
                date
              )
            );

            renderCalendar();
          }
        );

        grid.appendChild(
          cell
        );
      }

      elements.viewport.appendChild(
        weekdayHeader
      );

      elements.viewport.appendChild(
        grid
      );
    }


    /* ======================================================
       DAY VIEW
    ====================================================== */

    function renderDay() {
      if (
        !elements.viewport
      ) {
        return;
      }

      elements.viewport.innerHTML =
        "";

      const grid =
        document.createElement(
          "div"
        );

      grid.className =
        "calendar-time-grid";

      const dayEvents =
        getEventsForDate(
          state.activeDate
        );

      for (
        let hour = 0;
        hour < 24;
        hour++
      ) {
        const row =
          document.createElement(
            "div"
          );

        row.className =
          "calendar-hour-row";

        const label =
          document.createElement(
            "div"
          );

        label.className =
          "calendar-hour-label";

        label.textContent =
          `${String(
            hour
          ).padStart(
            2,
            "0"
          )}:00`;

        const space =
          document.createElement(
            "div"
          );

        space.className =
          "calendar-hour-space";

        const eventsAtHour =
          dayEvents.filter(
            (event) => {
              if (
                event.all_day
              ) {
                return false;
              }

              const eventDate =
                parseEventDate(
                  event.start_at
                );

              if (
                !eventDate
              ) {
                return false;
              }

              const hourString =
                new Intl.DateTimeFormat(
                  "en-ZA",
                  {
                    timeZone:
                      TIMEZONE,

                    hour:
                      "2-digit",

                    hour12:
                      false
                  }
                ).format(
                  eventDate
                );

              return (
                Number(
                  hourString
                ) ===
                hour
              );
            }
          );

        eventsAtHour.forEach(
          (event) => {
            const eventCard =
              document.createElement(
                "button"
              );

            eventCard.type =
              "button";

            eventCard.className =
              "calendar-day-event";

            eventCard.textContent =
              event.title;

            eventCard.addEventListener(
              "click",
              () => {
                state.selectedDate =
                  new Date(
                    state.activeDate
                  );

                selectEvent(
                  event.id
                );
              }
            );

            space.appendChild(
              eventCard
            );
          }
        );

        row.appendChild(
          label
        );

        row.appendChild(
          space
        );

        grid.appendChild(
          row
        );
      }

      elements.viewport.appendChild(
        grid
      );

      if (
        state.selectedDate
      ) {
        updateContextPanel(
          state.selectedDate
        );
      }
    }


    /* ======================================================
       WEEK VIEW
    ====================================================== */

    function renderWeek() {
      if (
        !elements.viewport
      ) {
        return;
      }

      elements.viewport.innerHTML =
        "";

      const week =
        document.createElement(
          "div"
        );

      week.className =
        "calendar-week-grid";

      const start =
        new Date(
          state.activeDate
        );

      start.setDate(
        start.getDate() -
        start.getDay()
      );

      for (
        let i = 0;
        i < 7;
        i++
      ) {
        const date =
          new Date(
            start
          );

        date.setDate(
          start.getDate() +
          i
        );

        const card =
          document.createElement(
            "button"
          );

        card.type =
          "button";

        card.className =
          "calendar-week-day";

        const events =
          getEventsForDate(
            date
          );

        card.innerHTML = `
          <small>
            ${
              new Intl.DateTimeFormat(
                "en-ZA",
                {
                  weekday:
                    "short"
                }
              ).format(
                date
              )
            }
          </small>

          <strong>
            ${date.getDate()}
          </strong>

          <span>
            ${
              events.length
                ? `${events.length} event${
                    events.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : "No events"
            }
          </span>
        `;

        card.addEventListener(
          "click",
          () => {
            state.activeDate =
              new Date(
                date
              );

            updateContextPanel(
              new Date(
                date
              )
            );
          }
        );

        week.appendChild(
          card
        );
      }

      elements.viewport.appendChild(
        week
      );
    }


    /* ======================================================
       YEAR VIEW
    ====================================================== */

    function renderYear() {
      if (
        !elements.viewport
      ) {
        return;
      }

      elements.viewport.innerHTML =
        "";

      const yearGrid =
        document.createElement(
          "div"
        );

      yearGrid.className =
        "calendar-year-grid";

      for (
        let month = 0;
        month < 12;
        month++
      ) {
        const monthCard =
          document.createElement(
            "button"
          );

        monthCard.type =
          "button";

        monthCard.className =
          "calendar-year-month";

        const title =
          document.createElement(
            "h3"
          );

        title.className =
          "calendar-year-month-title";

        title.textContent =
          new Intl.DateTimeFormat(
            "en-ZA",
            {
              month:
                "long"
            }
          ).format(
            new Date(
              state.activeDate
                .getFullYear(),
              month,
              1
            )
          );

        const eventCount =
          state.events.filter(
            (event) => {
              const date =
                parseEventDate(
                  event.start_at
                );

              return (
                date &&
                date.getFullYear() ===
                  state.activeDate
                    .getFullYear() &&

                date.getMonth() ===
                  month
              );
            }
          ).length;

        monthCard.appendChild(
          title
        );

        if (
          eventCount
        ) {
          const count =
            document.createElement(
              "span"
            );

          count.className =
            "calendar-year-event-count";

          count.textContent =
            `${eventCount} event${
              eventCount ===
              1
                ? ""
                : "s"
            }`;

          monthCard.appendChild(
            count
          );
        }

        monthCard.addEventListener(
          "click",
          () => {
            state.activeDate =
              new Date(
                state.activeDate
                  .getFullYear(),
                month,
                1
              );

            state.view =
              "month";

            state.selectedEvent =
              null;

            updateViewButtons();

            renderCalendar();
          }
        );

        yearGrid.appendChild(
          monthCard
        );
      }

      elements.viewport.appendChild(
        yearGrid
      );
    }


    /* ======================================================
       MASTER RENDERER
    ====================================================== */

    function renderCalendar() {
      updateViewHeader();

      if (
        state.view ===
        "day"
      ) {
        renderDay();

        return;
      }

      if (
        state.view ===
        "week"
      ) {
        renderWeek();

        return;
      }

      if (
        state.view ===
        "month"
      ) {
        renderMonth();

        return;
      }

      if (
        state.view ===
        "year"
      ) {
        renderYear();
      }
    }


    /* ======================================================
       VIEW BUTTON STATE
    ====================================================== */

    function updateViewButtons() {
      viewButtons.forEach(
        (button) => {
          button.classList.toggle(
            "is-active",
            button.dataset
              .calendarView ===
              state.view
          );
        }
      );
    }


    viewButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            state.view =
              button.dataset
                .calendarView;

            state.selectedEvent =
              null;

            if (
              elements.deleteEvent
            ) {
              elements.deleteEvent.hidden =
                true;
            }

            updateViewButtons();

            renderCalendar();
          }
        );
      }
    );


    /* ======================================================
       PREVIOUS / TODAY / NEXT
    ====================================================== */

    function navigate(
      direction
    ) {
      const date =
        new Date(
          state.activeDate
        );

      if (
        state.view ===
        "day"
      ) {
        date.setDate(
          date.getDate() +
          direction
        );
      }

      if (
        state.view ===
        "week"
      ) {
        date.setDate(
          date.getDate() +
          7 *
          direction
        );
      }

      if (
        state.view ===
        "month"
      ) {
        date.setMonth(
          date.getMonth() +
          direction
        );
      }

      if (
        state.view ===
        "year"
      ) {
        date.setFullYear(
          date.getFullYear() +
          direction
        );
      }

      state.activeDate =
        date;

      state.selectedEvent =
        null;

      if (
        elements.deleteEvent
      ) {
        elements.deleteEvent.hidden =
          true;
      }

      renderCalendar();
    }


    elements.previous
      ?.addEventListener(
        "click",
        () =>
          navigate(
            -1
          )
      );


    elements.next
      ?.addEventListener(
        "click",
        () =>
          navigate(
            1
          )
      );


    elements.today
      ?.addEventListener(
        "click",
        () => {
          state.activeDate =
            getJohannesburgCivilDate();

          state.selectedDate =
            null;

          state.selectedEvent =
            null;

          if (
            elements.deleteEvent
          ) {
            elements.deleteEvent.hidden =
              true;
          }

          renderCalendar();
        }
      );


    /* ======================================================
       SUPABASE SESSION
    ====================================================== */

    async function getCalendarSession() {
      const client =
        window.NOUS_SUPABASE;

      if (!client) {
        throw new Error(
          "NOUS Calendar could not reach Supabase."
        );
      }

      const {
        data: {
          session
        },

        error
      } =
        await client.auth
          .getSession();

      if (error) {
        throw error;
      }

      if (
        !session?.user
      ) {
        throw new Error(
          "You must be signed in to use NOUS Calendar."
        );
      }

      return {
        client,
        session
      };
    }


    /* ======================================================
       LOAD UNIVERSAL EVENTS
    ====================================================== */

    async function loadCalendarEvents() {
      if (
        state.loadingEvents
      ) {
        return;
      }

      state.loadingEvents =
        true;

      try {
        const {
          client,
          session
        } =
          await getCalendarSession();

        const {
          data,
          error
        } =
          await client
            .from(
              "calendar_events"
            )
            .select(
              "*"
            )
            .eq(
              "user_id",
              session.user.id
            )
            .neq(
              "status",
              "cancelled"
            )
            .order(
              "start_at",
              {
                ascending:
                  true
              }
            );

        if (error) {
          throw error;
        }

        state.events =
          data || [];

        console.log(
          "[NOUS CALENDAR] Events loaded",
          state.events.length
        );

      } catch (error) {
        console.error(
          "[NOUS CALENDAR LOAD ERROR]",
          error
        );

        state.events =
          [];

      } finally {
        state.loadingEvents =
          false;
      }
    }


    /* ======================================================
       CREATE EVENT MODAL
    ====================================================== */

    function openCreateModal() {
      if (
        !elements.createModal
      ) {
        console.error(
          "[NOUS CALENDAR] Create modal HTML is missing."
        );

        return;
      }

      const selected =
        state.selectedDate ||
        state.activeDate ||
        getJohannesburgCivilDate();

      if (
        elements.eventDate
      ) {
        elements.eventDate.value =
          formatInputDate(
            selected
          );
      }

      if (
        elements.eventStart &&
        !elements.eventStart.value
      ) {
        elements.eventStart.value =
          DEFAULT_START_TIME;
      }

      if (
        elements.eventEnd &&
        !elements.eventEnd.value
      ) {
        elements.eventEnd.value =
          DEFAULT_END_TIME;
      }

      if (
        elements.eventNotice
      ) {
        elements.eventNotice.textContent =
          "";
      }

      elements.createModal.hidden =
        false;

      elements.createModal.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.classList.add(
        "calendar-modal-open"
      );

      requestAnimationFrame(
        () => {
          elements.createModal
            ?.classList.add(
              "is-open"
            );

          elements.eventTitle
            ?.focus();
        }
      );
    }


    function closeCreateModal() {
      if (
        !elements.createModal
      ) {
        return;
      }

      elements.createModal
        .classList.remove(
          "is-open"
        );

      elements.createModal.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.classList.remove(
        "calendar-modal-open"
      );

      window.setTimeout(
        () => {
          if (
            elements.createModal
          ) {
            elements.createModal.hidden =
              true;
          }
        },
        180
      );
    }


    /* ======================================================
       SAVE UNIVERSAL EVENT
    ====================================================== */

    async function saveCalendarEvent() {
      const {
        client,
        session
      } =
        await getCalendarSession();

      const title =
        elements.eventTitle
          ?.value
          .trim();

      const date =
        elements.eventDate
          ?.value;

      const allDay =
        Boolean(
          elements.eventAllDay
            ?.checked
        );

      if (!title) {
        throw new Error(
          "Enter a title for the event."
        );
      }

      if (!date) {
        throw new Error(
          "Choose a date."
        );
      }

      let startAt;
      let endAt;

      if (
        allDay
      ) {
        startAt =
          `${date}T00:00:00+02:00`;

        endAt =
          `${date}T23:59:59+02:00`;

      } else {
        const start =
          elements.eventStart
            ?.value ||
          DEFAULT_START_TIME;

        const end =
          elements.eventEnd
            ?.value ||
          start;

        startAt =
          createJohannesburgTimestamp(
            date,
            start
          );

        endAt =
          createJohannesburgTimestamp(
            date,
            end
          );

        if (
          new Date(
            endAt
          ) <
          new Date(
            startAt
          )
        ) {
          throw new Error(
            "The event end time cannot be before its start time."
          );
        }
      }

      const payload = {

        user_id:
          session.user.id,

        title,

        description:
          elements.eventDescription
            ?.value
            .trim() ||
          null,

        start_at:
          startAt,

        end_at:
          endAt,

        all_day:
          allDay,

        location:
          elements.eventLocation
            ?.value
            .trim() ||
          null,

        source_space:
          elements.eventSource
            ?.value ||
          "calendar",

        event_type:
          elements.eventType
            ?.value ||
          "event",

        status:
          "scheduled"
      };

      console.log(
        "[NOUS CALENDAR] Saving event",
        payload
      );

      const {
        data,
        error
      } =
        await client
          .from(
            "calendar_events"
          )
          .insert(
            payload
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      console.log(
        "[NOUS CALENDAR] Event created",
        data
      );

      return data;
    }


    /* ======================================================
       DELETE EVENT
    ====================================================== */

    async function deleteSelectedEvent() {
      if (
        !state.selectedEvent ||
        state.deletingEvent
      ) {
        return;
      }

      const eventToDelete =
        state.selectedEvent;

      const confirmed =
        window.confirm(
          `Delete "${eventToDelete.title}"?`
        );

      if (!confirmed) {
        return;
      }

      state.deletingEvent =
        true;

      if (
        elements.deleteEvent
      ) {
        elements.deleteEvent.disabled =
          true;

        elements.deleteEvent.textContent =
          "Deleting...";
      }

      try {
        const {
          client,
          session
        } =
          await getCalendarSession();

        const {
          error
        } =
          await client
            .from(
              "calendar_events"
            )
            .delete()
            .eq(
              "id",
              eventToDelete.id
            )
            .eq(
              "user_id",
              session.user.id
            );

        if (error) {
          throw error;
        }

        state.events =
          state.events.filter(
            (event) =>
              event.id !==
              eventToDelete.id
          );

        state.selectedEvent =
          null;

        console.log(
          "[NOUS CALENDAR] Event deleted",
          eventToDelete.id
        );

        if (
          elements.deleteEvent
        ) {
          elements.deleteEvent.hidden =
            true;
        }

        renderCalendar();

        if (
          state.selectedDate
        ) {
          updateContextPanel(
            state.selectedDate
          );
        }

      } catch (error) {
        console.error(
          "[NOUS CALENDAR DELETE ERROR]",
          error
        );

        window.alert(
          error?.message ||
          "NOUS could not delete the event."
        );

      } finally {
        state.deletingEvent =
          false;

        if (
          elements.deleteEvent
        ) {
          elements.deleteEvent.disabled =
            false;

          elements.deleteEvent.textContent =
            "Delete event";
        }
      }
    }


    /* ======================================================
       CREATE BUTTON EVENTS
    ====================================================== */

    elements.create
      ?.addEventListener(
        "click",
        openCreateModal
      );


    elements.createClose
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.createBackdrop
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.eventCancel
      ?.addEventListener(
        "click",
        closeCreateModal
      );


    elements.deleteEvent
      ?.addEventListener(
        "click",
        deleteSelectedEvent
      );


    /* ======================================================
       ALL-DAY TOGGLE
    ====================================================== */

    elements.eventAllDay
      ?.addEventListener(
        "change",
        () => {
          const disabled =
            Boolean(
              elements.eventAllDay
                ?.checked
            );

          if (
            elements.eventStart
          ) {
            elements.eventStart.disabled =
              disabled;
          }

          if (
            elements.eventEnd
          ) {
            elements.eventEnd.disabled =
              disabled;
          }
        }
      );


    /* ======================================================
       EVENT FORM SUBMIT
    ====================================================== */

    elements.eventForm
      ?.addEventListener(
        "submit",
        async (
          event
        ) => {
          event.preventDefault();

          if (
            elements.eventSave
          ) {
            elements.eventSave.disabled =
              true;

            elements.eventSave.textContent =
              "Adding...";
          }

          if (
            elements.eventNotice
          ) {
            elements.eventNotice.textContent =
              "Saving event...";
          }

          try {
            const created =
              await saveCalendarEvent();

            state.events.push(
              created
            );

            state.events.sort(
              (
                eventA,
                eventB
              ) =>
                new Date(
                  eventA.start_at
                ) -
                new Date(
                  eventB.start_at
                )
            );

            const createdDate =
              parseEventDate(
                created.start_at
              );

            if (
              createdDate
            ) {
              state.selectedDate =
                createdDate;

              state.activeDate =
                new Date(
                  createdDate
                );
            }

            state.selectedEvent =
              created;

            if (
              elements.eventNotice
            ) {
              elements.eventNotice.textContent =
                "Event added to NOUS Calendar.";
            }

            console.log(
              "[NOUS CALENDAR] Universal event ready",
              created
            );

            elements.eventForm
              ?.reset();

            if (
              elements.eventStart
            ) {
              elements.eventStart.value =
                DEFAULT_START_TIME;

              elements.eventStart.disabled =
                false;
            }

            if (
              elements.eventEnd
            ) {
              elements.eventEnd.value =
                DEFAULT_END_TIME;

              elements.eventEnd.disabled =
                false;
            }

            window.setTimeout(
              () => {
                closeCreateModal();

                renderCalendar();

                if (
                  state.selectedDate
                ) {
                  updateContextPanel(
                    state.selectedDate
                  );
                }
              },
              450
            );

          } catch (error) {
            console.error(
              "[NOUS CALENDAR CREATE ERROR]",
              error
            );

            if (
              elements.eventNotice
            ) {
              elements.eventNotice.textContent =
                error?.message ||
                "NOUS could not create the event.";
            }

          } finally {
            if (
              elements.eventSave
            ) {
              elements.eventSave.disabled =
                false;

              elements.eventSave.textContent =
                "Add event";
            }
          }
        }
      );


    /* ======================================================
       ESCAPE KEY
    ====================================================== */

    document.addEventListener(
      "keydown",
      (
        event
      ) => {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        if (
          elements.createModal &&
          !elements.createModal.hidden
        ) {
          closeCreateModal();
        }
      }
    );


    /* ======================================================
       PUBLIC NOUS CALENDAR API
    ====================================================== */

    window.NOUS_CALENDAR_APP = {

      getEvents() {
        return [
          ...state.events
        ];
      },

      getSelectedDate() {
        return state.selectedDate
          ? new Date(
              state.selectedDate
            )
          : null;
      },

      getSelectedEvent() {
        return state.selectedEvent
          ? {
              ...state.selectedEvent
            }
          : null;
      },

      async refreshEvents() {
        await loadCalendarEvents();

        renderCalendar();

        return [
          ...state.events
        ];
      },

      async deleteEvent(
        eventId
      ) {
        const selected =
          state.events.find(
            (event) =>
              String(
                event.id
              ) ===
              String(
                eventId
              )
          );

        if (!selected) {
          return false;
        }

        state.selectedEvent =
          selected;

        await deleteSelectedEvent();

        return true;
      },

      openCreateEvent(
        options = {}
      ) {
        if (
          options.date
        ) {
          const requestedDate =
            new Date(
              options.date
            );

          if (
            !Number.isNaN(
              requestedDate.getTime()
            )
          ) {
            state.selectedDate =
              requestedDate;
          }
        }

        openCreateModal();

        if (
          options.title &&
          elements.eventTitle
        ) {
          elements.eventTitle.value =
            options.title;
        }

        if (
          options.sourceSpace &&
          elements.eventSource
        ) {
          elements.eventSource.value =
            options.sourceSpace;
        }

        if (
          options.eventType &&
          elements.eventType
        ) {
          elements.eventType.value =
            options.eventType;
        }
      }
    };


    /* ======================================================
       START NOUS CALENDAR
    ====================================================== */

    state.activeDate =
      getJohannesburgCivilDate();

    updateCalendarPeriod();

    updateLiveTime();

    updateViewButtons();

    await loadCalendarEvents();

    renderCalendar();

    console.log(
      "[NOUS CALENDAR] Ready",
      {
        timezone:
          TIMEZONE,

        view:
          state.view,

        events:
          state.events.length
      }
    );


    /* ======================================================
       CLOCK
    ====================================================== */

    window.setInterval(
      updateLiveTime,
      1000
    );
  }
);