<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->master !== null;
    }

    /**
     * The whole week is posted at once as `days[weekday][...]`.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'days' => ['required', 'array', 'size:7'],
            'days.*.is_active' => ['required', 'boolean'],
            'days.*.start_time' => ['nullable', 'date_format:H:i'],
            'days.*.end_time' => ['nullable', 'date_format:H:i'],
            'days.*.break_start' => ['nullable', 'date_format:H:i'],
            'days.*.break_end' => ['nullable', 'date_format:H:i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'days' => 'график',
            'days.*.start_time' => 'время начала',
            'days.*.end_time' => 'время окончания',
            'days.*.break_start' => 'начало перерыва',
            'days.*.break_end' => 'окончание перерыва',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'days.size' => 'График должен содержать все семь дней недели.',
            'days.*.start_time.date_format' => 'Время начала указывается в формате ЧЧ:ММ.',
            'days.*.end_time.date_format' => 'Время окончания указывается в формате ЧЧ:ММ.',
        ];
    }

    /**
     * A working day must be internally consistent: end after start, and a
     * break, if present, must sit inside the working interval.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ((array) $this->input('days', []) as $weekday => $day) {
                if (! is_array($day) || ! filter_var($day['is_active'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    continue;
                }

                $start = $day['start_time'] ?? null;
                $end = $day['end_time'] ?? null;
                $prefix = "days.{$weekday}";

                if ($start === null || $start === '') {
                    $validator->errors()->add("{$prefix}.start_time", 'Укажите время начала рабочего дня.');

                    continue;
                }

                if ($end === null || $end === '') {
                    $validator->errors()->add("{$prefix}.end_time", 'Укажите время окончания рабочего дня.');

                    continue;
                }

                if ($end <= $start) {
                    $validator->errors()->add(
                        "{$prefix}.end_time",
                        'Время окончания должно быть позже времени начала.',
                    );

                    continue;
                }

                $breakStart = $day['break_start'] ?? null;
                $breakEnd = $day['break_end'] ?? null;

                // A half-configured break is a data error, not a silent default.
                if (($breakStart === null) !== ($breakEnd === null)) {
                    $validator->errors()->add(
                        "{$prefix}.break_end",
                        'Заполните и начало, и окончание перерыва, либо оставьте оба поля пустыми.',
                    );

                    continue;
                }

                if ($breakStart === null || $breakEnd === null) {
                    continue;
                }

                if ($breakEnd <= $breakStart) {
                    $validator->errors()->add(
                        "{$prefix}.break_end",
                        'Окончание перерыва должно быть позже его начала.',
                    );

                    continue;
                }

                if ($breakStart < $start || $breakEnd > $end) {
                    $validator->errors()->add(
                        "{$prefix}.break_start",
                        'Перерыв должен находиться внутри рабочего дня.',
                    );
                }
            }
        });
    }
}
