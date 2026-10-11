import { Link } from '@inertiajs/react';
import { Img } from '@/Components/UI/Img';
import { RatingStars } from '@/Components/UI/RatingStars';
import { PriceRange } from '@/Components/UI/PriceRange';
import { Badge } from '@/Components/UI/Badge';
import { CalendarIcon } from '@/lib/icons';
import { MASTERS_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { masterPhoto } from '@/lib/image';
import { formatExperience, formatDuration, cn } from '@/lib/format';
import type { Master } from '@/types';

/*
|--------------------------------------------------------------------------
| MasterCard
|--------------------------------------------------------------------------
| Used by the "Мастера" section on the home page and by the masters grid.
|
|   - the photo is greyscale and returns to full colour on hover/focus,
|   - `showServices` adds the top three services with their price ranges
|     (used on /masters),
|   - the whole card is a link to the master's page via a stretched link,
|     while the "Записаться" button sits above it and goes to /booking.
*/

export interface MasterCardProps {
    master: Master;
    /** Show the top-3 service list under the bio. */
    showServices?: boolean;
    className?: string;
}

export function MasterCard({ master, showServices = false, className }: MasterCardProps) {
    const name = master.user?.name ?? 'Мастер';
    const services = (master.services ?? [])
        // Cheapest first, so the "top services" hint shows entry prices.
        .slice()
        .sort((a, b) => Number.parseFloat(a.base_price_min) - Number.parseFloat(b.base_price_min))
        .slice(0, 3);

    return (
        <article
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated',
                'transition-all duration-300 hover:border-accent/60 hover:shadow-xl hover:shadow-black/40',
                'focus-within:border-accent/60',
                className,
            )}
        >
            {/* Photo */}
            <div className="relative aspect-[4/5] overflow-hidden bg-bg-secondary">
                <Img
                    src={masterPhoto(master.photo, name)}
                    fallbackSrc="/images/placeholder-master.svg"
                    alt={`${name} — барбер`}
                    className="grayscale transition-all duration-500 group-hover:grayscale-0 group-focus-within:grayscale-0"
                    wrapperClassName="h-full w-full"
                />

                {/* Experience chip */}
                <span className="absolute left-4 top-4 rounded-full border border-border bg-bg-primary/85 px-3 py-1 text-xs text-text-primary backdrop-blur">
                    {MASTERS_COPY.experience}: {formatExperience(master.experience_years)}
                </span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-semibold text-text-primary">
                    <Link
                        href={routes.master(master.id)}
                        className="transition-all duration-300 hover:text-accent focus-visible:outline-none"
                    >
                        {/* Stretched link: makes the whole card clickable while
                            keeping the accessible name on the real anchor. */}
                        <span className="absolute inset-0 z-10" aria-hidden="true" />
                        {name}
                    </Link>
                </h3>

                <div className="mt-2">
                    <RatingStars
                        value={master.rating}
                        count={master.reviews_count}
                        size="sm"
                    />
                </div>

                {master.bio !== null && master.bio !== undefined && (
                    <p className="mt-4 text-sm leading-relaxed text-text-secondary line-clamp-3">
                        {master.bio}
                    </p>
                )}

                {showServices && services.length > 0 && (
                    <ul className="mt-5 space-y-2 border-t border-border pt-5">
                        {services.map((service) => (
                            <li
                                key={service.id}
                                className="flex items-baseline justify-between gap-4 text-sm"
                            >
                                <span className="text-text-secondary">{service.name}</span>
                                <span className="shrink-0">
                                    <PriceRange
                                        min={service.base_price_min}
                                        max={service.base_price_max}
                                        pivot={service.pivot}
                                        size="sm"
                                    />
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto flex items-center gap-3 pt-6">
                    <Link
                        href={routes.booking({ master: master.id })}
                        className="relative z-20 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg-primary transition-all duration-300 hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        {MASTERS_COPY.book}
                    </Link>

                    <Badge tone="neutral" className="relative z-20">
                        {MASTERS_COPY.servicesCount}: {master.services?.length ?? 0}
                    </Badge>
                </div>
            </div>
        </article>
    );
}

/** Grid wrapper so both master pages lay out identically. */
export function MasterCardGrid({
    masters,
    showServices = false,
    className,
}: {
    masters: Master[];
    showServices?: boolean;
    className?: string;
}) {
    return (
        <ul className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {masters.map((master) => (
                <li key={master.id} className="flex">
                    <MasterCard master={master} showServices={showServices} className="w-full" />
                </li>
            ))}
        </ul>
    );
}

/** Duration helper reused by the master detail page. */
export function ServiceDurationLabel({ minutes }: { minutes: number }) {
    return <span className="text-xs text-text-secondary">{formatDuration(minutes)}</span>;
}

export default MasterCard;
