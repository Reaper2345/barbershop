<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateScheduleRequest;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * All seven weekdays, so the UI can render a complete weekly grid even for
     * days without a Schedule row yet.
     */
    public function edit(Request $request): Response
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('manageSchedule', $master);

        $existing = $master->schedules()->get()->keyBy('weekday');

        $days = collect(range(0, 6))->map(function (int $weekday) use ($existing): array {
            $schedule = $existing->get($weekday);

            return [
                'weekday' => $weekday,
                'label' => Schedule::WEEKDAYS[$weekday],
                'is_active' => $schedule?->is_active ?? false,
                'start_time' => $schedule === null ? '10:00' : substr((string) $schedule->start_time, 0, 5),
                'end_time' => $schedule === null ? '20:00' : substr((string) $schedule->end_time, 0, 5),
                'break_start' => $schedule?->break_start === null ? null : substr((string) $schedule->break_start, 0, 5),
                'break_end' => $schedule?->break_end === null ? null : substr((string) $schedule->break_end, 0, 5),
            ];
        })->all();

        return Inertia::render('Master/Schedule', [
            'days' => $days,
            'timeOff' => $master->timeOff()->upcoming()->get(),
        ]);
    }

    public function update(UpdateScheduleRequest $request): RedirectResponse
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('manageSchedule', $master);

        foreach ($request->validated('days') as $weekday => $day) {
            $isActive = (bool) $day['is_active'];

            // Days that are switched off keep their row but are flagged inactive,
            // so historical slots stay explainable.
            Schedule::updateOrCreate(
                ['master_id' => $master->id, 'weekday' => (int) $weekday],
                [
                    'start_time' => $this->normalizeTime($day['start_time'] ?? null, '10:00'),
                    'end_time' => $this->normalizeTime($day['end_time'] ?? null, '20:00'),
                    'break_start' => $this->normalizeTime($day['break_start'] ?? null, null),
                    'break_end' => $this->normalizeTime($day['break_end'] ?? null, null),
                    'is_active' => $isActive,
                ],
            );
        }

        return back()->with('success', 'График работы обновлён.');
    }

    /**
     * Stored TIME columns need seconds; the form posts "HH:MM".
     */
    private function normalizeTime(?string $time, ?string $default): ?string
    {
        if ($time === null || $time === '') {
            return $default === null ? null : $default.':00';
        }

        return strlen($time) === 5 ? $time.':00' : $time;
    }
}
