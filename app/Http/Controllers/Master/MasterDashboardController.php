<?php

namespace App\Http\Controllers\Master;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MasterDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        $this->authorize('view', $master);

        $today = Carbon::today();
        $weekStart = Carbon::today()->startOfWeek();
        $monthStart = Carbon::today()->startOfMonth();

        $todayAppointments = Appointment::query()
            ->forMaster($master)
            ->whereDate('starts_at', $today->toDateString())
            ->with(['client', 'service'])
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('Master/Dashboard', [
            'stats' => [
                'today_total' => $todayAppointments->count(),
                'pending' => Appointment::forMaster($master)
                    ->where('status', AppointmentStatus::Pending->value)
                    ->count(),
                'upcoming' => Appointment::forMaster($master)->upcoming()->count(),
                'completed' => Appointment::forMaster($master)
                    ->where('status', AppointmentStatus::Done->value)
                    ->count(),
                'reviews' => Review::where('master_id', $master->id)->count(),
                'rating' => (float) $master->rating,
                // Approved reviews only: the same set the rating averages over.
                'reviews_count' => $master->reviews()->where('is_approved', true)->count(),
                'reviews_url' => route('reviews.index', ['master' => $master->id]),
                // Dashboard cards added in PROMPT 5.
                'week_total' => Appointment::forMaster($master)
                    ->where('starts_at', '>=', $weekStart)
                    ->count(),
                'week_revenue' => $this->revenueSince($master->id, $monthStart),
            ],
            // resolve() because an unresolved AnonymousResourceCollection is a
            // Responsable: Inertia would call toResponse() on it and deliver
            // {"data": [...]}. The dashboard types this prop as a plain array and
            // spreads it ([...todayAppointments]), so the wrapper blanks the page.
            'todayAppointments' => AppointmentResource::collection($todayAppointments)->resolve($request),
            // Raw storage path of the master's own photo; null means the public
            // card falls back to a placeholder, which the dashboard nudges the
            // master to fix by linking to /master/profile.
            'photo' => $master->photo,
            // The master's own working week, for a compact dashboard widget.
            'schedules' => $master->schedules()
                ->where('is_active', true)
                ->orderBy('weekday')
                ->get(),
        ]);
    }

    /**
     * Revenue from completed visits, using the agreed price.
     *
     * Precedence matches Appointment::finalPriceLabel: an exact offer wins,
     * otherwise the bottom of the quoted range.
     */
    private function revenueSince(int $masterId, Carbon $from): float
    {
        $sum = Appointment::query()
            ->where('master_id', $masterId)
            ->where('status', AppointmentStatus::Done->value)
            ->where('starts_at', '>=', $from)
            ->get(['master_price_offer', 'master_price_min'])
            ->sum(fn (Appointment $appointment): float => (float) (
                $appointment->master_price_offer
                ?? $appointment->master_price_min
                ?? 0
            ));

        return round((float) $sum, 2);
    }
}
