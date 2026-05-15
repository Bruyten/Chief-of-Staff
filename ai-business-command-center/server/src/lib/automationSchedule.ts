import { DateTime } from "luxon";

type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ScheduleInput = {
  cadence: "weekly" | "monthly";
  timezone: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour: number;
  minute: number;
  from?: Date;
};

function normalizeWeekday(value: number | null | undefined): WeekdayNumber {
  if (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6 ||
    value === 7
  ) {
    return value;
  }

  return 1;
}

function normalizeMonthDay(value: number | null | undefined) {
  if (!value || value < 1) {
    return 1;
  }

  return Math.min(value, 31);
}

export function computeNextRunAt(input: ScheduleInput) {
  const zone = input.timezone || "UTC";

  const base = DateTime.fromJSDate(input.from ?? new Date(), {
    zone,
  });

  if (!base.isValid) {
    throw new Error("Invalid timezone");
  }

  if (input.cadence === "weekly") {
    const weekday = normalizeWeekday(input.dayOfWeek);

    let candidate = base.set({
      weekday,
      hour: input.hour,
      minute: input.minute,
      second: 0,
      millisecond: 0,
    });

    if (candidate <= base) {
      candidate = candidate.plus({ weeks: 1 });
    }

    return candidate.toUTC().toJSDate();
  }

  const requestedDay = normalizeMonthDay(input.dayOfMonth);

  let candidate = base.set({
    day: Math.min(requestedDay, base.daysInMonth),
    hour: input.hour,
    minute: input.minute,
    second: 0,
    millisecond: 0,
  });

  if (candidate <= base) {
    const nextMonth = base.plus({ months: 1 });

    candidate = nextMonth.set({
      day: Math.min(requestedDay, nextMonth.daysInMonth),
      hour: input.hour,
      minute: input.minute,
      second: 0,
      millisecond: 0,
    });
  }

  return candidate.toUTC().toJSDate();
}
