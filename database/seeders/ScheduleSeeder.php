<?php

namespace Database\Seeders;

use App\Models\Master;
use App\Models\Schedule;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    /**
     * Working week is Tuesday–Saturday: 10:00–20:00 with a lunch break 14:00–15:00.
     * Weekday numbering follows Carbon: 0 = Sunday ... 6 = Saturday.
     *
     * @var list<int>
     */
    private const WORKING_WEEKDAYS = [2, 3, 4, 5, 6];

    public function run(): void
    {
        /** @var Master $master */
        foreach (Master::query()->get() as $master) {
            foreach (self::WORKING_WEEKDAYS as $weekday) {
                Schedule::updateOrCreate(
                    ['master_id' => $master->id, 'weekday' => $weekday],
                    [
                        'start_time' => '10:00:00',
                        'end_time' => '20:00:00',
                        'break_start' => '14:00:00',
                        'break_end' => '15:00:00',
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
