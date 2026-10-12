import { EmptyState } from '@/Components/UI/EmptyState';
import { CategoryIcon, InfoIcon, ScissorsIcon } from '@/lib/icons';
import { BOOKING_COPY } from '@/lib/content';
import { formatDuration, cn } from '@/lib/format';
import { PriceRange } from '@/Components/UI/PriceRange';
import { serviceDuration } from '@/lib/format';
import type { Category, Service } from '@/types';

/*
|--------------------------------------------------------------------------
| Step 1 — category & service
|--------------------------------------------------------------------------
| Two columns: direction on the left, the services inside it on the right.
|
| When the wizard was entered from a master page (?master_id=), only that
| master's services are selectable, so the categories and services are filtered
| accordingly and a notice explains why the choice is narrowed.
|
| Both columns are lists of toggle buttons rather than a select/accordion: the
| catalogue is short, and seeing the whole list removes a click.
*/

export interface StepServiceProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (category: Category) => void;
    services: Service[];
    selectedServiceId: number | null;
    onSelectService: (service: Service) => void;
    /** True when the wizard is locked to the master from the URL. */
    lockedMaster?: boolean;
    lockedMasterName?: string | null;
    className?: string;
}

export function StepService({
    categories,
    selectedCategoryId,
    onSelectCategory,
    services,
    selectedServiceId,
    onSelectService,
    lockedMaster = false,
    lockedMasterName = null,
    className,
}: StepServiceProps) {
    return (
        <div className={className}>
            <header>
                <h2 className="font-display text-2xl font-semibold text-text-primary">
                    {BOOKING_COPY.serviceTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {BOOKING_COPY.serviceSubtitle}
                </p>
            </header>

            {lockedMaster && (
                <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text-primary">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>
                        <span className="font-medium">{BOOKING_COPY.masterLocked}</span>
                        {lockedMasterName !== null ? `: ${lockedMasterName}. ` : '. '}
                        {BOOKING_COPY.masterLockedHint}
                    </span>
                </p>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Categories. Sticky from lg: the service list is long, and the
                    rail is how the visitor switches between directions. Below lg
                    it stays in normal flow. */}
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <p className="text-xs uppercase tracking-wider text-text-secondary">
                        {BOOKING_COPY.categoriesLabel}
                    </p>

                    {categories.length === 0 ? (
                        <p className="mt-4 text-sm text-text-secondary">
                            Прайс пока пуст.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-1" role="group" aria-label={BOOKING_COPY.categoriesLabel}>
                            {categories.map((category) => {
                                const active = category.id === selectedCategoryId;

                                return (
                                    <li key={category.id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelectCategory(category)}
                                            aria-pressed={active}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm',
                                                'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                                active
                                                    ? 'border-accent bg-accent/10 text-accent'
                                                    : 'border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                                            )}
                                        >
                                            <CategoryIcon
                                                slug={category.slug}
                                                className="h-4 w-4 shrink-0"
                                            />
                                            <span className="min-w-0 flex-1 truncate">
                                                {category.name}
                                            </span>
                                            <span className="shrink-0 text-xs text-text-secondary/70">
                                                {category.services?.length ?? 0}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Services */}
                <div>
                    <p className="text-xs uppercase tracking-wider text-text-secondary">
                        {selectedCategoryId === null
                            ? BOOKING_COPY.servicesIn
                            : `${BOOKING_COPY.servicesIn} · ${
                                  categories.find((category) => category.id === selectedCategoryId)
                                      ?.name ?? ''
                              }`}
                    </p>

                    {selectedCategoryId === null ? (
                        <EmptyState
                            className="mt-4"
                            size="sm"
                            icon={<ScissorsIcon />}
                            title={BOOKING_COPY.pickCategory}
                            description={BOOKING_COPY.pickCategoryHint}
                        />
                    ) : services.length === 0 ? (
                        <EmptyState
                            className="mt-4"
                            size="sm"
                            icon={<ScissorsIcon />}
                            title={BOOKING_COPY.serviceEmpty}
                            description={BOOKING_COPY.serviceEmptyHint}
                        />
                    ) : (
                        <ul className="mt-4 space-y-3" role="group" aria-label={BOOKING_COPY.servicesIn}>
                            {services.map((service) => {
                                const active = service.id === selectedServiceId;
                                const duration = serviceDuration(service);

                                return (
                                    <li key={service.id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelectService(service)}
                                            aria-pressed={active}
                                            className={cn(
                                                'w-full rounded-2xl border p-5 text-left transition-all duration-300',
                                                'focus-visible:ring-2 focus-visible:ring-accent',
                                                active
                                                    ? 'border-accent bg-accent/5'
                                                    : 'border-border bg-bg-elevated hover:border-accent/60',
                                            )}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-display text-lg font-semibold text-text-primary">
                                                        {service.name}
                                                    </p>

                                                    {service.description !== null &&
                                                        service.description !== undefined && (
                                                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                                                                {service.description}
                                                            </p>
                                                        )}

                                                    <p className="mt-3 text-xs text-text-secondary">
                                                        {formatDuration(duration)}
                                                    </p>
                                                </div>

                                                <PriceRange
                                                    min={service.base_price_min}
                                                    max={service.base_price_max}
                                                    pivot={service.pivot}
                                                    size="md"
                                                />
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StepService;
