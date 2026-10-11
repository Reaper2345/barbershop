<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to one of the application roles.
 *
 * The `role:admin` / `role:master` aliases point at this class (see
 * bootstrap/app.php) because the role is stored on users.role, which keeps the
 * guard independent from Spatie's role tables.
 *
 * Usage: ->middleware('role:admin') or ->middleware('role:admin,master')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        /*
         * A guest must be turned away as a guest, not as a forbidden user.
         *
         * The previous `abort(401)` produced a 401 response directly, which is
         * why a guest opening /admin saw the panel shell render before the
         * error: the request was rejected, but nothing redirected it to the
         * login screen, so the browser showed whatever the error channel put on
         * screen.
         *
         * Throwing AuthenticationException hands the decision to the framework:
         * it redirects to the destination registered by
         * `$middleware->redirectGuestsTo(...)` in bootstrap/app.php (the login
         * route), and returns a 401 JSON response for requests that expect JSON.
         * The same exception type the `auth` middleware raises, so both layers
         * behave identically.
         */
        if ($user === null) {
            throw new AuthenticationException(
                'Требуется вход в систему.',
                ['web'],
                $request->expectsJson() ? null : route('login'),
            );
        }

        /*
         * Roles are compared on the enum's backing value so the middleware keeps
         * working whether or not the User model casts `role` to App\Enums\Role.
         */
        $current = $user->role instanceof \BackedEnum
            ? (string) $user->role->value
            : (string) $user->role;

        foreach ($roles as $role) {
            if ($current === $role) {
                return $next($request);
            }
        }

        abort(403, 'Недостаточно прав для выполнения этого действия.');
    }
}
