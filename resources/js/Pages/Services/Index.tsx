import { Link } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { Button } from '@/Components/UI/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import { PriceRange } from '@/Components/UI/PriceRange';
import { CategoryIcon, ClockIcon, ScissorsIcon } from '@/lib/icons';
import { SERVICE_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { formatDuration } from '@/lib/format';
import type { Category } from '@/types';

/*
|--------------------------------------------------------------------------
| Services/Index — GET /services
|--------------------------------------------------------------------------
| The full price list grouped by category. Every category gets its own
| section with a stable anchor, and the sticky in-page navigation lets a
| visitor jump between them without a round trip.
|
| Props: categories — ordered categories with their active services
| (ServiceController@index).
*/

export interface ServicesIndexProps {
    categories?: Category[];
}

export default function ServicesIndex({ categories = [] }: ServicesIndexProps) {
    // Categories without active services would render as empty sections.
    const visible = categories.filter((category) => (category.services ?? []).length > 0);

    const totalServices = visible.reduce(
        (total, category) => total + (category.services?.length ?? 0),
        0,
    );

    return (
        <AppLayout title={SERVICE_COPY.title} description={SERVICE_COPY.subtitle}>
            {/* Page heading */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-16 md:py-20">
                    <p className="section-eyebrow">Прайс</p>
                    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                        {SERVICE_COPY.title}
                    </h1>
                    <p className="section-subtitle">{SERVICE_COPY.subtitle}</p>

                    {totalServices > 0 && (
                        <p className="mt-6 text-sm text-text-secondary">
                            {visible.length} {plural(visible.length, 'направление', 'направления', 'направлений')}
                            {' · '}
                            {totalServices} {plural(totalServices, 'услуга', 'услуги', 'услуг')}
                        </p>
                    )}
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {visible.length === 0 ? (
                        <EmptyState
                            icon={<ScissorsIcon />}
                            title={SERVICE_COPY.empty}
                            description={SERVICE_COPY.emptyDescription}
                            action={
                                <Button href={routes.booking()}>Записаться онлайн</Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
                            {/* In-page category navigation */}
                            <nav
                                aria-label="Категории услуг"
                                className="lg:sticky lg:top-28 lg:self-start"
                            >
                                <p className="text-xs uppercase tracking-wider text-text-secondary">
                                    Направления
                                </p>

                                <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
                                    {visible.map((category) => (
                                        <li key={category.id} className="shrink-0">
                                            <a
                                                href={`#category-${category.slug}`}
                                                className="block whitespace-nowrap rounded-full border border-border px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent lg:rounded-xl lg:border-transparent lg:px-3 lg:hover:bg-bg-elevated"
                                            >
                                                {category.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Category sections */}
                            <div className="space-y-16">
                                {visible.map((category) => (
                                    <section
                                        key={category.id}
                                        id={`category-${category.slug}`}
                                        aria-labelledby={`category-${category.slug}-title`}
                                        className="scroll-mt-28"
                                    >
                                        <header className="flex items-center gap-4">
                                            <span
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
                                                aria-hidden="true"
                                            >
                                                <CategoryIcon slug={category.slug} className="h-5 w-5" />
                                            </span>

                                            <div>
                                                <h2
                                                    id={`category-${category.slug}-title`}
                                                    className="font-display text-2xl font-semibold text-text-primary"
                                                >
                                                    {category.name}
                                                </h2>

                                                <p className="mt-1 text-sm text-text-secondary">
                                                    {(category.services?.length ?? 0)}{' '}
                                                    {plural(
                                                        category.services?.length ?? 0,
                                                        'услуга',
                                                        'услуги',
                                                        'услуг',
                                                    )}
                                                </p>
                                            </div>
                                        </header>

                                        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                                            {(category.services ?? []).map((service) => (
                                                <li
                                                    key={service.id}
                                                    className="group flex flex-col gap-4 p-6 transition-all duration-300 hover:bg-bg-secondary sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="min-w-0">
                                                        <h3 className="font-display text-lg font-semibold text-text-primary">
                                                            {service.name}
                                                        </h3>

                                                        {service.description !== null &&
                                                            service.description !== undefined && (
                                                                <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                                                                    {service.description}
                                                                </p>
                                                            )}

                                                        <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
                                                            <ClockIcon className="h-3.5 w-3.5" />
                                                            {SERVICE_COPY.duration}:{' '}
                                                            {formatDuration(service.duration_min)}
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-3">
                                                        <PriceRange
                                                            min={service.base_price_min}
                                                            max={service.base_price_max}
                                                            size="lg"
                                                        />

                                                        <Link
                                                            href={routes.booking({ service: service.id })}
                                                            className="whitespace-nowrap rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                                                        >
                                                            {SERVICE_COPY.book}
                                                        </Link>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </AppLayout>
    );
}

/** Russian plural picker for a count. */
function plural(count: number, one: string, few: string, many: string): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 > 10 && mod100 < 20) {
        return many;
    }

    if (mod10 === 1) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return few;
    }

    return many;
}
