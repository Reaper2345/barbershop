import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { Button } from '@/Components/UI/Button';
import { Img } from '@/Components/UI/Img';
import { StepIndicator } from '@/Components/Booking/StepIndicator';
import { SummaryCard } from '@/Components/Booking/SummaryCard';
import { StepService } from './StepService';
import { StepMaster } from './StepMaster';
import { StepDateTime } from './StepDateTime';
import { StepConfirm } from './StepConfirm';
import { BOOKING_COPY } from '@/lib/content';
import { BOOKING_STEPS, routes } from '@/lib/routes';
import { addMonths, parseIsoDate, todayIso, formatIsoDateLabel } from '@/lib/date';
import { masterPhoto } from '@/lib/image';
import { serviceDuration } from '@/lib/format';
import type {
    BookingSlot,
    Category,
    Master,
    Service,
    SlotApiError,
    SlotsResponse,
    SharedProps,
} from '@/types';

/*
|--------------------------------------------------------------------------
| Booking/Create — GET/POST /booking
|--------------------------------------------------------------------------
| The four-step wizard. All wizard state lives here in React; the only server
| round trips are the Inertia visit that renders this page and the JSON slot
| lookup on step 3.
|
| Props from BookingController@create:
|   categories      ordered categories with their active services
|   masters         active masters with their active services (pivot included)
|   selectedMaster  resolved from ?master_id=, else null
|   selectedService resolved from ?service_id=, else null
|   date            resolved day for the initial slot grid, else null
|   slots           pre-computed slots for (master, service, date)
|
| Skipping step 2: when the page was reached from a master page
| (/booking?master_id=…), the master is already chosen, so the wizard starts on
| step 3 and step 2 is only reachable by explicitly asking to change the master.
*/

export interface BookingCreateProps {
    categories?: Category[];
    masters?: Master[];
    /** Echoed by BookingController@create from ?master_id=. */
    master_id?: number | null;
    selectedMaster?: Master | null;
    selectedService?: Service | null;
    date?: string | null;
    slots?: BookingSlot[];
    /** Published /privacy page; shown in the step-4 consent modal. */
    privacyContent?: { title?: string | null; content?: string | null } | null;
}

/** `?master_id=` is the controller's name; `?master=` is accepted as an alias. */
function readIdParam(params: URLSearchParams, key: string): number | null {
    const raw = params.get(key) ?? params.get(key.replace('_id', ''));

    if (raw === null || raw === '') {
        return null;
    }

    const parsed = Number.parseInt(raw, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function BookingCreate({
    categories = [],
    masters = [],
    master_id: propMasterId = null,
    selectedMaster: preselectedMaster = null,
    selectedService: preselectedService = null,
    date = null,
    // Accepted from BookingController@create but intentionally not used to seed
    // the grid — see the comment on the `slots` state below.
    slots: _initialSlots = [],
    privacyContent = null,
}: BookingCreateProps) {
    const { url } = usePage<SharedProps>().props;

    /*
     * Initial state is derived from the props and the URL, inside a lazy
     * initialiser so it runs exactly once.
     *
     * The master id is read from the `master_id` prop first — that is the
     * controller's explicit answer to "did the visitor arrive from a master
     * page?" — and only falls back to scraping the query string. Relying on the
     * URL alone was the original defect: on a partial reload or a redirect that
     * drops the query, the id vanished and step 2 ("choose a master") reappeared
     * even though a master was already chosen.
     */
    const initial = useMemo(() => {
        const query = new URLSearchParams(typeof url === 'string' ? url.split('?')[1] ?? '' : '');

        const urlMasterId = readIdParam(query, 'master_id');
        const resolvedMasterId = propMasterId ?? urlMasterId;

        const master =
            preselectedMaster ??
            (resolvedMasterId !== null
                ? masters.find((candidate) => candidate.id === resolvedMasterId) ?? null
                : null);

        // The controller resolves this from ?service_id=; it is null when the
        // visitor followed a link without a service.
        const service = preselectedService;

        /*
         * Starting step: service → master → datetime → confirm.
         *
         * A deep link from /masters/{id} carries only a master, so the wizard
         * still has to ask for the service — but it must NOT ask for the master
         * again. `masterFromUrl` below is what makes step 1 jump straight to
         * step 3.
         */
        let step = 1;

        if (service !== null) {
            step = 2;
        }

        if (service !== null && master !== null) {
            step = 3;
        }

        return {
            masterId: master?.id ?? null,
            serviceId: service?.id ?? null,
            categoryId: service?.category_id ?? categories[0]?.id ?? null,
            step,
            // A master that came from the prop/URL is "locked": step 2 is skipped.
            locked: master !== null && resolvedMasterId !== null,
        };
        // Intentionally computed once for the page's lifetime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [step, setStep] = useState<number>(initial.step);
    const [furthest, setFurthest] = useState<number>(initial.step);

    const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
    const [serviceId, setServiceId] = useState<number | null>(initial.serviceId);
    const [masterId, setMasterId] = useState<number | null>(initial.masterId);

    // Skipping step 2 is only valid while the master came from the URL.
    const [masterFromUrl, setMasterFromUrl] = useState<boolean>(initial.locked);

    const [selectedDate, setSelectedDate] = useState<string | null>(date);
    const [month, setMonth] = useState<Date>(
        date !== null ? parseIsoDate(date) : addMonths(new Date(), 0),
    );
    const [slot, setSlot] = useState<BookingSlot | null>(null);

    /*
     * The grid starts empty rather than seeded with `initialSlots`.
     *
     * The controller computes those slots for its own resolved `date`, which is
     * not necessarily the day the wizard opens on (it defaults to tomorrow when
     * no ?date= was given). Seeding from it could therefore show one day's
     * times under another day's heading for a frame. The step-3 effect fetches
     * the correct grid on mount instead — same server-side SlotService, no
     * stale frame, one request.
     */
    const [slots, setSlots] = useState<BookingSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [agreed, setAgreed] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    /** Bumped by the retry button to re-run the fetch effect. */
    const [reloadToken, setReloadToken] = useState(0);

    /*
    |----------------------------------------------------------------------
    | Derived values
    |----------------------------------------------------------------------
    */

    const master = useMemo(
        () => masters.find((candidate) => candidate.id === masterId) ?? null,
        [masters, masterId],
    );

    /** Categories/services restricted to the locked master when applicable. */
    const masterServices = useMemo<Service[] | null>(() => {
        if (master === null || !masterFromUrl) {
            return null;
        }

        return master.services ?? [];
    }, [master, masterFromUrl]);

    const visibleCategories = useMemo<Category[]>(() => {
        if (masterServices === null) {
            return categories;
        }

        // Keep only categories that contain at least one of the master's
        // services, and keep only those services inside each category.
        const allowed = new Set(masterServices.map((service) => service.id));

        return categories
            .map((category) => ({
                ...category,
                services: (category.services ?? []).filter((service) =>
                    allowed.has(service.id),
                ),
            }))
            .filter((category) => (category.services ?? []).length > 0);
    }, [categories, masterServices]);

    const currentCategory = useMemo(
        () => visibleCategories.find((category) => category.id === categoryId) ?? null,
        [visibleCategories, categoryId],
    );

    const servicesInCategory = currentCategory?.services ?? [];

    /**
     * The chosen service. Resolved in three places because it can come from any
     * of them depending on how the wizard was entered:
     *   1. the category list the visitor is looking at,
     *   2. the locked master's own service list (step 2 never ran),
     *   3. the preselected prop, which is what a deep link resolves to.
     */
    const selectedService = useMemo(
        () =>
            selectedServiceFromList(servicesInCategory, serviceId) ??
            masterServices?.find((service) => service.id === serviceId) ??
            (preselectedService?.id === serviceId ? preselectedService : null),
        [servicesInCategory, serviceId, masterServices, preselectedService],
    );

    /** Duration comes from the master's pivot override when it exists. */
    const durationMinutes = useMemo<number | null>(() => {
        if (selectedService === null) {
            return null;
        }

        const offered = master?.services?.find((service) => service.id === selectedService.id);

        return serviceDuration(offered ?? selectedService);
    }, [master, selectedService]);

    const priceMin = selectedService?.base_price_min ?? null;
    const priceMax = selectedService?.base_price_max ?? null;

    /*
    |----------------------------------------------------------------------
    | Step 3 — slot fetching
    |----------------------------------------------------------------------
    */

    useEffect(() => {
        if (step !== 3 || masterId === null || serviceId === null || selectedDate === null) {
            return;
        }

        // Guard against out-of-order responses: only the newest request may
        // write state, and any in-flight request is aborted on change.
        const controller = new AbortController();
        let active = true;

        setSlotsLoading(true);
        setSlotsError(null);

        void axios
            .get<SlotsResponse>(routes.slots, {
                params: { master_id: masterId, service_id: serviceId, date: selectedDate },
                signal: controller.signal,
            })
            .then((response) => {
                if (!active) {
                    return;
                }

                // Discard a response that belongs to a date the visitor has
                // already navigated away from.
                if (response.data.date !== undefined && response.data.date !== selectedDate) {
                    return;
                }

                setSlots(response.data.slots ?? []);
            })
            .catch((error: SlotApiError) => {
                if (!active || axios.isCancel(error) === true) {
                    return;
                }

                const validationError = error.response?.data?.errors?.date?.[0];

                setSlots([]);
                setSlotsError(validationError ?? BOOKING_COPY.slotsError);
            })
            .finally(() => {
                if (active) {
                    setSlotsLoading(false);
                }
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [step, masterId, serviceId, selectedDate, reloadToken]);

    /*
    |----------------------------------------------------------------------
    | Selection handlers
    |----------------------------------------------------------------------
    */

    const handleSelectCategory = useCallback((category: Category) => {
        setCategoryId(category.id);
        // Changing the direction invalidates the service and everything downstream.
        setServiceId(null);
        // A master taken from ?master_id= stays locked: step 1 only lists his
        // services, so a new direction cannot invalidate him.
        if (!masterFromUrl) {
            setMasterId(null);
        }
        setSlot(null);
        setSlots([]);
        setErrors({});
        setFormError(null);
    }, [masterFromUrl]);

    const handleSelectService = useCallback((service: Service) => {
        setServiceId(service.id);

        /*
         * A different service invalidates a master the visitor picked by hand.
         * A master that came from ?master_id= is locked for this visit, though:
         * step 1 only offers his services, and clearing him here made step 2
         * ("choose a master") reappear for visitors arriving from that master's
         * page — exactly what the contract in the file header says must not
         * happen.
         */
        if (!masterFromUrl) {
            setMasterId(null);
        }

        setSlot(null);
        setSlots([]);
        setErrors({});
        setFormError(null);
    }, [masterFromUrl]);

    const handleSelectMaster = useCallback((selected: Master) => {
        setMasterId(selected.id);
        setMasterFromUrl(false);
        setSlot(null);
        setSlots([]);
        setErrors({});
        setFormError(null);
    }, []);

    const handleSelectDate = useCallback((isoDate: string) => {
        setSelectedDate(isoDate);
        // The previous day's slot is never valid on a new day.
        setSlot(null);
        setSlots([]);
        setSlotsError(null);
    }, []);

    /*
    |----------------------------------------------------------------------
    | Navigation & validation
    |----------------------------------------------------------------------
    */

    const step1Ready = serviceId !== null;
    const step2Ready = masterId !== null;
    const step3Ready = selectedDate !== null && slot !== null;

    const goNext = useCallback(() => {
        if (step === 1 && step1Ready) {
            // With a URL-locked master, step 2 is skipped entirely.
            setStep(masterFromUrl ? 3 : 2);
        } else if (step === 2 && step2Ready) {
            setStep(3);
        } else if (step === 3 && step3Ready) {
            setStep(4);
        } else {
            return;
        }

        setFurthest((previous) => Math.max(previous, step + 1));
    }, [step, step1Ready, step2Ready, step3Ready, masterFromUrl]);

    const goBack = useCallback(() => {
        // Step 3 goes back to step 1 when step 2 was skipped.
        if (step === 3 && masterFromUrl) {
            setStep(1);

            return;
        }

        setStep((previous) => Math.max(1, previous - 1));
    }, [step, masterFromUrl]);

    const jumpTo = useCallback(
        (target: number) => {
            if (target > furthest) {
                return;
            }

            // Step 2 is not part of the flow while the master is locked in.
            if (target === 2 && masterFromUrl) {
                setMasterFromUrl(false);
            }

            setStep(target);
        },
        [furthest, masterFromUrl],
    );

    /*
    |----------------------------------------------------------------------
    | Submission
    |----------------------------------------------------------------------
    */

    const submit = useCallback(() => {
        const nextErrors: Record<string, string> = {};

        if (!agreed) {
            nextErrors.agreement = BOOKING_COPY.agreeError;
        }

        if (slot === null) {
            nextErrors.starts_at = BOOKING_COPY.selectTime;
        }

        if (comment.length > 2000) {
            nextErrors.client_comment = 'Комментарий не должен превышать 2000 символов.';
        }

        setErrors(nextErrors);
        setFormError(null);

        if (Object.keys(nextErrors).length > 0) {
            if (nextErrors.starts_at !== undefined) {
                setStep(3);
            }

            return;
        }

        if (masterId === null || serviceId === null || slot === null) {
            return;
        }

        // `photo` must go through FormData; the backend reads it as a file.
        const payload = new FormData();
        payload.append('master_id', String(masterId));
        payload.append('service_id', String(serviceId));
        payload.append('starts_at', slot.starts_at);
        payload.append('client_comment', comment);

        if (photo !== null) {
            payload.append('photo', photo);
        }

        setProcessing(true);

        router.post(routes.booking(), payload, {
            // On success the controller redirects to /cabinet with a flash
            // message; nothing needs to be done here.
            onError: (serverErrors) => {
                setProcessing(false);

                const mapped: Record<string, string> = {};

                for (const [field, message] of Object.entries(serverErrors)) {
                    mapped[field] = String(message);
                }

                setErrors(mapped);

                // A rejected slot means somebody took it while the wizard was
                // open — send the visitor back to pick another time.
                const slotError = mapped.starts_at;
                const masterError = mapped.master_id ?? mapped.service_id;

                if (slotError !== undefined || masterError !== undefined) {
                    setFormError(slotError ?? masterError ?? null);
                    setStep(3);
                    setSlot(null);
                    setReloadToken((token) => token + 1);

                    return;
                }

                setFormError(mapped.client_comment ?? mapped.photo ?? null);
            },
            onFinish: () => setProcessing(false),
        });
    }, [agreed, comment, masterId, photo, serviceId, slot]);

    /*
    |----------------------------------------------------------------------
    | Calendar day rules
    |----------------------------------------------------------------------
    */

    const minMonth = useMemo(() => {
        const today = new Date();

        return new Date(today.getFullYear(), today.getMonth(), 1);
    }, []);

    const maxMonth = useMemo(() => addMonths(new Date(), 2), []);

    const isDayDisabled = useCallback(
        (day: Date, isoDate: string): boolean => {
            // Past days are never bookable.
            if (isoDate < todayIso()) {
                return true;
            }

            // A weekday with no active schedule row.
            const schedules = master?.schedules;

            if (schedules !== undefined) {
                const hasRow = schedules.some(
                    (schedule) => schedule.weekday === day.getDay() && schedule.is_active,
                );

                if (!hasRow) {
                    return true;
                }
            }

            return false;
        },
        [master],
    );

    /*
    |----------------------------------------------------------------------
    | Render
    |----------------------------------------------------------------------
    */

    const masterName = master?.user?.name ?? BOOKING_COPY.selectMaster;
    const serviceName = selectedService?.name ?? BOOKING_COPY.selectService;
    const dateLabel = selectedDate !== null ? formatIsoDateLabel(selectedDate, true) : BOOKING_COPY.selectDate;

    const canGoNext =
        (step === 1 && step1Ready) ||
        (step === 2 && step2Ready) ||
        (step === 3 && step3Ready) ||
        false;

    return (
        <AppLayout title={BOOKING_COPY.title} description={BOOKING_COPY.subtitle}>
            {/* Page header */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-10 md:py-14">
                    <p className="section-eyebrow">Запись онлайн</p>
                    <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                        {BOOKING_COPY.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                        {BOOKING_COPY.subtitle}
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {/*
                     * Progress: sticky right under the site header (h-20 + its
                     * 1px border), so the visitor always sees where they are.
                     * The bar only spans the content column, which is why the
                     * background does not need to reach the viewport edges.
                     */}
                    <div className="sticky top-20 z-20 -mt-2 mb-10 border-b border-border/70 bg-bg-primary/95 pb-3 pt-4 backdrop-blur">
                        <StepIndicator
                            steps={BOOKING_STEPS.map((item) => ({
                                id: item.id,
                                label: item.label,
                                hint:
                                    item.id === 1
                                        ? BOOKING_COPY.stepHints.service
                                        : item.id === 2
                                          ? BOOKING_COPY.stepHints.master
                                          : item.id === 3
                                            ? BOOKING_COPY.stepHints.datetime
                                            : BOOKING_COPY.stepHints.confirm,
                            }))}
                            current={step}
                            furthest={furthest}
                            onStepClick={jumpTo}
                        />
                    </div>

                    {/* Two columns from lg so the sticky recap below has a
                        column to stick in; it is plain flow on mobile. */}
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
                        {/* Step body */}
                        <div>
                            {step === 1 && (
                                <StepService
                                    categories={visibleCategories}
                                    selectedCategoryId={categoryId}
                                    onSelectCategory={handleSelectCategory}
                                    services={servicesInCategory}
                                    selectedServiceId={serviceId}
                                    onSelectService={handleSelectService}
                                    lockedMaster={masterFromUrl && master !== null}
                                    lockedMasterName={master?.user?.name ?? null}
                                />
                            )}

                            {step === 2 && (
                                <StepMaster
                                    masters={masters}
                                    serviceId={serviceId}
                                    serviceName={selectedService?.name ?? ''}
                                    selectedMasterId={masterId}
                                    onSelectMaster={handleSelectMaster}
                                />
                            )}

                            {step === 3 && (
                                <StepDateTime
                                    month={month}
                                    onMonthChange={setMonth}
                                    selectedDate={selectedDate}
                                    onSelectDate={handleSelectDate}
                                    minMonth={minMonth}
                                    maxMonth={maxMonth}
                                    isDisabled={isDayDisabled}
                                    slots={slots}
                                    selectedSlot={slot}
                                    onSelectSlot={setSlot}
                                    loading={slotsLoading}
                                    error={slotsError}
                                    onRetry={() => setReloadToken((token) => token + 1)}
                                    durationMinutes={durationMinutes}
                                />
                            )}

                            {step === 4 && (
                                <StepConfirm
                                    serviceName={serviceName}
                                    masterName={masterName}
                                    masterPhotoSlot={
                                        master !== null ? (
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border bg-bg-secondary">
                                                    <Img
                                                        src={masterPhoto(master.photo, masterName)}
                                                        fallbackSrc="/images/placeholder-master.svg"
                                                        alt={`${masterName} — барбер`}
                                                        width={64}
                                                        height={64}
                                                        wrapperClassName="h-full w-full"
                                                    />
                                                </div>
                                                <p className="text-sm text-text-secondary">
                                                    Ваш мастер:{' '}
                                                    <span className="text-text-primary">{masterName}</span>
                                                </p>
                                            </div>
                                        ) : undefined
                                    }
                                    date={selectedDate}
                                    slot={slot}
                                    durationMinutes={durationMinutes}
                                    priceMin={priceMin}
                                    priceMax={priceMax}
                                    comment={comment}
                                    onCommentChange={setComment}
                                    commentError={errors.client_comment}
                                    photo={photo}
                                    onPhotoChange={setPhoto}
                                    photoError={errors.photo}
                                    agreed={agreed}
                                    onAgreedChange={(value) => {
                                        setAgreed(value);
                                        setErrors((previous) => {
                                            const { agreement: _removed, ...rest } = previous;

                                            return rest;
                                        });
                                    }}
                                    agreedError={errors.agreement}
                                    formError={formError}
                                    onBackToDateTime={() => setStep(3)}
                                    privacyContent={privacyContent}
                                    processing={processing}
                                    onSubmit={submit}
                                    onBack={goBack}
                                />
                            )}

                            {/* Wizard footer nav (step 4 has its own submit row).
                                Sticky to the bottom of the viewport while the
                                step content is taller than the screen: the
                                opaque background keeps the content behind it
                                from bleeding through. */}
                            {step < 4 && (
                                <div className="sticky bottom-0 z-20 mt-10 flex flex-col gap-3 border-t border-border bg-bg-primary/95 pb-4 pt-6 backdrop-blur sm:flex-row-reverse sm:items-center sm:justify-between">
                                    <Button
                                        size="lg"
                                        onClick={goNext}
                                        disabled={!canGoNext}
                                        fullWidth
                                        className="sm:w-auto"
                                    >
                                        {BOOKING_COPY.next}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        onClick={goBack}
                                        disabled={step === 1}
                                        fullWidth
                                        className="sm:w-auto"
                                    >
                                        {BOOKING_COPY.back}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Sticky recap. Sticky from lg (not xl): the summary is
                            the only thing the visitor cross-checks while
                            scrolling a long step, and lg is where the two-column
                            wizard layout starts. `top-60`, not `top-28`: the
                            wizard's sticky progress bar (top-20, 147px tall)
                            otherwise covers the panel's first 115px. */}
                        <aside className="lg:sticky lg:top-60 lg:self-start">
                            <p className="mb-3 text-xs uppercase tracking-wider text-text-secondary">
                                {BOOKING_COPY.summary}
                            </p>

                            <SummaryCard
                                variant="compact"
                                rows={[
                                    {
                                        label: BOOKING_COPY.service,
                                        value: serviceName,
                                        emphasis: selectedService !== null,
                                    },
                                    {
                                        label: BOOKING_COPY.master,
                                        value: masterName,
                                        emphasis: master !== null,
                                    },
                                    { label: BOOKING_COPY.date, value: dateLabel },
                                    {
                                        label: BOOKING_COPY.time,
                                        value: slot?.time ?? BOOKING_COPY.selectTime,
                                    },
                                ]}
                                durationMinutes={durationMinutes}
                                priceMin={priceMin}
                                priceMax={priceMax}
                            />

                            <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                                {BOOKING_COPY.priceNote}
                            </p>
                        </aside>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}

/** Finds a service inside a category's list without importing a helper. */
function selectedServiceFromList(services: Service[], id: number | null): Service | null {
    if (id === null) {
        return null;
    }

    return services.find((service) => service.id === id) ?? null;
}
