import type { ReactNode } from 'react';

/*
|--------------------------------------------------------------------------
| ContactRow
|--------------------------------------------------------------------------
| An icon + label + value row for the address, phone and opening hours. Used
| by the home page contact block and by the contacts page sidebar, both of
| which read their values from `siteSettings`.
*/

export interface ContactRowProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    className?: string;
}

export function ContactRow({ icon, label, children, className }: ContactRowProps) {
    return (
        <li className={['flex gap-4', className ?? ''].join(' ')}>
            <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-accent"
                aria-hidden="true"
            >
                {icon}
            </span>

            <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-text-secondary">
                    {label}
                </span>
                <span className="mt-1 block break-words text-text-primary">{children}</span>
            </span>
        </li>
    );
}

export default ContactRow;
