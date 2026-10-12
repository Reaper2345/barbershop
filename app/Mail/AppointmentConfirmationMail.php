<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Confirmation code for a new booking.
 *
 * Sent to the BARBERSHOP's confirmation address (the `confirmation_email`
 * setting), not to the client: the shop quotes the code when it confirms the
 * visit, which is what ties a phone call to a row in the panel.
 *
 * Queued? No. BookingController@store sends it inline so the flash can report
 * whether the code actually left the building — a queued job would report
 * success before the SMTP handshake even happened.
 */
class AppointmentConfirmationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly Appointment $appointment)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ксививайд — код подтверждения записи №'.$this->appointment->id,
            // Mail.ru rejects a From that is not the authenticated mailbox.
            from: new Address(
                (string) config('mail.from.address'),
                (string) config('mail.from.name'),
            ),
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.appointment-confirmation');
    }
}
