import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { ReviewCard } from '@/Components/Public/ReviewCard';
import { ReviewModal } from '@/Components/Public/ReviewModal';
import { Badge } from '@/Components/UI/Badge';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Img } from '@/Components/UI/Img';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { Pagination } from '@/Components/UI/Pagination';
import { QuoteIcon } from '@/lib/icons';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/format';
import type { Paginated, ReviewLike } from '@/types';

/*
|--------------------------------------------------------------------------
| Reviews/Index — GET /reviews
|--------------------------------------------------------------------------
| The public review wall: approved reviews only, twelve per page, optionally
| narrowed to one master via ?master={id}.
|
| The master filter is a server round-trip (router.get with preserveState), not
| a client-side filter, so the URL stays shareable and the pager keeps working
| on a filtered set.
|
| Props:
|   reviews  — paginator of ReviewResource (data / links / meta)
|   masters  — masters with at least one approved review, plus their counts
|   filters  — ['master' => id|null]
*/

export interface ReviewsIndexProps {
    reviews?: Paginated<ReviewLike> | ReviewLike[];
    masters?: Array<{
        id: number;
        name: string;
        photo_url: string | null;
        review_count: number;
    }>;
    filters?: { master?: number | null };
}

const PLACEHOLDER = '/images/placeholder-master.svg';

export default function ReviewsIndex({
    reviews = [],
    masters = [],
    filters,
}: ReviewsIndexProps) {
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);
    // Review whose full text is open in the modal (null = closed).
    const [openReview, setOpenReview] = useState<ReviewLike | null>(null);
    const rows = Array.isArray(reviews) ? reviews : reviews.data;
    const activeMaster = filters?.master ?? null;
    const total = masters.reduce((sum, master) => sum + master.review_count, 0);

    const applyFilter = (masterId: number | null): void => {
        router.get(
            routes.reviews(masterId ?? undefined),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout title="Отзывы" description="Что говорят наши клиенты">
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-16 md:py-20">
                    <p className="section-eyebrow">Отзывы</p>
                    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                        Отзывы
                    </h1>
                    <p className="section-subtitle">Что говорят наши клиенты</p>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
                        {/* Master filter — sticky on large screens. */}
                        <aside className="lg:sticky lg:top-28 lg:self-start">
                            <h2 className="text-xs uppercase tracking-wider text-text-secondary">
                                Мастера
                            </h2>

                            <ul className="mt-4 space-y-2">
                                <li>
                                    <FilterRow
                                        active={activeMaster === null}
                                        onClick={() => applyFilter(null)}
                                        name="Все мастера"
                                        count={total}
                                    />
                                </li>

                                {masters.map((master) => (
                                    <li key={master.id}>
                                        <FilterRow
                                            active={activeMaster === master.id}
                                            onClick={() => applyFilter(master.id)}
                                            name={master.name}
                                            count={master.review_count}
                                            photoUrl={master.photo_url}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        <div>
                            {rows.length === 0 ? (
                                <EmptyState
                                    icon={<QuoteIcon className="h-6 w-6" />}
                                    title="Пока нет отзывов"
                                    description="Здесь появятся отзывы клиентов после проверки модератором."
                                />
                            ) : (
                                <>
                                    <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                        {rows.map((review) => (
                                            <li key={review.id} className="h-full">
                                                <ReviewCard
                                                    review={review}
                                                    showMaster
                                                    onPhotoClick={setLightbox}
                                                    onOpen={setOpenReview}
                                                    className="h-full"
                                                />
                                            </li>
                                        ))}
                                    </ul>

                                    <Pagination paginator={reviews} className="mt-12" />
                                </>
                            )}
                        </div>
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

/** One row of the master filter: avatar (when known), name and review count. */
function FilterRow({
    active,
    onClick,
    name,
    count,
    photoUrl,
}: {
    active: boolean;
    onClick: () => void;
    name: string;
    count: number;
    photoUrl?: string | null;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-bg-elevated text-text-primary hover:border-accent/60',
            )}
        >
            {photoUrl !== undefined && (
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-bg-secondary">
                    <Img
                        src={photoUrl ?? PLACEHOLDER}
                        fallbackSrc={PLACEHOLDER}
                        alt=""
                        width={36}
                        height={36}
                        wrapperClassName="h-full w-full"
                        className="h-full w-full object-cover"
                    />
                </span>
            )}

            <span className="min-w-0 flex-1 truncate text-sm">{name}</span>

            <Badge tone={active ? 'accent' : 'neutral'} size="sm">
                {count}
            </Badge>
        </button>
    );
}
