import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { Img } from '@/Components/UI/Img';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Pagination } from '@/Components/UI/Pagination';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { PortfolioModal } from '@/Components/Public/PortfolioModal';
import { ImagesIcon } from '@/lib/icons';
import { routes } from '@/lib/routes';
import { masterPhoto, portfolioPhoto, PORTFOLIO_FALLBACK } from '@/lib/image';
import { cn } from '@/lib/format';
import type { Paginated, PortfolioItemRow, PortfolioMasterChip, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Portfolio/Index — GET /portfolio
|--------------------------------------------------------------------------
| Public showcase wall. Props from PortfolioController@index:
|   masters — masters with at least one published work, each with a count
|   items   — paginated published works (24/page), newest filter applied
|   filters — ['master' => int|null] mirroring the ?master= query
|
| The master filter is a real server round trip (router.get with
| preserveState), not client-side filtering, so the paginator, the counts and
| a shared URL always agree.
*/

export interface PortfolioIndexProps {
    masters?: PortfolioMasterChip[];
    items?: Paginated<PortfolioItemRow>;
    filters?: { master: number | null };
}

export default function PortfolioIndex({
    masters = [],
    items,
    filters,
}: PortfolioIndexProps) {
    const { siteSettings } = usePage<SharedProps>().props;
    const works = items?.data ?? [];
    const activeMaster = filters?.master ?? null;

    // One overlay of each kind for the whole grid; the cards report clicks.
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);
    const [selected, setSelected] = useState<number | null>(null);

    /**
     * Photo of a work, in the shape the Lightbox wants.
     */
    const photoFor = (position: number): LightboxPhoto | null => {
        const work = works[position];

        if (work === undefined) {
            return null;
        }

        return {
            src: portfolioPhoto(work.photo_path),
            alt: work.title ?? 'Работа мастера',
            caption: work.master?.user?.name ?? work.master?.name ?? null,
        };
    };

    /**
     * Gallery step used by the modal arrows, the keyboard and the lightbox.
     * While the lightbox is open it follows the selection, so the full-size
     * photo never shows a stale work.
     */
    const openWork = (position: number): void => {
        setSelected(position);

        if (lightbox !== null) {
            const photo = photoFor(position);

            if (photo !== null) {
                setLightbox(photo);
            }
        }
    };

    const totalCount = masters.reduce((sum, master) => sum + master.items_count, 0);

    const applyFilter = (masterId: number | null): void => {
        if (masterId === activeMaster) {
            return;
        }

        router.get(
            masterId === null ? routes.portfolio() : routes.portfolio(masterId),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout
            title="Портфолио"
            description="Работы мастеров барбершопа: стрижки, бороды и оформление."
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
                        <li aria-current="page" className="text-text-primary">
                            Портфолио
                        </li>
                    </ol>
                </div>
            </nav>

            <section className="section">
                <div className="container-page">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="section-eyebrow">Работы мастеров</p>
                            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text-primary">
                                Портфолио
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                                Работы наших мастеров — стрижки, бороды и оформление. Нажмите на
                                фотографию, чтобы рассмотреть её подробнее.
                            </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-border bg-bg-elevated px-4 py-2 text-xs text-text-secondary">
                            {works.length} из {items?.total ?? works.length}{' '}
                            {plural(items?.total ?? works.length, 'работы', 'работ', 'работ')}
                        </span>
                    </div>

                    {/*
                     * `grid-cols-[minmax(0,1fr)]` on mobile and `min-w-0` on
                     * the aside are load-bearing: a plain single `auto` grid
                     * column sizes to min-content, and the master chips row is
                     * a `shrink-0` flex row. Without them the column grew to
                     * the row's full width (~823px) and forced the mobile
                     * layout viewport wider than the screen instead of
                     * scrolling inside the strip.
                     */}
                    <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12">
                        {/* ------------------------------------------------
                            Master filter: sticky column on desktop,
                            horizontally scrollable strip on mobile.
                        ------------------------------------------------ */}
                        <aside
                            aria-label="Фильтр по мастерам"
                            className="min-w-0 lg:sticky lg:top-24 lg:self-start"
                        >
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
                                Мастера
                            </p>

                            <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
                                <li className="shrink-0 lg:shrink">
                                    <MasterChip
                                        label="Все мастера"
                                        count={totalCount}
                                        active={activeMaster === null}
                                        onClick={() => applyFilter(null)}
                                    />
                                </li>

                                {masters.map((master) => (
                                    <li key={master.id} className="shrink-0 lg:shrink">
                                        <MasterChip
                                            label={master.name}
                                            count={master.items_count}
                                            photo={masterPhoto(master.photo_url, master.name)}
                                            active={activeMaster === master.id}
                                            onClick={() => applyFilter(master.id)}
                                        />
                                    </li>
                                ))}
                            </ul>

                            {siteSettings.phone !== null && siteSettings.phone !== undefined && (
                                <p className="mt-6 hidden text-xs text-text-secondary lg:block">
                                    Хотите так же?{' '}
                                    <a
                                        href={`tel:${siteSettings.phone.replace(/[^\d+]/g, '')}`}
                                        className="text-accent transition-all duration-300 hover:text-accent-hover"
                                    >
                                        {siteSettings.phone}
                                    </a>
                                </p>
                            )}
                        </aside>

                        {/* ------------------------------------------------
                            Works grid
                        ------------------------------------------------ */}
                        <div>
                            {works.length === 0 ? (
                                <EmptyState
                                    icon={<ImagesIcon />}
                                    title="Работ пока нет"
                                    description={
                                        activeMaster === null
                                            ? 'Как только мастера опубликуют работы, они появятся здесь.'
                                            : 'У этого мастера пока нет опубликованных работ. Выберите другого мастера.'
                                    }
                                    action={
                                        activeMaster === null ? undefined : (
                                            <button
                                                type="button"
                                                onClick={() => applyFilter(null)}
                                                className="text-sm text-accent transition-all duration-300 hover:text-accent-hover"
                                            >
                                                Показать всех мастеров
                                            </button>
                                        )
                                    }
                                />
                            ) : (
                                <>
                                    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {works.map((item, position) => (
                                            <li key={item.id}>
                                                <PortfolioCard
                                                    item={item}
                                                    onOpen={() => setSelected(position)}
                                                />
                                            </li>
                                        ))}
                                    </ul>

                                    {items !== undefined && (
                                        <Pagination paginator={items} className="mt-12" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Full work: title, whole description and the master link. The
                photo inside hands off to the Lightbox below, and both layers
                browse the same list. */}
            <PortfolioModal
                items={works}
                index={selected}
                onNavigate={openWork}
                onClose={() => setSelected(null)}
                onPhotoClick={setLightbox}
            />

            <Lightbox
                open={lightbox !== null}
                src={lightbox?.src ?? null}
                alt={lightbox?.alt ?? ''}
                caption={lightbox?.caption ?? null}
                onClose={() => setLightbox(null)}
                onPrev={() => selected !== null && openWork(selected - 1)}
                onNext={() => selected !== null && openWork(selected + 1)}
                canPrev={selected !== null && selected > 0}
                canNext={selected !== null && selected < works.length - 1}
                counter={selected === null ? null : `${selected + 1} / ${works.length}`}
            />
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Local pieces
|--------------------------------------------------------------------------
*/

function MasterChip({
    label,
    count,
    photo,
    active,
    onClick,
}: {
    label: string;
    count: number;
    photo?: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                active
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-border bg-bg-elevated text-text-secondary hover:border-accent/60 hover:text-text-primary',
            )}
        >
            {photo !== undefined ? (
                <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-secondary">
                    <Img
                        src={photo}
                        fallbackSrc="/images/placeholder-master.svg"
                        alt=""
                        width={40}
                        height={40}
                    />
                </span>
            ) : (
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-secondary text-accent"
                    aria-hidden="true"
                >
                    <ImagesIcon className="h-4 w-4" />
                </span>
            )}

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{label}</span>
                <span className="block text-xs text-text-secondary">
                    {count} {plural(count, 'работа', 'работы', 'работ')}
                </span>
            </span>
        </button>
    );
}

function PortfolioCard({
    item,
    onOpen,
}: {
    item: PortfolioItemRow;
    onOpen: () => void;
}) {
    const src = portfolioPhoto(item.photo_path);
    const masterName = item.master?.user?.name ?? item.master?.name ?? null;
    const title = item.title ?? 'Работа мастера';

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated transition-all duration-300 hover:border-accent/60">
            <button
                type="button"
                onClick={() => onOpen()}
                className="block aspect-square w-full cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Открыть работу «${title}»`}
            >
                {/*
                 * A bare <img> (no wrapperClassName) keeps the button's content
                 * model valid — a <div> inside a <button> is not.
                 */}
                <Img
                    src={src}
                    fallbackSrc={PORTFOLIO_FALLBACK}
                    alt={title}
                    className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </button>

            <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-semibold text-text-primary">
                    {title}
                </h2>

                {item.description !== null && item.description !== '' && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                        {item.description}
                    </p>
                )}

                {masterName !== null && (
                    <p className="mt-auto pt-4 text-xs uppercase tracking-wider text-accent">
                        {masterName}
                    </p>
                )}
            </div>
        </article>
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
