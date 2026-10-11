import { useMemo, useState } from 'react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { MasterCardGrid } from '@/Components/Public/MasterCard';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Button } from '@/Components/UI/Button';
import { ScissorsIcon } from '@/lib/icons';
import { MASTERS_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/format';
import type { CategorySummary, Master } from '@/types';

/*
|--------------------------------------------------------------------------
| Masters/Index — GET /masters
|--------------------------------------------------------------------------
| Grid of master cards with the top-3 services and prices. The service-category
| filter runs entirely on the client: the payload is small (three masters) and
| filtering client-side keeps the URL clean and the interaction instant.
|
| Props:
|   masters    — active masters, ordered by rating, withCount('reviews')
|   categories — categories that at least one active master works in
|
| `masters[i].services` must be loaded with the `master_service` pivot so the
| per-master price overrides are available; see MasterController@index.
*/

export interface MastersIndexProps {
    masters?: Master[];
    categories?: CategorySummary[];
}

export default function MastersIndex({
    masters = [],
    categories = [],
}: MastersIndexProps) {
    const [activeSlug, setActiveSlug] = useState<string | null>(null);

    // Fall back to the categories present in the loaded services when the
    // controller has not sent the (optional) category list.
    const availableCategories = useMemo<CategorySummary[]>(() => {
        if (categories.length > 0) {
            return categories;
        }

        const seen = new Map<number, CategorySummary>();

        for (const master of masters) {
            for (const service of master.services ?? []) {
                if (service.category !== undefined) {
                    seen.set(service.category.id, service.category);
                }
            }
        }

        return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }, [categories, masters]);

    /** How many masters offer at least one service in each category. */
    const counts = useMemo<Record<string, number>>(() => {
        const result: Record<string, number> = {};

        for (const category of availableCategories) {
            result[category.slug] = masters.filter((master) =>
                (master.services ?? []).some(
                    (service) => service.category?.slug === category.slug,
                ),
            ).length;
        }

        return result;
    }, [availableCategories, masters]);

    const filtered = useMemo<Master[]>(() => {
        if (activeSlug === null) {
            return masters;
        }

        return masters.filter((master) =>
            (master.services ?? []).some(
                (service) => service.category?.slug === activeSlug,
            ),
        );
    }, [activeSlug, masters]);

    return (
        <AppLayout
            title={MASTERS_COPY.title}
            description={MASTERS_COPY.subtitle}
        >
            {/* Page heading */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-16 md:py-20">
                    <p className="section-eyebrow">Команда</p>
                    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                        {MASTERS_COPY.title}
                    </h1>
                    <p className="section-subtitle">{MASTERS_COPY.subtitle}</p>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {availableCategories.length > 0 && (
                        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <span
                                    id="category-filter-label"
                                    className="text-xs uppercase tracking-wider text-text-secondary"
                                >
                                    {MASTERS_COPY.filterLabel}
                                </span>

                                <span className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
                                    {filtered.length}
                                </span>
                            </div>

                            <ul
                                role="group"
                                aria-labelledby="category-filter-label"
                                className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                <li className="shrink-0 snap-start">
                                    <FilterButton
                                        active={activeSlug === null}
                                        onClick={() => setActiveSlug(null)}
                                        count={masters.length}
                                    >
                                        {MASTERS_COPY.filterAll}
                                    </FilterButton>
                                </li>

                                {availableCategories.map((category) => (
                                    <li key={category.id} className="shrink-0 snap-start">
                                        <FilterButton
                                            active={activeSlug === category.slug}
                                            onClick={() => setActiveSlug(category.slug)}
                                            count={counts[category.slug] ?? 0}
                                        >
                                            {category.name}
                                        </FilterButton>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Announced to screen readers after filtering. */}
                    <p className="sr-only" role="status" aria-live="polite">
                        Найдено мастеров: {filtered.length}
                    </p>

                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={<ScissorsIcon />}
                            title={MASTERS_COPY.empty}
                            description={MASTERS_COPY.emptyDescription}
                            action={
                                <Button variant="ghost" onClick={() => setActiveSlug(null)}>
                                    Показать всех мастеров
                                </Button>
                            }
                        />
                    ) : (
                        <MasterCardGrid masters={filtered} showServices />
                    )}

                    {/* Conversion block */}
                    <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-elevated px-6 py-10 text-center">
                        <h2 className="font-display text-2xl font-semibold text-text-primary">
                            Не знаете, кого выбрать?
                        </h2>

                        <p className="max-w-lg text-sm text-text-secondary">
                            Позвоните нам — подскажем мастера под ваш тип волос и удобное время.
                        </p>

                        <Button href={routes.booking()} className="mt-2">
                            Записаться онлайн
                        </Button>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}

/** Pill-style filter control with an aria-pressed state. */
function FilterButton({
    active,
    onClick,
    count,
    children,
}: {
    active: boolean;
    onClick: () => void;
    count: number;
    children: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm',
                'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                active
                    ? 'border-accent bg-accent font-medium text-bg-primary'
                    : 'border-border text-text-secondary hover:border-accent hover:text-accent',
            )}
        >
            {children}
            <span
                className={cn(
                    'text-xs',
                    active ? 'text-bg-primary/70' : 'text-text-secondary/70',
                )}
            >
                {count}
            </span>
        </button>
    );
}
