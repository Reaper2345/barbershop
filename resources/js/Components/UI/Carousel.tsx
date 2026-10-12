import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Carousel
|--------------------------------------------------------------------------
| A scroll-snap track driven by the browser's own scrolling. That gives us
| native touch swiping and keyboard scrolling for free; the arrows simply
| scroll by one card, and the active dot is derived from `scrollLeft`, so the
| component needs no breakpoint detection to know how many cards are visible.
|
| Focusable content inside the slides stays reachable by keyboard.
*/

export interface CarouselProps {
    children: ReactNode[];
    /** Tailwind width classes for each slide, one per breakpoint. */
    slideClassName?: string;
    label: string;
    previousLabel: string;
    nextLabel: string;
    /** Hides the arrows and dots when there is only one slide. */
    className?: string;
}

/*
 * The track uses `gap-6` (1.5rem), so a plain `w-1/3` slide overshoots: three
 * of them plus two gaps need 1281px of a 1232px track and the third card was
 * sliced off at the container edge. Each breakpoint therefore subtracts its
 * share of the gaps — half a gap for two-up, two thirds of a gap for three-up.
 */
const DEFAULT_SLIDE_CLASS =
    'w-full md:w-[calc(50%_-_0.75rem)] xl:w-[calc(33.333%_-_1rem)]';

/** Slide width plus the gap: the distance one step of the track travels. */
function slideStep(track: HTMLUListElement): number {
    const first = track.firstElementChild as HTMLElement | null;

    if (first === null) {
        return track.clientWidth;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;

    return first.offsetWidth + gap;
}

/** How many slides currently fit in the track (1 at least). */
function visibleSlides(track: HTMLUListElement): number {
    const step = slideStep(track);

    if (step <= 0) {
        return 1;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    // The last slide needs no trailing gap, hence the `+ gap` on the width.
    const fit = Math.round((track.clientWidth + gap) / step);

    return Math.max(1, fit);
}

export function Carousel({
    children,
    slideClassName = DEFAULT_SLIDE_CLASS,
    label,
    previousLabel,
    nextLabel,
    className,
}: CarouselProps) {
    const trackRef = useRef<HTMLUListElement>(null);
    /*
     * `index` is the leftmost visible slide, so the reachable range is
     * 0 … total - visible. Tracking it (rather than only reading scrollLeft)
     * is what lets the arrows know they have hit a bound: with `scrollBy` the
     * track simply stopped at the end while the "next" button stayed enabled.
     */
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(1);

    const total = children.length;
    const maxIndex = Math.max(0, total - visible);
    const pageCount = Math.max(1, Math.ceil(total / visible));
    const hasPrev = index > 0;
    const hasNext = index < maxIndex;
    // The last page can start before `pageCount * visible` on a ragged end,
    // so it is matched by the bound rather than by division.
    const activePage = index >= maxIndex ? pageCount - 1 : Math.round(index / visible);

    // Read by the resize handler, which must not depend on stale state.
    const indexRef = useRef(0);
    indexRef.current = index;

    /** Moves the track to a slide index, clamped to the reachable range. */
    const goTo = (target: number): void => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        const clamped = Math.max(0, Math.min(target, maxIndex));

        setIndex(clamped);
        track.scrollTo({ left: clamped * slideStep(track), behavior: 'smooth' });
    };

    /** Keeps the arrows/dots honest when the user swipes or scrolls natively. */
    const handleScroll = (): void => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        const raw = Math.round(track.scrollLeft / slideStep(track));

        setIndex(Math.max(0, Math.min(raw, maxIndex)));
    };

    /*
     * The number of visible slides changes with the breakpoint, which changes
     * maxIndex — so it is re-measured on resize and the position re-clamped,
     * otherwise a viewport change would leave the arrows in the wrong state.
     */
    useEffect(() => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        const sync = (): void => {
            const fit = visibleSlides(track);
            const max = Math.max(0, total - fit);
            const clamped = Math.min(indexRef.current, max);

            setVisible(fit);
            setIndex(clamped);
            // No animation here: this only realigns after a layout change.
            track.scrollTo({ left: clamped * slideStep(track) });
        };

        sync();
        window.addEventListener('resize', sync);

        return () => window.removeEventListener('resize', sync);
    }, [total]);

    return (
        <div className={className}>
            <ul
                ref={trackRef}
                onScroll={handleScroll}
                aria-label={label}
                className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {children.map((child, index) => (
                    <li
                        key={index}
                        className={cn('shrink-0 snap-start', slideClassName)}
                    >
                        {child}
                    </li>
                ))}
            </ul>

            {children.length > 1 && (
                <div className="mt-8 flex items-center justify-between gap-4">
                    {/* Dots — one per page of visible slides, so they advance in
                        the same units as the arrows. */}
                    <ul className="flex flex-wrap items-center gap-2">
                        {Array.from({ length: pageCount }, (_, page) => (
                            <li key={page}>
                                <button
                                    type="button"
                                    onClick={() => goTo(page * visible)}
                                    aria-label={`Страница ${page + 1}`}
                                    aria-current={page === activePage ? 'true' : undefined}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                        page === activePage
                                            ? 'w-8 bg-accent'
                                            : 'w-3 bg-border hover:bg-text-secondary',
                                    )}
                                />
                            </li>
                        ))}
                    </ul>

                    {/* Arrows */}
                    <div className="flex items-center gap-2">
                        <ArrowButton
                            label={previousLabel}
                            onClick={() => goTo(index - visible)}
                            disabled={!hasPrev}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </ArrowButton>

                        <ArrowButton
                            label={nextLabel}
                            onClick={() => goTo(index + visible)}
                            disabled={!hasNext}
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </ArrowButton>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArrowButton({
    label,
    onClick,
    disabled,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            // Announced to assistive tech even where `disabled` is not honoured.
            aria-disabled={disabled || undefined}
            aria-label={label}
            className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-primary',
                'transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent',
                // Bound reached: visibly and actually inert.
                disabled &&
                    'pointer-events-none cursor-not-allowed opacity-40 hover:border-border hover:text-text-primary',
            )}
        >
            {children}
        </button>
    );
}

export default Carousel;
