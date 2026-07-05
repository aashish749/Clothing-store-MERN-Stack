const ALLOWED_PERIODS = new Set([
  "today",
  "yesterday",
  "week",
  "month",
  "year",
  "lastmonth",
  "last3months",
  "last30days",
  "last6months",
  "custom",
]);

const ALLOWED_GROUP_BY = new Set(["day", "week", "month"]);

const startOfUtcDay = (date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

const addUtcDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const startOfUtcMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));

const startOfUtcYear = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));

const addUtcMonths = (date, months) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );

const parseDateInput = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const calculatePercentageChange = (currentValue, previousValue) => {
  if (previousValue === 0 && currentValue === 0) return 0;
  if (previousValue === 0) return 100;
  return Number(
    (((currentValue - previousValue) / previousValue) * 100).toFixed(2),
  );
};

const getDateRangeFromQuery = (query) => {
  const now = new Date();
  const period = String(query.period || "month").toLowerCase();

  if (!ALLOWED_PERIODS.has(period)) {
    return {
      error:
        "Invalid period. Use today, yesterday, week, month, year, lastMonth, last30days, last6months, or custom.",
    };
  }

  if (period === "custom") {
    const customStart = parseDateInput(query.startDate);
    const customEnd = parseDateInput(query.endDate);

    if (!customStart || !customEnd) {
      return {
        error:
          "For custom period, startDate and endDate are required and must be valid dates.",
      };
    }

    const start = startOfUtcDay(customStart);
    const end = addUtcDays(startOfUtcDay(customEnd), 1);

    if (end <= start) {
      return { error: "endDate must be after startDate." };
    }

    return { period, start, end };
  }

  const todayStart = startOfUtcDay(now);

  if (period === "today") {
    return { period, start: todayStart, end: addUtcDays(todayStart, 1) };
  }

  if (period === "yesterday") {
    const yesterdayStart = addUtcDays(todayStart, -1);
    return { period, start: yesterdayStart, end: todayStart };
  }

  if (period === "week") {
    const weekStart = addUtcDays(todayStart, -6);
    return { period, start: weekStart, end: addUtcDays(todayStart, 1) };
  }

  if (period === "month") {
    return {
      period,
      start: startOfUtcMonth(now),
      end: addUtcDays(todayStart, 1),
    };
  }

  if (period === "lastmonth") {
    const currentMonthStart = startOfUtcMonth(now);
    const previousMonthStart = addUtcMonths(currentMonthStart, -1);
    return { period, start: previousMonthStart, end: currentMonthStart };
  }

  if (period === "last30days") {
    return {
      period,
      start: addUtcDays(todayStart, -29),
      end: addUtcDays(todayStart, 1),
    };
  }

  if (period === "last6months") {
    return {
      period,
      start: addUtcMonths(startOfUtcMonth(now), -6),
      end: startOfUtcMonth(now),
    };
  }

  if (period === "last3months") {
    return {
      period,
      start: addUtcMonths(startOfUtcMonth(now), -3),
      end: startOfUtcMonth(now),
    };
  }

  return { period, start: startOfUtcYear(now), end: addUtcDays(todayStart, 1) };
};

const getPreviousRange = ({ start, end }) => {
  const durationMs = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - durationMs),
    end: start,
  };
};

const getTrendDateFormat = (groupBy) => {
  if (groupBy === "month") return "%Y-%m";
  if (groupBy === "week") return "%Y-W%V";
  return "%Y-%m-%d";
};

export {
  ALLOWED_GROUP_BY,
  ALLOWED_PERIODS,
  addUtcDays,
  addUtcMonths,
  calculatePercentageChange,
  getDateRangeFromQuery,
  getPreviousRange,
  getTrendDateFormat,
  parseDateInput,
  startOfUtcDay,
  startOfUtcMonth,
  startOfUtcYear,
};
