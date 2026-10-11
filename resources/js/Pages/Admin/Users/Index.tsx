import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { RoleBadge } from '@/Components/Admin/RoleBadge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { PhoneInput } from '@/Components/UI/PhoneInput';
import { Modal } from '@/Components/UI/Modal';
import { Select } from '@/Components/UI/Select';
import { AlertIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL, ROLE_OPTIONS } from '@/lib/panel-copy';
import { formatDate } from '@/lib/format';
import { ROLE_LABELS } from '@/Components/Admin/RoleBadge';
import type { AdminUserRow, Role, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Users/Index — GET /admin/users
|--------------------------------------------------------------------------
| Accounts table with an inline role change and deletion.
|
| Two guards live in the backend (Admin\UserController) and are surfaced as
| errors rather than hidden: an admin cannot demote himself, and a user who
| still has a Master profile cannot be moved off `master` until that profile is
| deleted.
*/

export interface AdminUsersIndexProps {
    users?: AdminUserRow[];
    users_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    users_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
    roles?: Array<{ value: Role; label: string }>;
    filters?: { role?: string; search?: string };
}

export default function AdminUsersIndex({
    users = [],
    users_meta,
    users_links,
    filters,
}: AdminUsersIndexProps) {
    const { auth } = usePage<SharedProps>().props;

    const [editing, setEditing] = useState<AdminUserRow | null>(null);
    const [deleting, setDeleting] = useState<AdminUserRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState(filters?.search ?? '');

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(routes.admin.user(deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const applyFilters = (params: { role?: string; search?: string }): void => {
        router.get(
            routes.admin.users({
                role: params.role ?? filters?.role ?? '',
                search: params.search ?? search,
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const columns: Array<DataTableColumn<AdminUserRow>> = [
        {
            key: 'name',
            header: 'Имя',
            sortable: true,
            accessor: (row) => row.name,
            render: (row) => (
                <span>
                    <span className="block font-medium text-text-primary">{row.name}</span>
                    <span className="text-xs text-text-secondary">
                        Записей: {row.appointments_count ?? 0}
                    </span>
                </span>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true,
            accessor: (row) => row.email,
            render: (row) => <span className="text-text-secondary">{row.email}</span>,
        },
        {
            key: 'phone',
            header: 'Телефон',
            accessor: (row) => row.phone,
            render: (row) =>
                row.phone === null || row.phone === '' ? (
                    <span className="text-text-secondary">—</span>
                ) : (
                    <a
                        href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                        className="text-text-secondary transition-all duration-300 hover:text-accent"
                    >
                        {row.phone}
                    </a>
                ),
        },
        {
            key: 'role',
            header: 'Роль',
            sortable: true,
            accessor: (row) => row.role,
            render: (row) => <RoleBadge role={row.role} />,
        },
        {
            key: 'created_at',
            header: 'Регистрация',
            sortable: true,
            accessor: (row) => row.created_at,
            render: (row) => (
                <span className="whitespace-nowrap text-text-secondary">
                    {formatDate(row.created_at)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => {
                const isSelf = row.id === auth.user?.id;

                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(row)}
                            disabled={isSelf}
                            title={isSelf ? 'Нельзя изменить собственную роль' : undefined}
                        >
                            Роль
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(row)}
                            disabled={isSelf}
                            title={isSelf ? 'Нельзя удалить себя' : undefined}
                            className="border-danger/50 text-danger hover:border-danger hover:text-danger disabled:opacity-40"
                        >
                            {PANEL.common.delete}
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AdminLayout
            title={PANEL.admin.usersTitle}
            subtitle="Все учётные записи: клиенты, мастера и администраторы."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Пользователи' },
            ]}
        >
            <Head title={PANEL.admin.usersTitle} />

            {/* Filters */}
            <form
                className="mb-6 flex flex-wrap items-end gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    applyFilters({ search });
                }}
            >
                <div className="w-full sm:w-72">
                    <Input
                        label={PANEL.common.search}
                        name="search"
                        type="search"
                        placeholder="Имя, email или телефон"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <div className="w-full sm:w-56">
                    <Select
                        label="Роль"
                        name="role"
                        value={filters?.role ?? ''}
                        options={ROLE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                        placeholder="Все роли"
                        onChange={(event) => applyFilters({ role: event.target.value })}
                    />
                </div>

                <Button type="submit" variant="ghost" className="mb-1">
                    {PANEL.common.apply}
                </Button>

                {(filters?.role !== undefined && filters.role !== '') || search !== '' ? (
                    <Button
                        type="button"
                        variant="ghost"
                        className="mb-1"
                        onClick={() => {
                            setSearch('');
                            router.get(routes.admin.users(), {}, { preserveScroll: true });
                        }}
                    >
                        {PANEL.common.reset}
                    </Button>
                ) : null}
            </form>

            <DataTable
                caption={PANEL.admin.usersTitle}
                columns={columns}
                rows={users}
                rowKey={(row) => row.id}
                meta={users_meta}
                links={users_links}
                empty="Пользователей нет"
            />

            <ChangeRoleModal user={editing} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={deleting !== null}
                title="Удалить пользователя?"
                message={
                    deleting === null ? null : (
                        <>
                            Учётная запись{' '}
                            <span className="text-text-primary">{deleting.name}</span> (
                            {ROLE_LABELS[deleting.role]}) будет удалена вместе со всеми записями и
                            отзывами. Действие необратимо.
                        </>
                    )
                }
                processing={processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />
        </AdminLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Change role
|--------------------------------------------------------------------------
| Admin\UserController@update also takes `name` and `phone` (both required /
| nullable), so the modal sends the current values alongside the new role.
*/

function ChangeRoleModal({
    user,
    onClose,
}: {
    user: AdminUserRow | null;
    onClose: () => void;
}) {
    if (user === null) {
        return null;
    }

    return <ChangeRoleForm key={user.id} user={user} onClose={onClose} />;
}

function ChangeRoleForm({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
    const [role, setRole] = useState<Role>(user.role);
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = (): void => {
        if (name.trim().length < 2) {
            setError('Имя должно содержать не менее 2 символов.');

            return;
        }

        if (phone !== '' && !/^[+0-9()\-\s]{6,32}$/.test(phone)) {
            setError('Телефон может содержать цифры, пробелы, скобки, «+» и «-».');

            return;
        }

        setError(null);
        setProcessing(true);

        router.put(
            routes.admin.user(user.id),
            { role, name, phone },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.role ?? errors.name ?? errors.phone ?? 'Не удалось сохранить.');
                },
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="md"
            title="Изменить пользователя"
            description="Смена роли влияет на доступ к разделам сайта."
        >
            <div className="space-y-5">
                <Input
                    label="Имя"
                    name="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />

                <PhoneInput
                    label="Телефон"
                    name="phone"
                    value={phone}
                    onChange={setPhone}
                />

                <Select
                    label="Роль"
                    name="role"
                    required
                    value={role}
                    options={ROLE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                    }))}
                    hint="Мастеру с профилем нельзя сменить роль, пока профиль не удалён."
                    onChange={(event) => setRole(event.target.value as Role)}
                />

                {error !== null && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {error}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                    <Button
                        type="button"
                        loading={processing}
                        onClick={submit}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {PANEL.common.save}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={processing}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {PANEL.common.cancel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
