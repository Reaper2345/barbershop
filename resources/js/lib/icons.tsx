import type { SVGProps } from 'react';

/*
|--------------------------------------------------------------------------
| Icon set
|--------------------------------------------------------------------------
| Lightweight stroke icons sized through `className` (default 1em via the
| `h-6 w-6` utility on the consumer side). They are inline SVG rather than an
| icon font so they inherit `currentColor`, stay crisp and need no extra
| network request. Every icon is decorative by default (`aria-hidden`); pass
| `aria-hidden={false}` plus a `title` where the icon is the only label.
*/

export type IconProps = SVGProps<SVGSVGElement> & {
    /** Stroke width; 1.5 suits the minimalist aesthetic. */
    strokeWidth?: number;
};

function base({ strokeWidth = 1.5, ...props }: IconProps): SVGProps<SVGSVGElement> {
    return {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
        ...props,
    };
}

/* ------------------------------------------------------------------ */
/* Navigation & chrome                                                 */
/* ------------------------------------------------------------------ */

export function MenuIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function ChevronUpIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m18 15-6-6-6 6" />
        </svg>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

export function ArrowRightIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export function PhoneIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
        </svg>
    );
}

export function MapPinIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

export function ClockIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

export function MailIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Social                                                              */
/* ------------------------------------------------------------------ */

export function InstagramIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <path d="M17.5 6.5h.01" />
        </svg>
    );
}

export function TelegramIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M21 4 3 11l5 2 2 6 3-4 5 3 3-14Z" />
        </svg>
    );
}

export function WhatsappIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12Z" />
            <path d="M8.5 9.5c0 3 2 5 5 5l1-1.5-2-1-.8.8a4.5 4.5 0 0 1-1.5-1.5l.8-.8-1-2-1.5 1Z" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Content & status                                                    */
/* ------------------------------------------------------------------ */

export function StarIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
        </svg>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="m4 12.5 5 5L20 6.5" />
        </svg>
    );
}

export function CheckCircleIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12.5 2.5 2.5L16 9.5" />
        </svg>
    );
}

export function AlertIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16h.01" />
        </svg>
    );
}

export function InfoIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-5M12 8h.01" />
        </svg>
    );
}

export function UserIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export function ScissorsIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
        </svg>
    );
}

export function AwardIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="12" cy="9" r="6" />
            <path d="m8.2 14.3-1.7 7 5.5-3 5.5 3-1.7-7" />
        </svg>
    );
}

export function CoffeeIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M17 8h1.5a2.5 2.5 0 0 1 0 5H17" />
            <path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z" />
            <path d="M7 2v2M11 2v2" />
        </svg>
    );
}

export function ShieldIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

export function CalendarIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 11h18" />
        </svg>
    );
}

export function QuoteIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M9 6c-3 1.3-4.5 3.8-4.5 7.2V18h4.2v-4.5H6.3c0-2 .8-3.4 2.7-4.3L9 6ZM19 6c-3 1.3-4.5 3.8-4.5 7.2V18h4.2v-4.5h-2.4c0-2 .8-3.4 2.7-4.3L19 6Z" />
        </svg>
    );
}

export function ImagesIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="3" y="6" width="14" height="12" rx="2" />
            <path d="M7 18V8m14-2v10.5a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="10" r="1.2" />
            <path d="M3.5 15.5 7 12.5l3 3 2.5-2 3 2.5" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Service category icons (matched to the seeded category slugs)        */
/* ------------------------------------------------------------------ */

export function ScissorsCategoryIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
        </svg>
    );
}

export function BeardCategoryIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M5 4v5a7 7 0 0 0 14 0V4" />
            <path d="M5 9c2.5 0 4-1.2 7-1.2S16.5 9 19 9" />
            <path d="M9 15c1 1.6 2 2.4 3 2.4s2-.8 3-2.4" />
        </svg>
    );
}

export function ComplexCategoryIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M12 3v18M5 8.5 12 12l7-3.5M5 15.5 12 12l7 3.5" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

export function CareCategoryIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M12 3s5.5 5.4 5.5 9.5A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.5C6.5 8.4 12 3 12 3Z" />
            <path d="M12 18v3" />
        </svg>
    );
}

export function CategoryIcon({
    slug,
    ...props
}: IconProps & { slug: string }) {
    switch (slug) {
        case 'strizhki':
            return <ScissorsCategoryIcon {...props} />;
        case 'boroda-i-usy':
            return <BeardCategoryIcon {...props} />;
        case 'kompleksnye':
            return <ComplexCategoryIcon {...props} />;
        case 'ukhod':
            return <CareCategoryIcon {...props} />;
        default:
            // Unknown categories added through the admin panel still get an icon.
            return <ScissorsIcon {...props} />;
    }
}
