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

export function Carousel({
    children,
    slideClassName = 'w-full md:w-1/2 xl:w-1/3',
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

        // `clientWidth / visibleSlides` is the card width; the number of
        // visible slides is derived from the first slide's rendered width, so
        // this keeps working at every breakpoint.
        const firstSlide = track.firstElementChild as HTMLElement | null;
        const cardWidth = firstSlide?.offsetWidth ?? track.clientWidth;

        track.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    };

    const handleScroll = (): void => {
        const track = trackRef.current;

        if (track === null) {
            return;
        }

        const firstSlide = track.firstElementChild as HTMLElement | null;
        const cardWidth = firstSlide?.offsetWidth ?? 1;
        const index = Math.round(track.scrollLeft / cardWidth);

        setActiveIndex(Math.max(0, Math.min(index, children.length - 1)));
    };

    const scrollToIndex = (index: number): void => {
        const track = trackRef.current;
        const firstSlide = track?.firstElementChild as HTMLElement | null;

        if (track === null || track === undefined || firstSlide === null) {
            return;
        }

        track.scrollTo({ left: index * firstSlide.offsetWidth, behavior: 'smooth' });
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
