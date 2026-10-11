<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Master;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\TimeOff;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Generates the bookable time grid for a master on a given day.
 *
 * The grid is derived at read time rather than stored, so it always reflects
 * the current schedule, time off, existing bookings and service duration.
 */
class SlotService
{
    /**
     * Distance between two candidate start times, in minutes.
     */
    public const SLOT_INTERVAL_MINUTES = 30;

    /**
     * All bookable slots for a master/service pair on one date.
     *
     * @return list<array{time: string, starts_at: string, ends_at: string}>
     */
    public function getAvailableSlots(Master $master, Service $service, Carbon $date): array
    {
        $context = $this->buildDayContext($master, $service, $date);

        if ($context === null) {
            return [];
        }

        $slots = [];
        $cursor = $context['day_start']->copy();

        while ($cursor->lessThanOrEqualTo($context['latest_start'])) {
            if ($this->isSlotFree($cursor, $context)) {
                $slots[] = [
                    'time' => $cursor->format('H:i'),
                    'starts_at' => $cursor->toIso8601String(),
                    'ends_at' => $cursor->addMinutes($context['service_minutes'])->toIso8601String(),
                ];
            }

            $cursor = $cursor->addMinutes(self::SLOT_INTERVAL_MINUTES);
        }

        return $slots;
    }

    /**
     * Whether the exact start time can still be booked.
     *
     * This is the authoritative check used by BookingController@store, which is
     * why it re-validates against live data instead of trusting a posted slot.
     */
    public function isSlotBookable(Master $master, Service $service, Carbon $startsAt): bool
    {
        // Normalise first: the request may carry an offset that differs from the
        // application timezone, which would otherwise shift the whole grid.
        $startsAt = $this->normalize($startsAt);
        $context = $this->buildDayContext($master, $service, $startsAt);

        if ($context === null) {
            return false;
        }

        $candidate = $this->dateFor($context['date'], $startsAt->format('H:i'));

        if ($candidate === null) {
            return false;
        }

        // Only exact grid positions are bookable, not arbitrary minutes.
        if (! $this->isOnGrid($candidate, $context['day_start'])) {
            return false;
        }

        return $this->isSlotFree($candidate, $context);
    }

    /**
     * Everything needed to evaluate the day, or null when the master cannot work
     * that day at all (no active schedule, or an explicit day off).
     *
     * @return array{
     *     date: Carbon,
     *     day_start: Carbon,
     *     latest_start: Carbon,
     *     break_start: Carbon|null,
     *     break_end: Carbon|null,
     *     service_minutes: int,
     *     busy: list<array{0: Carbon, 1: Carbon}>
     * }|null
     */
    private function buildDayContext(Master $master, Service $service, Carbon $date): ?array
    {
        $schedule = $this->scheduleFor($master, (int) $date->dayOfWeek);

        if ($schedule === null) {
            return null;
        }

        if ($this->hasTimeOff($master, $date)) {
            return null;
        }

        $serviceMinutes = $this->serviceDuration($master, $service);

        if ($serviceMinutes <= 0) {
            return null;
        }

        /*
         * `start_time` / `end_time` are declared NOT NULL in the schedules
         * migration, but a row written by a future importer or a manual UPDATE
         * could still be empty. `dateFor()` returns null for those, and the old
         * code then called `$dayEnd->subMinutes(...)` on null — a fatal
         * "Call to a member function on null" 500 rather than an empty day.
         */
        $dayStart = $this->dateFor($date, $schedule->start_time);
        $dayEnd = $this->dateFor($date, $schedule->end_time);

        if ($dayStart === null || $dayEnd === null) {
            return null;
        }

        // A working day that ends before it starts is unusable, not fatal.
        if ($dayEnd->lessThanOrEqualTo($dayStart)) {
            return null;
        }

        // The last possible start must leave room for the whole service.
        $latestStart = $dayEnd->copy()->subMinutes($serviceMinutes);

        // A service longer than the working day can never be booked.
        if ($latestStart->lessThan($dayStart)) {
            return null;
        }

        return [
            'date' => $dayStart->copy()->startOfDay(),
            'day_start' => $dayStart,
            'latest_start' => $latestStart,
            /*
             * Break handling: either bound may legitimately be null (no break is
             * configured for this weekday). `dateFor()` maps both null and ""
             * to null, and `overlapsBreak()` treats a null pair as "no break",
             * so a half-configured break degrades to no break instead of
             * throwing.
             */
            'break_start' => $this->dateFor($date, $schedule->break_start),
            'break_end' => $this->dateFor($date, $schedule->break_end),
            'service_minutes' => $serviceMinutes,
            'busy' => $this->busyIntervals($master, $date),
        ];
    }

    /**
     * Active schedule row for the given weekday, if any.
     */
    private function scheduleFor(Master $master, int $weekday): ?Schedule
    {
        return $master->schedules()
            ->where('weekday', $weekday)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Whether the master has an explicit day off.
     */
    private function hasTimeOff(Master $master, Carbon $date): bool
    {
        return TimeOff::query()
            ->where('master_id', $master->id)
            ->whereDate('date', $date->toDateString())
            ->exists();
    }

    /**
     * Duration for this master/service pair: the master_service override wins
     * over the catalogue default.
     *
     * Every step is type-checked. `master_service.duration_min` is nullable by
     * design (null means "inherit"), and a 0 would make the slot loop divide by
     * nothing useful — worse, `addMinutes(0)` produces an endless run of
     * identical slots. Returning 0 lets the caller treat the day as unbookable.
     */
    private function serviceDuration(Master $master, Service $service): int
    {
        $pivot = $master->services()
            ->where('services.id', $service->id)
            ->first()
            ?->pivot;

        $override = $pivot?->duration_min;
        $fallback = $service->duration_min;

        $minutes = is_numeric($override)
            ? (int) $override
            : (is_numeric($fallback) ? (int) $fallback : 0);

        return max(0, $minutes);
    }

    /**
     * Bookings that still hold a slot, as [start, end] pairs.
     *
     * Rows with an unparseable or missing boundary are skipped rather than
     * allowed to throw: one bad appointment must not take down the whole grid.
     *
     * @return list<array{0: Carbon, 1: Carbon}>
     */
    private function busyIntervals(Master $master, Carbon $date): array
    {
        $appointments = Appointment::query()
            ->where('master_id', $master->id)
            ->whereDate('starts_at', $date->toDateString())
            ->whereIn('status', AppointmentStatus::activeValues())
            ->orderBy('starts_at')
            ->get(['starts_at', 'ends_at']);

        $intervals = [];

        foreach ($appointments as $appointment) {
            $start = $this->toCarbon($appointment->starts_at);
            $end = $this->toCarbon($appointment->ends_at);

            if ($start === null || $end === null) {
                continue;
            }

            $intervals[] = [$start, $end];
        }

        return $intervals;
    }

    /**
     * @param  array{
     *     date: Carbon,
     *     latest_start: Carbon,
     *     break_start: Carbon|null,
     *     break_end: Carbon|null,
     *     service_minutes: int,
     *     busy: list<array{0: Carbon, 1: Carbon}>
     * }  $context
     */
    private function isSlotFree(Carbon $candidate, array $context): bool
    {
        $serviceMinutes = $context['service_minutes'];
        $candidateEnd = $candidate->copy()->addMinutes($serviceMinutes);

        // Must finish by the end of the working day.
        if ($candidate->greaterThan($context['latest_start'])) {
            return false;
        }

        // No slot in the past, and none starting this very second — a slot that
        // begins at "now" is not actually bookable. isPast() alone would let it
        // through, because it is false for a time equal to now.
        if (! $candidate->isFuture()) {
            return false;
        }

        // Never straddle the lunch break.
        if ($this->overlapsBreak($candidate, $candidateEnd, $context)) {
            return false;
        }

        // Never overlap an existing live booking.
        foreach ($context['busy'] as [$busyStart, $busyEnd]) {
            if ($candidate->lessThan($busyEnd) && $candidateEnd->greaterThan($busyStart)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array{break_start: Carbon|null, break_end: Carbon|null}  $context
     */
    private function overlapsBreak(Carbon $candidate, Carbon $candidateEnd, array $context): bool
    {
        if ($context['break_start'] === null || $context['break_end'] === null) {
            return false;
        }

        return $candidate->lessThan($context['break_end'])
            && $candidateEnd->greaterThan($context['break_start']);
    }

    /**
     * True when $candidate sits on an exact interval boundary after $dayStart.
     */
    private function isOnGrid(Carbon $candidate, Carbon $dayStart): bool
    {
        $offset = $dayStart->diffInMinutes($candidate, false);

        return $offset >= 0 && $offset % self::SLOT_INTERVAL_MINUTES === 0;
    }

    /**
     * Combine a date with a stored time value ("HH:MM" or "HH:MM:SS").
     *
     * Returns null for a missing value AND for an unparseable one. The old
     * implementation called `Carbon::parse()` unguarded, so a malformed value in
     * a `time` column (or a config timezone that is not a string) escaped as an
     * exception and produced a 500 on GET /api/slots. A broken time now simply
     * means "this day has no usable grid".
     */
    private function dateFor(Carbon $date, ?string $time): ?Carbon
    {
        if ($time === null || trim($time) === '') {
            return null;
        }

        $time = trim($time);

        // Accept "H:MM", "HH:MM" and "HH:MM:SS"; reject anything else.
        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $time, $matches) !== 1) {
            return null;
        }

        $hour = (int) $matches[1];
        $minute = (int) $matches[2];
        $second = isset($matches[3]) ? (int) $matches[3] : 0;

        if ($hour > 23 || $minute > 59 || $second > 59) {
            return null;
        }

        try {
            return Carbon::createFromFormat(
                '!Y-m-d H:i:s',
                $date->format('Y-m-d').sprintf(' %02d:%02d:%02d', $hour, $minute, $second),
                $this->timezone(),
            ) ?: null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Coerce a model value into a Carbon, or null when that is impossible.
     *
     * `starts_at` / `ends_at` are cast to datetime on the model, so they usually
     * arrive as Carbon already; this keeps the path safe for a raw string, a
     * null, or garbage.
     */
    private function toCarbon(mixed $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value);
        }

        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value, $this->timezone());
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Application timezone, defensively coerced to a string.
     */
    private function timezone(): string
    {
        $timezone = config('app.timezone');

        return is_string($timezone) && $timezone !== '' ? $timezone : 'UTC';
    }

    /**
     * Re-express an incoming datetime in the application timezone.
     */
    private function normalize(Carbon $date): Carbon
    {
        return $date->copy()->setTimezone($this->timezone());
    }
}
