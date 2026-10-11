<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade template that renders the Inertia app.
     */
    protected $rootView = 'app';

    /**
     * Asset version used to bust the browser cache on deploy.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props shared with every Inertia response.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role->value,
                    'avatar' => $user->avatar,
                ],
                // Master profile id, so master-area links can be built without
                // an extra request. Null for clients and admins.
                'master_id' => $user?->master?->id,
            ],

            // Flash messages are consumed by the React toast layer.
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],

            // Site-wide content used by the layout on every page.
            'siteSettings' => fn (): array => Setting::allCached(),

            // Unread notifications for masters (the bell in the master header).
            'notifications' => fn () => $user === null || $user->master === null
                ? []
                : $user->unreadNotifications()
                    ->limit(10)
                    ->get()
                    ->map(fn ($notification): array => [
                        'id' => $notification->id,
                        'data' => $notification->data,
                        'created_at' => $notification->created_at?->toIso8601String(),
                    ])
                    ->all(),
        ]);
    }
}
