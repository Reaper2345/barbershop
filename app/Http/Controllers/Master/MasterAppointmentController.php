<?php

namespace App\Http\Controllers\Master;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MasterAppointmentController extends Controller
{
    /**
     * The master's booking queue, optionally filtered by status.
     */
    public function index(Request $request): Response
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $status = $request->string('status')->toString();

        $appointments = Appointment::query()
            ->forMaster($master)
            ->with(['client', 'service'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderByDesc('starts_at')
            ->paginate(20)
            ->withQueryString();

        // Shape each row with AppointmentResource while keeping the paginator
        // itself, so the prop stays a Laravel paginator (data / links /
        // current_page / last_page) — the page renders <Pagination> only when it
        // receives that object, not a bare array. Wrapping the paginator in
        // AppointmentResource::collection() would flatten it and silently drop
        // the paging controls.
        $appointments->through(
            fn (Appointment $appointment): array => (new AppointmentResource($appointment))->resolve($request),
        );

        return Inertia::render('Master/Appointments', [
            'appointments' => $appointments,
            'filters' => ['status' => $status],
        ]);
    }

    /**
     * Accept the booking and quote a price — either a range or one exact amount.
     */
    public function confirm(ConfirmAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('manage', $appointment);

        if (! in_array($appointment->status, [AppointmentStatus::Pending, AppointmentStatus::Confirmed], true)) {
            throw ValidationException::withMessages([
                'status' => 'Эту запись нельзя подтвердить: она уже в работе, завершена или отменена.',
            ]);
        }

        $data = $request->validated();
        $offer = $data['price_offer'] ?? null;
        $hasOffer = $offer !== null && $offer !== '';

        $appointment->update([
            'status' => AppointmentStatus::Confirmed,
            // Exactly one pricing shape is stored; the other stays null.
            'master_price_offer' => $hasOffer ? $offer : null,
            'master_price_min' => $hasOffer ? null : ($data['price_min'] ?? null),
            'master_price_max' => $hasOffer ? null : ($data['price_max'] ?? null),
            'master_comment' => $data['master_comment'] ?? $appointment->master_comment,
        ]);

        return back()->with('success', 'Запись подтверждена, клиент увидит стоимость.');
    }

    /**
     * Decline the booking. Freeing the slot is what matters here, so the
     * appointment moves to "cancelled" rather than being deleted.
     *
     * The reason is stored in `master_comment`; StoreAppointmentRequest has no
     * rule for it here, so it is validated inline. It stays optional at the API
     * level (the client UI encourages but does not require it).
     */
    public function reject(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('manage', $appointment);

        if ($appointment->status === AppointmentStatus::Done) {
            throw ValidationException::withMessages([
                'status' => 'Завершённую запись нельзя отклонить.',
            ]);
        }

        $validated = $request->validate([
            'master_comment' => ['nullable', 'string', 'max:2000'],
        ], [], [
            'master_comment' => 'причина отказа',
        ]);

        $appointment->update([
            'status' => AppointmentStatus::Cancelled,
            'master_price_min' => null,
            'master_price_max' => null,
            'master_price_offer' => null,
            // Keep any earlier comment when no new reason was supplied.
            'master_comment' => $validated['master_comment'] ?? $appointment->master_comment,
        ]);

        return back()->with('success', 'Запись отклонена, слот освобождён.');
    }

    /**
     * Advance a confirmed booking: in_progress -> done.
     */
    public function status(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('manage', $appointment);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:in_progress,done'],
        ], [
            'status.in' => 'Недопустимый статус. Разрешены только «в работе» и «завершена».',
            'status.required' => 'Не указан новый статус.',
        ]);

        $target = AppointmentStatus::from($validated['status']);

        // Only forward transitions from the states that make sense.
        $allowedFrom = match ($target) {
            AppointmentStatus::InProgress => [AppointmentStatus::Confirmed],
            AppointmentStatus::Done => [AppointmentStatus::Confirmed, AppointmentStatus::InProgress],
            default => [],
        };

        if (! in_array($appointment->status, $allowedFrom, true)) {
            throw ValidationException::withMessages([
                'status' => 'Переход из статуса «'.$appointment->status->label().'» в «'.$target->label().'» невозможен.',
            ]);
        }

        $appointment->update(['status' => $target]);

        return back()->with('success', 'Статус записи обновлён: '.$target->label().'.');
    }
}
