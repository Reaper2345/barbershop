<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * Admins manage the catalogue unconditionally.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === Role::Admin ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Service $service): bool
    {
        return true;
    }

    /**
     * A master may adjust price/duration/availability for a service he offers.
     */
    public function update(User $user, Service $service): bool
    {
        if ($user->master === null) {
            return false;
        }

        return $user->master->services()
            ->where('services.id', $service->id)
            ->exists();
    }

    /**
     * Creating, renaming or deleting catalogue entries is admin-only.
     */
    public function create(User $user): bool
    {
        return false;
    }

    public function delete(User $user, Service $service): bool
    {
        return false;
    }
}
