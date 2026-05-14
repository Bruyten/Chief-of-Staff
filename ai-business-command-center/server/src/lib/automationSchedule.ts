import { DateTime } from "luxon";

export type ScheduleInput = {
  cadence: "weekly" | "monthly";
  timezone: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour: number;
  minute: number;
  from?: Date;
};

export function computeNextRunAt(input: ScheduleInput) {
  const zone = input.timezone || "UTC";
  const base = DateTime.fromJSDate(input.from ?? new Date(), { zone });

  if (!base.isValid) {
    throw new Error("Invalid timezone");
  }

  if (input.cadence === "weekly") {
    const weekday = input.dayOfWeek ?? 1;
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
