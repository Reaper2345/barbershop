import { useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { CloseIcon, PhoneIcon } from '@/lib/icons';
import { primaryNav, isNavActive, routes } from '@/lib/routes';
import { telHref, cn } from '@/lib/format';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| MobileMenu
|--------------------------------------------------------------------------
| Slide-in drawer for small screens. Rendered by Header while `open` is true
| so the enter animation runs; it handles Escape, backdrop clicks, body scroll
| lock and focus trapping, mirroring the Modal's behaviour.
|
| The active item is derived from `usePage()` inside this component rather than
| taken from a prop: the drawer is mounted by Header, and reading the reactive
| page object here means the highlight is correct even while the drawer is open
| across a visit.
*/

export interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    settings: SharedProps['siteSettings'];
    user: SharedProps['auth']['user'];
}

export function MobileMenu({
    open,
    onClose,
    settings,
    user,
}: MobileMenuProps) {
    // Reactive: updates on every Inertia visit.
    const url = String(usePage<SharedProps>().url ?? '/');

    /*
     * Mirrors Header: on a master's detail page the CTA keeps that master,
     * otherwise the wizard asks for one again after the service step.
     */
    const masterFromUrl = /^\/masters\/(\d+)/.exec(url)?.[1];
    const bookingHref =
        masterFromUrl === undefined
            ? routes.booking()
            : routes.booking({ master: masterFromUrl });

    const panelRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();

                return;
            }

            if (event.key !== 'Tab' || panelRef.current === null) {
                return;
            }

            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled])',
            );

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
        };

        document.addEventListener('keydown', handleKeyDown);

        const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', handleKeyDown);
            window.cancelAnimationFrame(frame);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const phone = settings.phone ?? null;
    const siteName = settings.site_name ?? 'Барбершоп';

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div
                className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Меню навигации"
                className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-slide-in-right flex-col border-l border-border bg-bg-secondary"
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                    <Link
                        href={routes.home}
                        onClick={onClose}
                        className="font-display text-lg font-semibold tracking-tight text-text-primary"
                    >
                        {siteName}
                    </Link>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть меню"
                        className="rounded-full p-2 text-text-secondary transition-all duration-300 hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <nav aria-label="Основная навигация" className="flex-1 overflow-y-auto px-6 py-6">
                    <ul className="space-y-1">
                        {primaryNav.map((item) => {
                            const active = isNavActive(url, item);

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'block rounded-xl px-4 py-3 font-display text-lg transition-all duration-300',
                                            active
                                                ? 'bg-bg-elevated text-accent'
                                                : 'text-text-primary hover:bg-bg-elevated hover:text-accent',
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="space-y-4 border-t border-border px-6 py-6">
                    {phone !== null && (
                        <a
                            href={telHref(phone)}
                            className="flex items-center gap-2.5 text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                        >
                            <PhoneIcon className="h-4 w-4 shrink-0" />
                            {phone}
                        </a>
                    )}

                    <Button
                        href={bookingHref}
                        variant="primary"
                        fullWidth
                        onClick={onClose}
                    >
                        Записаться
                    </Button>

                    <div className="flex items-center justify-center gap-4 pt-1 text-sm">
                        {user === null ? (
                            <>
                                <Link
                                    href={routes.login}
                                    onClick={onClose}
                                    className="text-text-secondary transition-all duration-300 hover:text-accent"
                                >
                                    Войти
                                </Link>
                                <span className="text-border" aria-hidden="true">
                                    ·
                                </span>
                                <Link
                                    href={routes.register}
                                    onClick={onClose}
                                    className="text-text-secondary transition-all duration-300 hover:text-accent"
                                >
                                    Регистрация
                                </Link>
                            </>
                        ) : (
                            <Link
                                href={routes.cabinet}
                                onClick={onClose}
                                className="text-text-secondary transition-all duration-300 hover:text-accent"
                            >
                                Личный кабинет
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MobileMenu;
