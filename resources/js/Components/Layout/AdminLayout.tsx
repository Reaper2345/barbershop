import { useState, type ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CloseIcon, MenuIcon, UserIcon } from '@/lib/icons';
import { routes } from '@/lib/routes';
import { cn, initials } from '@/lib/format';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| AdminLayout
|--------------------------------------------------------------------------
| Shell for the admin and master areas: fixed sidebar with grouped navigation,
| topbar with breadcrumbs and the user block, and the page content. Built now
| (PROMPT 3 deliverable) but only consumed by the panel pages of PROMPT 4-5,
| which is why the navigation items are props rather than hardcoded routes.
*/

export interface AdminNavItem {
    label: string;
    href: string;
    /** Optional leading icon element. */
    icon?: ReactNode;
    /** Set on the item that matches the current URL. */
    active?: boolean;
    /** Renders a small count pill, e.g. pending appointments. */
    badge?: number | string;
}

export interface AdminNavGroup {
    title: string;
    items: AdminNavItem[];
}

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    /** Optional page description under the H1. */
    subtitle?: string;
    /** Trailing element on the title row, usually an action button. */
    actions?: ReactNode;
    nav: AdminNavGroup[];
    breadcrumbs?: Breadcrumb[];
    /** Extra badges shown in the topbar (notifications count etc.). */
    notificationCount?: number;
}

export function AdminLayout({
    children,
    title,
    subtitle,
    actions,
    nav,
    breadcrumbs = [],
    notificationCount,
}: AdminLayoutProps) {
    const { auth, siteSettings } = usePage<SharedProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = auth.user;
    const siteName = siteSettings.site_name ?? 'Барбершоп';

    const logout = (): void => {
        router.post(routes.logout);
    };

    return (
        <div className="min-h-screen bg-bg-primary">
            <Head title={title} />

            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 w-72 shrink-0 overflow-y-auto border-r border-border bg-bg-secondary',
                        'transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    )}
                    aria-label="Боковое меню"
                >
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                        <Link
                            href={routes.home}
                            className="flex flex-col leading-none"
                            aria-label={`${siteName} — на главную`}
                        >
                            <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
                                {siteName}
                            </span>
                            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-text-secondary">
                                Панель
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Закрыть меню"
                            className="rounded-full p-2 text-text-secondary transition-all duration-300 hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="space-y-8 px-4 py-6" aria-label="Навигация панели">
                        {nav.map((group) => (
                            <div key={group.title}>
                                <p className="px-3 pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                                    {group.title}
                                </p>

                                <ul className="space-y-1">
                                    {group.items.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                aria-current={item.active === true ? 'page' : undefined}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300',
                                                    item.active === true
                                                        ? 'bg-bg-elevated text-accent'
                                                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                                                )}
                                            >
                                                {item.icon !== undefined && (
                                                    <span
                                                        className="shrink-0 [&>svg]:h-4 [&>svg]:w-4"
                                                        aria-hidden="true"
                                                    >
                                                        {item.icon}
                                                    </span>
                                                )}

                                                <span className="flex-1">{item.label}</span>

                                                {item.badge !== undefined && (
                                                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Backdrop for the mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 animate-fade-in bg-black/70 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Main column */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur">
                        {/* Same horizontal steps AND the same max width as
                            <main>, so the breadcrumb sits exactly above the page
                            heading at every viewport — the content is centred
                            once the column is wider than the cap. */}
                        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Открыть меню"
                                aria-expanded={sidebarOpen}
                                className="rounded-full border border-border p-2 text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
                            >
                                <MenuIcon className="h-5 w-5" />
                            </button>

                            {/* Breadcrumbs */}
                            <nav aria-label="Хлебные крошки" className="min-w-0 flex-1">
                                <ol className="flex items-center gap-2 overflow-hidden text-sm">
                                    {breadcrumbs.map((crumb, index) => {
                                        const isLast = index === breadcrumbs.length - 1;

                                        return (
                                            <li
                                                key={`${crumb.label}-${index}`}
                                                className="flex min-w-0 items-center gap-2"
                                            >
                                                {crumb.href !== undefined && !isLast ? (
                                                    <Link
                                                        href={crumb.href}
                                                        className="truncate text-text-secondary transition-all duration-300 hover:text-accent"
                                                    >
                                                        {crumb.label}
                                                    </Link>
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            'truncate',
                                                            isLast ? 'text-text-primary' : 'text-text-secondary',
                                                        )}
                                                        aria-current={isLast ? 'page' : undefined}
                                                    >
                                                        {crumb.label}
                                                    </span>
                                                )}

                                                {!isLast && (
                                                    <span className="text-border" aria-hidden="true">
                                                        /
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>

                            {/* User block */}
                            <div className="flex items-center gap-3">
                                {notificationCount !== undefined && notificationCount > 0 && (
                                    <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                                        {notificationCount}
                                    </span>
                                )}

                                <span className="hidden text-right text-xs leading-tight sm:block">
                                    <span className="block font-medium text-text-primary">
                                        {user?.name ?? 'Гость'}
                                    </span>
                                    <span className="block text-text-secondary">
                                        {roleLabel(user?.role)}
                                    </span>
                                </span>

                                <span
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated text-xs font-medium text-accent"
                                    aria-hidden="true"
                                >
                                    {user !== null && user !== undefined ? initials(user.name) : (
                                        <UserIcon className="h-4 w-4" />
                                    )}
                                </span>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="hidden text-xs text-text-secondary transition-all duration-300 hover:text-accent sm:block"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                        {/*
                         * max-w-7xl rather than 6xl: the admin tables (services,
                         * appointments) were cramped at 1152px on a large screen,
                         * and the extra 128px goes straight to the data columns.
                         */}
                        <div className="mx-auto w-full max-w-7xl">
                            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                                        {title}
                                    </h1>

                                    {subtitle !== undefined && (
                                        <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
                                    )}
                                </div>

                                {actions !== undefined && (
                                    <div className="flex items-center gap-3">{actions}</div>
                                )}
                            </div>

                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function roleLabel(role: string | undefined): string {
    switch (role) {
        case 'admin':
            return 'Администратор';
        case 'master':
            return 'Мастер';
        case 'client':
            return 'Клиент';
        default:
            return 'Не авторизован';
    }
}

export default AdminLayout;
