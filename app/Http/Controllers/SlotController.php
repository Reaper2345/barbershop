<?php

namespace App\Http\Controllers;

use App\Http\Requests\SlotsRequest;
use App\Services\SlotService;
use Illuminate\Http\JsonResponse;
use Throwable;

/**
 * JSON slot lookup for the booking wizard.
 *
 * The wizard renders server-computed slots on first load (BookingController@create)
 * and then re-queries this endpoint whenever the visitor changes the date,
 * without a full Inertia visit.
 *
 * Registered as a *web* route (routes/web.php) on purpose: it needs the session
 * guard and the CSRF token so it can see the logged-in Inertia user. A route in
 * routes/api.php would run on the stateless `api` guard and always look like a
 * guest.
 */
class SlotController extends Controller
{
    public function __construct(private readonly SlotService $slotService)
    {
    }

    /**
     * GET /api/slots?master_id=&service_id=&date=Y-m-d
     *
     * The `date` query parameter is read through SlotsRequest::resolvedDate();
     * the class deliberately does not override Request::date(), whose inherited
     * signature would clash.
     *
     * 200 → {"slots": [{"time": "14:30", "starts_at": "...", "ends_at": "..."}]}
     * 422 → standard Laravel validation envelope.
     *
     * The service is wrapped so that an unexpected failure inside slot
     * generation degrades to an empty grid with a 200 instead of a 500. A
     * non-bookable day is a normal answer here, not a server error, and the
     * wizard already renders "Нет свободных слотов" for an empty list.
     */
    public function show(SlotsRequest $request): JsonResponse
    {
        $master = $request->master();
        $service = $request->service();
        // `resolvedDate()`, not `date()`: the inherited Request::date($key, …)
        // accessor is a different method and must not be shadowed.
        $date = $request->resolvedDate();

        // The FormRequest rules guarantee all three resolve, but the explicit
        // guard keeps static analysis and a defensive read honest.
        if ($master === null || $service === null || $date === null) {
            return response()->json([
                'message' => 'Не удалось определить мастера, услугу или дату.',
                'errors' => ['date' => ['Не удалось определить мастера, услугу или дату.']],
            ], 422);
        }

        try {
            $slots = $this->slotService->getAvailableSlots($master, $service, $date);
        } catch (Throwable $exception) {
            // Logged for diagnosis; the client gets a valid empty grid so the
            // booking wizard stays usable while the data is corrected.
            report($exception);

            $slots = [];
        }

        return response()->json([
            'slots' => $slots,
            // Echoed so the client can discard a response that arrived after
            // the visitor already moved to another date.
            'date' => $date->toDateString(),
        ]);
    }
}
