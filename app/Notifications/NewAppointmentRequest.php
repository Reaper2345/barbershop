<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notifies a master that a client has requested a new appointment.
 *
 * No mail/database channel is configured in PROMPT 2 — the notification exists
 * so the workflow hook is in place, and channels are added when the master
 * notification panel is built.
 */
class NewAppointmentRequest extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment)
    {
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $startsAtLabel = $this->appointment->starts_at?->translatedFormat('j F Y, H:i');

        return [
            'appointment_id' => $this->appointment->id,
            'client_id' => $this->appointment->client_id,
            'service_id' => $this->appointment->service_id,
            'starts_at' => $this->appointment->starts_at?->toIso8601String(),
            'message' => $startsAtLabel === null
                ? 'Новая заявка на запись'
                : 'Новая заявка на запись: '.$startsAtLabel,
        ];
    }
}
