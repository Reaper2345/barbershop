import { useMemo, type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { CallbackForm } from '@/Components/Public/CallbackForm';
import { ContactRow } from '@/Components/Public/ContactRow';
import { VenueMap, parseCoordinate } from '@/Components/Public/VenueMap';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import {
    ClockIcon,
    InfoIcon,
    InstagramIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    TelegramIcon,
    WhatsappIcon,
} from '@/lib/icons';
import { CONTACT_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { sanitizeHtml } from '@/lib/sanitize';
import { telHref } from '@/lib/format';
import type { Page as CmsPage, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Pages/Show — GET /about, GET /contacts
|--------------------------------------------------------------------------
| Renders a CMS page from the `pages` table. PageController routes both the
| /about and /contacts routes here, so the contacts slug additionally gets the
| contact details from `siteSettings` and the "Заказать звонок" form.
|
| The HTML is authored in the admin panel and therefore sanitised against an
| allow-list before it reaches dangerouslySetInnerHTML (lib/sanitize.ts).
*/

export interface PageShowProps {
    page: CmsPage;
}

export default function PageShow({ page }: PageShowProps) {
    const { siteSettings } = usePage<SharedProps>().props;

    const isContacts = page.slug === 'contacts';

    // Sanitising is comparatively expensive, so it runs once per content value.
    const html = useMemo(() => sanitizeHtml(page.content), [page.content]);

    const address = siteSettings.address ?? null;
    const phone = siteSettings.phone ?? null;
    const email = siteSettings.email ?? null;
    const workHours = siteSettings.work_hours ?? null;
    const instagram = siteSettings.instagram ?? null;
    // Map pin, when the coordinates are configured in the admin settings.
    const mapLat = parseCoordinate(siteSettings.map_lat);
    const mapLng = parseCoordinate(siteSettings.map_lng);

    const phoneDigits = phone === null ? '' : phone.replace(/[^\d]/g, '');
    const whatsapp = phoneDigits === '' ? null : `https://wa.me/${phoneDigits}`;
    const telegram = phoneDigits === '' ? null : `https://t.me/+${phoneDigits}`;

    const hasContacts = address !== null || phone !== null || email !== null || workHours !== null;

    /*
     * Search metadata: a per-page override (edited in the admin modal from
     * /admin/pages) wins, otherwise fall back to the page title plus the
     * site-wide description.
     */
    const metaTitle =
        page.meta_title !== null && page.meta_title !== undefined && page.meta_title !== ''
            ? page.meta_title
            : page.title;
    const metaDescription =
        page.meta_description !== null &&
        page.meta_description !== undefined &&
        page.meta_description !== ''
            ? page.meta_description
            : `${page.title} — ${siteSettings.site_name ?? 'барбершоп'}`;

    return (
        <AppLayout title={metaTitle} description={metaDescription}>
            {/* Page heading */}
            <section className="border-b border-border bg-bg-secondary">
                <div className="container-page py-16 md:py-20">
                    <p className="section-eyebrow">
                        {isContacts ? 'Связаться с нами' : 'О барбершопе'}
                    </p>

                    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                        {page.title}
                    </h1>
                </div>
            </section>

            <section className="section">
                <div className="container-page">
                    {isContacts ? (
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
                            {/* Page body */}
                            <article
                                className="prose-barber"
                                // Content is sanitised above; see lib/sanitize.ts.
                                dangerouslySetInnerHTML={{ __html: html }}
                            />

                            {/* Contact details + callback form */}
                            <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
                                {hasContacts && (
                                    <div className="rounded-2xl border border-border bg-bg-elevated p-6 sm:p-8">
                                        <h2 className="font-display text-xl font-semibold text-text-primary">
                                            Наши контакты
                                        </h2>

                                        <ul className="mt-6 space-y-5 text-sm">
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

                                            {email !== null && (
                                                <ContactRow
                                                    icon={<MailIcon className="h-4 w-4" />}
                                                    label={CONTACT_COPY.emailLabel}
                                                >
                                                    <a
                                                        href={`mailto:${email}`}
                                                        className="transition-all duration-300 hover:text-accent"
                                                    >
                                                        {email}
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

                                        {(instagram !== null || telegram !== null || whatsapp !== null) && (
                                            <div className="mt-8 border-t border-border pt-6">
                                                <p className="text-xs uppercase tracking-wider text-text-secondary">
                                                    {CONTACT_COPY.socialLabel}
                                                </p>

                                                <ul className="mt-4 flex flex-wrap gap-3">
                                                    {instagram !== null && (
                                                        <li>
                                                            <SocialPill href={instagram} label="Instagram">
                                                                <InstagramIcon className="h-4 w-4" />
                                                                Instagram
                                                            </SocialPill>
                                                        </li>
                                                    )}

                                                    {telegram !== null && (
                                                        <li>
                                                            <SocialPill href={telegram} label="Telegram">
                                                                <TelegramIcon className="h-4 w-4" />
                                                                Telegram
                                                            </SocialPill>
                                                        </li>
                                                    )}

                                                    {whatsapp !== null && (
                                                        <li>
                                                            <SocialPill href={whatsapp} label="WhatsApp">
                                                                <WhatsappIcon className="h-4 w-4" />
                                                                WhatsApp
                                                            </SocialPill>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Callback form */}
                                <div className="rounded-2xl border border-border bg-bg-elevated p-6 sm:p-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="font-display text-xl font-semibold text-text-primary">
                                            {CONTACT_COPY.callbackTitle}
                                        </h2>

                                        <Badge tone="accent">Перезвоним</Badge>
                                    </div>

                                    <CallbackForm className="mt-6" />
                                </div>

                                {/* Yandex Maps (JS API v3 with a key from
                                    settings, OpenStreetMap embed without one). */}
                                <VenueMap
                                    lat={mapLat}
                                    lng={mapLng}
                                    address={address}
                                    apiKey={siteSettings.yandex_maps_api_key ?? null}
                                    note={CONTACT_COPY.mapNote}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
                            {/* Page body */}
                            {html.trim() === '' ? (
                                <EmptyState
                                    icon={<InfoIcon />}
                                    title="Страница ещё не заполнена"
                                    description="Содержимое появится после того, как администратор добавит текст."
                                />
                            ) : (
                                <article
                                    className="prose-barber max-w-3xl"
                                    // Sanitised above; see lib/sanitize.ts.
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            )}

                            {/* Sidebar CTA */}
                            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                                <div className="rounded-2xl border border-border bg-bg-elevated p-6">
                                    <h2 className="font-display text-lg font-semibold text-text-primary">
                                        Записаться онлайн
                                    </h2>

                                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                                        Свободное время мастеров видно сразу — выберите удобный слот.
                                    </p>

                                    <Button href={routes.booking()} fullWidth className="mt-5">
                                        Записаться
                                    </Button>

                                    <Button
                                        href={routes.masters}
                                        variant="ghost"
                                        fullWidth
                                        className="mt-3"
                                    >
                                        Наши мастера
                                    </Button>
                                </div>

                                {workHours !== null && (
                                    <div className="rounded-2xl border border-border bg-bg-elevated p-6">
                                        <p className="text-xs uppercase tracking-wider text-text-secondary">
                                            {CONTACT_COPY.hoursLabel}
                                        </p>
                                        <p className="mt-2 text-sm text-text-primary">{workHours}</p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}
                </div>
            </section>
        </AppLayout>
    );
}

/** External social link rendered as a pill. */
function SocialPill({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (откроется в новой вкладке)`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
        >
            {children}
        </a>
    );
}
