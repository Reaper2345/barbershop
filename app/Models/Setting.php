<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string $group
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Setting extends Model
{
    /** @use HasFactory<\Database\Factories\SettingFactory> */
    use HasFactory;

    public const CACHE_KEY = 'barbershop.settings';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    protected static function booted(): void
    {
        // The whole settings map is cached as one blob, so any write busts it.
        static::saved(static fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(static fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * @param  Builder<Setting>  $query
     */
    public function scopeInGroup(Builder $query, string $group): void
    {
        $query->where('group', $group);
    }

    /**
     * All settings as a key => value map, cached for the lifetime of a deploy.
     *
     * @return array<string, string|null>
     */
    public static function allCached(): array
    {
        return Cache::rememberForever(
            self::CACHE_KEY,
            static fn (): array => self::query()->pluck('value', 'key')->all(),
        );
    }

    /**
     * Read a single setting value with an optional default.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        return self::allCached()[$key] ?? $default;
    }

    /**
     * Create or update a setting and flush the cache.
     */
    public static function put(string $key, ?string $value, string $group = 'general'): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group],
        );
    }

    /**
     * Drop the cached settings blob.
     *
     * save()/delete() already do this; the admin settings screen calls it too so
     * a payload with no net change still refreshes a stale entry.
     */
    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
