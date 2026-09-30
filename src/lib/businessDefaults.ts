import { DayOfWeek, type BusinessScheduleRequestDto } from "@/types";

export const DEFAULT_OPEN_TIME = "09:00:00";
export const DEFAULT_CLOSE_TIME = "18:00:00";

const WEEK_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const DEFAULT_SCHEDULES: BusinessScheduleRequestDto[] = WEEK_DAYS.map(
  (dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    periods: [{ openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME }],
  }),
);
