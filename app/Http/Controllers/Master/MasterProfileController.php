<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\UpdateMasterProfileRequest;
use App\Models\Master;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MasterProfileController extends Controller
{
    /**
     * The master's own profile: photo, bio and experience.
     *
     * Name and email belong to the linked User row and are shown read-only —
     * only an administrator changes them (Admin\UserController).
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
            'email' => $master->user?->email,
        ]);
    }

    /**
     * Update ONLY the Master row of the authenticated user.
     *
     * The User model (name, email, password, role) is deliberately untouched:
     * a master must not be able to rename himself or change his login email.
     */
    public function update(UpdateMasterProfileRequest $request): RedirectResponse
    {
        $master = $this->master($request);

        $data = $request->validated();

        // rating, is_active and user_id are not part of the profile form.
        unset($data['photo'], $data['remove_photo']);

        $previousPhoto = $master->photo;

        $path = $this->storePhoto($request, $master->id);

        /*
         * Whether THIS request actually asks for a different photo. The flag
         * cannot be derived later from `$data['photo'] ?? $previousPhoto`:
         * `??` also falls through on an existing-but-null value, so the
         * explicit «Удалить фото» branch (photo = null) would look unchanged
         * and the old file would survive as an orphan. Same pattern as
         * Admin\MasterController@update.
         */
        $photoChanged = false;

        if ($path !== null) {
            $data['photo'] = $path;
            $photoChanged = true;
        } elseif ($request->boolean('remove_photo')) {
            $data['photo'] = null;
            $photoChanged = true;
        }

        $master->update($data);

        /*
         * Drop the old file only when this save replaced it (a different path,
         * so the old name is no longer referenced) or cleared it. A save that
         * sends no photo input leaves the column and the file untouched.
         */
        if ($photoChanged && $previousPhoto !== null && $previousPhoto !== $path) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return back()->with('success', 'Профиль обновлён.');
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

    /**
     * Store the uploaded photo on the public disk, under masters/.
     *
     * Deterministic name keeps re-uploads from accumulating files, and the
     * saved path equals the previous one when the extension does not change, so
     * the old file is simply overwritten.
     */
    private function storePhoto(Request $request, int $masterId): ?string
    {
        if (! $request->hasFile('photo')) {
            return null;
        }

        $file = $request->file('photo');

        if ($file === null) {
            return null;
        }

        return $file->storeAs(
            'masters',
            $masterId.'.'.strtolower($file->getClientOriginalExtension()),
            ['disk' => 'public'],
        );
    }
}
