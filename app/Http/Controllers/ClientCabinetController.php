<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\CancelAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientCabinetController extends Controller
{
    /**
     * Cabinet overview: the next visit plus a short history.
     */
    public function index(Request $request): Response
    {
        $client = $request->user();

        $upcoming = Appointment::query()
            ->forClient($client)
            ->upcoming()
            ->with(['master.user', 'service'])
            ->limit(5)
            ->get();

        $history = Appointment::query()
            ->forClient($client)
            ->with(['master.user', 'service', 'review'])
            ->orderByDesc('starts_at')
            ->limit(10)
            ->get();

        return Inertia::render('Cabinet/Index', [
            ...$this->toProps(AppointmentResource::collection($upcoming), 'upcoming', $request),
            ...$this->toProps(AppointmentResource::collection($history), 'history', $request),
            'stats' => [
                'total' => Appointment::forClient($client)->count(),
                'completed' => Appointment::forClient($client)
                    ->where('status', AppointmentStatus::Done->value)
                    ->count(),
                'upcoming' => Appointment::forClient($client)->upcoming()->count(),
            ],
        ]);
    }

    /**
     * Full appointment list with filters.
     *
     * The cabinet's tabs map onto `status`:
     *   (empty) / active   → pending + confirmed + in_progress
     *   done               → история
     *   cancelled          → отменённые
     *
     * A single database `status` column cannot express "active", so that tab
     * receives the three sets separately and merges them client-side, while the
     * single-status tabs use the paginator exactly as before.
     */
    public function appointments(Request $request): Response
    {
        $client = $request->user();

        $status = $request->string('status')->toString();

        $isActiveTab = $status === '' || $status === 'active';

        $appointments = Appointment::query()
            ->forClient($client)
            ->with(['master.user', 'service', 'review'])
            ->when(! $isActiveTab, fn ($query) => $query->where('status', $status))
            ->orderByDesc('starts_at')
            ->paginate(15)
            ->withQueryString();

        $props = [
            ...$this->toProps(AppointmentResource::collection($appointments), 'appointments', $request),
            'filters' => ['status' => $status],
        ];

        if ($isActiveTab) {
            // Soonest first: the next visit is the one the client cares about.
            //
            // resolve() matters: an unresolved AnonymousResourceCollection is a
            // Responsable, so Inertia would call toResponse() on it and hand the
            // client {"data": [...]}. The cabinet spreads these three props
            // directly ([...pending, ...confirmed]), which throws
            // "not iterable" on an object and blanks the whole page.
            $byStatus = fn (AppointmentStatus $case): array => AppointmentResource::collection(
                Appointment::query()
                    ->forClient($client)
                    ->where('status', $case->value)
                    ->with(['master.user', 'service', 'review'])
                    ->orderBy('starts_at')
                    ->get(),
            )->resolve($request);

            $props['pending'] = $byStatus(AppointmentStatus::Pending);
            $props['confirmed'] = $byStatus(AppointmentStatus::Confirmed);
            $props['inProgress'] = $byStatus(AppointmentStatus::InProgress);
        }

        return Inertia::render('Cabinet/Appointments', $props);
    }

    /**
     * Client-initiated cancellation. Allowed only while the booking is
     * pending/confirmed and still in the future (see AppointmentPolicy).
     *
     * An optional reason is appended to `client_comment` so the master sees it;
     * the PROMPT 1 schema has no cancellation-reason column.
     */
    public function cancel(CancelAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('cancel', $appointment);

        $update = ['status' => AppointmentStatus::Cancelled];

        $reason = $request->reason();

        if ($reason !== null) {
            $existing = trim((string) $appointment->client_comment);
            $note = 'Отменено клиентом: '.$reason;

            $update['client_comment'] = $existing === ''
                ? $note
                : $existing."\n\n".$note;
        }

        $appointment->update($update);

        return back()->with('success', 'Запись отменена. Будем рады видеть вас снова!');
    }
}
