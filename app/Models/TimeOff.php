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
 * @property string $type
 * @property string|null $reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class TimeOff extends Model
{
    /** @use HasFactory<\Database\Factories\TimeOffFactory> */
    use HasFactory;

    /** Absence kinds offered by the master's quick actions. */
    public const TYPE_VACATION = 'vacation';

    public const TYPE_DAY_OFF = 'day_off';

    public const TYPE_SICK = 'sick';

    /**
     * Stored value → Russian label. The keys are also the validation whitelist.
     *
     * @var array<string, string>
     */
    public const TYPES = [
        self::TYPE_VACATION => 'Отпуск',
        self::TYPE_DAY_OFF => 'Выходной',
        self::TYPE_SICK => 'Больничный',
    ];

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
        'type',
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
     * Russian label for this row's type, ready for a flash message.
     */
    public function typeLabel(): string
    {
        return self::TYPES[$this->type] ?? self::TYPES[self::TYPE_DAY_OFF];
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
