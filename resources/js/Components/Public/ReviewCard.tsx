import { useEffect, useRef, useState } from 'react';
import { RatingStars } from '@/Components/UI/RatingStars';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { QuoteIcon } from '@/lib/icons';
import { formatDate, truncate, initials } from '@/lib/format';
import type { ReviewLike } from '@/types';

/*
|--------------------------------------------------------------------------
| ReviewCard
|--------------------------------------------------------------------------
| Used by the home-page carousel, the master detail page and the review wall.
| Only approved reviews ever reach the client (every query filters on
| `is_approved`), and the reviewer is shown as a name plus initial rather than
| a full profile.
|
| The card is a TEASER: the body is clamped to three lines and the whole card
| opens the full review in a modal (see ReviewModal), which is where the
| complete text and the client's photo live. "Читать полностью" appears only
| when the text was actually clipped, measured from the DOM rather than
| guessed from a character count.
|
| Accepts either shape the backend returns:
|   - the raw Review model (home page: reviews),
|   - ReviewResource (master page / wall: reviews.data).
*/

export interface ReviewCardProps {
    review: ReviewLike;
    /** Pre-truncation cap; the carousel uses it for even card heights. */
    maxLength?: number;
    /** Shows "· мастер X" under the date (home page carousel). */
    showMaster?: boolean;
    /**
     * Opens the photo in the page's own <Lightbox>. The handler lives on the
     * page so there is exactly one overlay per page; without it the thumbnail
     * stays a plain image rather than linking away in a new tab.
     */
    onPhotoClick?: (photo: LightboxPhoto) => void;
    /** Opens the full-review modal. Without it the card stays non-clickable. */
    onOpen?: (review: ReviewLike) => void;
    className?: string;
}

export function ReviewCard({
    review,
    maxLength,
    showMaster = false,
    onPhotoClick,
    onOpen,
    className,
}: ReviewCardProps) {
    const author = review.client?.name ?? 'Клиент';
    const text = maxLength !== undefined ? truncate(review.text, maxLength) : review.text;
    // MasterResource flattens the name onto `master.name`; the raw model shape
    // used by the home page nests it under `master.user.name`. Accept both, or
    // the review wall would show the date with no master at all.
    const masterName = review.master?.name ?? review.master?.user?.name ?? null;
    const dateLabel = 'created_at_label' in review && review.created_at_label != null
        ? review.created_at_label
        : formatDate(review.created_at ?? null);

    const bodyRef = useRef<HTMLQuoteElement>(null);
    const [clipped, setClipped] = useState(false);

    /*
     * `line-clamp` hides the overflow, so the only reliable signal that a
     * teaser is incomplete is scrollHeight exceeding clientHeight. Measured
     * after paint and again on resize (the clamp depends on the column width).
     */
    useEffect(() => {
        const element = bodyRef.current;

        if (element === null) {
            return;
        }

        const measure = (): void => setClipped(element.scrollHeight > element.clientHeight + 1);

        measure();
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, [text]);

    const openable = onOpen !== undefined;

    return (
        <figure
            className={[
                'relative flex h-full flex-col rounded-2xl border border-border bg-bg-elevated p-6',
                openable
                    ? 'transition-all duration-300 hover:border-accent/60 focus-within:border-accent/60'
                    : '',
                className ?? '',
            ].join(' ')}
        >
            <QuoteIcon className="h-6 w-6 text-accent/50" aria-hidden="true" />

            <RatingStars value={review.rating} size="sm" showValue={false} className="mt-4" />

            <blockquote
                ref={bodyRef}
                className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-text-secondary"
            >
                {text}
            </blockquote>

            {clipped && openable && (
                <button
                    type="button"
                    onClick={() => onOpen(review)}
                    className="relative z-20 mt-3 w-fit text-sm font-medium text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent"
                >
                    Читать полностью
                </button>
            )}

            {/* Optional photo of the finished work; opens in the page lightbox. */}
            {review.photo_url != null && review.photo_url !== '' && (
                <button
                    type="button"
                    onClick={() =>
                        onPhotoClick?.({
                            src: review.photo_url as string,
                            alt: `Фотография к отзыву${author !== 'Клиент' ? ` — ${author}` : ''}`,
                            caption: author,
                        })
                    }
                    disabled={onPhotoClick === undefined}
                    aria-label="Открыть фотографию к отзыву"
                    className="relative z-20 mt-4 block w-fit cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
                >
                    <img
                        src={review.photo_url}
                        alt="Фотография к отзыву"
                        loading="lazy"
                        className="h-32 w-auto object-cover"
                    />
                </button>
            )}

            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-secondary text-xs font-medium text-accent"
                    aria-hidden="true"
                >
                    {initials(author)}
                </span>

                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">
                        {author}
                    </span>

                    <span className="block text-xs text-text-secondary">
                        {dateLabel}
                        {showMaster && masterName !== null && ` · мастер ${masterName}`}
                    </span>
                </span>
            </figcaption>

            {/*
             * Stretched button: makes the whole card open the full review while
             * keeping the accessible name on a real control. The thumbnail and
             * "Читать полностью" sit above it (z-20) so they keep their own
             * behaviour.
             */}
            {openable && (
                <button
                    type="button"
                    onClick={() => onOpen(review)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Читать отзыв полностью${author !== 'Клиент' ? ` — ${author}` : ''}`}
                />
            )}
        </figure>
    );
}

export default ReviewCard;
