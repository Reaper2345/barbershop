import type { AppointmentStatus, Category, ReviewLike, Role } from '@/types';

/*
|--------------------------------------------------------------------------
| Panel types (master + admin)
|--------------------------------------------------------------------------
| Shapes returned by the PROMPT 5 controllers. Two families:
|
|   - *.Row types mirror the paginated envelopes from Controller::paginated(),
|     i.e. the raw array form of an Eloquent model (decimal casts are strings).
|   - MasterAppointmentRow / AdminAppointmentRow mirror AppointmentResource,
|     which the appointment endpoints use instead (numbers, labels, flags).
*/

/** `time_off` row from App\Models\TimeOff. */
export interface TimeOffRow {
    id: number;
    master_id: number;
    /** `date` cast → "2025-03-12T00:00:00.000000Z". */
    date: string;
    reason: string | null;
    created_at?: string;
}

/** One element of ScheduleController@edit's `days` prop. */
export interface MasterScheduleDay {
    weekday: number;
    label: string;
    is_active: boolean;
    /** "HH:MM" (seconds already stripped by the controller). */
    start_time: string;
    end_time: string;
    break_start: string | null;
    break_end: string | null;
}

/** MasterServiceController@index row: catalogue + this master's overrides. */
export interface MasterServiceRow {
    id: number;
    name: string;
    category: string | null;
    base_price_min: number;
    base_price_max: number;
    base_price_label: string;
    base_duration_min: number;
    /** null ⇒ inherit the catalogue value. */
    price_min: number | null;
    price_max: number | null;
    duration_min: number | null;
    is_active: boolean;
}

/** MasterDashboardController@index `stats`. */
export interface MasterDashboardStats {
    today_total?: number;
    pending?: number;
    upcoming?: number;
    completed?: number;
    reviews?: number;
    rating?: number;
    /** Approved reviews only, plus the public /reviews link for this master. */
    reviews_count?: number;
    reviews_url?: string;
    /** Added in PROMPT 5 for the week/revenue cards. */
    week_total?: number;
    week_revenue?: number | null;
}

/** A row of the master's queue (AppointmentResource shape, trimmed). */
export interface MasterAppointmentRow {
    id: number;
    status: AppointmentStatus;
    status_label?: string;
    starts_at: string | null;
    ends_at?: string | null;
    starts_at_label?: string | null;
    date_label?: string | null;
    time_label?: string | null;
    duration_min?: number | null;
    client_comment: string | null;
    photo_url: string | null;
    master_comment: string | null;
    master_price_min: number | null;
    master_price_max: number | null;
    master_price_offer: number | null;
    final_price_label?: string | null;
    client?: {
        id: number;
        name: string;
        phone: string | null;
        email: string;
    };
    service?: {
        id: number;
        name: string;
        duration_min: number;
        base_price_min: number | string;
        base_price_max: number | string;
    };
}

/** `statuses` prop used by the admin appointment filters and modals. */
export interface StatusOption {
    value: AppointmentStatus;
    label: string;
}

/*
|--------------------------------------------------------------------------
| Admin dashboard
|--------------------------------------------------------------------------
*/

/**
 * One metric across four periods, matching the brief's table:
 * | Метрика | Сегодня | Неделя | Месяц | Всего |
 */
export interface AdminMetricRow {
    key: string;
    label: string;
    today: number;
    week: number;
    month: number;
    total: number;
    /** Revenue rows are money, not counts. */
    format?: 'count' | 'money';
    tone?: 'neutral' | 'accent' | 'danger' | 'success';
}

export interface AdminTopMasterRow {
    id: number;
    name: string;
    appointments_count: number;
    revenue: number;
    rating: number;
}

/** Compact row for "Последние 10 записей". */
export interface AdminRecentAppointmentRow {
    id: number;
    starts_at: string | null;
    date_label?: string | null;
    time_label?: string | null;
    client?: { id: number; name: string } | null;
    master?: { id: number; name: string | null } | null;
    service?: { id: number; name: string } | null;
    status: AppointmentStatus;
    status_label?: string;
    price_label: string | null;
}

export interface AdminDashboardStats {
    masters_total?: number;
    masters_active?: number;
    services_total?: number;
    categories_total?: number;
    users_total?: number;
    clients_total?: number;
    appointments_total?: number;
    appointments_today?: number;
    appointments_pending?: number;
    appointments_upcoming?: number;
    reviews_total?: number;
    reviews_pending?: number;
    pages_total?: number;
    /** Added in PROMPT 5 for the metric table. */
    metrics?: AdminMetricRow[];
    topMasters?: AdminTopMasterRow[];
}

/*
|--------------------------------------------------------------------------
| Admin CRUD rows
|--------------------------------------------------------------------------
*/

export interface AdminMasterRow {
    id: number;
    user_id: number;
    bio: string | null;
    photo: string | null;
    experience_years: number;
    /** decimal cast ⇒ string. */
    rating: string;
    is_active: boolean;
    created_at?: string;
    user?: { id: number; name: string; email: string; phone: string | null };
    appointments_count?: number;
    reviews_count?: number;
    services_count?: number;
}

export interface AdminServiceRow {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    base_price_min: string;
    base_price_max: string;
    duration_min: number;
    is_active: boolean;
    category?: Category;
    masters_count?: number;
}

export interface AdminCategoryRow {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    services_count?: number;
}

export interface AdminPageRow {
    id: number;
    slug: string;
    title: string;
    content: string;
    is_published: boolean;
    updated_at?: string;
}

export interface AdminUserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    avatar: string | null;
    created_at: string;
    master?: { id: number } | null;
    appointments_count?: number;
}

export interface AdminReviewRow {
    id: number;
    rating: number;
    text: string | null;
    /** Optional client photo, surfaced by ReviewResource. */
    photo_path?: string | null;
    photo_url?: string | null;
    is_approved: boolean;
    created_at: string;
    client?: { id: number; name: string } | null;
    master?: { id: number; name?: string | null; user?: { name: string } } | null;
    appointment?: { service?: { name: string } | null } | null;
}

/** `settings` prop of Admin/Settings/Edit. */
export interface SettingRow {
    key: string;
    value: string | null;
    group: string;
}

/** Envelope emitted by Controller::paginated(). */
export interface PaginatedEnvelope<T> {
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
    rows: T[];
}

/** Narrows a `Paginated<ReviewLike>` union for the review table. */
export type AdminReviewLike = ReviewLike;

/*
|--------------------------------------------------------------------------
| Portfolio
|--------------------------------------------------------------------------
*/

/** One showcase work, as serialised by every portfolio controller. */
export interface PortfolioItemRow {
    id: number;
    master_id: number;
    title: string | null;
    description: string | null;
    /** "portfolio/01.svg" (bundled) or "portfolio/uploads/x.png" (storage). */
    photo_path: string;
    sort_order: number;
    is_published: boolean;
    created_at?: string;
    /** Present on the public wall and in both panel lists. */
    master?: {
        id: number;
        name?: string | null;
        photo?: string | null;
        user?: { id: number; name: string; email?: string } | null;
    } | null;
}

/** A master chip on the public wall, with how many works they published. */
export interface PortfolioMasterChip {
    id: number;
    name: string;
    /** Raw storage path; resolve with masterPhoto(). */
    photo_url: string | null;
    items_count: number;
}
