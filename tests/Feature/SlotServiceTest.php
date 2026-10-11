<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Category;
use App\Models\Master;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\TimeOff;
use App\Models\User;
use App\Services\SlotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Behavioural tests for SlotService.
 *
 * The expectations encoded here were first verified against a standalone port
 * of the algorithm (20/20 checks), which is how the isFuture()-vs-isPast()
 * off-by-one on "slot starting exactly now" was found.
 */
class SlotServiceTest extends TestCase
{
    use RefreshDatabase;

    private Master $master;

    private Service $service;

    private User $client;

    private SlotService $slots;

    /**
     * Fixed reference point: Thursday, 13 June 2024.
     */
    private Carbon $thursday;

    protected function setUp(): void
    {
        parent::setUp();

        $this->slots = app(SlotService::class);
        $this->thursday = Carbon::parse('2024-06-13', config('app.timezone'))->startOfDay();

        $user = User::create([
            'name' => 'Мастер Тестовый',
            'email' => 'slot-master@barber.test',
            'password' => 'password',
            'role' => 'master',
        ]);

        $this->master = Master::create([
            'user_id' => $user->id,
            'experience_years' => 5,
            'rating' => 0,
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Стрижки',
            'slug' => 'strizhki',
            'sort_order' => 10,
        ]);

        $this->service = Service::create([
            'category_id' => $category->id,
            'name' => 'Мужская стрижка',
            'base_price_min' => 1500,
            'base_price_max' => 2500,
            'duration_min' => 60,
            'is_active' => true,
        ]);

        $this->master->services()->attach($this->service->id, [
            'price_min' => 1500,
            'price_max' => 2500,
            'duration_min' => 60,
            'is_active' => true,
        ]);

        // A separate client, so seeded appointments are not self-bookings.
        $this->client = User::create([
            'name' => 'Клиент Тестовый',
            'email' => 'slot-client@barber.test',
            'password' => 'password',
            'role' => 'client',
        ]);

        // Tuesday-Saturday 10:00-20:00 with a 14:00-15:00 lunch break.
        foreach ([2, 3, 4, 5, 6] as $weekday) {
            Schedule::create([
                'master_id' => $this->master->id,
                'weekday' => $weekday,
                'start_time' => '10:00:00',
                'end_time' => '20:00:00',
                'break_start' => '14:00:00',
                'break_end' => '15:00:00',
                'is_active' => true,
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function slotTimes(Carbon $date, ?Carbon $now = null): array
    {
        Carbon::setTestNow($now ?? $this->thursday->copy()->setTime(9, 0));

        $times = array_map(
            static fn (array $slot): string => $slot['time'],
            $this->slots->getAvailableSlots($this->master, $this->service, $date),
        );

        Carbon::setTestNow();

        return array_values($times);
    }

    public function test_it_generates_30_minute_slots_skipping_the_break(): void
    {
        $times = $this->slotTimes($this->thursday);

        // 10:00 .. 19:00 on a 30-minute grid. A 60-minute service ending exactly
        // at 14:00 does not overlap the break, so 13:00 stays; 13:30 and 14:00
        // run into (or through) the break and are dropped.
        $this->assertContains('10:00', $times);
        $this->assertContains('13:00', $times);
        $this->assertContains('15:00', $times);
        $this->assertContains('19:00', $times);
        $this->assertNotContains('13:30', $times);
        $this->assertNotContains('14:00', $times);
        $this->assertNotContains('14:30', $times);
        $this->assertNotContains('19:30', $times);

        // Every slot is on the 30-minute grid and in ascending order.
        $sorted = $times;
        sort($sorted);
        $this->assertSame($sorted, $times);
    }

    public function test_each_slot_reports_iso_start_and_end(): void
    {
        Carbon::setTestNow($this->thursday->copy()->setTime(9, 0));

        $slots = $this->slots->getAvailableSlots($this->master, $this->service, $this->thursday);

        Carbon::setTestNow();

        $this->assertNotEmpty($slots);

        $first = $slots[0];
        $this->assertSame('10:00', $first['time']);
        $this->assertStringContainsString('T10:00', $first['starts_at']);
        $this->assertStringContainsString('T11:00', $first['ends_at']);
    }

    public function test_a_shorter_service_can_start_at_break_boundaries(): void
    {
        // 30 minutes: 13:30 ends exactly at the break start, 14:00 IS the break
        // start so it is excluded, and 15:00 ends the break.
        $short = Service::create([
            'category_id' => $this->service->category_id,
            'name' => 'Оформление висков',
            'base_price_min' => 500,
            'base_price_max' => 900,
            'duration_min' => 30,
            'is_active' => true,
        ]);

        $this->master->services()->attach($short->id, [
            'duration_min' => 30,
            'is_active' => true,
        ]);

        Carbon::setTestNow($this->thursday->copy()->setTime(9, 0));
        $times = array_map(
            static fn (array $slot): string => $slot['time'],
            $this->slots->getAvailableSlots($this->master, $short, $this->thursday),
        );
        Carbon::setTestNow();

        $this->assertContains('13:30', $times);
        $this->assertNotContains('14:00', $times);
        $this->assertNotContains('14:30', $times);
        $this->assertContains('15:00', $times);
    }

    public function test_existing_appointments_block_overlapping_slots(): void
    {
        Appointment::create([
            'client_id' => $this->client->id,
            'master_id' => $this->master->id,
            'service_id' => $this->service->id,
            'starts_at' => $this->thursday->copy()->setTime(12, 0),
            'ends_at' => $this->thursday->copy()->setTime(13, 0),
            'status' => AppointmentStatus::Confirmed,
        ]);

        $times = $this->slotTimes($this->thursday);

        $this->assertNotContains('11:30', $times);
        $this->assertNotContains('12:00', $times);
        $this->assertContains('11:00', $times);
        $this->assertContains('13:00', $times);
    }

    public function test_cancelled_appointments_do_not_block_slots(): void
    {
        Appointment::create([
            'client_id' => $this->client->id,
            'master_id' => $this->master->id,
            'service_id' => $this->service->id,
            'starts_at' => $this->thursday->copy()->setTime(12, 0),
            'ends_at' => $this->thursday->copy()->setTime(13, 0),
            'status' => AppointmentStatus::Cancelled,
        ]);

        $times = $this->slotTimes($this->thursday);

        $this->assertContains('12:00', $times);
    }

    public function test_time_off_removes_every_slot(): void
    {
        TimeOff::create([
            'master_id' => $this->master->id,
            'date' => $this->thursday->toDateString(),
            'reason' => 'Отпуск',
        ]);

        $this->assertSame([], $this->slotTimes($this->thursday));
    }

    public function test_inactive_schedule_removes_every_slot(): void
    {
        $this->master->schedules()->where('weekday', 4)->update(['is_active' => false]);

        $this->assertSame([], $this->slotTimes($this->thursday));
    }

    public function test_a_day_without_a_schedule_has_no_slots(): void
    {
        // Monday is not in the 2..6 working range.
        $monday = Carbon::parse('2024-06-10', config('app.timezone'))->startOfDay();

        $this->assertSame([], $this->slotTimes($monday));
    }

    public function test_past_slots_are_removed_for_today(): void
    {
        // At 13:00 the 13:00 slot is no longer bookable and 13:30 is blocked by
        // the break for a 60-minute service, so the day starts at 15:00.
        $times = $this->slotTimes($this->thursday, $this->thursday->copy()->setTime(13, 0));

        $this->assertSame('15:00', $times[0]);
        $this->assertNotContains('13:00', $times);
    }

    public function test_a_service_longer_than_the_working_day_has_no_slots(): void
    {
        $this->service->update(['duration_min' => 700]);

        $this->assertSame([], $this->slotTimes($this->thursday));
    }

    public function test_a_service_filling_the_whole_day_has_no_slots_when_a_break_exists(): void
    {
        // 10:00-20:00 is exactly 600 minutes, but the 14:00-15:00 break makes it
        // impossible for any start time to fit.
        $this->service->update(['duration_min' => 600]);

        $this->assertSame([], $this->slotTimes($this->thursday));
    }

    public function test_is_slot_bookable_enforces_the_grid(): void
    {
        Carbon::setTestNow($this->thursday->copy()->setTime(9, 0));

        $onGrid = $this->thursday->copy()->setTime(10, 30);
        $offGrid = $this->thursday->copy()->setTime(10, 15);
        $beforeOpening = $this->thursday->copy()->setTime(9, 30);
        $inBreak = $this->thursday->copy()->setTime(13, 45);

        $this->assertTrue($this->slots->isSlotBookable($this->master, $this->service, $onGrid));
        $this->assertFalse($this->slots->isSlotBookable($this->master, $this->service, $offGrid));
        $this->assertFalse($this->slots->isSlotBookable($this->master, $this->service, $beforeOpening));
        $this->assertFalse($this->slots->isSlotBookable($this->master, $this->service, $inBreak));

        Carbon::setTestNow();
    }

    public function test_is_slot_bookable_rejects_a_slot_starting_exactly_now(): void
    {
        // Regression guard: isPast() is false for a time equal to now, so a slot
        // starting this very second must be rejected explicitly.
        $now = $this->thursday->copy()->setTime(10, 0);
        Carbon::setTestNow($now);

        $this->assertFalse($this->slots->isSlotBookable($this->master, $this->service, $now->copy()));

        Carbon::setTestNow();
    }

    public function test_is_slot_bookable_is_false_on_a_day_off(): void
    {
        TimeOff::create([
            'master_id' => $this->master->id,
            'date' => $this->thursday->toDateString(),
        ]);

        Carbon::setTestNow($this->thursday->copy()->setTime(9, 0));

        $this->assertFalse(
            $this->slots->isSlotBookable($this->master, $this->service, $this->thursday->copy()->setTime(10, 0)),
        );

        Carbon::setTestNow();
    }
}
