<?php

namespace App\Providers;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Master;
use App\Models\Service;
use App\Notifications\NewAppointmentRequest;
use App\Policies\AppointmentPolicy;
use App\Policies\MasterPolicy;
use App\Policies\ServicePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Warm up Vite's asset preloading to speed up Inertia page loads.
        Vite::prefetch(concurrency: 3);

        $this->registerPolicies();
        $this->registerModelEvents();
    }

    /**
     * Policies are registered explicitly rather than relying on name guessing,
     * so the mapping survives a future namespace reshuffle.
     */
    private function registerPolicies(): void
    {
        Gate::policy(Master::class, MasterPolicy::class);
        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
    }

    private function registerModelEvents(): void
    {
        // Notify the master about a new request. Deliberately does NOT set a
        // session flash: the creating controller owns the user-facing message,
        // and a second flash would overwrite it.
        Appointment::created(function (Appointment $appointment): void {
            if ($appointment->status !== AppointmentStatus::Pending) {
                return;
            }

            $appointment->master?->user?->notify(
                new NewAppointmentRequest($appointment),
            );
        });
    }
}
