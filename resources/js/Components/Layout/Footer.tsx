import type { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { openCallbackModal } from './CallbackModal';
import {
    ClockIcon,
    InstagramIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    TelegramIcon,
    WhatsappIcon,
} from '@/lib/icons';
import { primaryNav } from '@/lib/routes';
import { telHref } from '@/lib/format';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Footer
|--------------------------------------------------------------------------
| Four columns — about, navigation, contacts, social — over a copyright bar.
| All four are fed from `siteSettings`, so nothing here is hardcoded copy.
| Social entries render only when the matching setting exists.
*/

export function Footer() {
    const { siteSettings, appName } = usePage<SharedProps>().props;

    const siteName = siteSettings.site_name ?? appName ?? 'Барбершоп';
    const about = siteSettings.about_text ?? null;
    const address = siteSettings.address ?? null;
    const phone = siteSettings.phone ?? null;
    const email = siteSettings.email ?? null;
    const workHours = siteSettings.work_hours ?? null;
    const instagram = siteSettings.instagram ?? null;

    // Telegram/WhatsApp are derived from the shared phone number, so they only
    // appear once a real number is configured in the admin panel.
    const phoneDigits = phone === null ? null : phone.replace(/[^\d]/g, '');
    const whatsapp = phoneDigits === null || phoneDigits === '' ? null : `https://wa.me/${phoneDigits}`;
    const telegram = phoneDigits === null || phoneDigits === '' ? null : `https://t.me/+${phoneDigits}`;

    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-bg-secondary">
            <div className="container-page py-16 md:py-20">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {/* About */}
                    <div>
                        <h2 className="font-display text-xl font-semibold text-text-primary">
                            {siteName}
                        </h2>

                        {about !== null && (
                            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                                {about.length > 220 ? `${about.slice(0, 220).trimEnd()}…` : about}
                            </p>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav aria-label="Навигация в подвале">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                            Навигация
                        </h2>
                        <ul className="mt-5 space-y-3 text-sm">
                            {primaryNav.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="link-muted">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Contacts */}
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                            Контакты
                        </h2>

                        <ul className="mt-5 space-y-3 text-sm text-text-secondary">
                            {address !== null && (
                                <li className="flex gap-2.5">
                                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                                    <span>{address}</span>
                                </li>
                            )}

                            {phone !== null && (
                                <li className="flex gap-2.5">
                                    <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                    <a href={telHref(phone)} className="link-muted">
                                        {phone}
                                    </a>
                                </li>
                            )}

                            {email !== null && (
                                <li className="flex gap-2.5">
                                    <MailIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                    <a href={`mailto:${email}`} className="link-muted">
                                        {email}
                                    </a>
                                </li>
                            )}

                            {workHours !== null && (
                                <li className="flex gap-2.5">
                                    <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{workHours}</span>
                                </li>
                            )}
                        </ul>

                        <button
                            type="button"
                            onClick={openCallbackModal}
                            className="mt-5 text-sm font-medium text-accent underline underline-offset-4 transition-all duration-300 hover:text-accent-hover"
                        >
                            Заказать звонок
                        </button>
                    </div>

                    {/* Social */}
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                            Мы в сети
                        </h2>

                        <ul className="mt-5 space-y-3 text-sm">
                            {instagram !== null && (
                                <li>
                                    <SocialLink href={instagram} label="Instagram">
                                        <InstagramIcon className="h-4 w-4" />
                                        Instagram
                                    </SocialLink>
                                </li>
                            )}

                            {telegram !== null && (
                                <li>
                                    <SocialLink href={telegram} label="Telegram">
                                        <TelegramIcon className="h-4 w-4" />
                                        Telegram
                                    </SocialLink>
                                </li>
                            )}

                            {whatsapp !== null && (
                                <li>
                                    <SocialLink href={whatsapp} label="WhatsApp">
                                        <WhatsappIcon className="h-4 w-4" />
                                        WhatsApp
                                    </SocialLink>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-border">
                <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-text-secondary sm:flex-row">
                    <p>
                        © {year} {siteName}. Все права защищены.
                    </p>
                    <p>Онлайн-запись работает круглосуточно.</p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({
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
            className="link-muted inline-flex items-center gap-2.5"
        >
            {children}
        </a>
    );
}

export default Footer;
