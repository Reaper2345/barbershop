<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters: roles and users come first, then the service catalogue,
     * then the per-master configuration, and finally the demo bookings and the
     * reviews that depend on them.
     */
    public function run(): void
    {
        $this->call([
            // 1. Access control and accounts
            RoleSeeder::class,
            AdminSeeder::class,
            MasterSeeder::class,
            ClientSeeder::class,

            // 2. Service catalogue
            CategorySeeder::class,
            ServiceSeeder::class,

            // 3. Per-master configuration (relies on masters + services)
            MasterServiceSeeder::class,
            ScheduleSeeder::class,

            // 4. Bookings and the reviews attached to completed ones
            AppointmentSeeder::class,
            ReviewSeeder::class,

            // 5. Showcase works for each master (relies on masters)
            PortfolioSeeder::class,

            // 6. Site content
            SettingSeeder::class,
            PageSeeder::class,
        ]);
    }
}
