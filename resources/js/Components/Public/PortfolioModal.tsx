import { useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { Modal } from '@/Components/UI/Modal';
import { Img } from '@/Components/UI/Img';
import { Button } from '@/Components/UI/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { routes } from '@/lib/routes';
import { portfolioPhoto, PORTFOLIO_FALLBACK } from '@/lib/image';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| PortfolioModal — one work, in full, with gallery navigation
|--------------------------------------------------------------------------
| A card on /portfolio (and in the portfolio section of /masters/{id}) is a
| teaser: the description is clamped to two lines and the master's name is not
| clickable. Clicking the card opens this instead of jumping straight into the
| lightbox, so the title, the whole text and the master link are readable.
|
| The modal is a GALLERY over the works of the current context — every item on
| /portfolio, that master's items on /masters/{id}. The owner shows the "3 / 12"
| counter, and the arrows, ArrowLeft/ArrowRight and a horizontal swipe move
| between works. ENDS DO NOT LOOP: the arrows disable at the first and last work
| (stated explicitly so the behaviour is not a surprise).
|
| The photo hands off to the page's own <Lightbox> (z-[60] against the modal's
| z-50, so it opens ON TOP); the lightbox receives the same gallery navigation,
| which is why Escape/arrows close or move one layer at a time.
|
| Escape, the backdrop and the close button come from <Modal>.
*/

export interface PortfolioModalProps {
    /** All works of the current context, in display order. */
    items: PortfolioItemRow[];
    /** Index into `items`; `null` keeps the modal closed. */
    index: number | null;
    /** Moves to another work (already clamped by the caller check below). */
    onNavigate: (index: number) => void;
    onClose: () => void;
    onPhotoClick?: (photo: LightboxPhoto) => void;
    /** Hidden on a master's own page, where the master is already the context. */
    showMasterLink?: boolean;
}

export function PortfolioModal({
    items,
    index,
    onNavigate,
    onClose,
    onPhotoClick,
    showMasterLink = true,
}: PortfolioModalProps) {
    /** Swipe origin, in clientX. */
    const touchStartX = useRef<number | null>(null);

    const open = index !== null && items.length > 0;
    const item = open && index !== null ? (items[index] ?? null) : null;
    const hasPrev = index !== null && index > 0;
    const hasNext = index !== null && index < items.length - 1;

    /*
     * Keyboard navigation. The Lightbox captures the arrow keys in the capture
     * phase and stops immediate propagation, so while it is open this handler
     * never sees them — one layer moves at a time.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'ArrowLeft' && hasPrev && index !== null) {
                onNavigate(index - 1);
            }

            if (event.key === 'ArrowRight' && hasNext && index !== null) {
                onNavigate(index + 1);
            }
        };

        document.addEventListener('keydown', onKeyDown, false);

        return () => document.removeEventListener('keydown', onKeyDown, false);
    }, [open, hasPrev, hasNext, index, onNavigate]);

    const title = item?.title ?? 'Работа мастера';
    const masterName = item?.master?.user?.name ?? item?.master?.name ?? null;
    const masterId = item?.master?.id ?? item?.master_id ?? null;
    const src = item === null ? null : portfolioPhoto(item.photo_path);
    const counter = index === null ? null : `${index + 1} / ${items.length}`;

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={title}
            description={masterName ?? undefined}
        >
            {item !== null && (
                <div className="space-y-6">
                    <div
                        className="relative"
                        onTouchStart={(event) => {
                            touchStartX.current = event.touches[0]?.clientX ?? null;
                        }}
                        onTouchEnd={(event) => {
                            const start = touchStartX.current;
                            const end = event.changedTouches[0]?.clientX ?? null;

                            touchStartX.current = null;

                            if (
                                start === null ||
                                end === null ||
                                Math.abs(end - start) < 45 ||
                                index === null
                            ) {
                                return;
                            }

                            // Swipe right → previous, swipe left → next.
                            if (end < start && hasNext) {
                                onNavigate(index + 1);
                            } else if (end > start && hasPrev) {
                                onNavigate(index - 1);
                            }
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                src !== null &&
                                onPhotoClick?.({
                                    src,
                                    alt: title,
                                    caption: masterName,
                                })
                            }
                            disabled={onPhotoClick === undefined || src === null}
                            aria-label={`Открыть «${title}» в полном размере`}
                            className="block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
                        >
                            <Img
                                /*
                                 * `key` is the item ID, not the photo URL: two
                                 * works could legitimately share an image, and
                                 * the remount is what guarantees the <img>
                                 * element is rebuilt when the arrows move.
                                 */
                                key={item.id}
                                src={src ?? PORTFOLIO_FALLBACK}
                                fallbackSrc={PORTFOLIO_FALLBACK}
                                alt={title}
                                className="max-h-[26rem] w-full object-cover"
                            />
                        </button>

                        {items.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => index !== null && onNavigate(index - 1)}
                                    disabled={!hasPrev}
                                    aria-label="Предыдущая работа"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated/90 p-2 text-text-primary backdrop-blur transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeftIcon className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => index !== null && onNavigate(index + 1)}
                                    disabled={!hasNext}
                                    aria-label="Следующая работа"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated/90 p-2 text-text-primary backdrop-blur transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRightIcon className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {item.description !== null && item.description !== '' ? (
                        <p className="whitespace-pre-line rounded-2xl border border-border bg-bg-secondary p-5 text-sm leading-relaxed text-text-primary">
                            {item.description}
                        </p>
                    ) : (
                        <p className="text-sm text-text-secondary">
                            Описание к этой работе не добавлено.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        {masterId !== null && masterName !== null && showMasterLink ? (
                            <Link
                                href={routes.master(masterId)}
                                className="font-medium text-accent transition-all duration-300 hover:text-accent-hover"
                            >
                                {masterName} →
                            </Link>
                        ) : (
                            masterName !== null && (
                                <span className="font-medium text-text-primary">
                                    {masterName}
                                </span>
                            )
                        )}

                        {/* Category / service: the row has no such column yet, so
                            it only renders if the payload ever carries one. */}
                        {'service' in item && item.service != null && (
                            <span className="text-text-secondary">
                                {(item.service as { name?: string }).name ?? ''}
                            </span>
                        )}

                        {counter !== null && (
                            <span className="tabular-nums text-text-secondary">{counter}</span>
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            className="ml-auto"
                            onClick={onClose}
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default PortfolioModal;
