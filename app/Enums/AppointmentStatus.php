<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case InProgress = 'in_progress';
    case Done = 'done';
    case Cancelled = 'cancelled';

    /**
     * Russian label rendered in admin tables and client cabinets.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Ожидает подтверждения',
            self::Confirmed => 'Подтверждена',
            self::InProgress => 'В работе',
            self::Done => 'Завершена',
            self::Cancelled => 'Отменена',
        };
    }

    /**
     * Tailwind badge palette name for this status.
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => 'amber',
            self::Confirmed => 'blue',
            self::InProgress => 'indigo',
            self::Done => 'emerald',
            self::Cancelled => 'rose',
        };
    }

    /**
     * Statuses that still occupy a slot in the master's calendar.
     *
     * @return list<self>
     */
    public static function active(): array
    {
        return [self::Pending, self::Confirmed, self::InProgress];
    }

    /**
     * Raw values of the statuses that block a calendar slot, ready for whereIn().
     *
     * @return list<string>
     */
    public static function activeValues(): array
    {
        return array_map(
            static fn (self $status): string => $status->value,
            self::active(),
        );
    }

    /**
     * Statuses a client is still allowed to cancel from.
     *
     * @return list<self>
     */
    public static function cancellable(): array
    {
        return [self::Pending, self::Confirmed];
    }

    public function isCancellable(): bool
    {
        return in_array($this, self::cancellable(), true);
    }

    /**
     * All enum values, handy for validation rules.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
