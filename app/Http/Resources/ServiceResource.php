<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Service
 */
class ServiceResource extends JsonResource
{
    /**
     * Prices fall back to the master's own override when the pivot is loaded,
     * so the same resource can describe "catalogue" and "this master" prices.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'base_price_min' => (float) $this->base_price_min,
            'base_price_max' => (float) $this->base_price_max,
            'base_price_label' => $this->priceLabel(),
            'duration_min' => (int) $this->duration_min,
            'is_active' => (bool) $this->is_active,

            /*
             * Master-specific override fields:
             *
             *  - `pivot`   : this master's price, else null (inherit catalogue)
             *  - `pivot_*` : the same values under explicit names
             *
             * The third argument is the point of this block. `whenPivotLoaded()`
             * does NOT return null when the pivot is absent — it returns
             * `MissingValue` (see ConditionallyLoadsAttributes::whenPivotLoaded,
             * whose default is `new MissingValue`). Serialising the resource
             * without a loaded pivot therefore used to yield a MissingValue
             * instance, and the old `$pivot === null ? … : $pivot->price_min`
             * check fell straight through to a property read on it:
             *
             *   Undefined property: Illuminate\Http\Resources\MissingValue::$price_min
             *
             * Passing `null` as the default makes "no pivot" an actual null, so
             * every consumer sees null instead of a MissingValue leak.
             *
             * `pivot` is published in the master-specific shape AND as
             * `pivot_*`. The React layer reads `service.pivot?.price_min`
             * (types/index.ts, Components/Public/MasterCard.tsx, lib/format.ts),
             * so both must stay.
             */
            'price_min' => $this->whenPivotLoaded('master_service', fn (): ?float => $this->pivot?->price_min === null
                ? null
                : (float) $this->pivot->price_min, null),
            'price_max' => $this->whenPivotLoaded('master_service', fn (): ?float => $this->pivot?->price_max === null
                ? null
                : (float) $this->pivot->price_max, null),

            'pivot_duration_min' => $this->whenPivotLoaded('master_service', fn (): ?int => $this->pivot?->duration_min === null
                ? null
                : (int) $this->pivot->duration_min, null),
            'pivot_is_active' => $this->whenPivotLoaded('master_service', fn (): bool => (bool) $this->pivot?->is_active, null),

            'pivot' => $this->whenPivotLoaded('master_service', fn (): array => [
                'price_min' => $this->pivot?->price_min === null ? null : (float) $this->pivot->price_min,
                'price_max' => $this->pivot?->price_max === null ? null : (float) $this->pivot->price_max,
                'duration_min' => $this->pivot?->duration_min === null ? null : (int) $this->pivot->duration_min,
                'is_active' => (bool) $this->pivot?->is_active,
            ], null),
        ];
    }
}
