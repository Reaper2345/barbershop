<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Review
 */
class ReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => (int) $this->rating,
            'text' => $this->text,
            'photo_path' => $this->photo_path,
            'photo_url' => $this->photo_path === null
                ? null
                : asset('storage/'.$this->photo_path),
            'is_approved' => (bool) $this->is_approved,
            'created_at' => $this->created_at?->toIso8601String(),
            'created_at_label' => $this->created_at?->translatedFormat('j F Y'),

            'client' => $this->whenLoaded('client', fn (): array => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'avatar' => $this->client->avatar,
            ]),
            // Resolved eagerly: an unresolved JsonResource is a Responsable, and
            // Inertia answers those with a {"data": …} wrapper, which silently
            // turned review.master into review.master.data on the review wall.
            'master' => $this->whenLoaded('master', fn (): array => (new MasterResource($this->master))->resolve($request)),
        ];
    }
}
