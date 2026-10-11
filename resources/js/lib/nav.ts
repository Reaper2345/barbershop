import { routes } from './routes';

/*
|--------------------------------------------------------------------------
| Panel navigation
|--------------------------------------------------------------------------
| Sidebar definitions for AdminLayout. Kept out of the layouts themselves so
| every admin page does not have to rebuild the same array, and so the active
| state is computed in exactly one place.
*/

export interface PanelNavItem {
    label: string;
    href: string;
    /** Extra path prefixes that also mark this item active. */
    match?: string[];
    /** Count pill, e.g. pending reviews. */
    badge?: number;
}

export interface PanelNavGroup {
    title: string;
    items: PanelNavItem[];
}

/** True when `path` belongs to `href` (used for the active sidebar state). */
export function isPanelItemActive(path: string, href: string, match: string[] = []): boolean {
    const clean = path.split('?')[0] ?? '/';

    if (clean === href) {
        return true;
    }

    if (clean.startsWith(`${href}/`)) {
        return true;
    }

    return match.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

/* ------------------------------------------------------------------ */
/* Master                                                              */
/* ------------------------------------------------------------------ */

export const masterNav: PanelNavGroup[] = [
    {
        title: 'Работа',
        items: [
            { label: 'Обзор', href: routes.masterArea.dashboard },
            { label: 'Записи', href: routes.masterArea.appointments() },
            { label: 'График работы', href: routes.masterArea.schedule },
            { label: 'Мои услуги', href: routes.masterArea.services },
            // Showcase works: photo, title, description, publish toggle.
            { label: 'Портфолио', href: routes.masterArea.portfolio },
            // Self-service profile: photo, bio and experience (POST/PUT
            // /master/profile). Last, as the personal-settings entry.
            { label: 'Профиль', href: routes.masterArea.profile },
        ],
    },
];

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export interface AdminNavCounts {
    masters?: number;
    services?: number;
    categories?: number;
    appointmentsPending?: number;
    reviewsPending?: number;
    pages?: number;
    users?: number;
    portfolio?: number;
}

/**
 * Admin sidebar with live counters where the dashboard supplies them.
 *
 * `/admin/masters` and `/admin/services` also match their `create`/`{id}/edit`
 * children so the item stays highlighted while editing.
 */
export function buildAdminNav(counts: AdminNavCounts = {}): PanelNavGroup[] {
    return [
        {
            title: 'Обзор',
            items: [{ label: 'Панель управления', href: routes.admin.dashboard }],
        },
        {
            title: 'Каталог',
            items: [
                {
                    label: 'Мастера',
                    href: routes.admin.masters,
                    match: ['/admin/masters'],
                    badge: counts.masters,
                },
                {
                    label: 'Услуги',
                    href: routes.admin.services,
                    match: ['/admin/services'],
                    badge: counts.services,
                },
                {
                    label: 'Категории',
                    href: routes.admin.categories,
                    match: ['/admin/categories'],
                    badge: counts.categories,
                },
                {
                    label: 'Портфолио',
                    href: routes.admin.portfolio(),
                    match: ['/admin/portfolio'],
                    badge: counts.portfolio,
                },
            ],
        },
        {
            title: 'Клиенты',
            items: [
                {
                    label: 'Записи',
                    href: routes.admin.appointments(),
                    match: ['/admin/appointments'],
                    badge: counts.appointmentsPending,
                },
                {
                    label: 'Отзывы',
                    href: routes.admin.reviews(),
                    match: ['/admin/reviews'],
                    badge: counts.reviewsPending,
                },
                {
                    label: 'Пользователи',
                    href: routes.admin.users(),
                    match: ['/admin/users'],
                    badge: counts.users,
                },
            ],
        },
        {
            title: 'Контент',
            items: [
                {
                    label: 'Страницы',
                    href: routes.admin.pages,
                    match: ['/admin/pages'],
                    badge: counts.pages,
                },
                {
                    label: 'Настройки',
                    href: routes.admin.settings,
                    match: ['/admin/settings'],
                },
            ],
        },
    ];
}

/** Sidebar group used by every admin page except the dashboard itself. */
export const adminNav: PanelNavGroup[] = buildAdminNav();
