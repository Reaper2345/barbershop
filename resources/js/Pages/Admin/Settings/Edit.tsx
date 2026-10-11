import { useMemo, useState, type FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { PhoneInput } from '@/Components/UI/PhoneInput';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, InfoIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL, SETTING_GROUP_LABELS } from '@/lib/panel-copy';
import { cn } from '@/lib/format';
import type { SettingRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Settings/Edit — GET/PUT /admin/settings
|--------------------------------------------------------------------------
| Grouped form, saved in one PUT. The controller sends `settings` as a flat
| list of {key, value, group} rows and only updates keys that already exist
| (a crafted payload cannot invent new settings), so this screen renders the
| groups it actually received.
|
| Tabs are derived from the payload rather than hardcoded, so adding a setting
| to the seeder surfaces here automatically.
|
| `features` is stored as JSON. It is validated client-side before submission
| so a typo cannot be silently persisted as an unparseable string.
*/

export interface AdminSettingsEditProps {
    settings?: SettingRow[];
    groups?: string[];
}

type SettingsForm = Record<string, string>;

const FIELD_LABELS: Record<string, string> = {
    site_name: 'Название барбершопа',
    phone: 'Телефон',
    address: 'Адрес',
    email: 'Email',
    instagram: 'Instagram',
    work_hours: 'Часы работы',
    hero_title: 'Заголовок на главной',
    hero_subtitle: 'Подзаголовок на главной',
    about_text: 'Текст «О нас»',
    features: 'Блок «Почему мы» (JSON)',
    meta_title: 'Meta title',
    meta_description: 'Meta description',
};

const FIELD_HINTS: Record<string, string> = {
    features:
        'Массив объектов: [{"title":"…","text":"…","icon":"award"}]. Допустимые иконки: award, scissors, coffee, shield.',
    hero_title: 'Крупный заголовок в первом экране главной страницы.',
    hero_subtitle: 'Одно-два предложения под заголовком.',
    about_text: 'Используется в разделе «О нас» и в подвале сайта.',
    meta_description: 'До 160 символов — текст под ссылкой в поиске.',
};

const MULTILINE = new Set(['about_text', 'hero_subtitle', 'meta_description', 'features']);

export default function AdminSettingsEdit({
    settings = [],
    groups = [],
}: AdminSettingsEditProps) {
    // Flat key → value map, which is what the controller expects back.
    const initial = useMemo<SettingsForm>(() => {
        const record: SettingsForm = {};

        for (const setting of settings) {
            record[setting.key] = setting.value ?? '';
        }

        return record;
    }, [settings]);

    const form = useForm<{ settings: SettingsForm }>({ settings: initial });

    // Group tabs, derived from the payload (falling back to the settings' own
    // group column when the controller omits the list).
    const availableGroups = useMemo<string[]>(() => {
        if (groups.length > 0) {
            return groups;
        }

        return [...new Set(settings.map((setting) => setting.group))];
    }, [groups, settings]);

    const [activeGroup, setActiveGroup] = useState<string>(availableGroups[0] ?? 'general');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const groupSettings = settings.filter((setting) => setting.group === activeGroup);

    const setValue = (key: string, value: string): void => {
        setSaved(false);
        form.setData('settings', { ...form.data.settings, [key]: value });
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // Validate the JSON field before anything is persisted.
        const features = form.data.settings.features;

        if (features !== undefined && features.trim() !== '') {
            try {
                const parsed: unknown = JSON.parse(features);

                if (!Array.isArray(parsed)) {
                    setJsonError('Ожидается JSON-массив объектов.');

                    return;
                }
            } catch {
                setJsonError('Некорректный JSON. Проверьте кавычки и запятые.');

                return;
            }
        }

        setJsonError(null);

        form.put(routes.admin.settings, {
            preserveScroll: true,
            onSuccess: () => setSaved(true),
        });
    };

    return (
        <AdminLayout
            title={PANEL.admin.settingsTitle}
            subtitle="Тексты и контакты сайта. Изменения применяются сразу после сохранения."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Настройки' },
            ]}
        >
            <Head title={PANEL.admin.settingsTitle} />

            {/* Group tabs */}
            <div
                role="tablist"
                aria-label="Группы настроек"
                className="mb-8 flex gap-2 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {availableGroups.map((group) => {
                    const selected = group === activeGroup;

                    return (
                        <button
                            key={group}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setActiveGroup(group)}
                            className={cn(
                                'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-all duration-300',
                                'focus-visible:ring-2 focus-visible:ring-accent',
                                selected ? 'text-accent' : 'text-text-secondary hover:text-text-primary',
                            )}
                        >
                            {SETTING_GROUP_LABELS[group] ?? group}

                            {selected && (
                                <span
                                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={submit} className="max-w-3xl space-y-6">
                {groupSettings.length === 0 ? (
                    <p className="rounded-2xl border border-border bg-bg-elevated px-5 py-8 text-center text-sm text-text-secondary">
                        В этой группе нет настроек.
                    </p>
                ) : (
                    groupSettings.map((setting) => {
                        const label = FIELD_LABELS[setting.key] ?? setting.key;
                        const hint = FIELD_HINTS[setting.key];
                        const value = form.data.settings[setting.key] ?? '';
                        const error = form.errors[`settings.${setting.key}` as keyof typeof form.errors];

                        return MULTILINE.has(setting.key) ? (
                            <Textarea
                                key={setting.key}
                                label={label}
                                name={setting.key}
                                rows={setting.key === 'features' ? 10 : 4}
                                value={value}
                                error={
                                    setting.key === 'features' ? (jsonError ?? error) : error
                                }
                                hint={hint}
                                className={setting.key === 'features' ? 'font-mono text-xs' : undefined}
                                onChange={(event) => setValue(setting.key, event.target.value)}
                            />
                        ) : setting.key === 'phone' ? (
                            <PhoneInput
                                key={setting.key}
                                label={label}
                                name={setting.key}
                                placeholder="+7 (___) ___-__-__"
                                value={value}
                                error={error}
                                hint={hint}
                                onChange={(next) => setValue(setting.key, next)}
                            />
                        ) : (
                            <Input
                                key={setting.key}
                                label={label}
                                name={setting.key}
                                value={value}
                                error={error}
                                hint={hint}
                                onChange={(event) => setValue(setting.key, event.target.value)}
                            />
                        );
                    })
                )}

                {form.hasErrors && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        Проверьте выделенные поля.
                    </p>
                )}

                {saved && !form.processing && (
                    <p
                        role="status"
                        className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-xs text-success"
                    >
                        Настройки сохранены.
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
                    <Button type="submit" loading={form.processing} size="lg">
                        {form.processing ? PANEL.common.saving : 'Сохранить настройки'}
                    </Button>

                    <p className="flex items-center gap-2 text-xs text-text-secondary">
                        <InfoIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                        Сохраняются сразу все группы, а не только открытая.
                    </p>
                </div>

                {/* Unsaved-changes indicator */}
                {form.isDirty && (
                    <p className="text-xs text-[#fbbf24]" role="status">
                        Есть несохранённые изменения.
                    </p>
                )}
            </form>
        </AdminLayout>
    );
}
