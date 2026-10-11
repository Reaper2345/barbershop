import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| StatCard
|--------------------------------------------------------------------------
| A single metric. Used standalone in the master dashboard and, as
| `variant="plain"`, for the cells of the admin dashboard's metric table —
| the brief asks for a table there, so the same visual language has to work
| inside a <td> without a border of its own.
*/

export interface StatCardProps {
    label: string;
    value: ReactNode;
    /** Secondary line, e.g. a comparison or a clarification. */
    hint?: ReactNode;
    /** Leading icon element. */
    icon?: ReactNode;
    tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning';
    /** `plain` drops the card chrome — for use inside a table cell. */
    variant?: 'card' | 'plain';
    className?: string;
}

const TONES = {
    neutral: 'text-text-primary',
    accent: 'text-accent',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-[#fbbf24]',
} as const;

export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = 'neutral',
    variant = 'card',
    className,
}: StatCardProps) {
    if (variant === 'plain') {
        return (
            <div className={cn('text-right', className)}>
                <p className={cn('font-display text-lg font-semibold tabular-nums', TONES[tone])}>
                    {value}
                </p>
                {hint !== undefined && <p className="text-xs text-text-secondary">{hint}</p>}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-bg-elevated p-6 transition-all duration-300',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <p className="text-xs uppercase tracking-wider text-text-secondary">{label}</p>

                {icon !== undefined && (
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent [&>svg]:h-4 [&>svg]:w-4"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}
            </div>

            <p className={cn('mt-4 font-display text-3xl font-semibold tabular-nums', TONES[tone])}>
                {value}
            </p>

            {hint !== undefined && <p className="mt-2 text-xs text-text-secondary">{hint}</p>}
        </div>
    );
}

export default StatCard;
