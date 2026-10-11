<?php

namespace App\Http\Requests;

use App\Models\Master;
use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Query validation for GET /api/slots.
 *
 * Beyond shape validation this resolves the three parameters into models and a
 * Carbon date, so the controller never parses input itself.
 */
class SlotsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Slot availability is not sensitive, but it is only useful to an
        // authenticated visitor: the booking routes sit behind `auth`.
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'date' => ['required', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'master_id' => 'мастер',
            'service_id' => 'услуга',
            'date' => 'дата',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.date_format' => 'Дата должна быть в формате ГГГГ-ММ-ДД.',
            'master_id.exists' => 'Мастер не найден.',
            'service_id.exists' => 'Услуга не найдена.',
        ];
    }

    public function master(): ?Master
    {
        return Master::find($this->integer('master_id'));
    }

    public function service(): ?Service
    {
        return Service::find($this->integer('service_id'));
    }

    /**
     * The requested day, at midnight in the application timezone.
     *
     * Named `resolvedDate()` and NOT `date()`: `Illuminate\Http\Request` pulls in
     * the InteractsWithData trait, which already declares
     *
     *   public function date($key, $format = null, $tz = null)
     *
     * Redeclaring it here with a different signature (`?Carbon`, no parameters)
     * is an LSP violation and a FATAL error in PHP, not a warning:
     *
     *   Declaration of SlotsRequest::date(): ?Carbon must be compatible with
     *   Illuminate\Http\Request::date($key, $format = null, $tz = null)
     *
     * The inherited `date($key, ...)` remains available and untouched, so
     * `$request->date('some_key')` still works on any request object.
     *
     * Returns null on anything unexpected; the controller answers 422 rather
     * than letting a parse failure surface as a 500. `createFromFormat` is used
     * (not `parse`) because it cannot quietly accept a malformed string, and the
     * format is checked against the re-rendered value so a value like
     * "2026-13-45" is rejected instead of rolling over into the next month.
     */
    public function resolvedDate(): ?Carbon
    {
        $raw = $this->query('date');

        if (! is_string($raw) || trim($raw) === '') {
            return null;
        }

        $raw = trim($raw);

        try {
            $timezone = $this->timezone();

            $parsed = Carbon::createFromFormat('!Y-m-d', $raw, $timezone);

            // `createFromFormat` can return false in some Carbon paths.
            if (! $parsed instanceof Carbon) {
                return null;
            }

            // Guard against silent overflow (e.g. 2026-02-31 -> 2026-03-03).
            if ($parsed->format('Y-m-d') !== $raw) {
                return null;
            }

            return $parsed->startOfDay();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Application timezone, defensively coerced to a string.
     *
     * `config('app.timezone')` is a string under normal operation, but a
     * malformed or cached config could hand back something else, and Carbon
     * would then throw a TypeError deep inside date construction.
     */
    private function timezone(): string
    {
        $timezone = config('app.timezone');

        return is_string($timezone) && $timezone !== '' ? $timezone : 'UTC';
    }
}
