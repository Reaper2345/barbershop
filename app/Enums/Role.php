<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Master = 'master';
    case Client = 'client';

    /**
     * Human readable Russian label, used by the UI in later prompts.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Администратор',
            self::Master => 'Мастер',
            self::Client => 'Клиент',
        };
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
