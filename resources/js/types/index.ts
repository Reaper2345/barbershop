/// <reference types="vite/client" />

import type { Page, PageProps } from '@inertiajs/core';

/*
|--------------------------------------------------------------------------
| Domain models
|--------------------------------------------------------------------------
|
| Every interface below describes the exact JSON Laravel's Eloquent models
| serialise to for the public controllers: `decimal:2` casts arrive as
| strings, `int` casts as numbers, and dates as ISO 8601 strings. Keeping them
| in one file lets every page and layout agree on a single source of truth.
|
*/

export type UserRole = 'admin' | 'master' | 'client';

/** Alias kept for the admin components, which talk about roles a lot. */
export type Role = UserRole;

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'done'
    | 'cancelled';

/** A user, as exposed through `auth.user` and on review/booking payloads. */
export interface User {
    id: number;
    name: string;
    role: UserRole;
    avatar: string | null;

    // Present on cabinet payloads, absent from the shared auth object.
    email?: string;
    phone?: string | null;
    created_at?: string;
    appointments_count?: number;
    reviews_count?: number;
}

/** The `auth` key shared with every response. */
export interface Auth {
    user: User | null;
    /** Master profile id — null for clients and admins. */
    master_id: number | null;
}

/** Backwards-compatible alias kept for the PROMPT 1 smoke page. */
export type AuthUser = User;

/** Per-master overrides carried by the `master_service` pivot. */
export interface MasterServicePivot {
    master_id: number;
    service_id: number;
    price_min: string | null;
    price_max: string | null;
    duration_min: number | null;
    is_active: boolean;
}

export interface Service {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    /** Decimal cast — arrives as a string, e.g. "1500.00". */
    base_price_min: string;
    base_price_max: string;
    /** Server-rendered label, e.g. "1 500–2 500 ₽". */
    base_price_label?: string;
    duration_min: number;
    is_active: boolean;
    category?: CategorySummary;
    pivot?: MasterServicePivot | null;
}

export interface CategorySummary {
    id: number;
    name: string;
    slug: string;
}

export interface Category extends CategorySummary {
    sort_order: number;
    services?: Service[];
    services_count?: number;
}

export interface Master {
    id: number;
    user_id: number;
    /** Present on MasterResource (the related user's name), absent on raw models. */
    name?: string | null;
    bio: string | null;
    /** Storage-relative path, e.g. "masters/ivan-sokolov.jpg". */
    photo: string | null;
    experience_years: number;
    /** Decimal cast — arrives as a string, e.g. "4.67". */
    rating: string;
    is_active: boolean;
    created_at?: string;

    /** Eager-loaded by every public master query. */
    user?: User;
    services?: Service[];
    schedules?: Schedule[];
    reviews?: Review[];

    /** Populated by `withCount('reviews')`. */
    reviews_count?: number;
}

export interface Schedule {
    id: number;
    master_id: number;
    /** 0 = Sunday … 6 = Saturday. */
    weekday: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

export interface Appointment {
    id: number;
    client_id: number;
    master_id: number;
    service_id: number;
    starts_at: string;
    ends_at: string;
    status: AppointmentStatus;
    client_comment: string | null;
    photo_path: string | null;
    master_price_min: string | null;
    master_price_max: string | null;
    master_price_offer: string | null;
    master_comment: string | null;
    final_price_label?: string | null;
    created_at?: string;
    master?: Master;
    service?: Service;
    client?: User;
    review?: Review | null;
}

export interface Review {
    id: number;
    client_id: number;
    master_id: number;
    appointment_id: number;
    rating: number;
    text: string | null;
    is_approved: boolean;
    /** Optional client photo of the result. */
    photo_path?: string | null;
    photo_url?: string | null;
    /** ISO 8601 timestamp. */
    created_at: string;

    client?: User;
    master?: Master;
}

/**
 * ReviewResource is the shape the master detail page paginates. It differs
 * from the raw model in three ways: `client` always exists (possibly with a
 * null name), `master` may be omitted when the relation is not loaded, and
 * the date arrives both as ISO 8601 and pre-formatted.
 */
export interface ServerReview {
    id: number;
    rating: number;
    text: string | null;
    is_approved: boolean;
    /** Optional client photo of the result. */
    photo_path?: string | null;
    photo_url?: string | null;
    created_at: string | null;
    created_at_label?: string | null;
    client?: {
        id: number;
        name: string | null;
        avatar: string | null;
    };
    master?: Master;
}

/** Anything either review shape can be rendered from. */
export type ReviewLike = Review | ServerReview;

export interface Setting {
    id: number;
    key: string;
    value: string | null;
    group: string;
}

/**
 * The `siteSettings` prop: a flat `key => value` map produced by
 * `Setting::allCached()`. Values are strings, or null when a stored key has no
 * value; they are never arrays.
 */
export type SiteSettings = Record<string, string | null>;

export interface PageContent {
    id: number;
    slug: string;
    title: string;
    /** HTML authored in the admin panel; sanitised before rendering. */
    content: string;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

/** Alias so pages can `import type { Page as CmsPage }`. */
export type { PageContent as Page };

/*
|--------------------------------------------------------------------------
| Inertia plumbing
|--------------------------------------------------------------------------
*/

export interface FlashMessages {
    success: string | null;
    error: string | null;
    status: string | null;
}

export interface NotificationItem {
    id: string;
    data: Record<string, unknown>;
    created_at: string | null;
}

/**
 * Props available on every Inertia response.
 *
 * The index signature is required so this interface can be merged into
 * Inertia's own PageProps declaration.
 */
export interface SharedProps {
    auth: Auth;
    flash: FlashMessages;
    siteSettings: SiteSettings;
    notifications: NotificationItem[];
    [key: string]: unknown;
}

declare module '@inertiajs/core' {
    interface PageProps extends SharedProps {}
}

declare module '@inertiajs/react' {
    interface PageProps extends SharedProps {}
}

declare global {
    interface Window {
        __DSH_BOOT__?: unknown;
        axios: typeof import('axios').default;
    }
}

/*
|--------------------------------------------------------------------------
| Laravel pagination
|--------------------------------------------------------------------------
*/

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

/**
 * Pagination and EmptyState receive props that are either a paginator or a
 * plain array, so the union has to be narrowed at runtime rather than by a
 * cast at the call site.
 */
export function isPaginated<T>(
    value: Paginated<T> | T[] | undefined,
): value is Paginated<T> {
    return (
        value !== undefined &&
        !Array.isArray(value) &&
        Array.isArray(value.data) &&
        typeof value.last_page === 'number' &&
        Array.isArray(value.links)
    );
}

export type InertiaPage = Page;
export type { PageProps };

/**
 * Booking-flow and cabinet payloads live in ./booking.ts to keep this file
 * focused on models and Inertia plumbing; re-exported so every page can keep
 * importing from '@/types'.
 */
export type {
    BookingSlot,
    SlotsResponse,
    SlotApiError,
    CabinetAppointment,
    CabinetStatus,
    CabinetStats,
    PriceState,
    ResourceMaster,
    ResourceService,
} from './booking';

export { priceState, canBeReviewed, masterName } from './booking';

/**
 * Panel payloads (master dashboard + admin CRUD) live in ./panel.ts.
 */
export type {
    TimeOffRow,
    MasterScheduleDay,
    MasterServiceRow,
    MasterDashboardStats,
    MasterAppointmentRow,
    StatusOption,
    AdminMetricRow,
    AdminTopMasterRow,
    AdminRecentAppointmentRow,
    AdminDashboardStats,
    AdminMasterRow,
    AdminServiceRow,
    AdminCategoryRow,
    AdminPageRow,
    AdminUserRow,
    AdminReviewRow,
    SettingRow,
    PaginatedEnvelope,
    AdminReviewLike,
    PortfolioItemRow,
    PortfolioMasterChip,
} from './panel';
