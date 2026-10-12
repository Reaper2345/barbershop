<?php

namespace App\Http\Controllers\Master;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBulkTimeOffRequest;
use App\Http\Requests\StoreTimeOffRequest;
use App\Models\Appointment;
use App\Models\Master;
use App\Models\TimeOff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class TimeOffController extends Controller
{
    /**
     * Shared by both endpoints: the authenticated master, or 403 if the profile
     * row is missing.
     */
    private function master(Request $request): Master
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('manageSchedule', $master);

        return $master;
    }

    /**
     * Single day (kept for compatibility with the original form/payload).
     */
    public function store(StoreTimeOffRequest $request): RedirectResponse
    {
        $master = $this->master($request);

        $data = $request->validated();

        // unique(master_id, date) in the schema: surface a readable error
        // instead of letting the insert hit the constraint.
        $exists = TimeOff::query()
            ->where('master_id', $master->id)
            ->whereDate('date', $data['date'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'date' => 'На эту дату выходной уже добавлен.',
            ]);
        }

        TimeOff::create([
            'master_id' => $master->id,
            'date' => $data['date'],
            'type' => TimeOff::TYPE_DAY_OFF,
            'reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Выходной добавлен.');
    }

    /**
     * POST /master/time-off/bulk — the quick actions (отпуск / выходной /
     * больничный).
     *
     * ONE ROW PER DAY. The table is built that way (unique(master_id, date)) and
     * SlotService checks availability per day, so a period is expanded here
     * rather than stored as a range: every day keeps its own row, its own delete
     * button, and the database keeps enforcing "no duplicate day".
     *
     * Overlapping periods are rejected up front — a range that touches an
     * existing row would otherwise fail halfway through with a constraint error.
     */
    public function bulk(StoreBulkTimeOffRequest $request): RedirectResponse
    {
        $master = $this->master($request);

        $data = $request->validated();

        $from = Carbon::parse($data['date_from'])->startOfDay();
        $to = Carbon::parse($data['date_to'])->startOfDay();

        $conflict = TimeOff::query()
            ->where('master_id', $master->id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->first();

        if ($conflict !== null) {
            throw ValidationException::withMessages([
                'date_from' => 'На '.$this->formatDay($conflict->date).' уже отмечен '
                    .mb_strtolower($conflict->typeLabel())
                    .'. Выберите другие даты или удалите существующую запись.',
            ]);
        }

        $reason = $data['reason'] ?? null;
        $now = Carbon::now();
        $rows = [];

        for ($day = $from->copy(); $day->lessThanOrEqualTo($to); $day->addDay()) {
            $rows[] = [
                'master_id' => $master->id,
                'date' => $day->toDateString(),
                'type' => $data['type'],
                'reason' => $reason,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // One statement: the loop above is already the validation-safe path, and
        // nothing else may interleave inside it.
        TimeOff::insert($rows);

        return back()->with('success', $this->confirmation($master, $data['type'], $from, $to));
    }

    public function destroy(Request $request, TimeOff $timeOff): RedirectResponse
    {
        $master = $this->master($request);

        // Route model binding resolves the row globally, so verify ownership.
        abort_if($timeOff->master_id !== $master->id, 403);

        $timeOff->delete();

        return back()->with('success', 'Выходной удалён.');
    }

    /**
     * Confirmation line for the flash, including the warning about bookings that
     * now fall inside the absence.
     */
    private function confirmation(Master $master, string $type, Carbon $from, Carbon $to): string
    {
        $label = TimeOff::TYPES[$type] ?? TimeOff::TYPES[TimeOff::TYPE_DAY_OFF];

        // «Выходной добавлен» reads better than «Выходной оформлен».
        $verb = $type === TimeOff::TYPE_DAY_OFF ? 'добавлен' : 'оформлен';

        $message = $label.' '.$verb.': '.$this->formatRange($from, $to).'.';

        $appointments = Appointment::query()
            ->where('master_id', $master->id)
            // «status not cancelled» — pending, confirmed, in_progress and done
            // all still occupy the calendar.
            ->where('status', '!=', AppointmentStatus::Cancelled->value)
            ->whereBetween('starts_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->count();

        if ($appointments > 0) {
            $message .= ' У вас '.$appointments.' '
                .$this->plural($appointments, 'запись', 'записи', 'записей')
                .' на эти даты — свяжитесь с клиентами.';
        }

        return $message;
    }

    /** "15 октября", or "15–19 октября", or "28 октября — 2 ноября". */
    private function formatRange(Carbon $from, Carbon $to): string
    {
        if ($from->isSameDay($to)) {
            return $this->formatDay($from);
        }

        if ($from->month === $to->month && $from->year === $to->year) {
            return $from->day.'–'.$this->formatDay($to);
        }

        return $this->formatDay($from).' — '.$this->formatDay($to);
    }

    private function formatDay(Carbon $day): string
    {
        return $day->day.' '.self::MONTHS[$day->month];
    }

    /** Russian plural, since trans_choice()/Str::plural() are English-only. */
    private function plural(int $count, string $one, string $few, string $many): string
    {
        $mod100 = $count % 100;
        $mod10 = $count % 10;

        if ($mod100 > 10 && $mod100 < 20) {
            return $many;
        }

        return match ($mod10) {
            1 => $one,
            2, 3, 4 => $few,
            default => $many,
        };
    }

    /** @var array<int, string> */
    private const MONTHS = [
        1 => 'января',
        2 => 'февраля',
        3 => 'марта',
        4 => 'апреля',
        5 => 'мая',
        6 => 'июня',
        7 => 'июля',
        8 => 'августа',
        9 => 'сентября',
        10 => 'октября',
        11 => 'ноября',
        12 => 'декабря',
    ];
}
