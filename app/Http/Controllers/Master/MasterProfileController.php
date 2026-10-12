<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\UpdateMasterProfileRequest;
use App\Models\Master;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterProfileController extends Controller
{
    /**
     * The master's own profile page.
     *
     * READ-ONLY for the master: name, phone, photo, bio and experience are all
     * shown for reference and are changed by an administrator. The only field
     * the master may edit is his login email.
     */
    public function edit(Request $request): Response
    {
        $master = $this->master($request);

        return Inertia::render('Master/Profile/Edit', [
            'bio' => $master->bio,
            'experience_years' => $master->experience_years,
            // Raw storage path: the frontend resolves it through masterPhoto(),
            // so the /storage prefix is applied in exactly one place.
            'photo_url' => $master->photo,
            'name' => $master->user?->name,
            'phone' => $master->user?->phone,
            'email' => $master->user?->email,
        ]);
    }

    /**
     * Update ONLY the authenticated user's email.
     *
     * Nothing else is written: the Master row (photo, bio, experience, rating,
     * is_active) is admin-only, and so is the rest of the User row (name, phone,
     * role, password). The form may still post those keys — validated() drops
     * everything that is not in the rules, so an old client cannot smuggle them
     * through.
     */
    public function update(UpdateMasterProfileRequest $request): RedirectResponse
    {
        // `master()` still runs first: it 403s a user whose profile row is gone,
        // instead of leaving a half-usable account.
        $this->master($request);

        $user = $request->user();
        $user->email = $request->validated('email');
        $user->save();

        return back()->with('success', 'Email обновлён.');
    }

    /**
     * The Master row behind the authenticated user.
     *
     * The role:master middleware guarantees the user, but not the profile row:
     * a user whose master row was deleted would otherwise hit a null deref.
     */
    private function master(Request $request): Master
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        return $master;
    }
}
