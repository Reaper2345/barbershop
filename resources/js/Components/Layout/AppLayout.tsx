import { useEffect, useState, type ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Header } from '@/Components/Layout/Header';
import { Footer } from '@/Components/Layout/Footer';
import { CallbackModal } from '@/Components/Layout/CallbackModal';
import { CheckCircleIcon, AlertIcon, CloseIcon } from '@/lib/icons';
import { cn } from '@/lib/format';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| AppLayout — public shell
|--------------------------------------------------------------------------
| Header + main + Footer, plus two things that must exist exactly once per
| page: the lead-capture modal and the flash-message region.
|
| `title` is piped through Inertia's <Head>, so the document title follows the
| "Page — Site" pattern configured in app.tsx.
*/

export interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export function AppLayout({ children, title, description }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-bg-primary">
            <Head title={title}>
                {description !== undefined && (
                    <meta name="description" content={description} />
                )}
            </Head>

            {/* Keyboard users can jump straight past the navigation. */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-accent focus:px-6 focus:py-3 focus:text-sm focus:font-medium focus:text-bg-primary"
            >
                Перейти к содержимому
            </a>

            <Header />

            <main id="main-content" className="flex-1">
                {children}
            </main>

            <Footer />

            <CallbackModal />
            <FlashMessages />
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Flash messages
|--------------------------------------------------------------------------
| Reads `flash.success|error` (set by the controllers) and renders a toast
| that dismisses itself. `status` is used by Laravel's password-reset flow and
| is not surfaced on the public site.
*/

function FlashMessages() {
    const { flash } = usePage<SharedProps>().props;
    const [dismissed, setDismissed] = useState<string[]>([]);

    type Tone = 'success' | 'error' | 'warning';

    const messages = [
        flash.success !== null ? { key: `success-${flash.success}`, tone: 'success' as Tone, text: flash.success } : null,
        /*
         * `warning`: the action succeeded but something needs attention (the
         * booking was saved while its confirmation email failed). Gold, alert
         * icon, and it lingers twice as long as the other tones.
         */
        flash.warning !== null && flash.warning !== undefined
            ? { key: `warning-${flash.warning}`, tone: 'warning' as Tone, text: flash.warning }
            : null,
        flash.error !== null ? { key: `error-${flash.error}`, tone: 'error' as Tone, text: flash.error } : null,
    ].filter((message): message is { key: string; tone: Tone; text: string } => message !== null);

    const visible = messages.filter((message) => !dismissed.includes(message.key));

    useEffect(() => {
        if (visible.length === 0) {
            return;
        }

        const hasWarning = visible.some((message) => message.tone === 'warning');

        const timeout = window.setTimeout(
            () => {
                setDismissed((previous) => [...previous, ...visible.map((message) => message.key)]);
            },
            // 12s for a warning: it names a phone number the client may need.
            hasWarning ? 12000 : 6000,
        );

        return () => window.clearTimeout(timeout);
    }, [flash.success, flash.warning, flash.error]); // eslint-disable-line react-hooks/exhaustive-deps

    if (visible.length === 0) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-3 px-4"
            role="status"
            aria-live="polite"
        >
            {visible.map((message) => (
                <div
                    key={message.key}
                    className={cn(
                        'pointer-events-auto flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-xl shadow-black/50 backdrop-blur',
                        message.tone === 'success' && 'border-success/40 bg-success/15 text-text-primary',
                        message.tone === 'warning' && 'border-accent/60 bg-accent/15 text-text-primary',
                        message.tone === 'error' && 'border-danger/40 bg-danger/15 text-text-primary',
                    )}
                >
                    {message.tone === 'success' && (
                        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    )}

                    {message.tone === 'warning' && (
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    )}

                    {message.tone === 'error' && (
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    )}

                    <p className="flex-1">{message.text}</p>

                    <button
                        type="button"
                        onClick={() => setDismissed((previous) => [...previous, message.key])}
                        aria-label="Скрыть сообщение"
                        className="rounded-full p-0.5 text-text-secondary transition-all duration-300 hover:text-text-primary"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default AppLayout;
