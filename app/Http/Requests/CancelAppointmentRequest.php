<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Client-initiated cancellation.
 *
 * The schema has no dedicated cancellation-reason column (PROMPT 1), so the
 * reason is validated here and appended to `client_comment` by the controller,
 * where the master can read it in the appointment card.
 */
class CancelAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The controller still runs the policy check; this only narrows to a
        // signed-in user.
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'reason' => 'причина отмены',
        ];
    }

    /**
     * Trimmed reason, or null when the client skipped the field.
     */
    public function reason(): ?string
    {
        $reason = $this->validated('reason');

        if (! is_string($reason)) {
            return null;
        }

        $reason = trim($reason);

        return $reason === '' ? null : $reason;
    }
}
