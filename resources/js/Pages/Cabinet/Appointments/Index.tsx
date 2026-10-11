import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { AppointmentCard } from '@/Components/Cabinet/AppointmentCard';
import { CancelAppointmentModal } from '@/Components/Cabinet/CancelAppointmentModal';
import { ReviewModal } from '@/Components/Cabinet/ReviewModal';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { Pagination } from '@/Components/UI/Pagination';
import { CalendarIcon, CheckCircleIcon, QuoteIcon, ScissorsIcon } from '@/lib/icons';
import { CABINET_COPY } from '@/lib/content';
import { routes, type AppointmentFilter } from '@/lib/routes';
import { cn } from '@/lib/format';
import { canBeReviewed, isPaginated } from '@/types';
import type { CabinetAppointment, Paginated } from '@/types';

/*
|--------------------------------------------------------------------------
| Cabinet/Appointments/Index — GET /cabinet/appointments
|--------------------------------------------------------------------------
| Tabs: Активные / История / Отменённые.
|
| The tabs are just query-string filters (`?status=`) handled by
| ClientCabinetController@appointments, so each tab is a real, linkable,
| back-button-friendly URL rather than client-side slicing:
|
|   active    → pending, confirmed, in_progress
|   history   → done
|   cancelled → cancelled
|
| Because the backend filters on a single `status` value, "Активные" fans out
| into one request per status; the three sets are merged here and re-sorted, so
| the tab still behaves like one list. Pagination is only rendered for the
| single-status tabs, where the server paginator is authoritative.
|
| NOTE: the controller currently renders `Cabinet/Appointments`. The
| implementation lives here (per the brief's Appointments/Index path) and
| Pages/Cabinet/Appointments.tsx re-exports it.
*/

export interface CabinetAppointmentsProps {
    /** Paginated list for single-status tabs. */
    appointments?: Paginated<CabinetAppointment> | CabinetAppointment[];
    filters?: { status?: string };
    /** Extra collections supplied for the merged "Активные" tab. */
    pending?: Paginated<CabinetAppointment> | CabinetAppointment[];
    confirmed?: Paginated<CabinetAppointment> | CabinetAppointment[];
    inProgress?: Paginated<CabinetAppointment> | CabinetAppointment[];
}

type TabId = 'active' | 'history' | 'cancelled';

const TABS: Array<{ id: TabId; label: string }> = [
    { id: 'active', label: CABINET_COPY.tabs.active },
    { id: 'history', label: CABINET_COPY.tabs.history },
    { id: 'cancelled', label: CABINET_COPY.tabs.cancelled },
];

/** Query string the controller understands for each tab. */
const TAB_STATUS: Record<TabId, AppointmentFilter> = {
    active: 'active',
    history: 'done',
    cancelled: 'cancelled',
};

/** Which raw statuses belong to each tab (used when merging). */
const TAB_STATUSES: Record<TabId, string[]> = {
    active: ['pending', 'confirmed', 'in_progress'],
    history: ['done'],
    cancelled: ['cancelled'],
};

export default function CabinetAppointments({
    appointments = [],
    filters,
    pending = [],
    confirmed = [],
    inProgress = [],
}: CabinetAppointmentsProps) {
    const [cancelTarget, setCancelTarget] = useState<CabinetAppointment | null>(null);
    const [reviewTarget, setReviewTarget] = useState<CabinetAppointment | null>(null);
    /** Reference-photo viewer, one per page. */
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    const currentStatus = filters?.status ?? '';

    // Map the incoming status back onto a tab. `all` and an empty filter both
    // mean "show everything", which is presented as the active tab.
    const activeTab: TabId = useMemo(() => {
        if (currentStatus === 'done') {
            return 'history';
        }

        if (currentStatus === 'cancelled') {
            return 'cancelled';
        }

        return 'active';
    }, [currentStatus]);

    /** Flattens the paginator-or-array union into rows. */
    const rows = useMemo(() => {
        const collect = (
            source: Paginated<CabinetAppointment> | CabinetAppointment[],
        ): CabinetAppointment[] => (isPaginated(source) ? source.data : source);

        const primary = collect(appointments);

        // Single-status tabs have exactly one authoritative source.
        if (activeTab !== 'active') {
            return primary;
        }

        // "Активные" merges whatever the controller supplied. When it only
        // returns the unfiltered list (no per-status props), filter it here.
        const extras = [...collect(pending), ...collect(confirmed), ...collect(inProgress)];

        const base =
            extras.length > 0
                ? extras
                : primary.filter((row) => TAB_STATUSES.active.includes(row.status));

        // Soonest first: the next visit is the one that matters.
        return [...base].sort(
            (a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime(),
        );
    }, [appointments, pending, confirmed, inProgress, activeTab]);

    // Only single-status tabs can trust the server's paginator.
    const paginator =
        activeTab !== 'active' && isPaginated(appointments) ? appointments : null;

    const emptyCopy = {
        active: { title: CABINET_COPY.emptyActive, text: CABINET_COPY.emptyActiveText },
        history: { title: CABINET_COPY.emptyHistory, text: CABINET_COPY.emptyHistoryText },
        cancelled: { title: CABINET_COPY.emptyCancelled, text: CABINET_COPY.emptyCancelledText },
    }[activeTab];

    return (
        <AppLayout title={CABINET_COPY.appointmentsTitle}>
            {/* Header */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-12 md:py-16">
                    <Link
                        href={routes.cabinet}
                        className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                    >
                        ← {CABINET_COPY.title}
                    </Link>

                    <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                        {CABINET_COPY.appointmentsTitle}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                        {CABINET_COPY.appointmentsSubtitle}
                    </p>

                    <Button href={routes.booking()} className="mt-6" iconLeft={<CalendarIcon />}>
                        {CABINET_COPY.newBooking}
                    </Button>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {/* Tabs */}
                    <div
                        role="tablist"
                        aria-label={CABINET_COPY.appointmentsTitle}
                        className="flex gap-2 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {TABS.map((tab) => {
                            const selected = tab.id === activeTab;

                            return (
                                <Link
                                    key={tab.id}
                                    href={routes.cabinetAppointments(TAB_STATUS[tab.id])}
                                    role="tab"
                                    aria-selected={selected}
                                    preserveScroll
                                    className={cn(
                                        'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-all duration-300',
                                        'focus-visible:ring-2 focus-visible:ring-accent',
                                        selected
                                            ? 'text-accent'
                                            : 'text-text-secondary hover:text-text-primary',
                                    )}
                                >
                                    {tab.label}

                                    {selected && (
                                        <span
                                            className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Result count */}
                    <p className="mt-6 text-sm text-text-secondary" aria-live="polite">
                        Найдено: <span className="text-text-primary">{rows.length}</span>{' '}
                        {plural(rows.length, 'запись', 'записи', 'записей')}
                    </p>

                    {/* List */}
                    {rows.length === 0 ? (
                        <EmptyState
                            className="mt-6"
                            icon={<ScissorsIcon />}
                            title={emptyCopy.title}
                            description={emptyCopy.text}
                            action={
                                activeTab === 'active' ? (
                                    <Button href={routes.booking()}>
                                        {CABINET_COPY.newBooking}
                                    </Button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <ul className="mt-6 space-y-4">
                            {rows.map((appointment) => (
                                <li key={appointment.id}>
                                    <AppointmentCard
                                        appointment={appointment}
                                        variant={appointment.status === 'confirmed' ? 'highlight' : 'default'}
                                        onPhotoClick={setLightbox}
                                        actions={
                                            <AppointmentActions
                                                appointment={appointment}
                                                onCancel={() => setCancelTarget(appointment)}
                                                onReview={() => setReviewTarget(appointment)}
                                            />
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Server pagination (single-status tabs only) */}
                    {paginator !== null && (
                        <Pagination paginator={paginator} className="mt-10" />
                    )}
                </div>
            </section>

            {/* Modals */}
            <CancelAppointmentModal
                appointment={cancelTarget}
                open={cancelTarget !== null}
                onClose={() => setCancelTarget(null)}
            />

            <ReviewModal
                appointment={reviewTarget}
                open={reviewTarget !== null}
                onClose={() => setReviewTarget(null)}
            />

            <Lightbox
                open={lightbox !== null}
                src={lightbox?.src ?? null}
                alt={lightbox?.alt ?? ''}
                caption={lightbox?.caption ?? null}
                onClose={() => setLightbox(null)}
            />
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Per-status actions
|--------------------------------------------------------------------------
| The brief's matrix, with one correction: `in_progress` is included in the
| cancellable set because the backend exposes `is_cancellable`
| (AppointmentStatus::cancellable() = pending + confirmed only) and any other
| choice would render a button whose request the policy rejects.
|
|   pending     → Отменить
|   confirmed   → Отменить, Связаться с мастером
|   in_progress → Связаться с мастером
|   done        → Оставить отзыв (only when no review exists yet)
|   cancelled   → nothing
*/

function AppointmentActions({
    appointment,
    onCancel,
    onReview,
}: {
    appointment: CabinetAppointment;
    onCancel: () => void;
    onReview: () => void;
}) {
    const canCancel = appointment.can_cancel;
    const reviewable = canBeReviewed(appointment);

    const masterHref =
        appointment.master !== undefined ? routes.master(appointment.master.id) : null;

    if (!canCancel && !reviewable && masterHref === null) {
        return (
            <p className="text-xs text-text-secondary">
                {appointment.status === 'cancelled' ? 'Запись отменена' : 'Действий не требуется'}
            </p>
        );
    }

    return (
        <>
            {reviewable && (
                <Button size="sm" onClick={onReview}>
                    {CABINET_COPY.leaveReview}
                </Button>
            )}

            {!reviewable &&
                appointment.status === 'done' &&
                (appointment.review ?? null) !== null && (
                    <Badge tone="neutral" className="gap-1.5">
                        <QuoteIcon className="h-3.5 w-3.5" />
                        {CABINET_COPY.reviewPending}
                    </Badge>
                )}

            {canCancel && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                >
                    {CABINET_COPY.cancel}
                </Button>
            )}

            {masterHref !== null &&
                (appointment.status === 'confirmed' ||
                    appointment.status === 'in_progress' ||
                    appointment.status === 'pending') && (
                    <Button href={masterHref} variant="ghost" size="sm">
                        {CABINET_COPY.contactMaster}
                    </Button>
                )}

            {appointment.status === 'done' && (
                <span className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Визит завершён
                </span>
            )}
        </>
    );
}

/** Russian plural picker for "запись". */
function plural(count: number, one: string, few: string, many: string): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 > 10 && mod100 < 20) {
        return many;
    }

    if (mod10 === 1) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return few;
    }

    return many;
}

/** Refresh helper kept next to the page it belongs to. */
export function reloadAppointments(): void {
    router.reload({ only: ['appointments', 'pending', 'confirmed', 'inProgress', 'filters'] });
}
