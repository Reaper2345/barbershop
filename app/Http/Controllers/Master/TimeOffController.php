<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimeOffRequest;
use App\Models\TimeOff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TimeOffController extends Controller
{
    public function store(StoreTimeOffRequest $request): RedirectResponse
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('manageSchedule', $master);

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
            'reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Выходной добавлен.');
    }

    public function destroy(Request $request, TimeOff $timeOff): RedirectResponse
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('manageSchedule', $master);

        // Route model binding resolves the row globally, so verify ownership.
        abort_if($timeOff->master_id !== $master->id, 403);

        $timeOff->delete();

        return back()->with('success', 'Выходной удалён.');
    }
}
