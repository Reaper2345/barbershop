<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortfolioItemRequest extends FormRequest
{
    /**
     * The route sits behind auth + role:master; the controller checks that the
     * item belongs to $request->user()->master before touching it.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The photo is optional here: no upload means "keep", and `remove_photo`
     * resets the item to the bundled placeholder.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
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
            'photo.image' => 'Фотография должна быть изображением.',
            'photo.mimes' => 'Подойдёт файл JPG, PNG, WEBP или SVG.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'title.max' => 'Заголовок не должен превышать 120 символов.',
            'description.max' => 'Описание не должно превышать 2000 символов.',
        ];
    }
}
