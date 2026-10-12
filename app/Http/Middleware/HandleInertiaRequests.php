<?php

namespace App\Http\Middleware;

use App\Enums\AppointmentStatus;
use App\Enums\Role;
use App\Models\Appointment;
use App\Models\Category;
use App\Models\Master;
use App\Models\Page;
use App\Models\PortfolioItem;
use App\Models\Review;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
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

            /*
             * Sidebar counters, shared with EVERY request.
             *
             * They used to be passed per page (only the dashboard and the reviews
             * list did it), so the badges vanished the moment you navigated to
             * another admin screen. Keyed by the nav href the layout matches on;
             * empty for non-admins, which leaves the master sidebar untouched.
             *
             * @var array<string, int>
             */
            'navCounts' => fn (): array => $this->adminNavCounts($user),

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

    /**
     * Admin sidebar counters, keyed by the href each nav item points at.
     *
     * Computed on every request so a page that fixes a pending review or
     * confirms an appointment shows the new number straight away. Only admins
     * pay for it; clients and masters get an empty array.
     *
     * @return array<string, int>
     */
    private function adminNavCounts(?User $user): array
    {
        if ($user === null || $user->role !== Role::Admin) {
            return [];
        }

        return [
            '/admin/masters' => Master::count(),
            '/admin/services' => Service::count(),
            '/admin/categories' => Category::count(),
            '/admin/portfolio' => PortfolioItem::count(),
            '/admin/appointments' => Appointment::where('status', AppointmentStatus::Pending->value)->count(),
            '/admin/reviews' => Review::where('is_approved', false)->count(),
            '/admin/users' => User::count(),
            '/admin/pages' => Page::count(),
        ];
    }
}
