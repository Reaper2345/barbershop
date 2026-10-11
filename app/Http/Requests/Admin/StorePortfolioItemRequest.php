<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePortfolioItemRequest extends FormRequest
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
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'title' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            // SVG is accepted because the bundled placeholders are SVG; the
            // image rule still rejects anything that is not a real image.
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
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
            'photo.required' => 'Загрузите фотографию работы.',
            'photo.image' => 'Фотография должна быть изображением.',
            'photo.mimes' => 'Подойдёт файл JPG, PNG, WEBP или SVG.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'title.max' => 'Заголовок не должен превышать 120 символов.',
            'description.max' => 'Описание не должно превышать 2000 символов.',
        ];
    }
}
