import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { Img } from '@/Components/UI/Img';
import { Button } from '@/Components/UI/Button';
import { RatingStars } from '@/Components/UI/RatingStars';
import { PriceRange } from '@/Components/UI/PriceRange';
import { Pagination } from '@/Components/UI/Pagination';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { ReviewCard } from '@/Components/Public/ReviewCard';
import { ReviewModal } from '@/Components/Public/ReviewModal';
import { CategoryIcon, ClockIcon, QuoteIcon, ScissorsIcon } from '@/lib/icons';
import { MASTERS_COPY, SERVICE_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { masterPhoto, portfolioPhoto, PORTFOLIO_FALLBACK } from '@/lib/image';
import {
    formatDuration,
    formatExperience,
    serviceDuration,
    cn,
} from '@/lib/format';
import type {
    Master,
    Paginated,
    PortfolioItemRow,
    ReviewLike,
    ServerReview,
    SharedProps,
} from '@/types';

/*
|--------------------------------------------------------------------------
| Masters/Show — GET /masters/{master}
|--------------------------------------------------------------------------
| Two columns: photo/bio/rating on the left, the services this master
| performs (with per-master price overrides) on the right. Reviews are
| paginated by the controller, 10 per page.
|
| Props:
|   master  — active master with user, active services (pivot loaded) and schedules
|   reviews — LengthAwarePaginator of approved ReviewResource items
*/

export interface MasterShowProps {
    master: Master;
    reviews?: Paginated<ServerReview>;
    /** First six published works plus the master's total, for the link. */
    portfolio?: {
        items: PortfolioItemRow[];
        total: number;
    };
}

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export default function MasterShow({ master, reviews, portfolio }: MasterShowProps) {
    const { siteSettings } = usePage<SharedProps>().props;
    const name = master.user?.name ?? 'Мастер';
    const services = master.services ?? [];
    const reviewItems = reviews?.data ?? [];
    const portfolioItems = portfolio?.items ?? [];
    const portfolioTotal = portfolio?.total ?? 0;

    // One overlay for the whole page; the cards just report which photo was
    // clicked.
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    // Review whose full text is open in the modal (null = closed).
    const [openReview, setOpenReview] = useState<ReviewLike | null>(null);

    // Weekdays this master is scheduled to work, derived from `schedules`.
    const workingDays = (master.schedules ?? []).map((schedule) => schedule.weekday);
    const uniqueDays = [...new Set(workingDays)].sort((a, b) => a - b);

    return (
        <AppLayout
            title={name}
            description={master.bio ?? `Записаться к мастеру ${name}`}
        >
            {/* Breadcrumbs */}
            <nav aria-label="Хлебные крошки" className="border-b border-border bg-bg-secondary">
                <div className="container-page py-4">
                    <ol className="flex items-center gap-2 text-xs text-text-secondary">
                        <li>
                            <Link
                                href={routes.home}
                                className="transition-all duration-300 hover:text-accent"
                            >
                                Главная
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link
                                href={routes.masters}
                                className="transition-all duration-300 hover:text-accent"
                            >
                                Мастера
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page" className="text-text-primary">
                            {name}
                        </li>
                    </ol>
                </div>
            </nav>

            <section className="section">
                <div className="container-page">
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
                        {/* ------------------------------------------------
                            Left: photo, identity, bio, rating breakdown

                            Sticky from lg up so the face, name and rating stay
                            in view while the services / portfolio / reviews
                            column scrolls. `self-start` is required: without it
                            a grid child stretches to the row height and sticky
                            has nothing to move within. Below lg the column is
                            in normal flow.
                        ------------------------------------------------ */}
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                                <div className="aspect-[4/5]">
                                    <Img
                                        src={masterPhoto(master.photo, name)}
                                        fallbackSrc="/images/placeholder-master.svg"
                                        alt={`${name} — барбер`}
                                        loading="eager"
                                        wrapperClassName="h-full w-full"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <h1 className="font-display text-4xl font-semibold tracking-tight text-text-primary">
                                    {name}
                                </h1>

                                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                                    <RatingStars
                                        value={master.rating}
                                        count={master.reviews_count}
                                        size="md"
                                    />

                                    <span className="flex items-center gap-2 text-sm text-text-secondary">
                                        <ScissorsIcon className="h-4 w-4 text-accent" />
                                        {MASTERS_COPY.experience}:{' '}
                                        {formatExperience(master.experience_years)}
                                    </span>
                                </div>

                                {master.bio !== null && master.bio !== undefined && (
                                    <p className="mt-6 text-sm leading-relaxed text-text-secondary">
                                        {master.bio}
                                    </p>
                                )}

                                <Button
                                    href={routes.booking({ master: master.id })}
                                    size="lg"
                                    fullWidth
                                    className="mt-8"
                                >
                                    Записаться к мастеру
                                </Button>

                                {siteSettings.phone !== null && siteSettings.phone !== undefined && (
                                    <p className="mt-4 text-center text-xs text-text-secondary">
                                        Или позвоните:{' '}
                                        <a
                                            href={`tel:${siteSettings.phone.replace(/[^\d+]/g, '')}`}
                                            className="text-accent transition-all duration-300 hover:text-accent-hover"
                                        >
                                            {siteSettings.phone}
                                        </a>
                                    </p>
                                )}
                            </div>

                            {/* Rating breakdown, computed from the loaded page
                                of reviews — labelled as such so the numbers are
                                not mistaken for the whole history. */}
                            <RatingBreakdown reviews={reviewItems} className="mt-8" />

                            {/* Working days */}
                            {uniqueDays.length > 0 && (
                                <div className="mt-8 rounded-2xl border border-border bg-bg-elevated p-6">
                                    <h2 className="font-display text-lg font-semibold text-text-primary">
                                        График работы
                                    </h2>

                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {uniqueDays.map((day) => (
                                            <li
                                                key={day}
                                                className="rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text-secondary"
                                            >
                                                {WEEKDAYS[day] ?? day}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* ------------------------------------------------
                            Right: services with prices and durations
                        ------------------------------------------------ */}
                        <div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="section-eyebrow">{SERVICE_COPY.title}</p>
                                    <h2 className="mt-3 font-display text-2xl font-semibold text-text-primary">
                                        Услуги мастера
                                    </h2>
                                </div>

                                <span className="shrink-0 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
                                    {services.length} {plural(services.length, 'услуга', 'услуги', 'услуг')}
                                </span>
                            </div>

                            {services.length === 0 ? (
                                <EmptyState
                                    className="mt-8"
                                    icon={<ScissorsIcon />}
                                    title="Мастер пока не указал услуги"
                                    description="Позвоните нам — подберём другого мастера или уточним список."
                                />
                            ) : (
                                <ul className="mt-8 space-y-4">
                                    {services.map((service) => (
                                        <li
                                            key={service.id}
                                            className="group rounded-2xl border border-border bg-bg-elevated p-6 transition-all duration-300 hover:border-accent/60"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {service.category !== undefined && (
                                                            <span className="text-accent" aria-hidden="true">
                                                                <CategoryIcon
                                                                    slug={service.category.slug}
                                                                    className="h-4 w-4"
                                                                />
                                                            </span>
                                                        )}

                                                        <h3 className="font-display text-lg font-semibold text-text-primary">
                                                            {service.name}
                                                        </h3>
                                                    </div>

                                                    {service.category !== undefined && (
                                                        <p className="mt-1 text-xs uppercase tracking-wider text-text-secondary">
                                                            {service.category.name}
                                                        </p>
                                                    )}

                                                    {service.description !== null &&
                                                        service.description !== undefined && (
                                                            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                                                {service.description}
                                                            </p>
                                                        )}
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end gap-3">
                                                    <PriceRange
                                                        min={service.base_price_min}
                                                        max={service.base_price_max}
                                                        pivot={service.pivot}
                                                        size="lg"
                                                    />

                                                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                        <ClockIcon className="h-3.5 w-3.5" />
                                                        {formatDuration(serviceDuration(service))}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-5 border-t border-border pt-5">
                                                <Button
                                                    href={routes.booking({
                                                        master: master.id,
                                                        service: service.id,
                                                    })}
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    {SERVICE_COPY.book}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* ------------------------------------------------
                                Portfolio: up to six published works. The
                                section is omitted entirely when the master
                                has nothing published.
                            ------------------------------------------------ */}
                            {portfolioItems.length > 0 && (
                                <section
                                    className="mt-16"
                                    aria-labelledby="master-portfolio-heading"
                                >
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <div>
                                            <p className="section-eyebrow">Работы</p>
                                            <h2
                                                id="master-portfolio-heading"
                                                className="mt-3 font-display text-2xl font-semibold text-text-primary"
                                            >
                                                Портфолио мастера
                                            </h2>
                                        </div>

                                        <span className="shrink-0 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
                                            {portfolioTotal}{' '}
                                            {plural(portfolioTotal, 'работа', 'работы', 'работ')}
                                        </span>
                                    </div>

                                    <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {portfolioItems.map((item) => {
                                            const src = portfolioPhoto(item.photo_path);
                                            const title = item.title ?? 'Работа мастера';

                                            return (
                                                <li key={item.id}>
                                                    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated transition-all duration-300 hover:border-accent/60">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLightbox({
                                                                    src,
                                                                    alt: title,
                                                                    caption:
                                                                        item.description ?? name,
                                                                })
                                                            }
                                                            className="block w-full cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                                            aria-label={`Открыть работу «${title}» крупнее`}
                                                        >
                                                            <Img
                                                                src={src}
                                                                fallbackSrc={PORTFOLIO_FALLBACK}
                                                                alt={title}
                                                                className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.03]"
                                                            />
                                                        </button>

                                                        <p className="px-4 py-3 text-sm text-text-primary">
                                                            {title}
                                                        </p>
                                                    </article>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {portfolioTotal > portfolioItems.length && (
                                        <div className="mt-6">
                                            <Button
                                                href={routes.portfolio(master.id)}
                                                variant="ghost"
                                                size="sm"
                                            >
                                                Смотреть всё портфолио →
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>

                    {/* ------------------------------------------------
                        Reviews
                    ------------------------------------------------ */}
                    <div className="mt-20 border-t border-border pt-16">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="section-eyebrow">Отзывы</p>
                                <h2 className="mt-3 font-display text-2xl font-semibold text-text-primary">
                                    Отзывы о {name}
                                </h2>
                            </div>

                            {reviews !== undefined && reviews.total > 0 && (
                                <p className="text-sm text-text-secondary">
                                    Всего отзывов: {reviews.total}
                                </p>
                            )}
                        </div>

                        {reviewItems.length === 0 ? (
                            <EmptyState
                                className="mt-8"
                                size="sm"
                                icon={<QuoteIcon />}
                                title="Отзывов пока нет"
                                description="Станьте первым, кто расскажет о работе этого мастера."
                            />
                        ) : (
                            <>
                                <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {reviewItems.map((review) => (
                                        <li key={review.id} className="flex">
                                            <ReviewCard
                                                review={review}
                                                onPhotoClick={setLightbox}
                                                onOpen={setOpenReview}
                                                className="w-full"
                                            />
                                        </li>
                                    ))}
                                </ul>

                                {reviews !== undefined && (
                                    <Pagination paginator={reviews} className="mt-12" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            <Lightbox
                open={lightbox !== null}
                src={lightbox?.src ?? null}
                alt={lightbox?.alt ?? ''}
                caption={lightbox?.caption ?? null}
                onClose={() => setLightbox(null)}
            />

            <ReviewModal
                review={openReview}
                onClose={() => setOpenReview(null)}
                onPhotoClick={setLightbox}
            />
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Local pieces
|--------------------------------------------------------------------------
*/

/** Star distribution across the reviews that were returned. */
function RatingBreakdown({
    reviews,
    className,
}: {
    reviews: ServerReview[];
    className?: string;
}) {
    if (reviews.length === 0) {
        return null;
    }

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((review) => review.rating === stars).length;

        return {
            stars,
            count,
            percent: Math.round((count / reviews.length) * 100),
        };
    });

    return (
        <div className={cn('rounded-2xl border border-border bg-bg-elevated p-6', className)}>
            <h2 className="font-display text-lg font-semibold text-text-primary">
                Распределение оценок
            </h2>

            <ul className="mt-5 space-y-3">
                {distribution.map((row) => (
                    <li key={row.stars} className="flex items-center gap-3 text-xs">
                        <span className="w-10 shrink-0 text-text-secondary">{row.stars} ★</span>

                        <span
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-secondary"
                            role="img"
                            aria-label={`${row.stars} звёзд: ${row.count} из ${reviews.length}`}
                        >
                            <span
                                className="block h-full rounded-full bg-accent"
                                style={{ width: `${row.percent}%` }}
                            />
                        </span>

                        <span className="w-8 shrink-0 text-right tabular-nums text-text-secondary">
                            {row.count}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-4 text-xs text-text-secondary">
                По данным текущей страницы отзывов ({reviews.length}).
            </p>
        </div>
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
