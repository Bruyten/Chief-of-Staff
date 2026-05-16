import { DateTime } from "luxon";

export type ScheduleInput = {
  cadence: "daily" | "weekly" | "monthly";
  timezone: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour: number;
  minute: number;
  from?: Date;
};

type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function normalizeWeekday(value: number | null | undefined): WeekdayNumber {
  switch (value) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return value;
    default:
      return 1;
  }
}

export function computeNextRunAt(input: ScheduleInput) {
  const zone = input.timezone || "UTC";

  const base = DateTime.fromJSDate(input.from ?? new Date(), {
    zone,
  });

  if (!base.isValid) {
    throw new Error("Invalid timezone");
  }

  if (input.cadence === "daily") {
    let candidate = base.set({
      hour: input.hour,
      minute: input.minute,
      second: 0,
      millisecond: 0,
    });

    if (candidate <= base) {
      candidate = candidate.plus({ days: 1 });
    }

    return candidate.toUTC().toJSDate();
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

  const day = input.dayOfMonth ?? 1;

  let candidate = base.set({
    day: Math.min(day, base.daysInMonth),
    hour: input.hour,
    minute: input.minute,
    second: 0,
    millisecond: 0,
  });

  if (candidate <= base) {
    const nextMonth = base.plus({ months: 1 });

    candidate = nextMonth.set({
      day: Math.min(day, nextMonth.daysInMonth),
      hour: input.hour,
      minute: input.minute,
      second: 0,
      millisecond: 0,
    });
  }

  return candidate.toUTC().toJSDate();
}
