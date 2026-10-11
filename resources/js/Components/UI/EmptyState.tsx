import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| EmptyState
|--------------------------------------------------------------------------
| Used when a filtered list, review block or cabinet table has nothing to
| show. `title` is required so no empty state can render without an
| explanation for the user.
*/

export interface EmptyStateProps {
    title: string;
    /** Explanation; accepts nodes so callers can embed links or emphasised text. */
    description?: ReactNode;
    icon?: ReactNode;
    /** Primary action, usually a <Button>. */
    action?: ReactNode;
    className?: string;
    /** `sm` for inline blocks (reviews), `md` for full sections. */
    size?: 'sm' | 'md';
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className,
    size = 'md',
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-secondary/40 text-center',
                size === 'md' ? 'px-6 py-16' : 'px-6 py-10',
                className,
            )}
        >
            {icon !== undefined && (
                <span
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-accent [&>svg]:h-6 [&>svg]:w-6"
                    aria-hidden="true"
                >
                    {icon}
                </span>
            )}

            <p className="font-display text-xl font-semibold text-text-primary">{title}</p>

            {description !== undefined && (
                <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                    {description}
                </p>
            )}

            {action !== undefined && <div className="mt-6">{action}</div>}
        </div>
    );
}

export default EmptyState;
