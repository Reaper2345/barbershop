<?php

namespace App\Http\Requests;

use App\Models\TimeOff;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBulkTimeOffRequest extends FormRequest
{
    /**
     * Longest absence a single quick action may create.
     *
     * A typo in the year (2035 instead of 2025) would otherwise insert
     * thousands of rows in one request.
     */
    public const MAX_DAYS = 60;

    public function authorize(): bool
    {
        return $this->user()?->master !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(array_keys(TimeOff::TYPES))],
            'date_from' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:today'],
            // A single-day absence (Выходной) posts the same value twice.
            'date_to' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Range length check, kept out of `rules()` because it compares two fields.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $from = $this->input('date_from');
            $to = $this->input('date_to');

            if (! is_string($from) || ! is_string($to) || $from === '' || $to === '') {
                return;
            }

            try {
                $days = Carbon::parse($from)->startOfDay()->diffInDays(Carbon::parse($to)->startOfDay()) + 1;
            } catch (\Throwable) {
                return; // The date rules already reported the unparsable value.
            }

            if ($days > self::MAX_DAYS) {
                $validator->errors()->add(
                    'date_to',
                    'Слишком длинный период: не более '.self::MAX_DAYS.' дней за раз.',
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'type' => 'тип отсутствия',
            'date_from' => 'дата начала',
            'date_to' => 'дата окончания',
            'reason' => 'причина',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Выберите тип отсутствия.',
            'type.in' => 'Неизвестный тип отсутствия.',
            'date_from.required' => 'Укажите дату начала.',
            'date_from.after_or_equal' => 'Нельзя отметить отсутствие на прошедшую дату.',
            'date_from.date_format' => 'Дата указывается в формате ГГГГ-ММ-ДД.',
            'date_to.required' => 'Укажите дату окончания.',
            'date_to.after_or_equal' => 'Дата окончания не может быть раньше даты начала.',
            'date_to.date_format' => 'Дата указывается в формате ГГГГ-ММ-ДД.',
            'reason.max' => 'Причина не должна превышать 255 символов.',
        ];
    }
}
