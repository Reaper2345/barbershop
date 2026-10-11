<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Master;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    /**
     * Sortable columns allow-list.
     *
     * The request's `sort` value is never interpolated into the query: it is
     * looked up here and only a known key reaches `orderBy()`. `cost` maps to the
     * agreed price with the same precedence Appointment::finalPriceLabel uses
     * (exact offer, else the bottom of the quoted range, else the catalogue
     * minimum), so the "Стоимость" column sorts by what the client will pay.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'starts_at' => 'starts_at',
        'created_at' => 'created_at',
        'cost' => 'COALESCE(master_price_offer, master_price_min, 0)',
        'status' => 'status',
        'id' => 'id',
    ];

    /**
     * Admin-wide booking list (index + show + status update only).
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $masterId = $request->integer('master_id');
        $date = $request->string('date')->toString();

        // Sorting: validated against the allow-list, with a safe default.
        $sort = $request->string('sort')->toString();
        $sortColumn = self::SORTABLE[$sort] ?? null;

        $dir = $request->string('dir')->toString() === 'asc' ? 'asc' : 'desc';

        $appointments = Appointment::query()
            ->with(['client', 'master.user', 'service'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($masterId > 0, fn ($query) => $query->where('master_id', $masterId))
            ->when($date !== '', fn ($query) => $query->whereDate('starts_at', $date))
            ->when(
                $sortColumn !== null,
                // raw expression because COALESCE cannot be expressed as a column
                fn ($query) => $query->orderByRaw("{$sortColumn} {$dir}"),
                fn ($query) => $query->orderByDesc('starts_at'),
            )
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Appointments/Index', [
            ...$this->toProps(AppointmentResource::collection($appointments), 'appointments', $request),
            'masters' => Master::with('user')->get(),
            'statuses' => self::statusOptions(),
            'filters' => [
                'status' => $status,
                'master_id' => $masterId > 0 ? $masterId : null,
                'date' => $date,
                'sort' => $sortColumn === null ? null : (string) array_search($sortColumn, self::SORTABLE, true),
                'dir' => $dir,
            ],
        ]);
    }

    public function show(Request $request, Appointment $appointment): Response
    {
        $appointment->load(['client', 'master.user', 'service', 'review']);

        return Inertia::render('Admin/Appointments/Show', [
            'appointment' => (new AppointmentResource($appointment))->resolve($request),
            'statuses' => self::statusOptions(),
        ]);
    }

    /**
     * Status list for the admin filter and status dropdowns.
     *
     * @return list<array{value: string, label: string}>
     */
    private static function statusOptions(): array
    {
        return array_map(
            static fn (AppointmentStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            AppointmentStatus::cases(),
        );
    }

    /**
     * Admins may force any status transition (corrections, no-shows, refunds).
     */
    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', AppointmentStatus::values())],
            'master_comment' => ['nullable', 'string', 'max:2000'],
        ], [
            'status.in' => 'Недопустимый статус записи.',
            'status.required' => 'Не указан новый статус.',
        ], [
            'status' => 'статус',
            'master_comment' => 'комментарий мастера',
        ]);

        $target = AppointmentStatus::from($validated['status']);

        if ($target === $appointment->status && ! array_key_exists('master_comment', $validated)) {
            throw ValidationException::withMessages([
                'status' => 'Запись уже находится в этом статусе.',
            ]);
        }

        $appointment->update([
            'status' => $target,
            'master_comment' => $validated['master_comment'] ?? $appointment->master_comment,
        ]);

        return back()->with('success', 'Статус записи обновлён: '.$target->label().'.');
    }
}
