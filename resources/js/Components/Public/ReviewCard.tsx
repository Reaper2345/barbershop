import { RatingStars } from '@/Components/UI/RatingStars';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { QuoteIcon } from '@/lib/icons';
import { formatDate, truncate, initials } from '@/lib/format';
import type { ReviewLike } from '@/types';

/*
|--------------------------------------------------------------------------
| ReviewCard
|--------------------------------------------------------------------------
| Used by the home-page carousel and the master detail page. Only approved
| reviews ever reach the client (every query filters on `is_approved`), and
| the reviewer is shown as a name plus initial rather than a full profile.
|
| Accepts either shape the backend returns:
|   - the raw Review model (home page: reviews,
|   - ReviewResource (master page: reviews.data).
*/

export interface ReviewCardProps {
    review: ReviewLike;
    /** Truncates long bodies — the carousel benefits from even card heights. */
    maxLength?: number;
    /** Shows "· мастер X" under the date (home page carousel). */
    showMaster?: boolean;
    /**
     * Opens the photo in the page's own <Lightbox>. The handler lives on the
     * page so there is exactly one overlay per page; without it the thumbnail
     * stays a plain image rather than linking away in a new tab.
     */
    onPhotoClick?: (photo: LightboxPhoto) => void;
    className?: string;
}

export function ReviewCard({
    review,
    maxLength,
    showMaster = false,
    onPhotoClick,
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

    return (
        <figure
            className={[
                'flex h-full flex-col rounded-2xl border border-border bg-bg-elevated p-6',
                className ?? '',
            ].join(' ')}
        >
            <QuoteIcon className="h-6 w-6 text-accent/50" aria-hidden="true" />

            <RatingStars value={review.rating} size="sm" showValue={false} className="mt-4" />

            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-text-secondary">
                {text}
            </blockquote>

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
                    className="mt-4 block w-fit cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
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
        </figure>
    );
}

export default ReviewCard;
