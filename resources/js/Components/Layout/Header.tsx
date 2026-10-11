import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { MobileMenu } from './MobileMenu';
import { openCallbackModal } from './CallbackModal';
import {
    ChevronDownIcon,
    MenuIcon,
    PhoneIcon,
    UserIcon,
} from '@/lib/icons';
import { isNavActive, primaryNav, routes } from '@/lib/routes';
import { telHref, cn } from '@/lib/format';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
| Sticky public header: logo left, centred navigation, phone + CTA + account
| menu on the right. Below `lg` the navigation collapses into MobileMenu.
|
| Every string comes from the shared `siteSettings` prop (Setting::allCached),
| so the phone number and name are editable in the admin panel.
*/

export function Header() {
    const page = usePage<SharedProps>();
    const { siteSettings, auth } = page.props;

    /*
     * The active nav item is derived from Inertia's reactive page object.
     *
     * `usePage()` re-renders this component on every visit, so `url` always
     * describes the request currently on screen — a plain prop or
     * `window.location` would go stale after a client-side visit.
     *
     * Reading `page.url` (a typed field on Inertia's Page) rather than
     * destructuring it out of `props` matters: merged PageProps carry an
     * `unknown` index signature, which collapses the type to `unknown` and
     * invites a defensive `typeof === 'string'` fallback. That fallback is
     * dangerous — if it ever fired, every URL would read as '/' and the
     * underline would sit permanently on "Главная". `String(...)` normalises
     * without silently faking a route.
     */
    const url = String(page.url ?? '/');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    const phone = siteSettings.phone ?? null;
    const siteName = siteSettings.site_name ?? 'Барбершоп';
    const user = auth.user;

    // Close the account dropdown on an outside click or Escape.
    useEffect(() => {
        if (!accountOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent): void => {
            if (accountRef.current !== null && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setAccountOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [accountOpen]);

    const openCallback = (): void => {
        openCallbackModal();
    };

    const logout = (): void => {
        setAccountOpen(false);
        router.post(routes.logout);
    };

    const cabinetHref =
        user?.role === 'admin'
            ? '/admin'
            : user?.role === 'master'
              ? auth.master_id !== null
                  ? '/master/dashboard'
                  : routes.cabinet
              : routes.cabinet;

    /*
     * Standing on a master's page, the CTA books that master. A bare
     * `/booking` drops the context and the wizard re-asks "choose a master"
     * after the service step, as if the visitor had started from scratch.
     */
    const masterFromUrl = /^\/masters\/(\d+)/.exec(url)?.[1];
    const bookingHref =
        masterFromUrl === undefined
            ? routes.booking()
            : routes.booking({ master: masterFromUrl });

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/80">
                <div className="container-page flex h-20 items-center justify-between gap-6">
                    {/* Logo */}
                    <Link
                        href={routes.home}
                        className="group flex shrink-0 flex-col leading-none"
                        aria-label={`${siteName} — на главную`}
                    >
                        <span className="font-display text-xl font-semibold tracking-tight text-text-primary transition-all duration-300 group-hover:text-accent">
                            {siteName}
                        </span>
                        <span className="mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-text-secondary">
                            Barbershop
                        </span>
                    </Link>

                    {/* Desktop navigation */}
                    <nav aria-label="Основная навигация" className="hidden lg:block">
                        <ul className="flex items-center gap-1">
                            {primaryNav.map((item) => {
                                const active = isNavActive(url, item);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                // `whitespace-nowrap` + the tighter px-3:
                                                // with seven nav items ("Портфолио" was
                                                // added last) a shrinking flex row wrapped
                                                // "Портфолио" and "О нас" onto two lines.
                                                'relative whitespace-nowrap rounded-full px-3 py-2 text-sm transition-all duration-300',
                                                active
                                                    ? 'text-accent'
                                                    : 'text-text-secondary hover:text-text-primary',
                                            )}
                                        >
                                            {item.label}
                                            {active && (
                                                <span
                                                    className="absolute inset-x-3 -bottom-0.5 h-px bg-accent"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {phone !== null && (
                            <a
                                href={telHref(phone)}
                                className="hidden items-center gap-2 text-sm text-text-secondary transition-all duration-300 hover:text-accent xl:flex"
                            >
                                <PhoneIcon className="h-4 w-4 shrink-0" />
                                {phone}
                            </a>
                        )}

                        <Button
                            href={bookingHref}
                            variant="primary"
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            Записаться
                        </Button>

                        {/* Account dropdown */}
                        <div className="relative hidden lg:block" ref={accountRef}>
                            <button
                                type="button"
                                onClick={() => setAccountOpen((previous) => !previous)}
                                aria-expanded={accountOpen}
                                aria-haspopup="true"
                                aria-controls="header-account-menu"
                                aria-label={user === null ? 'Меню входа' : 'Меню аккаунта'}
                                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <UserIcon className="h-4 w-4" />
                                <ChevronDownIcon
                                    className={cn(
                                        'h-3.5 w-3.5 transition-transform duration-300',
                                        accountOpen && 'rotate-180',
                                    )}
                                />
                            </button>

                            {accountOpen && (
                                <div
                                    id="header-account-menu"
                                    role="menu"
                                    aria-label="Аккаунт"
                                    className="absolute right-0 top-full z-50 mt-2 w-56 animate-scale-in overflow-hidden rounded-2xl border border-border bg-bg-elevated py-2 shadow-xl shadow-black/50"
                                >
                                    {user === null ? (
                                        <>
                                            <MenuLink href={routes.login} onSelect={() => setAccountOpen(false)}>
                                                Войти
                                            </MenuLink>
                                            <MenuLink href={routes.register} onSelect={() => setAccountOpen(false)}>
                                                Регистрация
                                            </MenuLink>
                                        </>
                                    ) : (
                                        <>
                                            <p className="px-4 pb-2 pt-1 text-xs text-text-secondary">
                                                {user.name}
                                            </p>
                                            <div className="my-1 border-t border-border" role="separator" />
                                            <MenuLink href={cabinetHref} onSelect={() => setAccountOpen(false)}>
                                                {user.role === 'client' ? 'Личный кабинет' : 'Панель управления'}
                                            </MenuLink>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={logout}
                                                className="block w-full px-4 py-2.5 text-left text-sm text-text-secondary transition-all duration-300 hover:bg-bg-secondary hover:text-accent"
                                            >
                                                Выйти
                                            </button>
                                        </>
                                    )}

                                    <div className="my-1 border-t border-border" role="separator" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setAccountOpen(false);
                                            openCallback();
                                        }}
                                        className="block w-full px-4 py-2.5 text-left text-sm text-text-secondary transition-all duration-300 hover:bg-bg-secondary hover:text-accent"
                                    >
                                        Заказать звонок
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Открыть меню"
                            aria-expanded={mobileOpen}
                            className="rounded-full border border-border p-2.5 text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
                        >
                            <MenuIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                settings={siteSettings}
                user={user}
                onCallback={openCallback}
            />
        </>
    );
}

/** Dropdown entry with consistent styling for links and buttons. */
function MenuLink({
    href,
    onSelect,
    children,
}: {
    href: string;
    onSelect: () => void;
    children: string;
}) {
    return (
        <Link
            href={href}
            role="menuitem"
            onClick={onSelect}
            className="block px-4 py-2.5 text-sm text-text-secondary transition-all duration-300 hover:bg-bg-secondary hover:text-accent"
        >
            {children}
        </Link>
    );
}

export default Header;
