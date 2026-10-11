<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $category_id
 * @property string $name
 * @property string|null $description
 * @property string $base_price_min
 * @property string $base_price_max
 * @property int $duration_min
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Category $category
 */
class Service extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'description',
        'base_price_min',
        'base_price_max',
        'duration_min',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_price_min' => 'decimal:2',
            'base_price_max' => 'decimal:2',
            'duration_min' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Masters performing this service (pivot carries per-master overrides).
     *
     * @return BelongsToMany<Master, $this>
     */
    public function masters(): BelongsToMany
    {
        return $this->belongsToMany(Master::class, 'master_service')
            ->withPivot(['price_min', 'price_max', 'duration_min', 'is_active'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Appointment, $this>
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    // ---------------------------------------------------------------------
    // Scopes & helpers
    // ---------------------------------------------------------------------

    /**
     * @param  Builder<Service>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Display string for the base price range, e.g. "1500–2500 ₽".
     */
    public function priceLabel(): string
    {
        $min = (float) $this->base_price_min;
        $max = (float) $this->base_price_max;

        if ($min === $max) {
            return number_format($min, 0, ',', ' ').' ₽';
        }

        return number_format($min, 0, ',', ' ').'–'.number_format($max, 0, ',', ' ').' ₽';
    }
}
