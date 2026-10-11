<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Master
 */
class MasterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->user?->name,
            'photo' => $this->photo,
            'bio' => $this->bio,
            'experience_years' => $this->experience_years,
            'rating' => (float) $this->rating,
            'is_active' => (bool) $this->is_active,

            // Loaded only when the controller eager-loads the relation.
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'reviews_count' => $this->whenCounted('reviews'),
        ];
    }
}
