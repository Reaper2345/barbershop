<?php

namespace App\Support;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * Where each role lands after signing in.
 *
 * The role lives on `users.role` (see App\Enums\Role), so this is a plain match
 * rather than a permissions lookup — matching EnsureUserHasRole's approach.
 *
 * `homeFor()` returns a ROUTE NAME, not a URL, so the caller resolves it with
 * route(). Each candidate is guarded by Route::has() so a missing route can
 * never reintroduce the "Route [x] not defined" failure this class exists to
 * prevent; the fallback is always the public home page.
 */
class RedirectByRole
{
    /**
     * Route name to send the given user to after login.
     */
    public static function homeFor(User $user): string
    {
        $preferred = match ($user->role) {
            Role::Admin => 'admin.dashboard',
            Role::Master => 'master.dashboard',
            Role::Client => 'cabinet.index',
        };

        if (Route::has($preferred)) {
            return $preferred;
        }

        // A master without a usable dashboard should not be bounced to the
        // client cabinet's route name if that is missing either.
        if ($user->role === Role::Master && Route::has('cabinet.index')) {
            return 'cabinet.index';
        }

        return 'home';
    }

    /**
     * Ready-to-use URL for the same destination.
     */
    public static function urlFor(User $user): string
    {
        return route(self::homeFor($user));
    }
}
