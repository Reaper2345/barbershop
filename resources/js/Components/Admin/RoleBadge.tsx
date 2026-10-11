import { Badge } from '@/Components/UI/Badge';
import type { Role } from '@/types';

/*
|--------------------------------------------------------------------------
| RoleBadge
|--------------------------------------------------------------------------
| Single source of truth for how a user role is coloured and labelled, so the
| users table, the topbar and any future role picker agree.
*/

const ROLE_LABELS: Record<Role, string> = {
    admin: 'Администратор',
    master: 'Мастер',
    client: 'Клиент',
};

const ROLE_TONES: Record<Role, 'accent' | 'blue' | 'neutral'> = {
    admin: 'accent',
    master: 'blue',
    client: 'neutral',
};

export function RoleBadge({ role, className }: { role: Role | string; className?: string }) {
    const known = isRole(role);
    const label = known ? ROLE_LABELS[role] : String(role);

    return (
        <Badge tone={known ? ROLE_TONES[role] : 'neutral'} dot className={className}>
            {label}
        </Badge>
    );
}

/** Runtime guard for values arriving as plain strings from the API. */
export function isRole(value: string): value is Role {
    return value === 'admin' || value === 'master' || value === 'client';
}

export { ROLE_LABELS };

export default RoleBadge;
