<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\StoreAppointmentRequest;
use App\Mail\AppointmentConfirmationMail;
use App\Models\Appointment;
use App\Models\Category;
use App\Models\Master;
use App\Models\Page;
use App\Models\Setting;
use App\Services\SlotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BookingController extends Controller
{
    public function __construct(private readonly SlotService $slotService)
    {
    }

    /**
     * Booking wizard. When master_id/service_id are present it also returns the
     * available slots for the requested day.
     */
    public function create(Request $request): Response
    {
        $categories = Category::query()
            ->ordered()
            ->with([
                'services' => fn ($query) => $query->active()->orderBy('name'),
            ])
            ->get();

        $masters = Master::query()
            ->active()
            ->with('user')
            ->with(['services' => fn ($query) => $query->where('master_service.is_active', true)])
            ->orderByDesc('rating')
            ->get();

        $selectedMaster = null;
        $selectedService = null;
        $date = null;
        $slots = [];

        $masterId = $request->integer('master_id');
        $serviceId = $request->integer('service_id');

        if ($masterId > 0 && $serviceId > 0) {
            $selectedMaster = $masters->firstWhere('id', $masterId);

            if ($selectedMaster !== null) {
                $selectedService = $selectedMaster->services->firstWhere('id', $serviceId);
            }

            if ($selectedMaster !== null && $selectedService !== null) {
                $date = $this->resolveDate($request->string('date')->toString());
                $slots = $this->slotService->getAvailableSlots($selectedMaster, $selectedService, $date);
            }
        }

        return Inertia::render('Booking/Create', [
            'categories' => $categories,
            'masters' => $masters,

            /*
             * `master_id` is echoed as a PROP, not just left in the query string.
             *
             * Booking/Create decides whether to skip step 2 ("choose a master")
             * from this value: the master was already chosen on /masters/{id},
             * and the component marks him as "locked" so the wizard jumps
             * straight from the service step to the date/time step.
             *
             * It previously had to scrape `usePage().url` for the query string,
             * which made the skip depend on the URL surviving every Inertia
             * visit (partial reloads, `preserveState`, a redirect that drops the
             * query). Passing it explicitly makes the contract between the
             * controller and the page a real prop.
             */
            'master_id' => $masterId > 0 ? $masterId : null,

            'selectedMaster' => $selectedMaster,
            'selectedService' => $selectedService,
            'date' => $date?->toDateString(),
            'slots' => $slots,

            /*
             * The consent checkbox on step 4 links to the personal-data policy.
             * It used to open /privacy in a new tab; the wizard now shows the
             * same text in a modal, so the content is sent with the page.
             *
             * Published pages only: an unpublished policy must not leak into a
             * public page. Null simply hides the modal body (the link stays).
             */
            'privacyContent' => fn (): ?array => Page::query()
                ->where('slug', 'privacy')
                ->where('is_published', true)
                ->first(['title', 'content'])
                ?->toArray(),
        ]);
    }

    /**
     * Creates the booking request and stores the optional reference photo.
     */
    public function store(StoreAppointmentRequest $request): RedirectResponse
    {
        $master = $request->master();
        $service = $request->service();
        $startsAt = $request->carbonStartsAt();

        // withValidator() already resolved these; this satisfies static analysis.
        abort_if($master === null || $service === null || $startsAt === null, 422);

        // Duration comes from the master's own price list when overridden.
        $pivot = $master->services()->where('services.id', $service->id)->first()?->pivot;
        $duration = (int) ($pivot->duration_min ?? $service->duration_min);

        $appointment = DB::transaction(fn (): Appointment => Appointment::create([
            'client_id' => $request->user()->id,
            'master_id' => $master->id,
            'service_id' => $service->id,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($duration),
            'status' => AppointmentStatus::Pending,
            'client_comment' => $request->validated('client_comment'),
            // 6 digits the client types back on /booking/verify/{id}.
            'confirmation_code' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'confirmation_attempts' => 0,
            'confirmation_sent_at' => Carbon::now(),
            'photo_path' => null,
            'master_price_min' => null,
            'master_price_max' => null,
            'master_price_offer' => null,
            'master_comment' => null,
        ]));

        // Stored after creation so the file name can carry the appointment id.
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');

            $path = $file->storeAs(
                'appointments',
                $appointment->id.'.'.$file->getClientOriginalExtension(),
                ['disk' => 'public'],
            );

            $appointment->forceFill(['photo_path' => $path])->save();
        }

        /*
         * Client confirmation code.
         *
         * The booking is ALREADY committed above and stays that way whatever
         * happens here: a broken mail channel must never lose a booking.
         *
         * The code goes to the CLIENT — only they can confirm it. The shop's
         * `confirmation_email` is a fallback for the master to look a code up,
         * never the recipient of this message.
         */
        $clientEmail = (string) ($appointment->client?->email ?? '');
        $mailFailed = false;

        if ($clientEmail === '') {
            // Registration requires an email, so this is a data anomaly.
            report(new RuntimeException('Appointment #'.$appointment->id.' has no client email; code not sent.'));
            $mailFailed = true;
        } else {
            try {
                Mail::to($clientEmail)->send(
                    new AppointmentConfirmationMail($appointment->loadMissing(['client', 'master.user', 'service'])),
                );
            } catch (Throwable $exception) {
                report($exception);
                $mailFailed = true;
            }
        }

        if ($mailFailed) {
            return redirect()
                ->route('booking.verify', $appointment)
                ->with('warning', 'Заявка сохранена, но письмо с кодом не удалось отправить. Свяжитесь с барбершопом по телефону: '
                    .(string) Setting::get('phone')
                    .'. Или нажмите «Отправить код заново» на этой странице.');
        }

        return redirect()->route('booking.verify', $appointment);
    }

    /**
     * Defaults to tomorrow: today is often already partially in the past.
     */
    private function resolveDate(string $input): Carbon
    {
        if ($input !== '') {
            try {
                return Carbon::parse($input)->startOfDay();
            } catch (Throwable) {
                // Fall through to the default below.
            }
        }

        return Carbon::tomorrow()->startOfDay();
    }
}
