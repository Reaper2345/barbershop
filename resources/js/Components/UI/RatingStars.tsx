import { useState } from 'react';
import { StarIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| RatingStars
|--------------------------------------------------------------------------
| A five-star display for `masters.rating` (a decimal) and review ratings (an
| integer). Fractional values are shown accurately by rendering a solid gold
| layer clipped to `rating / 5` over a muted base layer — no half-star special
| casing, and it degrades to five whole stars for integer input.
|
| Passing `interactive` turns it into the review form's rating picker instead:
| five buttons with radio semantics and a hover preview.
|*/

export interface RatingStarsProps {
    /** 0–5. Accepts the string decimal Eloquent returns for `rating`. */
    value: number | string | null | undefined;
    /** Number of reviews, rendered as "(12)" when provided. */
    count?: number | null;
    size?: 'sm' | 'md' | 'lg';
    /** Hides the numeric value next to the stars. */
    showValue?: boolean;
    className?: string;
    /**
     * Switches the read-only display into the review form's rating picker:
     * five real buttons, hover preview and radio semantics.
     */
    interactive?: boolean;
    /** Called with 1–5 when a star is clicked. Required when interactive. */
    onChange?: (value: number) => void;
}

const SIZES = {
    sm: { star: 'h-3.5 w-3.5', text: 'text-xs', gap: 'gap-0.5' },
    md: { star: 'h-4 w-4', text: 'text-sm', gap: 'gap-0.5' },
    lg: { star: 'h-5 w-5', text: 'text-base', gap: 'gap-1' },
} as const;

export function RatingStars({
    value,
    count,
    size = 'md',
    showValue = true,
    className,
    interactive = false,
    onChange,
}: RatingStarsProps) {
    const [hovered, setHovered] = useState(0);

    const numeric = toNumber(value);
    const clamped = Math.max(0, Math.min(5, numeric ?? 0));
    const percent = (clamped / 5) * 100;
    const styles = SIZES[size];
    const label =
        count !== null && count !== undefined
            ? `Рейтинг ${clamped.toFixed(1)} из 5, отзывов: ${count}`
            : `Рейтинг ${clamped.toFixed(1)} из 5`;

    // Two identical rows of stars; only the fill differs. The overlay row is
    // clipped by a percentage-width wrapper, so 4.67 renders as 93.4% gold.
    const outlineStars = Array.from({ length: 5 }, (_, index) => (
        <StarIcon
            key={index}
            className={cn(styles.star, 'shrink-0')}
            fill="none"
            stroke="currentColor"
        />
    ));

    const filledStars = Array.from({ length: 5 }, (_, index) => (
        <StarIcon
            key={index}
            className={cn(styles.star, 'shrink-0')}
            fill="currentColor"
            stroke="currentColor"
        />
    ));

    // The inner row must keep its full width so the clip reveals whole stars;
    // at 93.4% the wrapper shows 4.67 stars of a fixed-width row.
    const rowWidth = percent === 0 ? 0 : (100 / percent) * 100;

    /*
     * Interactive mode — used by the review form. Five buttons with radio
     * semantics, a hover preview that does not commit until click/keyboard.
     */
    if (interactive) {
        const shown = hovered > 0 ? hovered : clamped;

        return (
            <span
                role="radiogroup"
                aria-label="Оценка"
                className={cn('inline-flex items-center gap-2', className)}
                onMouseLeave={() => setHovered(0)}
            >
                <span className="inline-flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= shown;

                        return (
                            <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={clamped === star}
                                aria-label={`${star} из 5`}
                                onClick={() => onChange?.(star)}
                                onMouseEnter={() => setHovered(star)}
                                onFocus={() => setHovered(star)}
                                onBlur={() => setHovered(0)}
                                className="rounded-md p-0.5 transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <StarIcon
                                    className={cn(
                                        'h-8 w-8 transition-colors duration-200',
                                        active ? 'text-accent' : 'text-border',
                                    )}
                                    fill={active ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                />
                            </button>
                        );
                    })}
                </span>

                <span className={cn('font-medium text-text-primary', styles.text)}>
                    {shown > 0 ? `${shown} из 5` : 'Выберите оценку'}
                </span>
            </span>
        );
    }

    return (
        <span
            className={cn('inline-flex items-center', styles.gap, className)}
            role="img"
            aria-label={label}
        >
            <span className="relative inline-flex" aria-hidden="true">
                {/* Base (empty) stars */}
                <span className={cn('inline-flex text-border', styles.gap)}>{outlineStars}</span>

                {/* Filled overlay, clipped to the rating percentage */}
                <span
                    className={cn('absolute inset-0 inline-flex overflow-hidden', styles.gap)}
                    style={{ width: `${percent}%` }}
                >
                    <span
                        className={cn('inline-flex text-accent', styles.gap)}
                        style={{ width: `${rowWidth}%` }}
                    >
                        {filledStars}
                    </span>
                </span>
            </span>

            {showValue && numeric !== null && (
                <span className={cn('ml-1 font-medium text-text-primary', styles.text)} aria-hidden="true">
                    {clamped.toFixed(1)}
                </span>
            )}

            {count !== null && count !== undefined && (
                <span className={cn('text-text-secondary', styles.text)} aria-hidden="true">
                    ({count})
                </span>
            )}
        </span>
    );
}

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : null;
}

export default RatingStars;
