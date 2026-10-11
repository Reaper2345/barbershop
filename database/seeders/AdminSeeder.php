<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Single administrator account used to sign in to the admin panel.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@barber.test'],
            [
                'name' => 'Александр Петров',
                'phone' => '+7 495 120-45-67',
                'avatar' => 'avatars/admin.jpg',
                'role' => RoleEnum::Admin,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        $admin->syncRoles([RoleEnum::Admin->value]);
    }
}
