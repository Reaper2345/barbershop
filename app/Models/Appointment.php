<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $client_id
 * @property int $master_id
 * @property int $service_id
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property AppointmentStatus $status
 * @property string|null $client_comment
 * @property string|null $photo_path
 * @property string|null $master_price_min
 * @property string|null $master_price_max
 * @property string|null $master_price_offer
 * @property string|null $master_comment
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string|null $final_price_label
 */
class Appointment extends Model
{
    /** @use HasFactory<\Database\Factories\AppointmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'client_id',
        'master_id',
        'service_id',
        'starts_at',
        'ends_at',
        'status',
        'client_comment',
        'photo_path',
        'master_price_min',
        'master_price_max',
        'master_price_offer',
        'master_comment',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'status' => AppointmentStatus::class,
            'master_price_min' => 'decimal:2',
            'master_price_max' => 'decimal:2',
            'master_price_offer' => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * @return BelongsTo<User, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * @return BelongsTo<Master, $this>
     */
    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    /**
     * @return BelongsTo<Service, $this>
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * @return HasOne<Review, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    /**
     * Bookings that have not started yet and are still live.
     *
     * @param  Builder<Appointment>  $query
     */
    public function scopeUpcoming(Builder $query): void
    {
        $query->where('starts_at', '>=', Carbon::now())
            ->whereIn('status', array_map(
                static fn (AppointmentStatus $status): string => $status->value,
                AppointmentStatus::active(),
            ))
            ->orderBy('starts_at');
    }

    /**
     * @param  Builder<Appointment>  $query
     */
    public function scopeForMaster(Builder $query, int|Master $master): void
    {
        $query->where('master_id', $master instanceof Master ? $master->id : $master);
    }

    /**
     * @param  Builder<Appointment>  $query
     */
    public function scopeForClient(Builder $query, int|User $client): void
    {
        $query->where('client_id', $client instanceof User ? $client->id : $client);
    }

    /**
     * @param  Builder<Appointment>  $query
     */
    public function scopeWithStatus(Builder $query, AppointmentStatus $status): void
    {
        $query->where('status', $status->value);
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Human readable price shown to the client.
     *
     * A concrete offer wins over a range; the range is rendered as
     * "1800–2200 ₽" and a single agreed amount as "2000 ₽".
     *
     * @return Attribute<string|null, never>
     */
    protected function finalPriceLabel(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->master_price_offer !== null) {
                return self::formatMoney((float) $this->master_price_offer);
            }

            $min = $this->master_price_min === null ? null : (float) $this->master_price_min;
            $max = $this->master_price_max === null ? null : (float) $this->master_price_max;

            if ($min === null && $max === null) {
                return null;
            }

            // Only one bound provided.
            if ($min === null) {
                return self::formatMoney($max);
            }

            if ($max === null) {
                return self::formatMoney($min);
            }

            if ($min === $max) {
                return self::formatMoney($min);
            }

            return self::formatMoney($min).'–'.self::formatMoney($max, withSuffix: false);
        });
    }

    /**
     * Format a price as a Russian rouble amount, e.g. 2000 => "2000 ₽".
     */
    private static function formatMoney(float $amount, bool $withSuffix = true): string
    {
        $formatted = number_format($amount, 0, ',', ' ');

        return $withSuffix ? $formatted.' ₽' : $formatted;
    }

    /**
     * Total duration of the booking in minutes.
     */
    public function durationMinutes(): int
    {
        return (int) $this->starts_at->diffInMinutes($this->ends_at);
    }
}
