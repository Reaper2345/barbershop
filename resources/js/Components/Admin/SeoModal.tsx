import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/Components/UI/Modal';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Textarea } from '@/Components/UI/Textarea';
import { routes } from '@/lib/routes';
import type { AdminPageRow } from '@/types';

/*
|--------------------------------------------------------------------------
| SeoModal
|--------------------------------------------------------------------------
| Per-page search metadata, edited from the row action in /admin/pages.
|
| The modal is deliberately separate from the page edit screen: meta title and
| description are a two-field chore, and sending the whole (large) page body
| just to change them meant every SEO tweak risked clobbering the content.
|
| Saving is a PATCH to /admin/pages/{slug}/seo — Page binds by slug, so the
| slug (not the numeric id) is what the URL carries.
*/

export interface SeoModalProps {
    open: boolean;
    page: AdminPageRow | null;
    onClose: () => void;
}

interface SeoFormData {
    meta_title: string;
    meta_description: string;
}

export function SeoModal({ open, page, onClose }: SeoModalProps) {
    const form = useForm<SeoFormData>({ meta_title: '', meta_description: '' });
    const { setData, clearErrors } = form;
    const [saved, setSaved] = useState(false);

    // Re-seed the fields whenever a different page opens the modal.
    useEffect(() => {
        if (!open || page === null) {
            return;
        }

        setSaved(false);
        clearErrors();
        setData({
            meta_title: page.meta_title ?? '',
            meta_description: page.meta_description ?? '',
        });
    }, [open, page, setData, clearErrors]);

    const submit = (): void => {
        if (page === null) {
            return;
        }

        form.patch(routes.admin.pageSeo(page.slug), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSaved(true);
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            title="SEO страницы"
            description={
                page === null
                    ? undefined
                    : `Заголовок и описание для поисковых систем — /${page.slug}`
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
                className="space-y-5"
            >
                <Input
                    label="Meta title"
                    name="meta_title"
                    value={form.data.meta_title}
                    onChange={(event) => form.setData('meta_title', event.target.value)}
                    error={form.errors.meta_title}
                    hint="До 255 символов. Пусто — используется заголовок страницы."
                    disabled={form.processing}
                    autoFocus
                />

                <Textarea
                    label="Meta description"
                    name="meta_description"
                    value={form.data.meta_description}
                    onChange={(event) => form.setData('meta_description', event.target.value)}
                    error={form.errors.meta_description}
                    hint="До 500 символов. Пусто — используется описание сайта."
                    rows={4}
                    disabled={form.processing}
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
                    <Button type="submit" loading={form.processing} disabled={form.processing}>
                        Сохранить
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={form.processing}
                    >
                        Отмена
                    </Button>
                </div>

                {saved && (
                    <p role="status" className="text-xs text-text-secondary">
                        SEO сохранено.
                    </p>
                )}
            </form>
        </Modal>
    );
}

export default SeoModal;
