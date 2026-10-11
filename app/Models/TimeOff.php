<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $master_id
 * @property Carbon $date
 * @property string|null $reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class TimeOff extends Model
{
    /** @use HasFactory<\Database\Factories\TimeOffFactory> */
    use HasFactory;

    /**
     * The table name is singular and does not follow Laravel's convention.
     *
     * @var string
     */
    protected $table = 'time_off';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'master_id',
        'date',
        'reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Master, $this>
     */
    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    /**
     * @param  Builder<TimeOff>  $query
     */
    public function scopeUpcoming(Builder $query): void
    {
        $query->whereDate('date', '>=', Carbon::today())->orderBy('date');
    }
}
