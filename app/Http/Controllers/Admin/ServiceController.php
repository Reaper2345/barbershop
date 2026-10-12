<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Master;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Service::class);

        $services = Service::query()
            ->with('category')
            /*
             * The list page opens create/edit in a modal, so each row must carry
             * its own master assignment: the update endpoint SYNCS master_ids,
             * and a modal opened without them would detach every master on save.
             */
            ->with('masters:id')
            ->withCount('masters')
            ->orderBy('category_id')
            ->orderBy('name')
            ->paginate(30)
            ->through(function (Service $service): array {
                $row = $service->toArray();
                $row['master_ids'] = $service->masters->pluck('id')->all();
                // The relation itself is not part of the row contract.
                unset($row['masters']);

                return $row;
            });

        return Inertia::render('Admin/Services/Index', [
            ...$this->paginated($services, 'services'),
            // Needed by the modal's category select and master checkbox list.
            'categories' => Category::ordered()->get(['id', 'name', 'slug']),
            'masters' => $this->masterOptions(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Service::class);

        return Inertia::render('Admin/Services/Create', [
            'categories' => Category::ordered()->get(['id', 'name', 'slug']),
            'masters' => $this->masterOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Service::class);

        $data = $this->validatePayload($request);

        $service = Service::create($data);

        // Bulk assignment requested by the brief.
        $this->syncMasters($service, $data['master_ids'] ?? []);

        return redirect()
            ->route('admin.services.index')
            ->with('success', 'Услуга добавлена.');
    }

    public function edit(Service $service): Response
    {
        $this->authorize('update', $service);

        return Inertia::render('Admin/Services/Edit', [
            'service' => $service,
            'categories' => Category::ordered()->get(['id', 'name', 'slug']),
            'masters' => $this->masterOptions(),
            // Pre-tick the masters who already offer this service.
            'assignedMasterIds' => $service->masters()
                ->wherePivot('is_active', true)
                ->pluck('masters.id')
                ->all(),
        ]);
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $data = $this->validatePayload($request);

        $service->update($data);

        $this->syncMasters($service, $data['master_ids'] ?? []);

        return redirect()
            ->route('admin.services.index')
            ->with('success', 'Услуга обновлена.');
    }

    /**
     * Validation shared by store/update.
     *
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'base_price_min' => ['required', 'numeric', 'min:0', 'max:9999999.99'],
            'base_price_max' => ['required', 'numeric', 'min:0', 'max:9999999.99', 'gte:base_price_min'],
            'duration_min' => ['required', 'integer', 'min:5', 'max:600'],
            'is_active' => ['required', 'boolean'],
            'master_ids' => ['nullable', 'array'],
            'master_ids.*' => ['integer', Rule::exists('masters', 'id')],
        ], [
            'base_price_max.gte' => 'Максимальная цена не может быть меньше минимальной.',
            'duration_min.min' => 'Длительность должна быть не менее 5 минут.',
            'category_id.exists' => 'Выбранная категория не найдена.',
        ], [
            'category_id' => 'категория',
            'name' => 'название',
            'base_price_min' => 'минимальная цена',
            'base_price_max' => 'максимальная цена',
            'duration_min' => 'длительность',
            'master_ids' => 'мастера',
        ]);
    }

    /**
     * Attach/detach the service for the selected masters.
     *
     * Pivot rows are never deleted: a master who is unselected simply has
     * `is_active` set to false, so his own price and duration overrides survive
     * a later re-assignment. This mirrors MasterServiceSeeder.
     *
     * @param  list<int>  $masterIds
     */
    private function syncMasters(Service $service, array $masterIds): void
    {
        $selected = array_values(array_unique(array_map('intval', $masterIds)));

        $attached = $service->masters()->pluck('masters.id')->all();

        foreach ($selected as $masterId) {
            // `is_active` is the only key touched, so a master's own price and
            // duration overrides survive an edit here.
            if (in_array($masterId, $attached, true)) {
                $service->masters()->updateExistingPivot($masterId, ['is_active' => true]);

                continue;
            }

            $service->masters()->attach($masterId, ['is_active' => true]);
        }

        // Unselected masters keep their row (and their overrides) but stop
        // offering the service.
        $service->masters()
            ->newPivotStatement()
            ->where('service_id', $service->id)
            ->when(
                $selected !== [],
                fn ($query) => $query->whereNotIn('master_id', $selected),
            )
            ->update(['is_active' => false]);
    }

    /**
     * Masters for the assignment checklist.
     *
     * @return list<array{id: int, name: string}>
     */
    private function masterOptions(): array
    {
        return Master::query()
            ->with('user')
            ->orderBy('id')
            ->get()
            ->map(fn (Master $master): array => [
                'id' => $master->id,
                'name' => $master->user?->name ?? 'Мастер #'.$master->id,
            ])
            ->all();
    }

    public function destroy(Service $service): RedirectResponse
    {
        $this->authorize('delete', $service);

        // appointments.service_id is ON DELETE RESTRICT: deleting a booked
        // service would fail at the database level, so check first.
        if ($service->appointments()->exists()) {
            return back()->with(
                'error',
                'Нельзя удалить услугу: по ней уже есть записи. Отключите её вместо удаления.',
            );
        }

        $service->delete();

        return redirect()
            ->route('admin.services.index')
            ->with('success', 'Услуга удалена.');
    }
}
