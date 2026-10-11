<?php

namespace App\Http\Controllers\Auth;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration form.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Create the account and sign the user in.
     *
     * Every self-registered account is a client: master and admin accounts are
     * created from the admin panel, which also assigns the Spatie role.
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        $data = $request->validated();

        /** @var User $user */
        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'],
                // The `hashed` cast on User::$casts hashes this automatically.
                'password' => $data['password'],
                'role' => Role::Client,
            ]);

            // Keep users.role and the Spatie role tables in step, matching the
            // admin panel's UserController.
            $user->syncRoles([Role::Client->value]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return redirect()->route('cabinet.index');
    }
}
