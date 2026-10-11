<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ConfirmAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $appointment = $this->route('appointment');

        return $appointment instanceof Appointment
            && $this->user()?->can('manage', $appointment) === true;
    }

    /**
     * Either a min/max range or a single exact offer must be supplied.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:9999999.99', 'required_without:price_offer'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:9999999.99', 'gte:price_min'],
            'price_offer' => ['nullable', 'numeric', 'min:0', 'max:9999999.99', 'required_without:price_min'],
            'master_comment' => ['nullable', 'string', 'max:2000'],
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
            'price_offer' => 'точная цена',
            'master_comment' => 'комментарий мастера',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price_min.required_without' => 'Укажите диапазон цен (от и до) или точную цену.',
            'price_offer.required_without' => 'Укажите точную цену или диапазон цен.',
            'price_max.gte' => 'Максимальная цена не может быть меньше минимальной.',
        ];
    }

    /**
     * The two shapes are mutually exclusive: a range OR a single offer.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasOffer = $this->filled('price_offer');
            $hasRange = $this->filled('price_min') || $this->filled('price_max');

            if ($hasOffer && $hasRange) {
                $validator->errors()->add(
                    'price_offer',
                    'Укажите либо точную цену, либо диапазон — не оба варианта одновременно.',
                );
            }

            // A range needs both bounds; a lone upper bound makes no sense.
            if ($this->filled('price_max') && ! $this->filled('price_min')) {
                $validator->errors()->add('price_min', 'Укажите минимальную цену диапазона.');
            }
        });
    }
}
