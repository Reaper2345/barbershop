import { useRef, useState, type ReactNode } from 'react';
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

/** Slide width plus the gap: the distance one arrow press must travel. */
function slideStep(track: HTMLUListElement): number {
    const first = track.firstElementChild as HTMLElement | null;

    if (first === null) {
        return track.clientWidth;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;

    return first.offsetWidth + gap;
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
    const [activeIndex, setActiveIndex] = useState(0);

    const scrollByCard = (direction: -1 | 1): void => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        // Advancing by the slide width *plus the gap* lands exactly on the
        // neighbouring snap point; using the width alone drifted out of sync
        // with the dots after the second click.
        track.scrollBy({ left: direction * slideStep(track), behavior: 'smooth' });
    };

    const handleScroll = (): void => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        const step = slideStep(track);
        const index = Math.round(track.scrollLeft / step);

        setActiveIndex(Math.max(0, Math.min(index, children.length - 1)));
    };

    const scrollToIndex = (index: number): void => {
        const track = trackRef.current;

        if (track === null || track === undefined) {
            return;
        }

        track.scrollTo({ left: index * slideStep(track), behavior: 'smooth' });
    };

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
                    {/* Dots */}
                    <ul className="flex flex-wrap items-center gap-2">
                        {children.map((_, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => scrollToIndex(index)}
                                    aria-label={`Отзыв ${index + 1}`}
                                    aria-current={index === activeIndex ? 'true' : undefined}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                        index === activeIndex
                                            ? 'w-8 bg-accent'
                                            : 'w-3 bg-border hover:bg-text-secondary',
                                    )}
                                />
                            </li>
                        ))}
                    </ul>

                    {/* Arrows */}
                    <div className="flex items-center gap-2">
                        <ArrowButton label={previousLabel} onClick={() => scrollByCard(-1)} disabled={activeIndex === 0}>
                            <ChevronLeftIcon className="h-5 w-5" />
                        </ArrowButton>

                        <ArrowButton
                            label={nextLabel}
                            onClick={() => scrollByCard(1)}
                            disabled={activeIndex >= children.length - 1}
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
            aria-label={label}
            className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-primary',
                'transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary',
            )}
        >
            {children}
        </button>
    );
}

export default Carousel;
