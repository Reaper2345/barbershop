/*
|--------------------------------------------------------------------------
| Calendar date helpers
|--------------------------------------------------------------------------
| Everything here works on plain `YYYY-MM-DD` strings built from local date
| parts. That matters: the API and the database both speak application-timezone
| calendar dates, and routing them through `new Date('2025-03-12')` (which
| parses as UTC midnight) would shift the day for anyone east of Greenwich.
| `new Date(2025, 2, 12)` is local and round-trips exactly.
*/

/** Monday-first weekday labels, index 0 = Monday. */
export const WEEKDAY_SHORT = ['Пн', 'Вс', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;
export const WEEKDAY_FULL = [
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
    'воскресенье',
] as const;

const MONTHS_NOMINATIVE = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
] as const;

const MONTHS_GENITIVE = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
] as const;

export function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Local `Date` → `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function todayIso(): string {
    return toIsoDate(new Date());
}

/** Midnight today, used for "is this date in the past" comparisons. */
function startOfToday(): Date {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isPastDate(value: string): boolean {
    return parseIsoDate(value).getTime() < startOfToday().getTime();
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function addMonths(date: Date, amount: number): Date {
    // Clamp the day so 31 Jan + 1 month lands on 28/29 Feb rather than 2 Mar.
    const year = date.getFullYear();
    const month = date.getMonth() + amount;
    const day = Math.min(date.getDate(), daysInMonth(year, month));

    return new Date(year, month, day);
}

export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday (JS getDay() is Sunday-first, so it is remapped). */
export function mondayIndex(date: Date): number {
    return (date.getDay() + 6) % 7;
}

export function monthLabel(date: Date): string {
    return `${MONTHS_NOMINATIVE[date.getMonth()] ?? ''} ${date.getFullYear()}`;
}

/** `2025-03-12` → `"12 марта 2025"`, optionally with the weekday. */
export function formatIsoDateLabel(value: string, withWeekday = false): string {
    const date = parseIsoDate(value);
    const label = `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()] ?? ''} ${date.getFullYear()}`;

    return withWeekday ? `${label}, ${WEEKDAY_FULL[mondayIndex(date)] ?? ''}` : label;
}

/**
 * Whether a weekday has no active schedule row.
 *
 * `schedules` holds one row per working weekday with `is_active`. A master with
 * the relation unloaded yields an empty set, which would disable every day — so
 * callers must only use this when `schedules` is actually present.
 */
export function isWeekdayWorked(
    schedules: Array<{ weekday: number; is_active: boolean }> | undefined,
    date: Date,
): boolean {
    if (schedules === undefined) {
        return true;
    }

    // Schedules store the Carbon weekday (0 = Sunday), not the JS/Monday index.
    const carbonWeekday = date.getDay();

    return schedules.some(
        (schedule) => schedule.weekday === carbonWeekday && schedule.is_active,
    );
}
