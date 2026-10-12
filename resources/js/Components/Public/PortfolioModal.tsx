import { Link } from '@inertiajs/react';
import { Modal } from '@/Components/UI/Modal';
import { Img } from '@/Components/UI/Img';
import { Button } from '@/Components/UI/Button';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { routes } from '@/lib/routes';
import { portfolioPhoto, PORTFOLIO_FALLBACK } from '@/lib/image';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| PortfolioModal — one work, in full
|--------------------------------------------------------------------------
| A card on /portfolio (and in the portfolio section of /masters/{id}) is a
| teaser: the description is clamped to two lines and the master's name is not
| clickable. Clicking the card opens this instead of jumping straight into the
| lightbox, so the title, the whole text and the master link are readable.
|
| The photo inside hands off to the page's own <Lightbox> — the same contract
| ReviewModal uses — and the lightbox is z-[60] against the modal's z-50, so it
| opens ON TOP and Escape closes it first.
|
| Escape, the backdrop and the close button come from <Modal>.
*/

export interface PortfolioModalProps {
    /** `null` keeps the modal closed, so the caller only stores the selection. */
    item: PortfolioItemRow | null;
    onClose: () => void;
    onPhotoClick?: (photo: LightboxPhoto) => void;
    /** Hidden on a master's own page, where the master is already the context. */
    showMasterLink?: boolean;
}

export function PortfolioModal({
    item,
    onClose,
    onPhotoClick,
    showMasterLink = true,
}: PortfolioModalProps) {
    const title = item?.title ?? 'Работа мастера';
    const masterName = item?.master?.user?.name ?? item?.master?.name ?? null;
    const masterId = item?.master?.id ?? item?.master_id ?? null;
    const src = item === null ? null : portfolioPhoto(item.photo_path);

    return (
        <Modal
            open={item !== null}
            onClose={onClose}
            size="lg"
            title={title}
            description={masterName ?? undefined}
        >
            {item !== null && (
                <div className="space-y-6">
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
                            src={src ?? PORTFOLIO_FALLBACK}
                            fallbackSrc={PORTFOLIO_FALLBACK}
                            alt={title}
                            className="max-h-[26rem] w-full object-cover"
                        />
                    </button>

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
