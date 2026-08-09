const NOUS_CALENDAR_TIMEZONE = "Africa/Johannesburg";

const NOUS_CALENDAR_ICON_BASE = "/assets/icons/calendar/";

const NOUS_ZODIAC_PERIODS = [
  {
    sign: "Aries",
    slug: "aries",
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    start: "March 21",
    end: "April 19",
    icon: `${NOUS_CALENDAR_ICON_BASE}aries.png`
  },

  {
    sign: "Taurus",
    slug: "taurus",
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    start: "April 20",
    end: "May 20",
    icon: `${NOUS_CALENDAR_ICON_BASE}taurus.png`
  },

  {
    sign: "Gemini",
    slug: "gemini",
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
    start: "May 21",
    end: "June 20",
    icon: `${NOUS_CALENDAR_ICON_BASE}gemini.png`
  },

  {
    sign: "Cancer",
    slug: "cancer",
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
    start: "June 21",
    end: "July 22",
    icon: `${NOUS_CALENDAR_ICON_BASE}cancer.png`
  },

  {
    sign: "Leo",
    slug: "leo",
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    start: "July 23",
    end: "August 22",
    icon: `${NOUS_CALENDAR_ICON_BASE}leo.png`
  },

  {
    sign: "Virgo",
    slug: "virgo",
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    start: "August 23",
    end: "September 22",
    icon: `${NOUS_CALENDAR_ICON_BASE}virgo.png`
  },

  {
    sign: "Libra",
    slug: "libra",
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    start: "September 23",
    end: "October 22",
    icon: `${NOUS_CALENDAR_ICON_BASE}libra.png`
  },

  {
    sign: "Scorpio",
    slug: "scorpio",
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    start: "October 23",
    end: "November 21",
    icon: `${NOUS_CALENDAR_ICON_BASE}scorpio.png`
  },

  {
    sign: "Sagittarius",
    slug: "sagittarius",
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    start: "November 22",
    end: "December 21",
    icon: `${NOUS_CALENDAR_ICON_BASE}sagittarius.png`
  },

  {
    sign: "Capricorn",
    slug: "capricorn",
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    start: "December 22",
    end: "January 19",
    icon: `${NOUS_CALENDAR_ICON_BASE}capricorn.png`
  },

  {
    sign: "Aquarius",
    slug: "aquarius",
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    start: "January 20",
    end: "February 18",
    icon: `${NOUS_CALENDAR_ICON_BASE}aquarius.png`
  },

  {
    sign: "Pisces",
    slug: "pisces",
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    start: "February 19",
    end: "March 20",
    icon: `${NOUS_CALENDAR_ICON_BASE}pisces.png`
  }
];


/**
 * Get the Johannesburg month and day for a Date.
 */
function getJohannesburgDateParts(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("NOUS Calendar requires a valid Date object.");
  }

  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: NOUS_CALENDAR_TIMEZONE,
    month: "numeric",
    day: "numeric"
  });

  const parts = formatter.formatToParts(date);

  const month = Number(
    parts.find(part => part.type === "month")?.value
  );

  const day = Number(
    parts.find(part => part.type === "day")?.value
  );

  return {
    month,
    day
  };
}


/**
 * Determine the zodiac period for any supplied Date.
 */
function getZodiacPeriod(date = new Date()) {
  const { month, day } = getJohannesburgDateParts(date);

  const currentValue = month * 100 + day;

  const period = NOUS_ZODIAC_PERIODS.find(period => {
    const startValue =
      period.startMonth * 100 + period.startDay;

    const endValue =
      period.endMonth * 100 + period.endDay;

    // Normal periods:
    // Example: Leo = July 23 → August 22
    if (startValue <= endValue) {
      return (
        currentValue >= startValue &&
        currentValue <= endValue
      );
    }

    // Cross-year period:
    // Capricorn = December 22 → January 19
    return (
      currentValue >= startValue ||
      currentValue <= endValue
    );
  });

  return period || null;
}


/**
 * Get the current NOUS Calendar period.
 */
function getCurrentZodiacPeriod() {
  return getZodiacPeriod(new Date());
}


/**
 * Get only the icon path for a supplied/current Date.
 */
function getCalendarIcon(date = new Date()) {
  const period = getZodiacPeriod(date);

  return period?.icon || null;
}


/**
 * Public NOUS Calendar API.
 *
 * Other NOUS systems can query this later through:
 *
 * window.NOUS_CALENDAR.getCurrentPeriod()
 */
window.NOUS_CALENDAR = {
  timezone: NOUS_CALENDAR_TIMEZONE,
  periods: NOUS_ZODIAC_PERIODS,

  getZodiacPeriod,
  getCurrentPeriod: getCurrentZodiacPeriod,
  getCalendarIcon
};