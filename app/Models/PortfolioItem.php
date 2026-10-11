<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A single portfolio entry: one photo of the master's work.
 *
 * @property int $id
 * @property int $master_id
 * @property string|null $title
 * @property string|null $description
 * @property string $photo_path
 * @property int $sort_order
 * @property bool $is_published
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Master $master
 */
class PortfolioItem extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'master_id',
        'title',
        'description',
        'photo_path',
        'sort_order',
        'is_published',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'bool',
            'sort_order' => 'int',
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
     * Items the public site may show, in display order.
     *
     * @param  Builder<PortfolioItem>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true)
            ->orderBy('sort_order')
            ->orderByDesc('id');
    }
}
