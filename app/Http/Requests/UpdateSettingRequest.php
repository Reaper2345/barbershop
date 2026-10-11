<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSettingRequest extends FormRequest
{
    /**
     * Icons the "Почему мы" block knows how to render.
     */
    private const FEATURE_ICONS = ['award', 'scissors', 'coffee', 'shield'];

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    /**
     * Settings arrive as key => value pairs, e.g. settings[site_name].
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            // Keys must match existing settings rows; values stay free-form
            // text. The cap is intentionally generous because `about_text` and
            // the `features` JSON are long-form content.
            'settings.*' => ['nullable', 'string', 'max:20000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'settings' => 'настройки',
            'settings.features' => 'блок «Почему мы»',
            'settings.meta_title' => 'meta title',
            'settings.meta_description' => 'meta description',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'settings.required' => 'Нет данных для сохранения.',
            'settings.*.max' => 'Значение настройки не должно превышать 20000 символов.',
        ];
    }

    /**
     * `features` is consumed as JSON by the home page, so a malformed value
     * would silently break the "Почему мы" block. It is validated here rather
     * than trusted, and the error is attached to the field itself.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $raw = $this->input('settings.features');

            if ($raw === null || $raw === '') {
                return;
            }

            if (! is_string($raw)) {
                $validator->errors()->add('settings.features', 'Ожидается JSON-строка.');

                return;
            }

            $decoded = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE || ! is_array($decoded)) {
                $validator->errors()->add(
                    'settings.features',
                    'Некорректный JSON: '.json_last_error_msg().'.',
                );

                return;
            }

            foreach ($decoded as $index => $feature) {
                if (! is_array($feature)) {
                    $validator->errors()->add(
                        'settings.features',
                        'Элемент #'.($index + 1).' должен быть объектом.',
                    );

                    return;
                }

                foreach (['title', 'text', 'icon'] as $key) {
                    if (! isset($feature[$key]) || ! is_string($feature[$key]) || $feature[$key] === '') {
                        $validator->errors()->add(
                            'settings.features',
                            'Элемент #'.($index + 1).': не заполнено поле «'.$key.'».',
                        );

                        return;
                    }
                }

                if (! in_array($feature['icon'], self::FEATURE_ICONS, true)) {
                    $validator->errors()->add(
                        'settings.features',
                        'Элемент #'.($index + 1).': допустимые иконки — '
                        .implode(', ', self::FEATURE_ICONS).'.',
                    );

                    return;
                }
            }
        });
    }
}
