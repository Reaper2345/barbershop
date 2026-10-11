<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Master;
use App\Models\User;

class MasterPolicy
{
    /**
     * Admins can always act; a master can only act on his own profile.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === Role::Admin ? true : null;
    }

    /**
     * Everyone may browse the master catalogue.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Creating a master profile is admin-only and is granted by before().
     *
     * This method must exist even though before() decides the real answer:
     * Gate::resolvePolicyCallback() returns false outright when the policy has
     * no method for the ability, so it never reaches before() — leaving
     * /admin/masters/create a 403 for administrators.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Everyone may browse the master catalogue — including guests.
     *
     * The nullable type is load-bearing, not decoration: Gate skips a policy
     * method entirely for a guest unless its first parameter allows null
     * (Gate::parameterAllowsGuests), and a skipped method is a denied method —
     * so /masters/{id} returned 403 to logged-out visitors even though the
     * index page linked straight to it.
     */
    public function view(?User $user, Master $master): bool
    {
        return true;
    }

    /**
     * Only the master himself may edit his profile (admins via before()).
     */
    public function update(User $user, Master $master): bool
    {
        return $user->id === $master->user_id;
    }

    /**
     * Deleting a master profile is an admin-only operation.
     */
    public function delete(User $user, Master $master): bool
    {
        return false;
    }

    /**
     * Managing the personal schedule (working hours, days off).
     */
    public function manageSchedule(User $user, Master $master): bool
    {
        return $user->id === $master->user_id;
    }
}
