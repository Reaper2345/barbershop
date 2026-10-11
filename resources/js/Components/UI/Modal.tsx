import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
| Rendered in a portal at the end of <body> so it escapes any transformed
| ancestor. Behaviour that is easy to get wrong and therefore lives here:
|   - Escape closes,
|   - the backdrop click closes but clicks inside the panel do not,
|   - focus moves into the panel on open and returns to the trigger on close,
|   - body scroll is locked while open,
|   - role="dialog" + aria-modal + labelled/described ids.
*/

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children?: ReactNode;
    /** Action row; rendered inside the panel below the content. */
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    /** Hides the close button for confirmation dialogs driven by the footer. */
    hideCloseButton?: boolean;
}

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
} as const;

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    hideCloseButton = false,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const generatedId = useId();
    const titleId = `modal-title-${generatedId.replace(/:/g, '')}`;
    const descriptionId = `modal-desc-${generatedId.replace(/:/g, '')}`;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();

                return;
            }

            if (event.key !== 'Tab' || panelRef.current === null) {
                return;
            }

            // Simple focus trap over the focusable elements inside the panel.
            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
            );

            if (focusable.length === 0) {
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
        [onClose],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        previouslyFocused.current = document.activeElement as HTMLElement | null;

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        // Move focus after paint so the panel exists in the layout. Form
        // controls are preferred over the close button, which is why the
        // selector order matters here.
        const frame = window.requestAnimationFrame(() => {
            const target = panelRef.current?.querySelector<HTMLElement>(
                'input, textarea, select, button:not([disabled])',
            );

            (target ?? panelRef.current)?.focus();
        });

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', handleKeyDown);
            window.cancelAnimationFrame(frame);
            previouslyFocused.current?.focus?.();
        };
    }, [open, handleKeyDown]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title !== undefined ? titleId : undefined}
                aria-describedby={description !== undefined ? descriptionId : undefined}
                tabIndex={-1}
                className={cn(
                    'relative z-10 w-full animate-scale-in rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl shadow-black/60 sm:p-8',
                    SIZES[size],
                )}
            >
                {!hideCloseButton && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть окно"
                        className="absolute right-4 top-4 rounded-full p-2 text-text-secondary transition-all duration-300 hover:bg-bg-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                )}

                {(title !== undefined || description !== undefined) && (
                    <header className="mb-6 pr-10">
                        {title !== undefined && (
                            <h2
                                id={titleId}
                                className="font-display text-2xl font-semibold text-text-primary"
                            >
                                {title}
                            </h2>
                        )}

                        {description !== undefined && (
                            <p id={descriptionId} className="mt-2 text-sm text-text-secondary">
                                {description}
                            </p>
                        )}
                    </header>
                )}

                <div>{children}</div>

                {footer !== undefined && <div className="mt-8">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}

export default Modal;
