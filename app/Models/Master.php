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
 * @property int $user_id
 * @property string|null $bio
 * @property string|null $photo
 * @property int $experience_years
 * @property string $rating
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
class Master extends Model
{
    /** @use HasFactory<\Database\Factories\MasterFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'bio',
        'photo',
        'experience_years',
        'rating',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'rating' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Services this master performs, with per-master price/duration overrides.
     *
     * @return BelongsToMany<Service, $this>
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'master_service')
            ->withPivot(['price_min', 'price_max', 'duration_min', 'is_active'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Schedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * @return HasMany<TimeOff, $this>
     */
    public function timeOff(): HasMany
    {
        return $this->hasMany(TimeOff::class);
    }

    /**
     * @return HasMany<Appointment, $this>
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Showcase of this master's work, in display order.
     *
     * @return HasMany<PortfolioItem, $this>
     */
    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class)->orderBy('sort_order');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    /**
     * @param  Builder<Master>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Masters whose weekday schedule marks them available on the given day.
     *
     * @param  Builder<Master>  $query
     */
    public function scopeWorkingOn(Builder $query, int $weekday): void
    {
        $query->whereHas('schedules', fn (Builder $q) => $q
            ->where('weekday', $weekday)
            ->where('is_active', true));
    }

    /**
     * Recalculate the cached rating from approved reviews.
     */
    public function recalculateRating(): void
    {
        $average = $this->reviews()->where('is_approved', true)->avg('rating');

        $this->forceFill(['rating' => round((float) $average, 2)])->save();
    }
}
