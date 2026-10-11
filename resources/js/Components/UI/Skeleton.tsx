import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Skeleton
|--------------------------------------------------------------------------
| Loading placeholders for the async Inertia visits. `pulse` matches the
| dark surface; the shape is controlled by the caller's className.
*/

export interface SkeletonProps {
    className?: string;
    /** Renders several stacked lines (the last one shorter). */
    lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn('animate-pulse rounded-lg bg-border/60', className)}
            aria-hidden="true"
        />
    );
}

export function SkeletonText({ lines = 3, className }: SkeletonProps) {
    const count = Math.max(1, lines);

    return (
        <div className={cn('space-y-2', className)} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className={cn(
                        'h-3 animate-pulse rounded bg-border/60',
                        // The final line is short so the block reads as prose.
                        index === count - 1 ? 'w-3/5' : 'w-full',
                    )}
                />
            ))}
        </div>
    );
}

/** Card-shaped placeholder used while a master/service grid loads. */
export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div
            className={cn('rounded-2xl border border-border bg-bg-elevated p-6', className)}
            aria-hidden="true"
        >
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="mt-6 h-5 w-1/2" />
            <div className="mt-3">
                <SkeletonText lines={2} />
            </div>
        </div>
    );
}

export default Skeleton;
