import { useEffect, useState, type FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { AlertIcon, InfoIcon } from '@/lib/icons';
import { cn } from '@/lib/format';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import type { AdminCategoryRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Categories/Form — create & edit
|--------------------------------------------------------------------------
| One component for both modes. The controller generates the slug from the name
| when the slug field is left empty (Str::slug), and validates it against
| /^[a-z0-9]+(?:-[a-z0-9]+)*$/, so the field shows a live preview of what will
| be stored.
*/

export interface AdminCategoryFormProps {
    /** Present in edit mode. */
    category?: AdminCategoryRow | null;
    /** Renders just the form, for the modal opened from the list. */
    embedded?: boolean;
    /** Called after a successful save and by Cancel when embedded. */
    onDone?: () => void;
}

interface CategoryForm {
    name: string;
    slug: string;
    sort_order: string;
}

export default function AdminCategoryForm({
    category = null,
    embedded = false,
    onDone,
}: AdminCategoryFormProps) {
    const isEdit = category !== null;

    const form = useForm<CategoryForm>({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        sort_order: String(category?.sort_order ?? 10),
    });

    // Live slug preview; the server owns the real value.
    const [slugPreview, setSlugPreview] = useState(category?.slug ?? '');

    useEffect(() => {
        const source = form.data.slug !== '' ? form.data.slug : form.data.name;

        setSlugPreview(slugify(source));
    }, [form.data.slug, form.data.name]);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // `sort_order` is validated as an integer; keep it numeric.
        form.transform((data) => ({
            name: data.name,
            slug: data.slug,
            sort_order: Number(data.sort_order === '' ? 0 : data.sort_order),
        }));

        const options = { onSuccess: () => onDone?.() };

        if (isEdit && category !== null) {
            form.put(routes.admin.category(category.id), options);

            return;
        }

        form.post(routes.admin.categories, options);
    };

    const body = (
        <>
            <form
                onSubmit={submit}
                className={cn('space-y-6', embedded ? 'w-full' : 'max-w-2xl')}
                noValidate
            >
                <Input
                    label="Название"
                    name="name"
                    required
                    maxLength={255}
                    placeholder="Например: Стрижки"
                    value={form.data.name}
                    error={form.errors.name}
                    onChange={(event) => form.setData('name', event.target.value)}
                />

                <Input
                    label="Адрес (slug)"
                    name="slug"
                    maxLength={255}
                    placeholder="оставьте пустым — сгенерируется автоматически"
                    value={form.data.slug}
                    error={form.errors.slug}
                    hint="Строчные латинские буквы, цифры и дефис. Используется в адресе страницы."
                    onChange={(event) => form.setData('slug', event.target.value)}
                />

                {/* Slug preview */}
                <p className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
                    <InfoIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                    Будет сохранено:{' '}
                    <code className="text-accent">{slugPreview === '' ? '—' : slugPreview}</code>
                </p>

                <Input
                    label="Порядок сортировки"
                    name="sort_order"
                    type="number"
                    min={0}
                    max={10000}
                    required
                    value={form.data.sort_order}
                    error={form.errors.sort_order}
                    hint="Меньшее значение — выше в списках. Шаг 10 оставляет место для вставок."
                    onChange={(event) => form.setData('sort_order', event.target.value)}
                />

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

                    {embedded ? (
                        <Button type="button" variant="ghost" onClick={() => onDone?.()}>
                            {PANEL.common.cancel}
                        </Button>
                    ) : (
                        <Link
                            href={routes.admin.categories}
                            className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                        >
                            {PANEL.common.back}
                        </Link>
                    )}
                </div>
            </form>
        </>
    );

    if (embedded) {
        return body;
    }

    return (
        <AdminLayout
            title={isEdit ? `Категория: ${category.name}` : 'Новая категория'}
            subtitle="Категории группируют прайс на сайте и в форме записи."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Категории', href: routes.admin.categories },
                { label: isEdit ? 'Редактирование' : 'Создание' },
            ]}
        >
            <Head title={isEdit ? 'Категория' : 'Новая категория'} />

            {body}
        </AdminLayout>
    );
}

/**
 * Client-side mirror of Str::slug for the preview only. The server value wins.
 */
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

/** Convenience wrapper so the page name in the controller resolves. */
export function AdminCategoryCreate() {
    return <AdminCategoryForm />;
}

export function AdminCategoryEdit({ category }: { category: AdminCategoryRow }) {
    return <AdminCategoryForm category={category} />;
}
