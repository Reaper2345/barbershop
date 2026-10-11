<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * "Заказать звонок" modal. Used by LeadController@store.
 *
 * This request is not part of the PROMPT 2 list, but the /call-request route
 * needs validation; the lead is logged because the schema has no leads table.
 */
class StoreCallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => ['required', 'string', 'min:6', 'max:32', 'regex:/^[+0-9()\-\s]+$/'],
            'comment' => ['nullable', 'string', 'max:1000'],
            // Honeypot: bots fill every field they can see.
            'website' => ['nullable', 'prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'имя',
            'phone' => 'телефон',
            'comment' => 'комментарий',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Укажите, как к вам обращаться.',
            'phone.required' => 'Укажите номер телефона для связи.',
            'phone.regex' => 'Телефон может содержать только цифры, пробелы, скобки, «+» и «-».',
            'website.prohibited' => 'Заявка отклонена.',
        ];
    }
}
