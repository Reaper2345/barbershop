<?php

namespace Tests\Unit;

use App\Models\Appointment;
use App\Models\Master;
use App\Models\Service;
use App\Models\User;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Appointment::finalPriceLabel accessor.
 *
 * These run without a database: the accessor only reads model attributes, so a
 * bare PHPUnit test case is enough.
 */
class AppointmentPriceLabelTest extends TestCase
{
    private function appointment(array $attributes): Appointment
    {
        $appointment = new Appointment();
        $appointment->forceFill($attributes);

        return $appointment;
    }

    public function test_it_returns_null_when_no_price_is_set(): void
    {
        $this->assertNull($this->appointment([])->final_price_label);
    }

    public function test_it_renders_a_single_offer(): void
    {
        $label = $this->appointment(['master_price_offer' => 2000])->final_price_label;

        $this->assertSame('2 000 ₽', $label);
    }

    public function test_it_renders_an_equal_range_as_one_amount(): void
    {
        $label = $this->appointment([
            'master_price_min' => 1800,
            'master_price_max' => 1800,
        ])->final_price_label;

        $this->assertSame('1 800 ₽', $label);
    }

    public function test_it_renders_a_price_range(): void
    {
        $label = $this->appointment([
            'master_price_min' => 1800,
            'master_price_max' => 2200,
        ])->final_price_label;

        $this->assertSame('1 800–2 200 ₽', $label);
    }

    public function test_offer_wins_over_range(): void
    {
        $label = $this->appointment([
            'master_price_min' => 1800,
            'master_price_max' => 2200,
            'master_price_offer' => 2000,
        ])->final_price_label;

        $this->assertSame('2 000 ₽', $label);
    }

    public function test_it_handles_a_missing_upper_bound(): void
    {
        $label = $this->appointment(['master_price_min' => 1500])->final_price_label;

        $this->assertSame('1 500 ₽', $label);
    }

    public function test_it_handles_a_missing_lower_bound(): void
    {
        $label = $this->appointment(['master_price_max' => 2500])->final_price_label;

        $this->assertSame('2 500 ₽', $label);
    }

    public function test_it_renders_thousands_with_spaces(): void
    {
        $label = $this->appointment(['master_price_offer' => 12500])->final_price_label;

        $this->assertSame('12 500 ₽', $label);
    }
}
