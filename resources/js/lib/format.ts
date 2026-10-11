/*
|--------------------------------------------------------------------------
| Formatting helpers
|--------------------------------------------------------------------------
| The public site is Russian-only, so all number/date formatting is pinned to
| `ru-RU` instead of the browser locale: a client with an English OS must still
| see "1 800 ₽" rather than "₽1,800".
*/

const PRICE_FORMATTER = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
});

/** `1800` → `"1 800 ₽"`, `0`/null → `"по запросу"`. */
export function formatPrice(
    value: number | string | null | undefined,
    options: { withSuffix?: boolean; fallback?: string } = {},
): string {
    const { withSuffix = true, fallback = 'по запросу' } = options;
    const amount = toNumber(value);

    if (amount === null || amount <= 0) {
        return fallback;
    }

    const formatted = PRICE_FORMATTER.format(amount);

    return withSuffix ? `${formatted} ₽` : formatted;
}

/**
 * Renders a price range exactly as the design system specifies:
 *   - both bounds          → "1 800–2 200 ₽"
 *   - only the lower bound → "от 1 500 ₽"
 *   - only the upper bound → "до 2 200 ₽"
 *   - a single value       → "2 000 ₽"
 */
export function formatPriceRange(
    min: number | string | null | undefined,
    max: number | string | null | undefined,
    fallback = 'по запросу',
): string {
    const low = toNumber(min);
    const high = toNumber(max);

    // Treat 0 as "not set": the schema stores 0 for unpriced services.
    const hasLow = low !== null && low > 0;
    const hasHigh = high !== null && high > 0;

    if (hasLow && hasHigh) {
        if (low === high) {
            return formatPrice(low);
        }

        return `${formatPrice(low, { withSuffix: false })}–${formatPrice(high)}`;
    }

    if (hasLow) {
        return `от ${formatPrice(low)}`;
    }

    if (hasHigh) {
        return `до ${formatPrice(high)}`;
    }

    return fallback;
}

/** Resolves the effective price of a service, honouring a master's override. */
export function servicePriceRange(service: {
    base_price_min: string | number;
    base_price_max: string | number;
    pivot?: { price_min: string | null; price_max: string | null } | null;
}): string {
    const pivotMin = service.pivot?.price_min ?? null;
    const pivotMax = service.pivot?.price_max ?? null;

    const min = toNumber(pivotMin) ?? toNumber(service.base_price_min);
    const max = toNumber(pivotMax) ?? toNumber(service.base_price_max);

    return formatPriceRange(min, max);
}

/** Effective duration of a service in minutes, honouring a pivot override. */
export function serviceDuration(service: {
    duration_min: number;
    pivot?: { duration_min: number | null } | null;
}): number {
    return service.pivot?.duration_min ?? service.duration_min;
}

/** `90` → `"1 ч 30 мин"`, `45` → `"45 мин"`. */
export function formatDuration(minutes: number | null | undefined): string {
    const total = toNumber(minutes);

    if (total === null || total <= 0) {
        return '—';
    }

    const hours = Math.floor(total / 60);
    const rest = total % 60;

    if (hours === 0) {
        return `${rest} мин`;
    }

    if (rest === 0) {
        return `${hours} ч`;
    }

    return `${hours} ч ${rest} мин`;
}

/** `9` → `"9 лет"` using correct Russian plural forms. */
export function formatExperience(years: number | string | null | undefined): string {
    const value = toNumber(years) ?? 0;
    const absolute = Math.abs(Math.trunc(value));
    const mod100 = absolute % 100;
    const mod10 = absolute % 10;

    let noun = 'лет';

    if (mod100 < 11 || mod100 > 19) {
        if (mod10 === 1) {
            noun = 'год';
        } else if (mod10 >= 2 && mod10 <= 4) {
            noun = 'года';
        }
    }

    return `${value} ${noun}`;
}

/** ISO 8601 → `"12 марта 2025"`. */
export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/**
 * `+7 (495) 120-45-67` → `+74951204567`, so the number can live inside a
 * `tel:` href.
 */
export function telHref(phone: string | null | undefined): string {
    if (!phone) {
        return '';
    }

    const normalised = phone.replace(/[^\d+]/g, '');

    return normalised.length > 0 ? `tel:${normalised}` : '';
}

/** Two-letter initials for an avatar fallback. */
export function initials(name: string | null | undefined): string {
    if (!name) {
        return '?';
    }

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

/** Joins conditional class names without pulling in `clsx`. */
export function cn(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}

/** Truncates a review body to `limit` characters on a word boundary. */
export function truncate(text: string | null | undefined, limit: number): string {
    if (!text) {
        return '';
    }

    if (text.length <= limit) {
        return text;
    }

    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');

    return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : null;
}
