import { Modal } from '@/Components/UI/Modal';
import { RatingStars } from '@/Components/UI/RatingStars';
import { Button } from '@/Components/UI/Button';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { formatDate, initials } from '@/lib/format';
import type { ReviewLike } from '@/types';

/*
|--------------------------------------------------------------------------
| ReviewModal — full review
|--------------------------------------------------------------------------
| The cards on /, /masters/{id} and /reviews are teasers (three-line clamp),
| so the complete text, the client's details and the photo live here.
|
| The photo hands off to the page's own <Lightbox> rather than nesting a
| second overlay inside the modal: every public page already owns exactly one
| lightbox instance, and passing it in keeps that invariant.
|
| Escape, backdrop click and the close button all come from <Modal>.
*/

export interface ReviewModalProps {
    /** `null` keeps the modal closed, so the caller only stores the selection. */
    review: ReviewLike | null;
    onClose: () => void;
    onPhotoClick?: (photo: LightboxPhoto) => void;
}

export function ReviewModal({ review, onClose, onPhotoClick }: ReviewModalProps) {
    const open = review !== null;

    const author = review?.client?.name ?? 'Клиент';
    const masterName = review?.master?.name ?? review?.master?.user?.name ?? null;
    const dateLabel =
        review !== null && 'created_at_label' in review && review.created_at_label != null
            ? review.created_at_label
            : formatDate(review?.created_at ?? null);
    const photoUrl = review?.photo_url ?? null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="Отзыв полностью"
            description={
                review === null
                    ? undefined
                    : [author, masterName === null ? null : `мастер ${masterName}`, dateLabel]
                          .filter((part): part is string => part !== null && part !== '')
                          .join(' · ')
            }
        >
            {review !== null && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <RatingStars value={review.rating} size="md" />

                        <span className="flex items-center gap-2 text-xs text-text-secondary">
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-secondary text-[0.65rem] font-medium text-accent"
                                aria-hidden="true"
                            >
                                {initials(author)}
                            </span>
                            {author}
                        </span>
                    </div>

                    <p className="whitespace-pre-line rounded-2xl border border-border bg-bg-secondary p-5 text-sm leading-relaxed text-text-primary">
                        {review.text ?? 'Текст отзыва не указан.'}
                    </p>

                    {photoUrl != null && photoUrl !== '' && (
                        <button
                            type="button"
                            onClick={() =>
                                onPhotoClick?.({
                                    src: photoUrl,
                                    alt: `Фотография к отзыву — ${author}`,
                                    caption: author,
                                })
                            }
                            disabled={onPhotoClick === undefined}
                            aria-label="Открыть фотографию к отзыву"
                            className="block w-fit cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
                        >
                            <img
                                src={photoUrl}
                                alt="Фотография к отзыву"
                                className="max-h-72 w-auto object-cover"
                            />
                        </button>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row-reverse">
                        <Button type="button" onClick={onClose}>
                            Закрыть
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default ReviewModal;
