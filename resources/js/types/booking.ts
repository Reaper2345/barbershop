import type { Master, ReviewLike, Service } from '@/types';

/*
|--------------------------------------------------------------------------
| Booking & cabinet types
|--------------------------------------------------------------------------
| These describe the two payloads PROMPT 4 introduced, neither of which is a
| plain Eloquent model:
|
|   - GET /api/slots returns the SlotService grid verbatim inside a `slots` key
|     (the service returns a list, the endpoint wraps it so the envelope has a
|     stable name and room for extras later).
|   - The cabinet uses AppointmentResource, which is richer than the raw
|     Appointment model: it adds pre-formatted labels and computed flags.
*/

/** One bookable start time from SlotService::getAvailableSlots(). */
export interface BookingSlot {
    /** Display value, "14:30". */
    time: string;
    /** ISO 8601 in the application timezone — this is what gets submitted. */
    starts_at: string;
    /** ISO 8601, already offset by the service duration. */
    ends_at: string;
}

/**
 * Response body of GET /api/slots.
 *
 * On a validation failure the endpoint answers 422 with the standard Laravel
 * shape, so `errors` is optional here.
 */
export interface SlotsResponse {
    slots: BookingSlot[];
    /** Echoed back so a stale response can be discarded. */
    date?: string;
}

/**
 * The subset of an axios error the slot lookup cares about. Typing it here
 * avoids `any` in the catch block while staying honest that the value is
 * unknown at runtime.
 */
export interface SlotApiError {
    response?: {
        status?: number;
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
}

/**
 * Master as embedded in AppointmentResource (MasterResource shape).
 * `services` is present only when the relation was loaded.
 */
export interface ResourceMaster {
    id: number;
    name: string | null;
    photo: string | null;
    bio: string | null;
    experience_years: number;
    rating: number | string;
    is_active: boolean;
    services?: Service[];
    reviews_count?: number;
}

/**
 * Service as embedded in AppointmentResource (ServiceResource shape). The
 * `base_price_*` fields arrive as numbers here, unlike the raw model where the
 * `decimal:2` cast produces strings.
 */
export interface ResourceService {
    id: number;
    name: string;
    description: string | null;
    base_price_min: number | string;
    base_price_max: number | string;
    base_price_label?: string;
    duration_min: number;
    is_active: boolean;
    category?: { id: number; name: string; slug: string };
    price_min?: number | null;
    price_max?: number | null;
    pivot_duration_min?: number | null;
    pivot_is_active?: boolean | null;
}

/** A single row from AppointmentResource::toArray(). */
export interface CabinetAppointment {
    id: number;

    /** Raw enum value, for logic. */
    status: CabinetStatus;
    /** Russian label, for display. */
    status_label?: string;
    /** Tailwind palette name from AppointmentStatus::color(). */
    status_color?: string;

    starts_at: string | null;
    ends_at: string | null;
    starts_at_label?: string | null;
    date_label?: string | null;
    time_label?: string | null;
    duration_min?: number | null;

    client_comment: string | null;
    photo_path: string | null;
    photo_url: string | null;

    master_price_min: number | null;
    master_price_max: number | null;
    master_price_offer: number | null;

    /** "2 000 ₽" | "1 800–2 200 ₽" | null, from the model accessor. */
    final_price_label: string | null;
    master_comment: string | null;

    /** Mirrors AppointmentPolicy::cancel — the UI must not re-derive this. */
    can_cancel: boolean;
    /** Added to AppointmentResource in PROMPT 4: status ⇒ cancellable. */
    is_cancellable?: boolean;

    client?: { id: number; name: string; phone: string | null; email: string };
    master?: ResourceMaster;
    service?: ResourceService;
    /** Loaded for history rows; absent from the upcoming list. */
    review?: ReviewLike | null;

    created_at?: string | null;
}

export type CabinetStatus =
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'done'
    | 'cancelled';

/** `stats` prop of GET /cabinet. */
export interface CabinetStats {
    total: number;
    completed: number;
    upcoming: number;
}

/** Resolved price state of an appointment, driving the AppointmentCard badge. */
export type PriceState =
    | { kind: 'offer'; label: string }
    | { kind: 'range'; label: string }
    | { kind: 'pending' };

/**
 * The three price states AppointmentCard renders:
 *   offer   — master named an exact figure → "Мастер подтвердил: 2 000 ₽"
 *   range   — master gave a range        → "Мастер уточнил: 1 800–2 200 ₽"
 *   pending — nothing quoted yet         → "Цена будет уточнена мастером"
 */
export function priceState(appointment: CabinetAppointment): PriceState {
    const offer = appointment.master_price_offer;
    const min = appointment.master_price_min;
    const max = appointment.master_price_max;

    // The server already renders the label when it has one; prefer it so the
    // UI and the API can never disagree about formatting.
    if (appointment.final_price_label !== null && appointment.final_price_label !== '') {
        return offer !== null
            ? { kind: 'offer', label: appointment.final_price_label }
            : { kind: 'range', label: appointment.final_price_label };
    }

    if (offer !== null) {
        return { kind: 'offer', label: formatRubles(offer) };
    }

    if (min !== null || max !== null) {
        const low = min ?? max ?? 0;
        const high = max ?? min ?? 0;

        return {
            kind: 'range',
            label:
                low === high
                    ? formatRubles(low)
                    : `${formatRubles(low, false)}–${formatRubles(high)}`,
        };
    }

    return { kind: 'pending' };
}

function formatRubles(amount: number, withSuffix = true): string {
    const formatted = new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0,
    }).format(amount);

    return withSuffix ? `${formatted} ₽` : formatted;
}

/** Whether a history row can still be reviewed. */
export function canBeReviewed(appointment: CabinetAppointment): boolean {
    return appointment.status === 'done' && (appointment.review ?? null) === null;
}

/** Master display name with a safe fallback. */
export function masterName(master: Master | ResourceMaster | undefined): string {
    if (master === undefined) {
        return 'Мастер';
    }

    // The raw model nests the name under `user`; the AppointmentResource
    // flattens it onto the master object itself.
    if ('user' in master) {
        return master.user?.name ?? 'Мастер';
    }

    return (master as ResourceMaster).name ?? 'Мастер';
}
