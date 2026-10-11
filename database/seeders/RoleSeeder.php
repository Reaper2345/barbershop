<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * The three application roles. `guard_name` follows the default config.
     */
    public function run(): void
    {
        // Drop the Spatie permission cache so the new roles are visible at once.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (RoleEnum::values() as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }
    }
}
