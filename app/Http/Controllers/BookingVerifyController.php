<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Mail\AppointmentConfirmationMail;
use App\Models\Appointment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Client-side code confirmation.
 *
 * The client books (status pending), receives a 6-digit code by email and types
 * it here. Only the owning client may confirm, and only while the booking is
 * still pending — see AppointmentPolicy@verify.
 *
 * The code is never echoed back to the browser: the page receives the masked
 * email address and the cooldown, nothing else.
 */
class BookingVerifyController extends Controller
{
    /** Wrong guesses allowed before the code is burned. */
    private const MAX_ATTEMPTS = 5;

    /** How long a code stays valid after it was sent. */
    private const CODE_TTL_MINUTES = 15;

    /** Minimum wait between two sends. */
    private const RESEND_COOLDOWN_SECONDS = 60;

    public function show(Request $request, Appointment $appointment): Response|RedirectResponse
    {
        $this->authorize('verify', $appointment);

        return Inertia::render('Booking/Verify', [
            'appointment' => [
                'id' => $appointment->id,
                'client_email' => $this->maskEmail($appointment->client?->email),
                'starts_at_label' => $appointment->starts_at?->translatedFormat('j F Y, H:i'),
                'service_name' => $appointment->service?->name,
                'master_name' => $appointment->master?->user?->name,
                'resend_available_in' => $this->resendAvailableIn($appointment),
            ],
        ]);
    }

    public function verify(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('verify', $appointment);

        $data = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        if ($appointment->confirmation_attempts >= self::MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'code' => 'Превышено число попыток. Создайте новую запись.',
            ]);
        }

        if ($appointment->confirmation_sent_at === null
            || $appointment->confirmation_sent_at->lt(Carbon::now()->subMinutes(self::CODE_TTL_MINUTES))) {
            throw ValidationException::withMessages([
                'code' => 'Код устарел. Отправьте новый.',
            ]);
        }

        if (! hash_equals((string) $appointment->confirmation_code, (string) $data['code'])) {
            $appointment->increment('confirmation_attempts');
            $appointment->refresh();

            $left = max(0, self::MAX_ATTEMPTS - $appointment->confirmation_attempts);

            throw ValidationException::withMessages([
                'code' => $left === 0
                    ? 'Превышено число попыток. Создайте новую запись.'
                    : 'Неверный код. Осталось попыток: '.$left.'.',
            ]);
        }

        $appointment->forceFill([
            'status' => AppointmentStatus::Confirmed,
            // The code has done its job; keeping it would let a leaked email be
            // replayed against the same booking.
            'confirmation_code' => null,
            'confirmation_attempts' => 0,
            'confirmation_sent_at' => null,
        ])->save();

        return redirect()
            ->route('cabinet.index')
            ->with('success', 'Запись подтверждена.');
    }

    public function resend(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('verify', $appointment);

        $availableIn = $this->resendAvailableIn($appointment);

        if ($availableIn > 0) {
            throw ValidationException::withMessages([
                'code' => 'Новый код можно отправить через '.$availableIn.' с.',
            ]);
        }

        $this->issueCode($appointment);

        return back()->with('success', 'Код отправлен повторно.');
    }

    /**
     * «Отменить запись» / closing the page without confirming.
     *
     * CANCEL, not delete: the master's queue and the booking history must show
     * that a request existed and was withdrawn, and a hard delete would also
     * discard the client's reference photo. The row leaves the master's pending
     * queue either way, which is the business requirement.
     */
    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->authorize('verify', $appointment);

        $appointment->forceFill([
            'status' => AppointmentStatus::Cancelled,
            'confirmation_code' => null,
            'confirmation_sent_at' => null,
        ])->save();

        return redirect()
            ->route('booking.create')
            ->with('warning', 'Запись не подтверждена — создайте новую.');
    }

    /**
     * New code + reset attempts + stamp the send time, then mail it.
     *
     * A transport failure is reported, not thrown: the client still has the
     * page and the «Отправить код заново» button.
     */
    private function issueCode(Appointment $appointment): void
    {
        $appointment->forceFill([
            'confirmation_code' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'confirmation_attempts' => 0,
            'confirmation_sent_at' => Carbon::now(),
        ])->save();

        $email = $appointment->client?->email;

        if ($email === null || $email === '') {
            report(new \RuntimeException('Appointment #'.$appointment->id.' has no client email to confirm.'));

            return;
        }

        try {
            Mail::to($email)->send(
                new AppointmentConfirmationMail($appointment->loadMissing(['client', 'master.user', 'service'])),
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    /** Seconds left on the 60-second cooldown, 0 when a resend is allowed. */
    private function resendAvailableIn(Appointment $appointment): int
    {
        if ($appointment->confirmation_sent_at === null) {
            return 0;
        }

        $elapsed = (int) $appointment->confirmation_sent_at->diffInSeconds(Carbon::now());

        return max(0, self::RESEND_COOLDOWN_SECONDS - $elapsed);
    }

    /** «cl***@barber.test» — enough to recognise the address, not to leak it. */
    private function maskEmail(?string $email): ?string
    {
        if ($email === null || $email === '') {
            return null;
        }

        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($name, 0, 2).str_repeat('*', max(2, mb_strlen($name) - 2)).'@'.$domain;
    }
}
