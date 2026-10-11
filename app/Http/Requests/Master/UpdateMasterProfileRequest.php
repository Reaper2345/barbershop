<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMasterProfileRequest extends FormRequest
{
    /**
     * The route already sits behind auth + role:master, and the controller only
     * ever writes to $request->user()->master, so there is nothing to check
     * against a route parameter here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Mirrors Admin\MasterController@update, minus the admin-only is_active
     * flag: a master may edit his own photo, bio and experience but cannot
     * deactivate himself or touch the linked user account.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:2000'],
            'experience_years' => ['required', 'integer', 'min:0', 'max:60'],
            // A new upload replaces the current photo; no file means "keep".
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            // Explicit «Удалить фото» — the form sends 1 when the master asked
            // for the current photo to be cleared.
            'remove_photo' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'photo.image' => 'Фотография должна быть изображением.',
            'photo.mimes' => 'Подойдёт файл JPG, PNG или WEBP.',
            'experience_years.required' => 'Укажите опыт работы.',
            'experience_years.integer' => 'Опыт работы указывается числом лет.',
            'experience_years.min' => 'Опыт работы не может быть отрицательным.',
            'experience_years.max' => 'Опыт работы не может превышать 60 лет.',
            'bio.max' => 'Описание не должно превышать 2000 символов.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'bio' => 'описание',
            'photo' => 'фотография',
            'experience_years' => 'опыт работы',
            'remove_photo' => 'удаление фотографии',
        ];
    }
}
