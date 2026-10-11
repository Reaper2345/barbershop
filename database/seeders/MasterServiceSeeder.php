<?php

namespace Database\Seeders;

use App\Models\Master;
use App\Models\Service;
use Illuminate\Database\Seeder;

class MasterServiceSeeder extends Seeder
{
    /**
     * Number of services offered by each master (random slice of the price list).
     */
    private const MIN_SERVICES_PER_MASTER = 8;

    private const MAX_SERVICES_PER_MASTER = 11;

    /**
     * Fixed seed keeps the "random" assignment reproducible between runs,
     * which makes the demo data stable for screenshots and tests.
     */
    private const RANDOM_SEED = 20240101;

    public function run(): void
    {
        $services = Service::query()->get();

        if ($services->isEmpty()) {
            $this->command?->warn('MasterServiceSeeder: no services found, run ServiceSeeder first.');

            return;
        }

        /** @var Master $master */
        foreach (Master::query()->get() as $index => $master) {
            // Per-master RNG so adding a fourth master does not shift masters 1-3.
            mt_srand(self::RANDOM_SEED + $index);

            $count = mt_rand(
                min(self::MIN_SERVICES_PER_MASTER, $services->count()),
                min(self::MAX_SERVICES_PER_MASTER, $services->count()),
            );

            $selection = $services->random($count);

            $sync = [];

            foreach ($selection as $service) {
                // ±10% price variation, rounded to the nearest 50 roubles.
                $min = $this->vary((float) $service->base_price_min);
                $max = $this->vary((float) $service->base_price_max);

                // Guarantee min <= max even after independent variation.
                if ($min > $max) {
                    [$min, $max] = [$max, $min];
                }

                $sync[$service->id] = [
                    'price_min' => $min,
                    'price_max' => $max,
                    // ±10% duration variation, snapped to 5-minute steps.
                    'duration_min' => $this->varyDuration((int) $service->duration_min),
                    'is_active' => true,
                ];
            }

            // Rows left over from an earlier run are flagged inactive rather
            // than deleted, so historical appointments keep a valid pivot row.
            $master->services()->syncWithoutDetaching($sync);

            $master->services()
                ->whereNotIn('services.id', array_keys($sync))
                ->update(['master_service.is_active' => false]);
        }

        // Restore the global RNG so later seeders are unaffected.
        mt_srand();
    }

    /**
     * Apply a ±10% variation and round to the nearest 50 roubles.
     */
    private function vary(float $price): float
    {
        $factor = mt_rand(-10, 10) / 100;

        return round(($price * (1 + $factor)) / 50) * 50;
    }

    /**
     * Apply a ±10% variation to a duration, snapped to 5-minute steps.
     */
    private function varyDuration(int $minutes): int
    {
        $factor = mt_rand(-10, 10) / 100;

        return max(15, (int) (round(($minutes * (1 + $factor)) / 5) * 5));
    }
}
