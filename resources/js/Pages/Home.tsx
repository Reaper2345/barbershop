import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { openCallbackModal } from '@/Components/Layout/CallbackModal';
import { Button } from '@/Components/UI/Button';
import { Carousel } from '@/Components/UI/Carousel';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { SectionHeading } from '@/Components/Public/SectionHeading';
import { MasterCard } from '@/Components/Public/MasterCard';
import { ReviewCard } from '@/Components/Public/ReviewCard';
import { FeatureCard } from '@/Components/Public/FeatureCard';
import { ContactRow } from '@/Components/Public/ContactRow';
import { CategoryIcon, PhoneIcon, MapPinIcon, ClockIcon, ArrowRightIcon, ScissorsIcon, QuoteIcon } from '@/lib/icons';
import { COPY, CONTACT_COPY, FEATURES, type Feature } from '@/lib/content';
import { routes } from '@/lib/routes';
import { formatPriceRange, telHref } from '@/lib/format';
import type { Category, Master, Review, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Home — GET /
|--------------------------------------------------------------------------
| Props come from HomeController@index:
|   categories — ordered categories with their active services (for prices)
|   masters    — 3 highest-rated active masters, withCount('reviews')
|   reviews    — 6 latest approved reviews
|
| `features` is optional: the controller does not send it yet, so the block
| falls back to the settings-aware defaults in lib/content.ts.
*/

export interface HomeProps {
    categories?: Category[];
    masters?: Master[];
    reviews?: Review[];
    features?: Feature[];
}

export default function Home({
    categories = [],
    masters = [],
    reviews = [],
    features,
}: HomeProps) {
    const { siteSettings } = usePage<SharedProps>().props;

    // Single overlay for the review carousel.
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    const heroTitle = siteSettings.hero_title ?? 'Барбершоп в центре города';
    const heroSubtitle = siteSettings.hero_subtitle ?? null;
    const siteName = siteSettings.site_name ?? 'Барбершоп';
    const address = siteSettings.address ?? null;
    const phone = siteSettings.phone ?? null;
    const workHours = siteSettings.work_hours ?? null;

    // Settings override each default feature when the keys exist.
    const resolvedFeatures: Feature[] = (features ?? FEATURES).map((feature) => ({
        ...feature,
        title: siteSettings[feature.titleKey] ?? feature.title,
        text: siteSettings[feature.textKey] ?? feature.text,
    }));

    return (
        <AppLayout title={undefined} description={heroSubtitle ?? undefined}>
            {/* ---------------------------------------------------------------
                Hero
            --------------------------------------------------------------- */}
            <section className="relative isolate flex min-h-[calc(100vh-5rem)] items-center overflow-hidden">
                {/* Decorative background — no photo asset is required. */}
                <div
                    className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 -z-10 opacity-70"
                    aria-hidden="true"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, rgba(201,169,97,0.18), transparent 55%), radial-gradient(circle at 80% 10%, rgba(201,169,97,0.10), transparent 45%)',
                    }}
                />
                <div
                    className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]"
                    aria-hidden="true"
                />

                <div className="container-page py-24 md:py-32">
                    <div className="max-w-3xl">
                        <p className="section-eyebrow">{siteName}</p>

                        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
                            {heroTitle}
                        </h1>

                        {heroSubtitle !== null && (
                            <p className="mt-8 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                                {heroSubtitle}
                            </p>
                        )}

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Button href={routes.booking()} size="lg">
                                {COPY.cta.book}
                            </Button>

                            <Button href={routes.masters} variant="ghost" size="lg">
                                {COPY.cta.masters}
                            </Button>
                        </div>

                        {workHours !== null && (
                            <p className="mt-8 flex items-center gap-2 text-sm text-text-secondary">
                                <ClockIcon className="h-4 w-4 shrink-0 text-accent" />
                                {workHours}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Услуги — 4 categories
            --------------------------------------------------------------- */}
            <section className="section border-t border-border" aria-labelledby="services-heading">
                <div className="container-page">
                    <SectionHeading
                        id="services-heading"
                        eyebrow={COPY.services.eyebrow}
                        title={COPY.services.title}
                        subtitle={COPY.services.subtitle}
                        action={
                            <Link
                                href={routes.services}
                                className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-all duration-300 hover:text-accent-hover"
                            >
                                {COPY.services.cta}
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        }
                    />

                    {categories.length === 0 ? (
                        <EmptyState
                            className="mt-12"
                            icon={<ScissorsIcon />}
                            title={COPY.services.empty}
                            description="Прайс обновляется — загляните чуть позже."
                        />
                    ) : (
                        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <CategoryCard category={category} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Мастера — 3 cards
            --------------------------------------------------------------- */}
            <section className="section border-t border-border bg-bg-secondary" aria-labelledby="masters-heading">
                <div className="container-page">
                    <SectionHeading
                        id="masters-heading"
                        eyebrow={COPY.masters.eyebrow}
                        title={COPY.masters.title}
                        subtitle={COPY.masters.subtitle}
                        action={
                            <Link
                                href={routes.masters}
                                className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-all duration-300 hover:text-accent-hover"
                            >
                                {COPY.masters.cta}
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        }
                    />

                    {masters.length === 0 ? (
                        <EmptyState
                            className="mt-12"
                            icon={<ScissorsIcon />}
                            title={COPY.masters.empty}
                            description="Мы набираем команду — напишите нам, если хотите записаться."
                        />
                    ) : (
                        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {masters.map((master) => (
                                <li key={master.id} className="flex">
                                    <MasterCard master={master} className="w-full" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Почему мы — 4 features
            --------------------------------------------------------------- */}
            <section className="section border-t border-border" aria-labelledby="features-heading">
                <div className="container-page">
                    <SectionHeading
                        id="features-heading"
                        eyebrow={COPY.features.eyebrow}
                        title={COPY.features.title}
                        align="center"
                    />

                    <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {resolvedFeatures.map((feature) => (
                            <FeatureCard key={feature.titleKey} feature={feature} />
                        ))}
                    </ul>
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Отзывы — carousel of the latest approved reviews
            --------------------------------------------------------------- */}
            <section className="section border-t border-border bg-bg-secondary" aria-labelledby="reviews-heading">
                <div className="container-page">
                    <SectionHeading
                        id="reviews-heading"
                        eyebrow={COPY.reviews.eyebrow}
                        title={COPY.reviews.title}
                        subtitle={COPY.reviews.subtitle}
                    />

                    {reviews.length === 0 ? (
                        <EmptyState
                            className="mt-12"
                            icon={<QuoteIcon />}
                            title={COPY.reviews.empty}
                            description="Станьте первым — оставьте отзыв после визита."
                        />
                    ) : (
                        <Carousel
                            className="mt-12"
                            label={COPY.reviews.title}
                            previousLabel={COPY.reviews.prev}
                            nextLabel={COPY.reviews.next}
                        >
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    maxLength={260}
                                    showMaster
                                    onPhotoClick={setLightbox}
                                    className="h-full"
                                />
                            ))}
                        </Carousel>
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Контакты + карта
            --------------------------------------------------------------- */}
            <section className="section border-t border-border" aria-labelledby="contacts-heading">
                <div className="container-page">
                    <SectionHeading
                        id="contacts-heading"
                        eyebrow={COPY.contacts.eyebrow}
                        title={COPY.contacts.title}
                    />

                    <div className="mt-12 grid gap-8 lg:grid-cols-2">
                        {/* Contact details */}
                        <div className="flex flex-col gap-6">
                            <ul className="space-y-5 text-sm">
                                {address !== null && (
                                    <ContactRow
                                        icon={<MapPinIcon className="h-4 w-4" />}
                                        label={CONTACT_COPY.address}
                                    >
                                        {address}
                                    </ContactRow>
                                )}

                                {phone !== null && (
                                    <ContactRow
                                        icon={<PhoneIcon className="h-4 w-4" />}
                                        label={CONTACT_COPY.phoneLabel}
                                    >
                                        <a
                                            href={telHref(phone)}
                                            className="transition-all duration-300 hover:text-accent"
                                        >
                                            {phone}
                                        </a>
                                    </ContactRow>
                                )}

                                {workHours !== null && (
                                    <ContactRow
                                        icon={<ClockIcon className="h-4 w-4" />}
                                        label={CONTACT_COPY.hoursLabel}
                                    >
                                        {workHours}
                                    </ContactRow>
                                )}
                            </ul>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button href={routes.booking()}>{COPY.cta.book}</Button>

                                <Button variant="ghost" onClick={openCallbackModal}>
                                    {COPY.cta.callback}
                                </Button>
                            </div>
                        </div>

                        {/* Map placeholder: the address is the only data we have,
                            so the block renders a styled frame instead of an
                            embedded third-party map. */}
                        <div className="relative min-h-[18rem] overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                            <div
                                className="absolute inset-0 opacity-60"
                                aria-hidden="true"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                                    backgroundSize: '48px 48px',
                                }}
                            />

                            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                                <MapPinIcon className="h-8 w-8 text-accent" />

                                {address !== null && (
                                    <p className="max-w-xs text-sm font-medium text-text-primary">
                                        {address}
                                    </p>
                                )}

                                <p className="text-xs text-text-secondary">
                                    {CONTACT_COPY.mapNote}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
| Local pieces
|--------------------------------------------------------------------------
*/

/** Category card: icon, name, service count and the overall price range. */
function CategoryCard({ category }: { category: Category }) {
    const services = category.services ?? [];
    const prices = services.flatMap((service) => [
        Number.parseFloat(service.base_price_min),
        Number.parseFloat(service.base_price_max),
    ]).filter((value) => Number.isFinite(value) && value > 0);

    const min = prices.length > 0 ? Math.min(...prices) : null;
    const max = prices.length > 0 ? Math.max(...prices) : null;

    return (
        <Link
            href={routes.services}
            className="group flex h-full flex-col rounded-2xl border border-border bg-bg-elevated p-6 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:shadow-black/40 focus-visible:ring-2 focus-visible:ring-accent"
        >
            <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent/20"
                aria-hidden="true"
            >
                <CategoryIcon slug={category.slug} className="h-5 w-5" />
            </span>

            <h3 className="mt-5 font-display text-xl font-semibold text-text-primary transition-all duration-300 group-hover:text-accent">
                {category.name}
            </h3>

            <p className="mt-2 text-sm text-text-secondary">
                {services.length > 0
                    ? `${services.length} ${pluralServices(services.length)}`
                    : 'Скоро в прайсе'}
            </p>

            <p className="mt-auto pt-6">
                <span className="text-xs uppercase tracking-wider text-text-secondary">от </span>
                <span className="font-display text-2xl font-semibold text-accent tabular-nums">
                    {formatPriceRange(min, max, 'по запросу')}
                </span>
            </p>
        </Link>
    );
}

/** Russian plural form for "услуга". */
function pluralServices(count: number): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 > 10 && mod100 < 20) {
        return 'услуг';
    }

    if (mod10 === 1) {
        return 'услуга';
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return 'услуги';
    }

    return 'услуг';
}
