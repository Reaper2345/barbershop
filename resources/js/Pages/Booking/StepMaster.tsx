import { Img } from '@/Components/UI/Img';
import { EmptyState } from '@/Components/UI/EmptyState';
import { RatingStars } from '@/Components/UI/RatingStars';
import { PriceRange } from '@/Components/UI/PriceRange';
import { CheckIcon, ScissorsIcon } from '@/lib/icons';
import { BOOKING_COPY, MASTERS_COPY } from '@/lib/content';
import { formatExperience, serviceDuration, formatDuration, cn } from '@/lib/format';
import { masterPhoto } from '@/lib/image';
import type { Master } from '@/types';

/*
|--------------------------------------------------------------------------
| Step 2 — master
|--------------------------------------------------------------------------
| Grid of the masters who actually perform the chosen service. The controller
| already filters `masters` to active barbers with their active services
| loaded, so the check here is simply whether the service id appears in that
| master's list.
|
| The price shown is *this master's* price for *this service*, taken from the
| pivot override when present — the catalogue price would be misleading.
|
| This step is skipped entirely when the wizard was entered with ?master_id=.
*/

export interface StepMasterProps {
    masters: Master[];
    serviceId: number | null;
    serviceName: string;
    selectedMasterId: number | null;
    onSelectMaster: (master: Master) => void;
    className?: string;
}

export function StepMaster({
    masters,
    serviceId,
    serviceName,
    selectedMasterId,
    onSelectMaster,
    className,
}: StepMasterProps) {
    // Only masters who offer the selected service.
    const capable = masters.filter(
        (master) =>
            serviceId === null ||
            (master.services ?? []).some((service) => service.id === serviceId),
    );

    return (
        <div className={className}>
            <header>
                <h2 className="font-display text-2xl font-semibold text-text-primary">
                    {BOOKING_COPY.masterTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {BOOKING_COPY.masterSubtitle}
                    {serviceName !== '' && (
                        <>
                            {' '}
                            Услуга: <span className="text-text-primary">{serviceName}</span>.
                        </>
                    )}
                </p>
            </header>

            {capable.length === 0 ? (
                <EmptyState
                    className="mt-8"
                    icon={<ScissorsIcon />}
                    title={BOOKING_COPY.masterEmpty}
                    description={BOOKING_COPY.masterEmptyHint}
                />
            ) : (
                <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {capable.map((master) => {
                        const name = master.user?.name ?? 'Мастер';
                        const active = master.id === selectedMasterId;

                        // This master's row for the chosen service carries the
                        // pivot overrides (price/duration).
                        const offered = (master.services ?? []).find(
                            (service) => service.id === serviceId,
                        );
                        const duration = offered !== undefined ? serviceDuration(offered) : null;

                        return (
                            <li key={master.id} className="flex">
                                <button
                                    type="button"
                                    onClick={() => onSelectMaster(master)}
                                    aria-pressed={active}
                                    className={cn(
                                        'group flex w-full flex-col overflow-hidden rounded-2xl border text-left',
                                        'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent',
                                        active
                                            ? 'border-accent bg-accent/5'
                                            : 'border-border bg-bg-elevated hover:border-accent/60',
                                    )}
                                >
                                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg-secondary">
                                        <Img
                                            src={masterPhoto(master.photo, name)}
                                            fallbackSrc="/images/placeholder-master.svg"
                                            alt={`${name} — барбер`}
                                            className={cn(
                                                'grayscale transition-all duration-500',
                                                'group-hover:grayscale-0',
                                                active && 'grayscale-0',
                                            )}
                                            wrapperClassName="h-full w-full"
                                        />

                                        {active && (
                                            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-bg-primary">
                                                <CheckIcon className="h-4 w-4" />
                                                <span className="sr-only">Выбран</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <p className="font-display text-lg font-semibold text-text-primary">
                                            {name}
                                        </p>

                                        <div className="mt-2">
                                            <RatingStars
                                                value={master.rating}
                                                count={master.reviews_count}
                                                size="sm"
                                            />
                                        </div>

                                        <p className="mt-3 text-xs text-text-secondary">
                                            {MASTERS_COPY.experience}:{' '}
                                            {formatExperience(master.experience_years)}
                                            {duration !== null && ` · ${formatDuration(duration)}`}
                                        </p>

                                        {offered !== undefined && (
                                            <p className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-4 text-sm">
                                                <span className="text-text-secondary">
                                                    {BOOKING_COPY.yourPrice}
                                                </span>
                                                <PriceRange
                                                    min={offered.base_price_min}
                                                    max={offered.base_price_max}
                                                    pivot={offered.pivot}
                                                    size="md"
                                                />
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default StepMaster;
