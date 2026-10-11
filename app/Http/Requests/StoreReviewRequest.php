<?php

namespace App\Http\Requests;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'appointment_id' => [
                'required',
                'integer',
                // Must be one of this client's own completed visits.
                Rule::exists('appointments', 'id')
                    ->where('client_id', $this->user()?->id)
                    ->where('status', AppointmentStatus::Done->value),
            ],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text' => ['nullable', 'string', 'max:2000'],
            // Optional client photo of the result; stored on the public disk.
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'appointment_id' => 'запись',
            'rating' => 'оценка',
            'text' => 'отзыв',
            'photo' => 'фотография',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'appointment_id.exists' => 'Отзыв можно оставить только по завершённому визиту.',
            'appointment_id.required' => 'Не указана запись, по которой оставляется отзыв.',
            'rating.min' => 'Оценка должна быть от 1 до 5.',
            'rating.max' => 'Оценка должна быть от 1 до 5.',
            'rating.required' => 'Поставьте оценку от 1 до 5.',
            'photo.image' => 'Фотография должна быть изображением.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
        ];
    }

    /**
     * A given visit can only be reviewed once (reviews.appointment_id is unique).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $appointmentId = $this->input('appointment_id');

            if ($appointmentId === null) {
                return;
            }

            $alreadyReviewed = Appointment::query()
                ->whereKey($appointmentId)
                ->whereHas('review')
                ->exists();

            if ($alreadyReviewed) {
                $validator->errors()->add('appointment_id', 'По этой записи отзыв уже оставлен.');
            }
        });
    }
}
