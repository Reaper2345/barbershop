import type { HTMLAttributes, ReactNode } from 'react';
import type { AppointmentStatus } from '@/types';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Badge
|--------------------------------------------------------------------------
| Status colours mirror App\Enums\AppointmentStatus::color() so the badge in
| the UI and the badge in the admin tables never disagree. Tones are rendered
| as translucent tints so they sit correctly on the near-black background.
*/

export type BadgeTone =
    | 'neutral'
    | 'accent'
    | 'success'
    | 'danger'
    | 'info'
    | 'amber'
    | 'blue'
    | 'indigo'
    | 'emerald'
    | 'rose';

const TONES: Record<BadgeTone, string> = {
    neutral: 'border-border bg-bg-secondary text-text-secondary',
    accent: 'border-accent/40 bg-accent/15 text-accent',
    success: 'border-success/40 bg-success/15 text-success',
    danger: 'border-danger/40 bg-danger/15 text-danger',
    info: 'border-white/15 bg-white/10 text-text-primary',
    // Tailwind's palette, matching the enum's `color()` names.
    amber: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.15)] text-[#fbbf24]',
    blue: 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.15)] text-[#60a5fa]',
    indigo: 'border-[rgba(129,140,248,0.4)] bg-[rgba(129,140,248,0.15)] text-[#818cf8]',
    emerald: 'border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.15)] text-[#34d399]',
    rose: 'border-[rgba(251,113,133,0.4)] bg-[rgba(251,113,133,0.15)] text-[#fb7185]',
};

/** Enum value → tone, kept in lockstep with AppointmentStatus::color(). */
const STATUS_TONES: Record<AppointmentStatus, BadgeTone> = {
    pending: 'amber',
    confirmed: 'blue',
    in_progress: 'indigo',
    done: 'emerald',
    cancelled: 'rose',
};

/** Russian labels, mirroring AppointmentStatus::label(). */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждена',
    in_progress: 'В работе',
    done: 'Завершена',
    cancelled: 'Отменена',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
    size?: 'sm' | 'md';
    /** Small leading dot — handy for status pills. */
    dot?: boolean;
    children: ReactNode;
}

export function Badge({
    tone = 'neutral',
    size = 'sm',
    dot = false,
    className,
    children,
    ...props
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-medium',
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
                TONES[tone],
                className,
            )}
            {...props}
        >
            {dot && (
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            )}
            {children}
        </span>
    );
}

/** Convenience wrapper for booking statuses. */
export function StatusBadge({
    status,
    size = 'sm',
    className,
}: {
    status: AppointmentStatus;
    size?: 'sm' | 'md';
    className?: string;
}) {
    return (
        <Badge tone={STATUS_TONES[status]} size={size} dot className={className}>
            {STATUS_LABELS[status]}
        </Badge>
    );
}

export default Badge;
