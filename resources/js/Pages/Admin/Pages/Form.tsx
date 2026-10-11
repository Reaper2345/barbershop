import { useMemo, useState, type FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, InfoIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/format';
import type { AdminPageRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Pages/Form — create & edit
|--------------------------------------------------------------------------
| `content` is raw HTML (the seeder stores <h2>/<p>/<ul> …), and AdminPageController
| validates it as a required string. This form therefore edits HTML in a
| textarea with a live preview.
|
| The preview runs the same allow-list sanitiser the public page uses
| (lib/sanitize.ts), so what the admin sees here is what a visitor will get —
| including anything the sanitiser would strip.
*/

export interface AdminPageFormProps {
    page?: AdminPageRow | null;
}

interface PageForm {
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
}

export default function AdminPageForm({ page = null }: AdminPageFormProps) {
    const isEdit = page !== null;

    const form = useForm<PageForm>({
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        content: page?.content ?? '',
        is_published: page?.is_published ?? true,
    });

    const [showPreview, setShowPreview] = useState(false);

    // The preview is sanitised exactly like the public render.
    const preview = useMemo(() => sanitizeHtml(form.data.content), [form.data.content]);

    const slugPreview = useMemo(
        () => slugify(form.data.slug !== '' ? form.data.slug : form.data.title),
        [form.data.slug, form.data.title],
    );

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.transform((data) => ({
            title: data.title,
            // Empty means "generate from the title" server-side.
            slug: data.slug,
            content: data.content,
            is_published: data.is_published,
        }));

        if (isEdit && page !== null) {
            form.put(routes.admin.page(page.id));

            return;
        }

        form.post(routes.admin.pages);
    };

    return (
        <AdminLayout
            title={isEdit ? `Страница: ${page.title}` : 'Новая страница'}
            subtitle="Содержимое хранится как HTML и выводится на сайте после очистки."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Страницы', href: routes.admin.pages },
                { label: isEdit ? 'Редактирование' : 'Создание' },
            ]}
        >
            <Head title={isEdit ? 'Страница' : 'Новая страница'} />

            <form onSubmit={submit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
                {/* Left: fields */}
                <div className="space-y-6">
                    <Input
                        label="Заголовок"
                        name="title"
                        required
                        maxLength={255}
                        placeholder="Например: О барбершопе"
                        value={form.data.title}
                        error={form.errors.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                    />

                    <Input
                        label="Адрес (slug)"
                        name="slug"
                        maxLength={255}
                        placeholder="оставьте пустым — сгенерируется из заголовка"
                        value={form.data.slug}
                        error={form.errors.slug}
                        hint="Строчные латинские буквы, цифры и дефис."
                        onChange={(event) => form.setData('slug', event.target.value)}
                    />

                    <p className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
                        <InfoIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                        Страница откроется по адресу:{' '}
                        <code className="text-accent">
                            /{slugPreview === '' ? '—' : slugPreview}
                        </code>
                    </p>

                    <Textarea
                        label="Содержимое (HTML)"
                        name="content"
                        rows={18}
                        required
                        placeholder={'<h2>Заголовок раздела</h2>\n<p>Текст…</p>'}
                        value={form.data.content}
                        error={form.errors.content}
                        hint="Разрешены заголовки, абзацы, списки, ссылки и изображения."
                        className="font-mono text-xs"
                        onChange={(event) => form.setData('content', event.target.value)}
                    />

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_published}
                            onChange={(event) => form.setData('is_published', event.target.checked)}
                            className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        <span className="text-text-primary">Опубликовать на сайте</span>
                    </label>

                    {form.hasErrors && (
                        <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                            <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                            Проверьте выделенные поля.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" loading={form.processing} size="lg">
                            {isEdit ? PANEL.common.save : PANEL.common.create}
                        </Button>

                        <Link
                            href={routes.admin.pages}
                            className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                        >
                            {PANEL.common.back}
                        </Link>
                    </div>
                </div>

                {/* Right: preview */}
                <aside className="xl:sticky xl:top-28 xl:self-start">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-display text-lg font-semibold text-text-primary">
                            Предпросмотр
                        </h2>

                        <button
                            type="button"
                            onClick={() => setShowPreview((previous) => !previous)}
                            className="text-xs text-accent transition-all duration-300 hover:text-accent-hover"
                        >
                            {showPreview ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>

                    <div
                        className={cn(
                            'mt-4 rounded-2xl border border-border bg-bg-elevated p-6',
                            !showPreview && 'hidden',
                        )}
                    >
                        {preview.trim() === '' ? (
                            <p className="text-sm text-text-secondary">
                                Пока нечего показать — начните вводить содержимое.
                            </p>
                        ) : (
                            <article
                                className="prose-barber"
                                // Sanitised above with the same allow-list the
                                // public page uses.
                                dangerouslySetInnerHTML={{ __html: preview }}
                            />
                        )}
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                        Теги и атрибуты вне разрешённого списка удаляются при выводе на сайте.
                        Предпросмотр показывает именно то, что увидят посетители.
                    </p>
                </aside>
            </form>
        </AdminLayout>
    );
}

/** Client-side mirror of Str::slug for the preview only. */
function slugify(value: string): string {
    const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
        и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
        с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
        щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };

    return value
        .toLowerCase()
        .split('')
        .map((char) => map[char] ?? char)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
