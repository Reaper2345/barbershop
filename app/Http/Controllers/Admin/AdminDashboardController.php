<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Category;
use App\Models\Master;
use App\Models\Page;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Master::class);

        $today = Carbon::today();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'masters_total' => Master::count(),
                'masters_active' => Master::active()->count(),
                'services_total' => Service::count(),
                'categories_total' => Category::count(),
                'users_total' => User::count(),
                'clients_total' => User::where('role', Role::Client->value)->count(),
                'appointments_total' => Appointment::count(),
                'appointments_today' => Appointment::whereDate('starts_at', $today->toDateString())->count(),
                'appointments_pending' => Appointment::where('status', AppointmentStatus::Pending->value)->count(),
                'appointments_upcoming' => Appointment::upcoming()->count(),
                'reviews_total' => Review::count(),
                'reviews_pending' => Review::where('is_approved', false)->count(),
                'pages_total' => Page::count(),
                // The four-row metric table requested for this screen.
                'metrics' => $this->metrics(),
            ],
            // Table 2: best performers this month.
            'topMasters' => $this->topMasters(),
            // Table 3: the latest bookings.
            'recentAppointments' => $this->recentAppointments(),
        ]);
    }

    /**
     * The | Метрика | Сегодня | Неделя | Месяц | Всего | table.
     *
     * Revenue counts completed visits only and uses the price the master agreed
     * (offer, else the bottom of the quoted range, else nothing) — the same
     * precedence as Appointment::finalPriceLabel, so the dashboard total cannot
     * disagree with an individual appointment card.
     *
     * @return list<array<string, mixed>>
     */
    private function metrics(): array
    {
        $today = Carbon::today();
        $weekStart = Carbon::today()->startOfWeek();
        $monthStart = Carbon::today()->startOfMonth();

        $appointments = fn (Carbon $from = null) => Appointment::query()
            ->when($from !== null, fn ($query) => $query->where('starts_at', '>=', $from));

        $clients = fn (Carbon $from = null) => User::query()
            ->where('role', Role::Client->value)
            ->when($from !== null, fn ($query) => $query->where('created_at', '>=', $from));

        $cancelled = fn (Carbon $from = null) => Appointment::query()
            ->where('status', AppointmentStatus::Cancelled->value)
            ->when($from !== null, fn ($query) => $query->where('starts_at', '>=', $from));

        $revenue = function (Carbon $from = null): float {
            $query = Appointment::query()
                ->where('status', AppointmentStatus::Done->value)
                ->when($from !== null, fn ($q) => $q->where('starts_at', '>=', $from));

            // Priority: an exact offer, then the minimum of the quoted range.
            $sum = $query->get(['master_price_offer', 'master_price_min'])
                ->sum(fn (Appointment $appointment): float => (float) (
                    $appointment->master_price_offer
                    ?? $appointment->master_price_min
                    ?? 0
                ));

            return round((float) $sum, 2);
        };

        return [
            [
                'key' => 'appointments',
                'label' => 'Записи',
                'today' => $appointments($today)->whereDate('starts_at', $today->toDateString())->count(),
                'week' => $appointments($weekStart)->count(),
                'month' => $appointments($monthStart)->count(),
                'total' => Appointment::count(),
                'format' => 'count',
                'tone' => 'accent',
            ],
            [
                'key' => 'revenue',
                'label' => 'Выручка (завершённые)',
                'today' => $revenue($today),
                'week' => $revenue($weekStart),
                'month' => $revenue($monthStart),
                'total' => $revenue(),
                'format' => 'money',
                'tone' => 'success',
            ],
            [
                'key' => 'clients',
                'label' => 'Новые клиенты',
                'today' => $clients($today)->whereDate('created_at', $today->toDateString())->count(),
                'week' => $clients($weekStart)->count(),
                'month' => $clients($monthStart)->count(),
                'total' => User::where('role', Role::Client->value)->count(),
                'format' => 'count',
                'tone' => 'neutral',
            ],
            [
                'key' => 'cancellations',
                'label' => 'Отмены',
                'today' => $cancelled($today)->whereDate('starts_at', $today->toDateString())->count(),
                'week' => $cancelled($weekStart)->count(),
                'month' => $cancelled($monthStart)->count(),
                'total' => Appointment::where('status', AppointmentStatus::Cancelled->value)->count(),
                'format' => 'count',
                'tone' => 'danger',
            ],
        ];
    }

    /**
     * Top five masters by completed bookings, with revenue and rating.
     *
     * @return list<array<string, mixed>>
     */
    private function topMasters(): array
    {
        return Master::query()
            ->with('user')
            ->withCount('appointments')
            ->orderByDesc('appointments_count')
            ->limit(5)
            ->get()
            ->map(function (Master $master): array {
                $revenue = Appointment::query()
                    ->where('master_id', $master->id)
                    ->where('status', AppointmentStatus::Done->value)
                    ->get(['master_price_offer', 'master_price_min'])
                    ->sum(fn (Appointment $appointment): float => (float) (
                        $appointment->master_price_offer
                        ?? $appointment->master_price_min
                        ?? 0
                    ));

                return [
                    'id' => $master->id,
                    'name' => $master->user?->name ?? 'Мастер #'.$master->id,
                    'appointments_count' => (int) $master->appointments_count,
                    'revenue' => round((float) $revenue, 2),
                    'rating' => (float) $master->rating,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * The ten most recent bookings, shaped for the dashboard table.
     *
     * @return list<array<string, mixed>>
     */
    private function recentAppointments(): array
    {
        return Appointment::query()
            ->with(['client', 'master.user', 'service'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'id' => $appointment->id,
                'starts_at' => $appointment->starts_at?->toIso8601String(),
                'date_label' => $appointment->starts_at?->translatedFormat('j F Y'),
                'time_label' => $appointment->starts_at?->format('H:i'),
                'status' => $appointment->status->value,
                'status_label' => $appointment->status->label(),
                'price_label' => $appointment->final_price_label,
                'client' => $appointment->client === null ? null : [
                    'id' => $appointment->client->id,
                    'name' => $appointment->client->name,
                ],
                'master' => $appointment->master === null ? null : [
                    'id' => $appointment->master->id,
                    'name' => $appointment->master->user?->name,
                ],
                'service' => $appointment->service === null ? null : [
                    'id' => $appointment->service->id,
                    'name' => $appointment->service->name,
                ],
            ])
            ->all();
    }
}
