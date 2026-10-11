import { formatPriceRange, cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| PriceRange
|--------------------------------------------------------------------------
| Single place that turns the two decimal columns in the schema into the
| strings the design asks for:
|   both bounds           → "1 800–2 200 ₽"
|   lower bound only      → "от 1 500 ₽"
|   identical bounds      → "2 000 ₽"
|   nothing set           → "по запросу"
|
| Accepts the master-specific pivot overrides when they are present, so the
| same component serves the catalogue and the master detail page.
*/

export interface PriceRangeProps {
    min?: number | string | null;
    max?: number | string | null;
    /** Per-master override; wins over min/max when the pivot is loaded. */
    pivot?: { price_min: string | null; price_max: string | null } | null;
    /** Prefix such as "от" / "Цена". */
    prefix?: string;
    size?: 'sm' | 'md' | 'lg';
    tone?: 'accent' | 'primary' | 'secondary';
    className?: string;
}

const SIZES = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
} as const;

const TONES = {
    accent: 'text-accent',
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
} as const;

export function PriceRange({
    min,
    max,
    pivot,
    prefix,
    size = 'md',
    tone = 'accent',
    className,
}: PriceRangeProps) {
    const low = pivot?.price_min ?? min ?? null;
    const high = pivot?.price_max ?? max ?? null;
    const label = formatPriceRange(low, high);
    const isNegotiable = label === 'по запросу';

    return (
        <span
            className={cn(
                'font-medium tabular-nums',
                SIZES[size],
                isNegotiable ? TONES.secondary : TONES[tone],
                className,
            )}
        >
            {prefix !== undefined && <span className="mr-1 text-text-secondary">{prefix}</span>}
            {label}
        </span>
    );
}

export default PriceRange;
