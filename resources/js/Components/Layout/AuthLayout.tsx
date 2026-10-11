import type { ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircleIcon, ArrowRightIcon } from '@/lib/icons';
import { routes } from '@/lib/routes';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| AuthLayout
|--------------------------------------------------------------------------
| Centred card for the login and registration screens: brand mark, a short
| promise, the form card, and a footer slot for the "already registered?"
| switch. Deliberately narrow (max-w-md) and free of the public navigation so
| nothing competes with the form.
*/

export interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    /** Rendered under the card, e.g. a link to the other auth screen. */
    footer?: ReactNode;
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
    const { siteSettings } = usePage<SharedProps>().props;
    const siteName = siteSettings.site_name ?? 'Барбершоп';

    return (
        <div className="flex min-h-screen flex-col bg-bg-primary">
            <Head title={title} />

            <div className="container-page flex flex-1 flex-col items-center justify-center py-16">
                <Link
                    href={routes.home}
                    className="mb-10 text-center transition-all duration-300 hover:opacity-90"
                    aria-label={`${siteName} — на главную`}
                >
                    <span className="block font-display text-2xl font-semibold tracking-tight text-text-primary">
                        {siteName}
                    </span>
                    <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.3em] text-text-secondary">
                        Barbershop
                    </span>
                </Link>

                <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-8 sm:p-10">
                    <header className="mb-8">
                        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                            {title}
                        </h1>

                        {subtitle !== undefined && (
                            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                {subtitle}
                            </p>
                        )}
                    </header>

                    {children}
                </div>

                {footer !== undefined && (
                    <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>
                )}

                <Link
                    href={routes.home}
                    className="mt-10 inline-flex items-center gap-2 text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                >
                    <ArrowRightIcon className="h-4 w-4 rotate-180" />
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Shared auth form pieces
|--------------------------------------------------------------------------
*/

/** Small feature list shown beside/under the auth form. */
export function AuthPerks({ items }: { items: string[] }) {
    return (
        <ul className="space-y-2.5">
            {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                </li>
            ))}
        </ul>
    );
}

/** Inline validation summary for the auth forms. */
export function AuthErrorSummary({ errors }: { errors: string[] }) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <ul
            role="alert"
            className="space-y-1 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger"
        >
            {errors.map((error) => (
                <li key={error}>{error}</li>
            ))}
        </ul>
    );
}

export default AuthLayout;
