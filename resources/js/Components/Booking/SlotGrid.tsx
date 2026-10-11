import { Skeleton } from '@/Components/UI/Skeleton';
import { EmptyState } from '@/Components/UI/EmptyState';
import { ClockIcon, AlertIcon } from '@/lib/icons';
import { cn } from '@/lib/format';
import type { BookingSlot } from '@/types';

/*
|--------------------------------------------------------------------------
| SlotGrid
|--------------------------------------------------------------------------
| The 30-minute time buttons produced by SlotService, grouped by part of day so
| a 10:00–20:00 day reads as three short rows instead of twenty tiles.
|
| The grid is the one place where a stale response is genuinely confusing, so
| it always reflects the latest request: `loading` shows skeletons, `error`
| shows a retry affordance, and an empty result says so explicitly.
*/

export interface SlotGridProps {
    slots: BookingSlot[];
    selected: BookingSlot | null;
    onSelect: (slot: BookingSlot) => void;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    /** Rendered when there is nothing to show and nothing went wrong. */
    emptyHint?: string;
    className?: string;
}

const GROUPS: Array<{ title: string; from: number; to: number }> = [
    { title: 'Утро', from: 0, to: 12 },
    { title: 'День', from: 12, to: 17 },
    { title: 'Вечер', from: 17, to: 24 },
];

export function SlotGrid({
    slots,
    selected,
    onSelect,
    loading = false,
    error = null,
    onRetry,
    emptyHint,
    className,
}: SlotGridProps) {
    if (loading) {
        return (
            <div className={cn('space-y-6', className)}>
                {GROUPS.slice(0, 2).map((group) => (
                    <div key={group.title}>
                        <Skeleton className="h-3 w-16" />
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 5 }, (_, index) => (
                                <Skeleton key={index} className="h-11 rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
                <p className="sr-only" role="status">
                    Ищем свободное время…
                </p>
            </div>
        );
    }

    if (error !== null) {
        return (
            <div
                role="alert"
                className={cn(
                    'flex flex-col items-start gap-4 rounded-2xl border border-danger/40 bg-danger/10 p-6',
                    className,
                )}
            >
                <p className="flex items-start gap-2.5 text-sm text-text-primary">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    {error}
                </p>

                {onRetry !== undefined && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        Попробовать снова
                    </button>
                )}
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <EmptyState
                className={className}
                size="sm"
                icon={<ClockIcon />}
                title="Нет свободных слотов"
                description={
                    emptyHint ??
                    'На этот день всё занято. Выберите другую дату — свободное время появится сразу.'
                }
            />
        );
    }

    const byGroup = GROUPS.map((group) => ({
        title: group.title,
        items: slots.filter((slot) => {
            const hour = Number.parseInt(slot.time.slice(0, 2), 10);

            return hour >= group.from && hour < group.to;
        }),
    })).filter((group) => group.items.length > 0);

    return (
        <div className={cn('space-y-6', className)}>
            {byGroup.map((group) => (
                <div key={group.title}>
                    <p className="text-xs uppercase tracking-wider text-text-secondary">
                        {group.title}
                    </p>

                    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                        {group.items.map((slot) => {
                            const isSelected = selected?.starts_at === slot.starts_at;

                            return (
                                <li key={slot.starts_at}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(slot)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            'w-full rounded-xl border px-2 py-3 text-sm tabular-nums',
                                            'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                            isSelected
                                                ? 'border-accent bg-accent font-semibold text-bg-primary'
                                                : 'border-border bg-bg-secondary text-text-primary hover:border-accent hover:text-accent',
                                        )}
                                    >
                                        {slot.time}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default SlotGrid;
