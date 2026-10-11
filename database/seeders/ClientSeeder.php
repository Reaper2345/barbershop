<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Two demo clients used to exercise the booking flow.
     *
     * @var list<array<string, mixed>>
     */
    private const CLIENTS = [
        [
            'name' => 'Сергей Морозов',
            'email' => 'client1@barber.test',
            'phone' => '+7 985 601-23-44',
            'avatar' => 'avatars/sergey-morozov.jpg',
        ],
        [
            'name' => 'Павел Никитин',
            'email' => 'client2@barber.test',
            'phone' => '+7 909 133-70-52',
            'avatar' => null,
        ],
    ];

    public function run(): void
    {
        foreach (self::CLIENTS as $data) {
            $client = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'avatar' => $data['avatar'],
                    'role' => RoleEnum::Client,
                    'password' => 'password',
                    'email_verified_at' => now(),
                ],
            );

            $client->syncRoles([RoleEnum::Client->value]);
        }
    }
}
