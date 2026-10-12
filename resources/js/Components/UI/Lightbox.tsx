import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Lightbox
|--------------------------------------------------------------------------
| In-page viewer for published photos (review photos, client reference
| photos). Replaces the old "open the raw file in a new tab" links, which
| took the visitor off the site.
|
| Behaviour mirrors Modal.tsx so the two overlays feel the same:
|   - portal at the end of <body>, so no transformed ancestor can clip it,
|   - Escape closes, backdrop click closes, clicking the image does NOT,
|   - focus moves into the dialog and returns to the trigger on close,
|   - body scroll is locked while open,
|   - role="dialog" + aria-modal, labelled by the image alt text.
|
| The open/close fade+scale is a CSS transition (not the Modal's entry-only
| keyframe) so the element can animate out before it unmounts.
*/

export interface LightboxPhoto {
    src: string;
    alt: string;
    caption?: string | null;
}

export interface LightboxProps {
    open: boolean;
    src: string | null;
    alt: string;
    onClose: () => void;
    caption?: string | null;
    /**
     * Optional gallery navigation. Both handlers must be present for the arrows
     * to render; `canPrev`/`canNext` disable them at the ends (no looping) and
     * `counter` is the "3 / 12" label.
     */
    onPrev?: () => void;
    onNext?: () => void;
    canPrev?: boolean;
    canNext?: boolean;
    counter?: string | null;
}

/** Kept in step with the transition duration below. */
const DURATION = 200;

export function Lightbox({
    open,
    src,
    alt,
    onClose,
    caption = null,
    onPrev,
    onNext,
    canPrev = false,
    canNext = false,
    counter = null,
}: LightboxProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    /** Swipe origin, in clientX. */
    const touchStartX = useRef<number | null>(null);
    // `mounted` keeps the element in the tree long enough to animate out.
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);

            const frame = window.requestAnimationFrame(() => setVisible(true));

            return () => window.cancelAnimationFrame(frame);
        }

        setVisible(false);

        const timeout = window.setTimeout(() => setMounted(false), DURATION);

        return () => window.clearTimeout(timeout);
    }, [open]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                /*
                 * The dialog underneath (e.g. the admin review modal) also
                 * listens for Escape on `document`. Without this, one press
                 * would close the lightbox AND the modal behind it. Capturing
                 * plus stopImmediatePropagation keeps the press to the topmost
                 * layer only.
                 */
                event.stopImmediatePropagation();
                event.preventDefault();
                onClose();

                return;
            }

            /*
             * Gallery arrows. Captured like Escape so the modal below does not
             * act on the same press, and disabled ends swallow the key.
             */
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                const forward = event.key === 'ArrowRight';
                const handler = forward ? onNext : onPrev;
                const allowed = forward ? canNext : canPrev;

                if (handler === undefined || allowed === false) {
                    return;
                }

                event.stopImmediatePropagation();
                event.preventDefault();
                handler();

                return;
            }

            if (event.key !== 'Tab' || panelRef.current === null) {
                return;
            }

            // The close button is the only focusable control, so the trap is
            // mostly about not letting Tab escape to the page behind.
            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );

            if (focusable.length === 0) {
                event.preventDefault();
                panelRef.current.focus();

                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (first === undefined || last === undefined) {
                return;
            }

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        [onClose, onPrev, onNext, canPrev, canNext],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        previouslyFocused.current = document.activeElement as HTMLElement | null;

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        // Capture phase, so this runs before the Modal's bubble-phase handler.
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open, handleKeyDown]);

    /*
     * Focus is moved in its own effect: the panel only exists once `mounted`
     * flips (the exit transition keeps the element around), so focusing from
     * the effect above would run while the ref is still null and leave focus on
     * whatever was behind the overlay.
     *
     * The restore rides on the same flag: returning focus when `open` flips
     * false would be undone a moment later, when the exiting panel unmounts and
     * the browser drops focus to <body>.
     */
    useEffect(() => {
        if (!open || !mounted) {
            return;
        }

        const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

        return () => window.cancelAnimationFrame(frame);
    }, [open, mounted]);

    useEffect(() => {
        if (mounted) {
            return;
        }

        previouslyFocused.current?.focus?.();
    }, [mounted]);

    if (!mounted || src === null || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8">
            {/*
             * Backdrop is a sibling of the dialog, so a click on the image (or
             * anywhere inside the panel) can never reach this handler.
             */}
            <div
                className={cn(
                    'absolute inset-0 bg-black/80 backdrop-blur transition-opacity',
                    visible ? 'opacity-100' : 'opacity-0',
                )}
                style={{ transitionDuration: `${DURATION}ms` }}
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={alt}
                tabIndex={-1}
                onTouchStart={(event) => {
                    touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                    const start = touchStartX.current;
                    const end = event.changedTouches[0]?.clientX ?? null;

                    touchStartX.current = null;

                    if (start === null || end === null || Math.abs(end - start) < 45) {
                        return;
                    }

                    // Swipe right → previous, swipe left → next.
                    if (end < start && canNext) {
                        onNext?.();
                    } else if (end > start && canPrev) {
                        onPrev?.();
                    }
                }}
                className={cn(
                    // The panel takes focus on open, so the app-wide
                    // `:focus-visible` ring would draw a gold box around the
                    // whole overlay; the close button keeps its own ring.
                    'relative z-10 flex max-h-full w-full flex-col items-center gap-4 transition-all ease-out focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                    visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                )}
                style={{ transitionDuration: `${DURATION}ms` }}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl shadow-black/60"
                />

                {onPrev !== undefined && onNext !== undefined && (
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!canPrev}
                        aria-label="Предыдущая работа"
                        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-bg-elevated/85 p-3 text-text-secondary backdrop-blur transition-all duration-300 hover:border-accent hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:left-[-4.5rem]"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                )}

                {onPrev !== undefined && onNext !== undefined && (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canNext}
                        aria-label="Следующая работа"
                        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-bg-elevated/85 p-3 text-text-secondary backdrop-blur transition-all duration-300 hover:border-accent hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:right-[-4.5rem]"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                )}

                {counter !== null && counter !== '' && (
                    <p className="text-xs tabular-nums text-text-secondary">{counter}</p>
                )}

                {caption !== null && caption !== '' && (
                    <p className="max-w-[90vw] text-center text-sm text-text-secondary">{caption}</p>
                )}
            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="absolute right-4 top-4 z-20 rounded-full border border-border bg-bg-elevated/80 p-3 text-text-secondary backdrop-blur transition-all duration-300 hover:border-accent hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
            >
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>,
        document.body,
    );
}

export default Lightbox;
