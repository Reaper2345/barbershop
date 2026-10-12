/*
|--------------------------------------------------------------------------
| URL catalogue
|--------------------------------------------------------------------------
| The backend (PROMPT 2) registered named routes but did not install Ziggy, so
| URLs are declared here once rather than being typed as string literals inside
| components. Every href on the site comes from this object, which keeps a
| future `route()` helper a single-file swap.
*/

import type { AppointmentStatus } from '@/types';

export const routes = {
    home: '/',
    masters: '/masters',
    master: (id: number | string): string => `/masters/${id}`,
    services: '/services',
    /** Public review wall, optionally filtered by master. */
    reviews: (masterId?: number | string): string =>
        masterId === undefined || masterId === ''
            ? '/reviews'
            : `/reviews?master=${masterId}`,
    /** Public portfolio wall, optionally filtered by master. */
    portfolio: (masterId?: number | string): string =>
        masterId === undefined || masterId === ''
            ? '/portfolio'
            : `/portfolio?master=${masterId}`,
    about: '/about',
    contacts: '/contacts',

    /**
     * CMS pages served by the /{slug} catch-all. Only the slugs the app links
     * to on its own are listed; anything else is built ad hoc.
     */
    pages: {
        privacy: '/privacy',
    },

    booking: (params?: { master?: number | string; service?: number | string }): string => {
        const query = new URLSearchParams();

        // Parameter names match what BookingController@create reads
        // ($request->integer('master_id') / 'service_id'), so a link from the
        // public site lands on a wizard that is already pre-filled, with the
        // master's services and the day's slots resolved server-side.
        if (params?.master !== undefined) {
            query.set('master_id', String(params.master));
        }

        if (params?.service !== undefined) {
            query.set('service_id', String(params.service));
        }

        const search = query.toString();

        return search === '' ? '/booking' : `/booking?${search}`;
    },

    /**
     * Registered in PROMPT 5. Declared here so the header can render the link
     * before the auth controllers exist.
     */
    login: '/login',
    register: '/register',

    /** Authenticated client area. */
    cabinet: '/cabinet',
    cabinetAppointments: (status?: AppointmentFilter): string =>
        status === undefined || status === 'all'
            ? '/cabinet/appointments'
            : `/cabinet/appointments?status=${status}`,
    cabinetCancel: (id: number | string): string =>
        `/cabinet/appointments/${id}/cancel`,
    cabinetReviews: '/cabinet/reviews',

    logout: '/logout',

    /** "Заказать звонок" — LeadController@store. */
    callRequest: '/call-request',

    /**
     * Slot lookup for the booking wizard. Implemented as a web route returning
     * JSON (see routes/web.php) so it rides on the session guard and the CSRF
     * token — an API-guard route would not see the logged-in Inertia user.
     */
    slots: '/api/slots',

    /*
    |----------------------------------------------------------------------
    | Master area — prefix /master, role:master (routes/web.php)
    |----------------------------------------------------------------------
    | Paths mirror the controller render names so no page needs a shim:
    | ScheduleController@edit → Master/Schedule, MasterServiceController@index
    | → Master/Services, MasterAppointmentController@index → Master/Appointments.
    */
    masterArea: {
        dashboard: '/master/dashboard',
        schedule: '/master/schedule',
        timeOff: '/master/time-off',
        /** Quick actions (отпуск / выходной / больничный): one call, a date range. */
        timeOffBulk: '/master/time-off/bulk',
        timeOffDelete: (id: number | string): string => `/master/time-off/${id}`,
        services: '/master/services',
        service: (id: number | string): string => `/master/services/${id}`,
        /**
         * Self-service profile. The update is a POST carrying `_method: 'put'`
         * because the payload may be multipart and PHP only parses multipart
         * bodies on POST — see Master/Profile/Edit.tsx.
         */
        profile: '/master/profile',
        /** Master's own showcase works (all items, published or not). */
        portfolio: '/master/portfolio',
        portfolioCreate: '/master/portfolio/create',
        portfolioEdit: (id: number | string): string => `/master/portfolio/${id}/edit`,
        portfolioItem: (id: number | string): string => `/master/portfolio/${id}`,
        portfolioToggle: (id: number | string): string => `/master/portfolio/${id}/toggle`,
        appointments: (status?: string): string =>
            status === undefined || status === ''
                ? '/master/appointments'
                : `/master/appointments?status=${status}`,
        appointmentConfirm: (id: number | string): string =>
            `/master/appointments/${id}/confirm`,
        appointmentReject: (id: number | string): string =>
            `/master/appointments/${id}/reject`,
        appointmentStatus: (id: number | string): string =>
            `/master/appointments/${id}/status`,
    },

    /*
    |----------------------------------------------------------------------
    | Admin area — prefix /admin, role:admin (routes/web.php)
    |----------------------------------------------------------------------
    */
    admin: {
        dashboard: '/admin',

        masters: '/admin/masters',
        mastersCreate: '/admin/masters/create',
        masterEdit: (id: number | string): string => `/admin/masters/${id}/edit`,
        master: (id: number | string): string => `/admin/masters/${id}`,

        services: '/admin/services',
        servicesCreate: '/admin/services/create',
        serviceEdit: (id: number | string): string => `/admin/services/${id}/edit`,
        service: (id: number | string): string => `/admin/services/${id}`,

        categories: '/admin/categories',
        categoriesCreate: '/admin/categories/create',
        categoryEdit: (id: number | string): string => `/admin/categories/${id}/edit`,
        category: (id: number | string): string => `/admin/categories/${id}`,

        portfolio: (masterId?: number | string): string =>
            masterId === undefined || masterId === ''
                ? '/admin/portfolio'
                : `/admin/portfolio?master=${masterId}`,
        portfolioCreate: '/admin/portfolio/create',
        portfolioEdit: (id: number | string): string => `/admin/portfolio/${id}/edit`,
        portfolioItem: (id: number | string): string => `/admin/portfolio/${id}`,
        portfolioToggle: (id: number | string): string => `/admin/portfolio/${id}/toggle`,

        appointments: (params?: {
            status?: string;
            masterId?: number | string;
            date?: string;
            search?: string;
            /** Allow-listed sort key: starts_at | created_at | cost | status | id. */
            sort?: string;
            dir?: 'asc' | 'desc';
        }): string => {
            const query = new URLSearchParams();

            if (params?.status !== undefined && params.status !== '') {
                query.set('status', params.status);
            }

            if (params?.masterId !== undefined && params.masterId !== '') {
                query.set('master_id', String(params.masterId));
            }

            if (params?.date !== undefined && params.date !== '') {
                query.set('date', params.date);
            }

            if (params?.search !== undefined && params.search !== '') {
                query.set('search', params.search);
            }

            if (params?.sort !== undefined && params.sort !== '') {
                query.set('sort', params.sort);
                query.set('dir', params.dir === 'asc' ? 'asc' : 'desc');
            }

            const search = query.toString();

            return search === '' ? '/admin/appointments' : `/admin/appointments?${search}`;
        },
        appointment: (id: number | string): string => `/admin/appointments/${id}`,

        reviews: (approved?: 'yes' | 'no' | ''): string =>
            approved === undefined || approved === ''
                ? '/admin/reviews'
                : `/admin/reviews?approved=${approved}`,
        reviewApprove: (id: number | string): string => `/admin/reviews/${id}/approve`,
        reviewUnapprove: (id: number | string): string => `/admin/reviews/${id}/unapprove`,
        review: (id: number | string): string => `/admin/reviews/${id}`,

        settings: '/admin/settings',

        pages: '/admin/pages',
        pagesCreate: '/admin/pages/create',
        pageEdit: (id: number | string): string => `/admin/pages/${id}/edit`,
        page: (id: number | string): string => `/admin/pages/${id}`,
        /** SEO-only PATCH used by the modal in the pages list. */
        pageSeo: (slug: number | string): string => `/admin/pages/${slug}/seo`,

        users: (params?: { role?: string; search?: string }): string => {
            const query = new URLSearchParams();

            if (params?.role !== undefined && params.role !== '') {
                query.set('role', params.role);
            }

            if (params?.search !== undefined && params.search !== '') {
                query.set('search', params.search);
            }

            const search = query.toString();

            return search === '' ? '/admin/users' : `/admin/users?${search}`;
        },
        user: (id: number | string): string => `/admin/users/${id}`,
    },
} as const;

/** Status filter accepted by GET /cabinet/appointments. */
export type AppointmentFilter =
    | 'all'
    | 'active'
    | 'history'
    | 'cancelled'
    | AppointmentStatus;

/** Booking wizard steps, in order. */
export const BOOKING_STEPS = [
    { id: 1, label: 'Услуга' },
    { id: 2, label: 'Мастер' },
    { id: 3, label: 'Время' },
    { id: 4, label: 'Подтверждение' },
] as const;

/**
 * Primary navigation. Kept next to `routes` so the header, the mobile drawer
 * and the footer never drift apart.
 */
export interface NavItem {
    href: string;
    label: string;
    /** Extra path prefixes that should mark the item as active. */
    match?: string[];
}

/**
 * Public header/footer navigation, in the order the owner asked for:
 * О нас — Услуги — Мастера — Портфолио — Контакты.
 *
 * «Главная» is the logo link and «Отзывы» is linked from the home page, the
 * master dashboard and the review form, so neither needs a header slot.
 */
export const primaryNav: NavItem[] = [
    { href: routes.about, label: 'О нас' },
    { href: routes.services, label: 'Услуги' },
    { href: routes.masters, label: 'Мастера' },
    { href: routes.portfolio(), label: 'Портфолио' },
    { href: routes.contacts, label: 'Контакты' },
];

/** True when `path` belongs to `item` (used for the active nav state). */
export function isNavActive(currentUrl: string, item: NavItem): boolean {
    // `usePage().url` includes the query string and may arrive without a leading
    // slash; normalise both so a comparison can never silently mismatch.
    const withSlash = currentUrl.startsWith('/') ? currentUrl : `/${currentUrl}`;
    const path = withSlash.split('?')[0]?.split('#')[0] ?? '/';

    // "/" would prefix-match everything, so the home item is exact-match only.
    if (item.href === '/') {
        return path === '/';
    }

    // Trailing-slash tolerant: "/masters/" should still highlight "Мастера".
    const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

    if (normalized === item.href || normalized.startsWith(`${item.href}/`)) {
        return true;
    }

    return (item.match ?? []).some(
        (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    );
}
