<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortfolioItemRequest extends FormRequest
{
    /**
     * The route sits behind auth + role:admin, so there is nothing further to
     * check here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Same rules as store(), except the photo is optional: no upload means
     * "keep the current file", and `remove_photo` clears it explicitly.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'title' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'remove_photo' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'master_id' => 'мастер',
            'title' => 'заголовок',
            'description' => 'описание',
            'photo' => 'фотография',
            'remove_photo' => 'удаление фотографии',
            'sort_order' => 'порядок',
            'is_published' => 'публикация',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'master_id.required' => 'Выберите мастера.',
            'master_id.exists' => 'Выбранный мастер не найден.',
            'photo.image' => 'Фотография должна быть изображением.',
            'photo.mimes' => 'Подойдёт файл JPG, PNG, WEBP или SVG.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'title.max' => 'Заголовок не должен превышать 120 символов.',
            'description.max' => 'Описание не должно превышать 2000 символов.',
        ];
    }
}
