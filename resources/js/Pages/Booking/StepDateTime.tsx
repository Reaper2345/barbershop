import { Calendar } from '@/Components/Booking/Calendar';
import { SlotGrid } from '@/Components/Booking/SlotGrid';
import { BOOKING_COPY } from '@/lib/content';
import { formatIsoDateLabel } from '@/lib/date';
import { ClockIcon } from '@/lib/icons';
import { formatDuration } from '@/lib/format';
import type { BookingSlot } from '@/types';

/*
|--------------------------------------------------------------------------
| Step 3 — date & time
|--------------------------------------------------------------------------
| Calendar on the left, the SlotService grid on the right. The parent owns the
| fetching; this component only presents state and reports intent.
|
| The disabled-day rule is the union of three conditions and is computed by the
| parent (`isDisabled`), because only the parent knows the master's schedules.
*/

export interface StepDateTimeProps {
    month: Date;
    onMonthChange: (month: Date) => void;
    selectedDate: string | null;
    onSelectDate: (isoDate: string) => void;
    minMonth?: Date;
    maxMonth?: Date;
    isDisabled?: (date: Date, isoDate: string) => boolean;

    slots: BookingSlot[];
    selectedSlot: BookingSlot | null;
    onSelectSlot: (slot: BookingSlot) => void;
    loading: boolean;
    error: string | null;
    onRetry: () => void;

    /** Duration of the master/service pair, shown next to the grid. */
    durationMinutes?: number | null;
    className?: string;
}

export function StepDateTime({
    month,
    onMonthChange,
    selectedDate,
    onSelectDate,
    minMonth,
    maxMonth,
    isDisabled,
    slots,
    selectedSlot,
    onSelectSlot,
    loading,
    error,
    onRetry,
    durationMinutes,
    className,
}: StepDateTimeProps) {
    return (
        <div className={className}>
            <header>
                <h2 className="font-display text-2xl font-semibold text-text-primary">
                    {BOOKING_COPY.datetimeTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {BOOKING_COPY.datetimeSubtitle}
                </p>
            </header>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                {/* Calendar */}
                <div>
                    <p className="mb-3 text-xs uppercase tracking-wider text-text-secondary">
                        {BOOKING_COPY.pickDate}
                    </p>

                    <Calendar
                        value={selectedDate}
                        onChange={onSelectDate}
                        month={month}
                        onMonthChange={onMonthChange}
                        minDate={minMonth}
                        maxDate={maxMonth}
                        isDisabled={isDisabled}
                    />
                </div>

                {/* Slots */}
                <div>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                        <p className="text-xs uppercase tracking-wider text-text-secondary">
                            {BOOKING_COPY.pickTime}
                        </p>

                        {selectedDate !== null && (
                            <p className="text-sm text-text-primary">
                                {formatIsoDateLabel(selectedDate, true)}
                            </p>
                        )}

                        {durationMinutes !== null && durationMinutes !== undefined && durationMinutes > 0 && (
                            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <ClockIcon className="h-3.5 w-3.5" />
                                Длительность: {formatDuration(durationMinutes)}
                            </p>
                        )}
                    </div>

                    {selectedDate === null ? (
                        <p className="rounded-2xl border border-dashed border-border bg-bg-secondary/40 px-6 py-10 text-center text-sm text-text-secondary">
                            {BOOKING_COPY.pickDateFirst}
                            <span className="mt-1 block text-xs text-text-secondary/70">
                                {BOOKING_COPY.pickDateFirstHint}
                            </span>
                        </p>
                    ) : (
                        <SlotGrid
                            slots={slots}
                            selected={selectedSlot}
                            onSelect={onSelectSlot}
                            loading={loading}
                            error={error}
                            onRetry={onRetry}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default StepDateTime;
