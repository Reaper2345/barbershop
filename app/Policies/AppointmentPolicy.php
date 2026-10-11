<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /**
     * Admins can do anything with any booking.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === Role::Admin ? true : null;
    }

    /**
     * Client may only see his own bookings; a master only his own queue.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        return $this->ownsAsClient($user, $appointment)
            || $this->isAssignedMaster($user, $appointment);
    }

    /**
     * Updating covers confirming, rejecting and advancing a status.
     */
    public function update(User $user, Appointment $appointment): bool
    {
        return $this->ownsAsClient($user, $appointment)
            || $this->isAssignedMaster($user, $appointment);
    }

    /**
     * Only the assigned master may quote a price or advance the workflow.
     */
    public function manage(User $user, Appointment $appointment): bool
    {
        return $this->isAssignedMaster($user, $appointment);
    }

    /**
     * A client may cancel his own booking while it is still pending/confirmed
     * and has not started yet.
     */
    public function cancel(User $user, Appointment $appointment): bool
    {
        if (! $this->ownsAsClient($user, $appointment)) {
            return false;
        }

        if (! $appointment->status->isCancellable()) {
            return false;
        }

        return $appointment->starts_at->isFuture();
    }

    /**
     * A review may only be left by the client, after the visit happened.
     */
    public function review(User $user, Appointment $appointment): bool
    {
        return $this->ownsAsClient($user, $appointment);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return false;
    }

    private function ownsAsClient(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->client_id;
    }

    private function isAssignedMaster(User $user, Appointment $appointment): bool
    {
        return $user->master !== null && $user->master->id === $appointment->master_id;
    }
}
