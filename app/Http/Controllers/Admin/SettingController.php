<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        $settings = Setting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get(['key', 'value', 'group']);

        return Inertia::render('Admin/Settings/Edit', [
            'settings' => $settings,
            // Grouped for tabbed rendering in the admin UI.
            'groups' => $settings->groupBy('group')->keys()->values(),
        ]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        $values = $request->validated('settings');

        // `group` is a MySQL reserved word; Setting::put() goes through Eloquent,
        // which quotes identifiers correctly.
        DB::transaction(function () use ($values): void {
            foreach ($values as $key => $value) {
                $setting = Setting::query()->where('key', $key)->first();

                // Unknown keys are ignored rather than created, so a crafted
                // payload cannot invent new settings.
                if ($setting === null) {
                    continue;
                }

                $setting->update(['value' => $value]);
            }
        });

        // Setting::booted() already flushes the cache on save; clear again so a
        // payload with no actual changes still refreshes a stale entry.
        Setting::flushCache();

        return back()->with('success', 'Настройки сохранены.');
    }
}
