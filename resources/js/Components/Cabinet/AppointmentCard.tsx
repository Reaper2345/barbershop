import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Img } from '@/Components/UI/Img';
import type { LightboxPhoto } from '@/Components/UI/Lightbox';
import { Badge, StatusBadge } from '@/Components/UI/Badge';
import { ClockIcon, QuoteIcon } from '@/lib/icons';
import { formatDuration, cn } from '@/lib/format';
import { masterPhoto } from '@/lib/image';
import { routes } from '@/lib/routes';
import { priceState } from '@/types';
import type { CabinetAppointment } from '@/types';

/*
|--------------------------------------------------------------------------
| AppointmentCard
|--------------------------------------------------------------------------
| One booking, in the cabinet overview and in the full list.
|
| Price presentation follows the three states the schema can be in, and relies
| on the server's `final_price_label` so the UI and the API agree:
|
|   master_price_offer set          → "Мастер подтвердил: 2 000 ₽"  (green)
|   min/max set, no offer          → "Мастер уточнил: 1 800–2 200 ₽" (gold)
|   nothing set                    → "Цена будет уточнена мастером"   (muted)
|
| `master_comment` is surfaced in its own muted box — it is the master's answer
| to the client's comment/photo, so hiding it would make the price change look
| unmotivated.
*/

export interface AppointmentCardProps {
    appointment: CabinetAppointment;
    /** `highlight` gives the card the gold left border used for the next visit. */
    variant?: 'default' | 'highlight';
    /** Action buttons; rendered in a row under the details. */
    actions?: ReactNode;
    /** Opens the reference photo in the page's <Lightbox> instead of a new tab. */
    onPhotoClick?: (photo: LightboxPhoto) => void;
    className?: string;
}

export function AppointmentCard({
    appointment,
    variant = 'default',
    actions,
    onPhotoClick,
    className,
}: AppointmentCardProps) {
    const master = appointment.master;
    const service = appointment.service;
    const name = master?.name ?? 'Мастер';
    const price = priceState(appointment);

    return (
        <article
            className={cn(
                'flex flex-col gap-5 rounded-2xl border border-border bg-bg-elevated p-5 sm:p-6',
                'transition-all duration-300 hover:border-accent/50',
                variant === 'highlight' && 'border-l-2 border-l-accent',
                className,
            )}
        >
            <div className="flex items-start gap-4">
                {/* Master photo */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-bg-secondary">
                    <Img
                        src={masterPhoto(master?.photo ?? null, name)}
                        fallbackSrc="/images/placeholder-master.svg"
                        alt={`${name} — барбер`}
                        width={64}
                        height={64}
                        wrapperClassName="h-full w-full"
                    />
                </div>

                {/* Headline */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-text-primary">
                            {service?.name ?? 'Услуга'}
                        </h3>

                        <StatusBadge status={appointment.status} />
                    </div>

                    <p className="mt-1 text-sm text-text-secondary">
                        Мастер:{' '}
                        {master !== undefined ? (
                            <Link
                                href={routes.master(master.id)}
                                className="text-text-primary transition-all duration-300 hover:text-accent"
                            >
                                {name}
                            </Link>
                        ) : (
                            name
                        )}
                    </p>

                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                        <span className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {appointment.starts_at_label ?? '—'}
                        </span>

                        {appointment.duration_min !== null &&
                            appointment.duration_min !== undefined &&
                            appointment.duration_min > 0 && (
                                <span className="text-text-secondary/80">
                                    {formatDuration(appointment.duration_min)}
                                </span>
                            )}
                    </p>
                </div>
            </div>

            {/* Price line */}
            <div className="flex flex-wrap items-center gap-2">
                {price.kind === 'offer' && (
                    <Badge tone="emerald" size="md">
                        Мастер подтвердил: {price.label}
                    </Badge>
                )}

                {price.kind === 'range' && (
                    <Badge tone="accent" size="md">
                        Мастер уточнил: {price.label}
                    </Badge>
                )}

                {price.kind === 'pending' && (
                    <Badge tone="neutral" size="md">
                        Цена будет уточнена мастером
                    </Badge>
                )}
            </div>

            {/* Master's comment */}
            {appointment.master_comment !== null && appointment.master_comment !== '' && (
                <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
                        <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
                        <span>
                            <span className="font-medium text-text-primary">Комментарий мастера: </span>
                            {appointment.master_comment}
                        </span>
                    </p>
                </div>
            )}

            {/* Client's own comment, for context when re-reading an old booking */}
            {appointment.client_comment !== null && appointment.client_comment !== '' && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-text-secondary/80">
                    Ваш комментарий: {appointment.client_comment}
                </p>
            )}

            {/* Reference photo */}
            {appointment.photo_url != null && appointment.photo_url !== '' && (
                <button
                    type="button"
                    onClick={() =>
                        onPhotoClick?.({
                            src: appointment.photo_url as string,
                            alt: 'Фото-референс, приложенное к записи',
                            caption: appointment.service?.name ?? null,
                        })
                    }
                    disabled={onPhotoClick === undefined}
                    className="inline-flex w-fit cursor-pointer items-center gap-2 text-xs text-accent underline underline-offset-4 transition-all duration-300 hover:text-accent-hover disabled:cursor-default"
                >
                    Фото-референс
                </button>
            )}

            {actions !== undefined && (
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                    {actions}
                </div>
            )}
        </article>
    );
}

export default AppointmentCard;
