import type { ReactNode } from 'react';
import { PriceRange } from '@/Components/UI/PriceRange';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| SummaryCard
|--------------------------------------------------------------------------
| The step-4 confirmation summary (and the sticky recap in the wizard sidebar).
| `rows` covers the free-form facts; the price row is rendered by PriceRange so
| the range formatting stays identical to the rest of the site.
*/

export interface SummaryRow {
    label: string;
    value: ReactNode;
    /** Renders the value in gold, used for the master/service headline. */
    emphasis?: boolean;
}

export interface SummaryCardProps {
    rows: SummaryRow[];
    /** Price bounds for the selected master/service pair. */
    priceMin?: number | string | null;
    priceMax?: number | string | null;
    /** Duration in minutes, overridden by the master's own pivot value. */
    durationMinutes?: number | null;
    /** Explains that the final price is agreed by the master. */
    priceNote?: string;
    /** Optional thumbnail (master photo). */
    image?: ReactNode;
    className?: string;
    /** `compact` drops the image and tightens spacing for the sidebar. */
    variant?: 'default' | 'compact';
}

export function SummaryCard({
    rows,
    priceMin,
    priceMax,
    durationMinutes,
    priceNote,
    image,
    className,
    variant = 'default',
}: SummaryCardProps) {
    const compact = variant === 'compact';

    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-bg-elevated',
                compact ? 'p-5' : 'p-6 sm:p-8',
                className,
            )}
        >
            {image !== undefined && !compact && <div className="mb-6">{image}</div>}

            <dl className={cn('space-y-4', compact && 'space-y-3')}>
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-start justify-between gap-4 text-sm"
                    >
                        <dt className="shrink-0 text-text-secondary">{row.label}</dt>
                        <dd
                            className={cn(
                                'min-w-0 text-right',
                                row.emphasis === true
                                    ? 'font-display text-base font-semibold text-accent'
                                    : 'text-text-primary',
                            )}
                        >
                            {row.value}
                        </dd>
                    </div>
                ))}

                {durationMinutes !== null && durationMinutes !== undefined && durationMinutes > 0 && (
                    <div className="flex items-start justify-between gap-4 text-sm">
                        <dt className="shrink-0 text-text-secondary">Длительность</dt>
                        <dd className="text-right text-text-primary">
                            {formatDuration(durationMinutes)}
                        </dd>
                    </div>
                )}

                {(priceMin !== undefined || priceMax !== undefined) && (
                    <div className="flex items-start justify-between gap-4 border-t border-border pt-4 text-sm">
                        <dt className="shrink-0 text-text-secondary">Стоимость</dt>
                        <dd className="text-right">
                            <PriceRange
                                min={priceMin}
                                max={priceMax}
                                size={compact ? 'md' : 'lg'}
                            />
                        </dd>
                    </div>
                )}
            </dl>

            {priceNote !== undefined && (
                <p className="mt-5 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs leading-relaxed text-text-secondary">
                    {priceNote}
                </p>
            )}
        </div>
    );
}

export default SummaryCard;
