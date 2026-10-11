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
 * @property int $weekday
 * @property string $start_time
 * @property string $end_time
 * @property string|null $break_start
 * @property string|null $break_end
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Schedule extends Model
{
    /** @use HasFactory<\Database\Factories\ScheduleFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'master_id',
        'weekday',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Russian weekday names indexed 0 (Sunday) .. 6 (Saturday).
     *
     * @var array<int, string>
     */
    public const WEEKDAYS = [
        0 => 'Воскресенье',
        1 => 'Понедельник',
        2 => 'Вторник',
        3 => 'Среда',
        4 => 'Четверг',
        5 => 'Пятница',
        6 => 'Суббота',
    ];

    /**
     * @return BelongsTo<Master, $this>
     */
    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    public function weekdayName(): string
    {
        return self::WEEKDAYS[$this->weekday] ?? '—';
    }

    /**
     * True when the master has a break configured for this weekday.
     */
    public function hasBreak(): bool
    {
        return $this->break_start !== null && $this->break_end !== null;
    }

    /**
     * @param  Builder<Schedule>  $query
     */
    public function scopeForWeekday(Builder $query, int $weekday): void
    {
        $query->where('weekday', $weekday)->where('is_active', true);
    }
}
