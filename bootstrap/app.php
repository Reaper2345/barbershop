<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        /*
         * TLS is terminated upstream (the lab's reverse proxy in front of
         * free-anchor.vps.ktk-45.ru), so the app only ever sees plain HTTP.
         * Trusting the proxy makes Laravel honour X-Forwarded-*: without it
         * asset()/route() emit http:// URLs on an https page and the browser
         * blocks the CSS/JS as mixed content.
         */
        $middleware->trustProxies(at: '*');

        /*
         * Guests are sent to the login page instead of hitting a bare 401.
         *
         * `auth` runs before `role:*` (see routes/web.php), so it rejects an
         * unauthenticated request first. This callback gives that rejection an
         * explicit destination; without it the framework falls back to looking
         * up the `login` route name, and any future rename would silently turn
         * every protected page back into a routing exception.
         */
        $middleware->redirectGuestsTo(fn () => route('login'));

        // Inertia must run last in the web group so it can rewrite the response.
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            // Role gates use EnsureUserHasRole, which reads users.role.
            'role' => EnsureUserHasRole::class,

            // Spatie's permission middleware remains available for
            // fine-grained abilities added in later prompts.
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
