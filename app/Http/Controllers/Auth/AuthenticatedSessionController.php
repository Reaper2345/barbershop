<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\RedirectByRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login form.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            // The password-reset flow is not part of the project yet; the page
            // accepts the flag so it can be switched on without a change here.
            'canResetPassword' => false,
        ]);
    }

    /**
     * Authenticate the user and send them to their role's home page.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();

        // `remember` is optional in the payload; default to off.
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => 'Неверный email или пароль.',
            ]);
        }

        $request->session()->regenerate();

        // intended() honours the URL the guard stashed before redirecting to
        // /login; the role-based route is the default destination.
        return redirect()->intended(
            RedirectByRole::urlFor($request->user()),
        );
    }

    /**
     * Log the user out and clear the session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
