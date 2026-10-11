<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\Role;
use App\Models\Appointment;
use App\Models\Category;
use App\Models\Master;
use App\Models\Page;
use App\Models\Review;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Verifies the schema and the seed data produced by PROMPT 1.
 *
 * phpunit.xml pins this suite to in-memory SQLite, so the MySQL-specific
 * migrations are exercised only structurally (see the note in the summary).
 */
class BookingSchemaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        // hasRole() reads Spatie's cached permission map; reset it so the
        // roles created by the seeder are actually visible.
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_roles_are_created(): void
    {
        $this->assertDatabaseHas('roles', ['name' => Role::Admin->value, 'guard_name' => 'web']);
        $this->assertDatabaseHas('roles', ['name' => Role::Master->value, 'guard_name' => 'web']);
        $this->assertDatabaseHas('roles', ['name' => Role::Client->value, 'guard_name' => 'web']);
    }

    public function test_users_are_created_with_the_expected_roles(): void
    {
        $admin = User::where('email', 'admin@barber.test')->firstOrFail();
        $this->assertSame(Role::Admin, $admin->role);
        $this->assertTrue($admin->hasRole(Role::Admin->value));

        $this->assertSame(3, User::where('role', Role::Master->value)->count());
        $this->assertSame(2, User::where('role', Role::Client->value)->count());

        $masterUser = User::where('email', 'master1@barber.test')->firstOrFail();
        $this->assertTrue($masterUser->hasRole(Role::Master->value));
        $this->assertNotNull($masterUser->master);
    }

    public function test_catalogue_and_master_configuration(): void
    {
        $this->assertSame(4, Category::count());
        $this->assertSame(14, Service::count());
        $this->assertSame(3, Master::count());
        $this->assertSame(13, Appointment::count());
        $this->assertSame(8, Review::count());
        $this->assertSame(9, Setting::count());
        $this->assertSame(2, Page::count());
    }

    public function test_every_master_has_a_tue_to_sat_schedule(): void
    {
        $master = Master::firstOrFail();

        $this->assertSame(5, $master->schedules()->count());

        $weekdays = $master->schedules()->orderBy('weekday')->pluck('weekday')
            ->map(static fn ($weekday): int => (int) $weekday)
            ->all();

        $this->assertSame([2, 3, 4, 5, 6], $weekdays);

        $schedule = $master->schedules()->where('weekday', 2)->firstOrFail();
        $this->assertStringStartsWith('10:00', (string) $schedule->start_time);
        $this->assertStringStartsWith('20:00', (string) $schedule->end_time);
        $this->assertTrue($schedule->hasBreak());
    }

    public function test_master_services_carry_price_overrides_within_ten_percent(): void
    {
        $master = Master::with('services')->firstOrFail();

        $this->assertGreaterThanOrEqual(8, $master->services->count());
        $this->assertLessThanOrEqual(11, $master->services->count());

        foreach ($master->services as $service) {
            // decimal:2 casts come back as strings, so compare as floats.
            $pivotMin = (float) $service->pivot->price_min;
            $pivotMax = (float) $service->pivot->price_max;
            $baseMin = (float) $service->base_price_min;
            $baseMax = (float) $service->base_price_max;

            // ±10% variation, then rounded to the nearest 50 roubles.
            $this->assertGreaterThanOrEqual($baseMin * 0.90 - 49, $pivotMin);
            $this->assertLessThanOrEqual($baseMin * 1.10 + 49, $pivotMin);
            $this->assertGreaterThanOrEqual($baseMax * 0.90 - 49, $pivotMax);
            $this->assertLessThanOrEqual($baseMax * 1.10 + 49, $pivotMax);

            // The seeder guarantees the lower bound never exceeds the upper one.
            $this->assertLessThanOrEqual($pivotMax, $pivotMin);
        }
    }

    public function test_reviews_are_approved_and_ratings_are_consistent(): void
    {
        $this->assertSame(8, Review::where('is_approved', true)->count());

        foreach (Master::with('reviews')->get() as $master) {
            $expected = round((float) $master->reviews()->where('is_approved', true)->avg('rating'), 2);

            $this->assertEqualsWithDelta($expected, (float) $master->rating, 0.001);
        }
    }

    public function test_appointment_scopes_and_status_casting(): void
    {
        $appointment = Appointment::with('service')->where('status', AppointmentStatus::Done->value)->firstOrFail();

        $this->assertSame(AppointmentStatus::Done, $appointment->status);
        $this->assertNotNull($appointment->final_price_label);

        // 13 rows total: 8 completed past visits, 3 confirmed future bookings
        // and 2 pending future bookings. Only live future bookings match the
        // Upcoming scope, so 5 is expected.
        $this->assertSame(5, Appointment::upcoming()->count());
        $this->assertSame(8, Appointment::where('status', AppointmentStatus::Done->value)->count());
    }

    public function test_master_and_client_scopes_filter_correctly(): void
    {
        $master = Master::firstOrFail();

        $this->assertSame(
            Appointment::where('master_id', $master->id)->count(),
            Appointment::forMaster($master)->count(),
        );

        $client = User::where('role', Role::Client->value)->firstOrFail();

        $this->assertSame(
            Appointment::where('client_id', $client->id)->count(),
            Appointment::forClient($client)->count(),
        );
    }

    public function test_price_label_range_is_produced_for_the_pre_quoted_booking(): void
    {
        $priced = Appointment::whereNotNull('master_price_min')->where('starts_at', '>', now())->first();

        $this->assertNotNull($priced, 'Expected one upcoming booking with a master quote.');
        $this->assertStringContainsString('₽', (string) $priced->final_price_label);
    }
}
