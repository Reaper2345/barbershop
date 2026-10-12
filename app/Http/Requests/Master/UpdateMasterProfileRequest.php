<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMasterProfileRequest extends FormRequest
{
    /**
     * The route already sits behind auth + role:master, and the controller only
     * ever writes to $request->user(), so there is nothing to check against a
     * route parameter here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * A master may change ONE thing about himself: his login email.
     *
     * Everything else — name, phone, bio, photo and experience — belongs to the
     * administrator (Admin\MasterController / Admin\UserController). The rules
     * are the enforcement point: fields that are not listed here are stripped by
     * validated(), so the old bio/experience/photo payload is ignored even if a
     * client still sends it.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()?->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Укажите email.',
            'email.email' => 'Укажите корректный email.',
            'email.unique' => 'Этот email уже используется.',
            'email.max' => 'Email не должен превышать 255 символов.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'email' => 'email',
        ];
    }
}
