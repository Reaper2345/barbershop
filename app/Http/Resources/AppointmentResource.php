<?php

namespace App\Http\Resources;

use App\Enums\AppointmentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * @mixin \App\Models\Appointment
 */
class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // Raw enum value for logic, Russian label for display.
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_color' => $this->status->color(),

            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'starts_at_label' => $this->starts_at?->translatedFormat('j F Y, H:i'),
            'date_label' => $this->starts_at?->translatedFormat('j F Y'),
            'time_label' => $this->starts_at?->format('H:i'),
            'duration_min' => $this->when(
                $this->starts_at !== null && $this->ends_at !== null,
                fn (): int => $this->durationMinutes(),
            ),

            'client_comment' => $this->client_comment,
            'photo_path' => $this->photo_path,
            'photo_url' => $this->photo_path === null ? null : asset('storage/'.$this->photo_path),

            'master_price_min' => $this->master_price_min === null ? null : (float) $this->master_price_min,
            'master_price_max' => $this->master_price_max === null ? null : (float) $this->master_price_max,
            'master_price_offer' => $this->master_price_offer === null ? null : (float) $this->master_price_offer,

            // Computed by the model accessor: "2 000 ₽" | "1 800–2 200 ₽" | null.
            'final_price_label' => $this->final_price_label,
            'master_comment' => $this->master_comment,

            'can_cancel' => $this->canCancel($request),
            // Whether the status itself still permits a client cancellation,
            // independent of who is asking. The cabinet uses this to decide
            // which action buttons to render per status.
            'is_cancellable' => $this->status->isCancellable(),

            'client' => $this->whenLoaded('client', fn (): array => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'phone' => $this->client->phone,
                'email' => $this->client->email,
            ]),
            /*
             * Nested resources are resolved eagerly into plain arrays instead of
             * being left as JsonResource objects.
             *
             * Inertia treats every Responsable prop — and JsonResource is one —
             * by calling toResponse() on it and reading the decoded body
             * (Response::resolvePropertyInstances). A ResourceResponse wraps its
             * payload in the "data" key, so an unresolved nested resource reached
             * React as {"data": {...}} and `service?.name` silently became
             * undefined ("Услуга: —"). Resolving here keeps the flat shape the
             * React types declare.
             */
            'master' => $this->whenLoaded('master', fn (): array => (new MasterResource($this->master))->resolve($request)),
            'service' => $this->whenLoaded('service', fn (): array => (new ServiceResource($this->service))->resolve($request)),
            'review' => $this->whenLoaded('review', fn (): ?array => $this->review === null ? null : (new ReviewResource($this->review))->resolve($request)),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Mirrors AppointmentPolicy::cancel so the UI and the API agree.
     */
    private function canCancel(Request $request): bool
    {
        $user = $request->user();

        if ($user === null || $this->starts_at === null) {
            return false;
        }

        if ($user->id !== $this->client_id) {
            return false;
        }

        return $this->status->isCancellable()
            && $this->starts_at->greaterThan(Carbon::now());
    }
}
