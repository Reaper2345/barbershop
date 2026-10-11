import type { AppointmentStatus } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin / master panel copy
|--------------------------------------------------------------------------
| All panel text lives here so wording is edited in one place and the pages
| stay markup. Kept separate from lib/content.ts (public site) because the
| audiences and the tone differ.
*/

export const PANEL = {
    common: {
        save: 'Сохранить',
        saving: 'Сохраняем…',
        create: 'Добавить',
        creating: 'Создаём…',
        edit: 'Редактировать',
        delete: 'Удалить',
        deleting: 'Удаляем…',
        cancel: 'Отмена',
        back: 'Назад к списку',
        search: 'Поиск',
        reset: 'Сбросить',
        actions: 'Действия',
        empty: 'Записей нет',
        apply: 'Применить',
        all: 'Все',
        yes: 'Да',
        no: 'Нет',
        unknown: '—',
        confirmDeleteTitle: 'Подтвердите удаление',
    },

    master: {
        dashboardSubtitle: 'Ваши записи, график и услуги в одном месте.',
        scheduleTitle: 'График работы',
        scheduleSubtitle:
            'Отметьте рабочие дни и укажите интервалы. Клиенты видят только часы внутри этих интервалов.',
        servicesTitle: 'Мои услуги',
        servicesSubtitle:
            'Цены и длительность можно сузить относительно прайса барбершопа — базовую услугу изменить нельзя.',
        appointmentsTitle: 'Записи',
        appointmentsSubtitle: 'Новые заявки, подтверждённые визиты и история.',
    },

    admin: {
        dashboardTitle: 'Панель управления',
        dashboardSubtitle: 'Сводка по записям, выручке и клиентам.',
        metricsTitle: 'Ключевые метрики',
        topMastersTitle: 'Топ-5 мастеров',
        recentTitle: 'Последние 10 записей',
        mastersTitle: 'Мастера',
        servicesTitle: 'Услуги',
        categoriesTitle: 'Категории',
        appointmentsTitle: 'Записи',
        reviewsTitle: 'Отзывы',
        usersTitle: 'Пользователи',
        pagesTitle: 'Страницы',
        settingsTitle: 'Настройки',
    },
} as const;

/** Master appointment tabs, in display order. */
export const MASTER_TABS = [
    { id: 'pending', label: 'Новые' },
    { id: 'confirmed', label: 'Подтверждённые' },
    { id: 'done', label: 'Завершённые' },
    { id: 'cancelled', label: 'Отменённые' },
] as const;

/** Russian labels for every appointment status (mirrors the enum). */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждена',
    in_progress: 'В работе',
    done: 'Завершена',
    cancelled: 'Отменена',
};

/** Status options for filters and selects. */
export const STATUS_OPTIONS: Array<{ value: AppointmentStatus; label: string }> = (
    Object.keys(STATUS_LABELS) as AppointmentStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));

/** Role options for the users table. */
export const ROLE_OPTIONS = [
    { value: 'client', label: 'Клиент' },
    { value: 'master', label: 'Мастер' },
    { value: 'admin', label: 'Администратор' },
] as const;

/** Group titles used by the settings screen. */
export const SETTING_GROUP_LABELS: Record<string, string> = {
    general: 'Общие',
    contacts: 'Контакты',
    homepage: 'Главная страница',
    about: 'О барбершопе',
    seo: 'SEO',
};
