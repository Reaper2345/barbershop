<?php

namespace App\Http\Requests;

use App\Models\Master;
use App\Models\Service;
use App\Services\SlotService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class StoreAppointmentRequest extends FormRequest
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
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'client_comment' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'master_id' => 'мастер',
            'service_id' => 'услуга',
            'starts_at' => 'время записи',
            'client_comment' => 'комментарий',
            'photo' => 'фотография',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'starts_at.after' => 'Нельзя записаться на прошедшее время. Выберите другой слот.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'photo.image' => 'Фотография должна быть изображением.',
        ];
    }

    /**
     * Reject the booking unless the requested minute is a real free slot.
     *
     * The check runs against live data via SlotService, so a stale or forged
     * `starts_at` cannot slip past validation.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->hasAny(['master_id', 'service_id', 'starts_at'])) {
                return;
            }

            $master = Master::find($this->integer('master_id'));
            $service = Service::find($this->integer('service_id'));

            if ($master === null || $service === null) {
                return;
            }

            if (! $master->is_active) {
                $validator->errors()->add('master_id', 'Этот мастер сейчас не принимает записи.');

                return;
            }

            // The chosen service must actually be offered by the chosen master.
            if (! $this->masterOffersService($master, $service->id)) {
                $validator->errors()->add('service_id', 'Выбранный мастер не оказывает эту услугу.');

                return;
            }

            $startsAt = $this->carbonStartsAt();

            if ($startsAt === null) {
                $validator->errors()->add('starts_at', 'Некорректная дата или время записи.');

                return;
            }

            $slotService = app(SlotService::class);

            if (! $slotService->isSlotBookable($master, $service, $startsAt)) {
                $validator->errors()->add(
                    'starts_at',
                    'Это время уже занято или недоступно для записи. Пожалуйста, выберите другой слот.',
                );
            }
        });
    }

    public function master(): ?Master
    {
        return Master::find($this->integer('master_id'));
    }

    public function service(): ?Service
    {
        return Service::find($this->integer('service_id'));
    }

    public function carbonStartsAt(): ?Carbon
    {
        $raw = $this->input('starts_at');

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return null;
        }
    }

    private function masterOffersService(Master $master, int $serviceId): bool
    {
        return $master->services()
            ->where('services.id', $serviceId)
            ->where('services.is_active', true)
            ->where('master_service.is_active', true)
            ->exists();
    }
}
