<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Master;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AppointmentSeeder extends Seeder
{
    /**
     * Demo bookings: eight completed visits in the past (so that the review
     * seeder has real appointments to attach to) plus five upcoming requests in
     * different statuses for the admin panel.
     *
     * Each entry: day offset from today, slot hour/minute, status, client
     * comment, and an optional `priced` flag for an upcoming booking that the
     * master has already quoted.
     *
     * @var list<array{offset: int, hour: int, minute: int, status: AppointmentStatus, comment: string|null, priced?: bool}>
     */
    private const APPOINTMENTS = [
        // --- Past, completed => reviewable ---
        ['offset' => -28, 'hour' => 11, 'minute' => 0, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -24, 'hour' => 16, 'minute' => 0, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -21, 'hour' => 12, 'minute' => 30, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -17, 'hour' => 18, 'minute' => 0, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -14, 'hour' => 10, 'minute' => 30, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -10, 'hour' => 15, 'minute' => 30, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -7, 'hour' => 19, 'minute' => 0, 'status' => AppointmentStatus::Done, 'comment' => null],
        ['offset' => -3, 'hour' => 13, 'minute' => 0, 'status' => AppointmentStatus::Done, 'comment' => null],

        // --- Upcoming, awaiting confirmation ---
        [
            'offset' => 2, 'hour' => 12, 'minute' => 0, 'status' => AppointmentStatus::Pending,
            'comment' => 'Здравствуйте! Хочу освежить стрижку и убрать длину по бокам. Фото прикреплю в чате.',
        ],
        [
            'offset' => 3, 'hour' => 17, 'minute' => 0, 'status' => AppointmentStatus::Pending,
            'comment' => 'Нужно оформить бороду перед командировкой, желательно покороче.',
        ],

        // --- Upcoming, already confirmed by the master ---
        [
            'offset' => 5, 'hour' => 11, 'minute' => 0, 'status' => AppointmentStatus::Confirmed,
            'comment' => 'Записываюсь повторно, в прошлый раз всё понравилось.',
        ],
        [
            'offset' => 8, 'hour' => 18, 'minute' => 30, 'status' => AppointmentStatus::Confirmed,
            'comment' => null,
        ],

        // Confirmed and already priced by the master — exercises the
        // "1800–2200 ₽" branch of Appointment::finalPriceLabel.
        [
            'offset' => 11, 'hour' => 13, 'minute' => 0, 'status' => AppointmentStatus::Confirmed,
            'comment' => 'Прикрепил фото, хочу короткую бороду с чётким контуром.',
            'priced' => true,
        ],
    ];

    public function run(): void
    {
        $clients = User::query()->where('role', 'client')->orderBy('id')->get();

        // Only masters with at least one active service can be booked, and a
        // booking may only use a service that this master actually performs.
        $masters = Master::query()
            ->whereHas('services', fn ($query) => $query->where('master_service.is_active', true))
            ->with(['services' => fn ($query) => $query->where('master_service.is_active', true)])
            ->orderBy('id')
            ->get();

        if ($clients->isEmpty() || $masters->isEmpty()) {
            $this->command?->warn('AppointmentSeeder: run MasterSeeder, ClientSeeder, ServiceSeeder and MasterServiceSeeder first.');

            return;
        }

        foreach (self::APPOINTMENTS as $index => $data) {
            $client = $clients[$index % $clients->count()];
            $master = $masters[$index % $masters->count()];

            // Pick a service from this master's own price list, not the global one.
            $services = $master->services;
            $service = $services[$index % $services->count()];
            $pivot = $service->pivot;

            $startsAt = Carbon::today()
                ->addDays($data['offset'])
                ->setTime($data['hour'], $data['minute']);

            $duration = (int) ($pivot->duration_min ?? $service->duration_min);

            // Completed bookings are always priced from the master's own price
            // list; upcoming ones only when the master already sent an offer.
            $isPriced = $data['status'] === AppointmentStatus::Done || ($data['priced'] ?? false);

            $attributes = [
                'client_id' => $client->id,
                'master_id' => $master->id,
                'service_id' => $service->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addMinutes($duration),
                'status' => $data['status'],
                'client_comment' => $data['comment'],
                'photo_path' => null,
                'master_price_min' => $isPriced ? ($pivot->price_min ?? $service->base_price_min) : null,
                'master_price_max' => $isPriced ? ($pivot->price_max ?? $service->base_price_max) : null,
                'master_price_offer' => null,
                'master_comment' => $data['status'] === AppointmentStatus::Done
                    ? 'Работа выполнена, клиент доволен результатом.'
                    : null,
            ];

            // Guard against duplicate demo rows when the seeder is re-run.
            $existing = Appointment::query()
                ->where('client_id', $client->id)
                ->where('master_id', $master->id)
                ->where('service_id', $service->id)
                ->where('starts_at', $startsAt)
                ->first();

            if ($existing !== null) {
                $existing->update($attributes);

                continue;
            }

            Appointment::create($attributes);
        }
    }
}
