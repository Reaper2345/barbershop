import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import {
    WEEKDAY_SHORT,
    addMonths,
    formatIsoDateLabel,
    isSameDay,
    monthLabel,
    startOfMonth,
    toIsoDate,
} from '@/lib/date';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Calendar
|--------------------------------------------------------------------------
| Hand-rolled month grid — the brief explicitly rules out a date library.
|
| Disabled days are the union of three independent conditions, evaluated by the
| caller and passed in as a predicate:
|   - the day is in the past,
|   - the master has a day off (TimeOff),
|   - the weekday has no active schedule.
|
| Accessibility: the grid is a real table-free `role="grid"`, days are buttons
| with `aria-disabled` rather than `disabled` where they must stay focusable,
| and the whole thing is announced as a labelled group.
*/

export interface CalendarProps {
    /** Currently selected day, `YYYY-MM-DD`. */
    value: string | null;
    onChange: (isoDate: string) => void;
    /** Month currently displayed, as a Date on the 1st. */
    month: Date;
    onMonthChange: (month: Date) => void;
    /** Returns true when the day cannot be booked. */
    isDisabled?: (date: Date, isoDate: string) => boolean;
    /** Earliest selectable month; the previous arrow is disabled below it. */
    minDate?: Date;
    /** Latest selectable month; the next arrow is disabled above it. */
    maxDate?: Date;
    className?: string;
}

export function Calendar({
    value,
    onChange,
    month,
    onMonthChange,
    isDisabled,
    minDate,
    maxDate,
    className,
}: CalendarProps) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstOfMonth = new Date(year, monthIndex, 1);
    // Monday-first offset.
    const leading = (firstOfMonth.getDay() + 6) % 7;
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();

    // Padding days from the previous month keep the grid rectangular.
    const cells: Array<{ date: Date; iso: string; inMonth: boolean }> = [];

    for (let i = leading - 1; i >= 0; i -= 1) {
        const date = new Date(year, monthIndex, -i);
        cells.push({ date, iso: toIsoDate(date), inMonth: false });
    }

    for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(year, monthIndex, day);
        cells.push({ date, iso: toIsoDate(date), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
        const last = cells[cells.length - 1];

        if (last === undefined) {
            break;
        }

        const date = new Date(last.date);
        date.setDate(date.getDate() + 1);
        cells.push({ date, iso: toIsoDate(date), inMonth: false });
    }

    const canGoBack = minDate === undefined || startOfMonth(month).getTime() > startOfMonth(minDate).getTime();
    const canGoForward = maxDate === undefined || startOfMonth(month).getTime() < startOfMonth(maxDate).getTime();

    return (
        <div className={cn('rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5', className)}>
            {/* Month header */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={() => onMonthChange(addMonths(month, -1))}
                    disabled={!canGoBack}
                    aria-label="Предыдущий месяц"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <p className="font-display text-lg font-semibold capitalize text-text-primary" aria-live="polite">
                    {monthLabel(month)}
                </p>

                <button
                    type="button"
                    onClick={() => onMonthChange(addMonths(month, 1))}
                    disabled={!canGoForward}
                    aria-label="Следующий месяц"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Weekday header */}
            <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
                {WEEKDAY_SHORT.map((label) => (
                    <div
                        key={label}
                        className="py-2 text-center text-[0.7rem] uppercase tracking-wider text-text-secondary"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div
                role="group"
                aria-label={`Календарь на ${monthLabel(month)}`}
                className="grid grid-cols-7 gap-1"
            >
                {cells.map((cell) => {
                    const disabled = !cell.inMonth || (isDisabled?.(cell.date, cell.iso) ?? false);
                    const selected = value === cell.iso;
                    const isToday = isSameDay(cell.date, new Date());

                    return (
                        <button
                            key={cell.iso}
                            type="button"
                            // `aria-disabled` (not `disabled`) would keep the
                            // cell focusable, but for a pure date grid removing
                            // it from the tab order is the better trade-off.
                            disabled={disabled}
                            aria-pressed={selected}
                            aria-label={formatIsoDateLabel(cell.iso, true)}
                            onClick={() => onChange(cell.iso)}
                            className={cn(
                                'relative flex aspect-square items-center justify-center rounded-xl text-sm',
                                'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                !cell.inMonth && 'text-text-secondary/25',
                                cell.inMonth && !disabled && 'text-text-primary hover:bg-bg-elevated hover:text-accent',
                                disabled && cell.inMonth && 'cursor-not-allowed text-text-secondary/40',
                                selected && 'bg-accent font-semibold text-bg-primary hover:bg-accent hover:text-bg-primary',
                                isToday && !selected && 'ring-1 ring-inset ring-accent/40',
                            )}
                        >
                            {cell.date.getDate()}

                            {isToday && !selected && (
                                <span className="sr-only">(сегодня)</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="mt-4 text-xs text-text-secondary">
                Серые дни недоступны: у мастера выходной или нерабочий день.
            </p>
        </div>
    );
}

export default Calendar;
