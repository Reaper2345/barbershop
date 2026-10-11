<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMasterServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterServiceController extends Controller
{
    /**
     * Every active catalogue service, marking which ones this master offers.
     */
    public function index(Request $request): Response
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $offered = $master->services()
            ->get()
            ->keyBy('id');

        $services = Service::query()
            ->active()
            ->with('category')
            ->orderBy('category_id')
            ->orderBy('name')
            ->get()
            ->map(function (Service $service) use ($offered): array {
                $pivot = $offered->get($service->id)?->pivot;

                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'category' => $service->category?->name,
                    'base_price_min' => (float) $service->base_price_min,
                    'base_price_max' => (float) $service->base_price_max,
                    'base_price_label' => $service->priceLabel(),
                    'base_duration_min' => (int) $service->duration_min,
                    // Null overrides mean "inherit the catalogue value".
                    'price_min' => $pivot?->price_min === null ? null : (float) $pivot->price_min,
                    'price_max' => $pivot?->price_max === null ? null : (float) $pivot->price_max,
                    'duration_min' => $pivot?->duration_min === null ? null : (int) $pivot->duration_min,
                    'is_active' => $pivot === null ? false : (bool) $pivot->is_active,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Master/Services', [
            'services' => $services,
        ]);
    }

    /**
     * Updates this master's price/duration/availability for one service.
     */
    public function update(UpdateMasterServiceRequest $request, Service $service): RedirectResponse
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $data = $request->validated();

        // A service the master does not offer yet is attached on first save.
        $master->services()->syncWithoutDetaching([
            $service->id => [
                'price_min' => $data['price_min'] ?? null,
                'price_max' => $data['price_max'] ?? null,
                'duration_min' => $data['duration_min'] ?? null,
                'is_active' => (bool) $data['is_active'],
            ],
        ]);

        return back()->with('success', 'Услуга обновлена.');
    }
}
