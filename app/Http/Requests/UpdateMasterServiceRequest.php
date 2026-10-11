<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMasterServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $service = $this->route('service');

        return $service instanceof Service
            && $this->user()?->can('update', $service) === true;
    }

    /**
     * All fields are optional: the master may override only what he wants,
     * leaving NULL to mean "inherit the catalogue default".
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:9999999.99', 'gte:price_min'],
            'duration_min' => ['nullable', 'integer', 'min:5', 'max:600'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'price_min' => 'минимальная цена',
            'price_max' => 'максимальная цена',
            'duration_min' => 'длительность',
            'is_active' => 'доступность услуги',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price_max.gte' => 'Максимальная цена не может быть меньше минимальной.',
            'duration_min.min' => 'Длительность услуги должна быть не менее 5 минут.',
            'duration_min.max' => 'Длительность услуги не может превышать 600 минут.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('price_max') && ! $this->filled('price_min')) {
                $validator->errors()->add('price_min', 'Укажите минимальную цену диапазона.');
            }
        });
    }
}
