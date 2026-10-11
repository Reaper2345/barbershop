import { useState, type ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { AppointmentCard } from '@/Components/Cabinet/AppointmentCard';
import { CancelAppointmentModal } from '@/Components/Cabinet/CancelAppointmentModal';
import { ReviewModal } from '@/Components/Cabinet/ReviewModal';
import { Button } from '@/Components/UI/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import { CalendarIcon, ScissorsIcon, StarIcon } from '@/lib/icons';
import { CABINET_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/format';
import { canBeReviewed } from '@/types';
import type { CabinetAppointment, CabinetStats, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Cabinet/Index — GET /cabinet
|--------------------------------------------------------------------------
| Overview: greeting, three counters, the next visit highlighted, the last few
| past visits, and the two quick actions the brief asks for.
|
| Props from ClientCabinetController@index:
|   upcoming — up to 5 future appointments, soonest first
|   history  — up to 10 appointments of any status, newest first
|   stats    — { total, completed, upcoming }
*/

export interface CabinetIndexProps {
    upcoming?: CabinetAppointment[];
    history?: CabinetAppointment[];
    stats?: CabinetStats;
}

export default function CabinetIndex({
    upcoming = [],
    history = [],
    stats = { total: 0, completed: 0, upcoming: 0 },
}: CabinetIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const clientName = auth.user?.name ?? 'клиент';

    // Modals are driven from one place so both the overview and the full list
    // share exactly the same cancel/review behaviour.
    const [cancelTarget, setCancelTarget] = useState<CabinetAppointment | null>(null);
    const [reviewTarget, setReviewTarget] = useState<CabinetAppointment | null>(null);

    const next = upcoming[0] ?? null;

    // "Записаться снова" repeats the most recent booking of any status: its
    // master and service are almost always what the client wants again.
    const last = history[0] ?? null;

    // The most recent completed visit still missing a review.
    const reviewable = history.find((appointment) => canBeReviewed(appointment)) ?? null;

    return (
        <AppLayout title={CABINET_COPY.title}>
            {/* Welcome */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-12 md:py-16">
                    <p className="section-eyebrow">Личный кабинет</p>

                    <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                        {CABINET_COPY.welcome(clientName)}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                        {CABINET_COPY.welcomeText}
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button href={routes.booking()} iconLeft={<CalendarIcon />}>
                            {CABINET_COPY.newBooking}
                        </Button>

                        <Button href={routes.cabinetAppointments()} variant="ghost">
                            {CABINET_COPY.allAppointments}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {/* Stats */}
                    <ul className="grid gap-4 sm:grid-cols-3">
                        <StatCard label={CABINET_COPY.stats.total} value={stats.total} />
                        <StatCard
                            label={CABINET_COPY.stats.upcoming}
                            value={stats.upcoming}
                            highlight={stats.upcoming > 0}
                        />
                        <StatCard label={CABINET_COPY.stats.completed} value={stats.completed} />
                    </ul>

                    <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
                        <div className="space-y-12">
                            {/* Next appointment */}
                            <div>
                                <h2 className="font-display text-2xl font-semibold text-text-primary">
                                    {CABINET_COPY.nextTitle}
                                </h2>

                                {next === null ? (
                                    <EmptyState
                                        className="mt-6"
                                        icon={<CalendarIcon />}
                                        title={CABINET_COPY.nextEmpty}
                                        description={CABINET_COPY.nextEmptyText}
                                        action={
                                            <Button href={routes.booking()}>
                                                {CABINET_COPY.newBooking}
                                            </Button>
                                        }
                                    />
                                ) : (
                                    <AppointmentCard
                                        className="mt-6"
                                        appointment={next}
                                        variant="highlight"
                                        actions={
                                            <>
                                                {next.can_cancel && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setCancelTarget(next)}
                                                        className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                                                    >
                                                        {CABINET_COPY.cancel}
                                                    </Button>
                                                )}

                                                {canBeReviewed(next) && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setReviewTarget(next)}
                                                    >
                                                        {CABINET_COPY.leaveReview}
                                                    </Button>
                                                )}

                                                {next.master !== undefined && (
                                                    <Button
                                                        href={routes.master(next.master.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        {CABINET_COPY.contactMaster}
                                                    </Button>
                                                )}
                                            </>
                                        }
                                    />
                                )}
                            </div>

                            {/* Recent history */}
                            <div>
                                <div className="flex items-end justify-between gap-4">
                                    <h2 className="font-display text-2xl font-semibold text-text-primary">
                                        {CABINET_COPY.historyTitle}
                                    </h2>

                                    <Link
                                        href={routes.cabinetAppointments('all')}
                                        className="text-sm text-accent transition-all duration-300 hover:text-accent-hover"
                                    >
                                        {CABINET_COPY.allAppointments}
                                    </Link>
                                </div>

                                {history.length === 0 ? (
                                    <EmptyState
                                        className="mt-6"
                                        size="sm"
                                        icon={<ScissorsIcon />}
                                        title={CABINET_COPY.emptyHistory}
                                        description={CABINET_COPY.emptyHistoryText}
                                    />
                                ) : (
                                    <ul className="mt-6 space-y-4">
                                        {history.slice(0, 4).map((appointment) => (
                                            <li key={appointment.id}>
                                                <AppointmentCard appointment={appointment} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Quick actions */}
                        <aside className="lg:sticky lg:top-28 lg:self-start">
                            <h2 className="font-display text-xl font-semibold text-text-primary">
                                {CABINET_COPY.quickActions}
                            </h2>

                            <div className="mt-5 space-y-4">
                                {/* Repeat last booking */}
                                <QuickAction
                                    title={CABINET_COPY.repeat}
                                    hint={CABINET_COPY.repeatHint}
                                    icon={<CalendarIcon className="h-5 w-5" />}
                                    disabled={last === null}
                                    href={
                                        last !== null && last.master !== undefined && last.service !== undefined
                                            ? routes.booking({
                                                  master: last.master.id,
                                                  service: last.service.id,
                                              })
                                            : routes.booking()
                                    }
                                    detail={
                                        last !== null && last.service !== undefined
                                            ? last.service.name
                                            : 'Пока нет прошлых записей'
                                    }
                                />

                                {/* Leave a review */}
                                <QuickAction
                                    title={CABINET_COPY.leaveReview}
                                    hint={CABINET_COPY.leaveReviewHint}
                                    icon={<StarIcon className="h-5 w-5" />}
                                    disabled={reviewable === null}
                                    // 'done', not 'history': the controller only
                                    // understands active/done/cancelled, so the
                                    // old value filtered for status='history',
                                    // matched nothing and dumped the reviewer on
                                    // an empty "Активные" tab.
                                    href={routes.cabinetAppointments('done')}
                                    detail={
                                        reviewable !== null && reviewable.service !== undefined
                                            ? `Визит ${reviewable.date_label ?? ''}`
                                            : 'Нет визитов без отзыва'
                                    }
                                />
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* Shared modals */}
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
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Local pieces
|--------------------------------------------------------------------------
*/

function StatCard({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: number;
    highlight?: boolean;
}) {
    return (
        <li
            className={cn(
                'rounded-2xl border bg-bg-elevated p-6',
                highlight ? 'border-accent/50' : 'border-border',
            )}
        >
            <p className="text-xs uppercase tracking-wider text-text-secondary">{label}</p>
            <p
                className={cn(
                    'mt-3 font-display text-4xl font-semibold tabular-nums',
                    highlight ? 'text-accent' : 'text-text-primary',
                )}
            >
                {value}
            </p>
        </li>
    );
}

function QuickAction({
    title,
    hint,
    detail,
    icon,
    href,
    disabled,
}: {
    title: string;
    hint: string;
    detail: string;
    icon: ReactNode;
    href: string;
    disabled: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-bg-elevated p-5',
                disabled && 'opacity-60',
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
                    aria-hidden="true"
                >
                    {icon}
                </span>

                <div className="min-w-0">
                    <p className="font-medium text-text-primary">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{hint}</p>
                    <p className="mt-2 truncate text-xs text-text-secondary/80">{detail}</p>
                </div>
            </div>

            {!disabled && (
                <Button href={href} variant="ghost" size="sm" fullWidth className="mt-4">
                    Перейти
                </Button>
            )}
        </div>
    );
}
