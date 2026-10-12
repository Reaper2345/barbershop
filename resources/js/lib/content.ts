/*
|--------------------------------------------------------------------------
| Public site copy
|--------------------------------------------------------------------------
| The rule for the public pages is "everything comes from settings or the
| database". Two categories of string have no database home yet and are
| therefore declared here, once, instead of being scattered through the
| components:
|
|   1. Section headings and button labels that are part of the design rather
|      than of the content ("Услуги", "Почему мы", "Записаться").
|   2. The "Почему мы" feature list. SettingSeeder has no keys for these yet,
|      so each entry is read from `siteSettings` first and falls back to the
|      default below. Adding why_1_title/why_1_text … to the seeder (or to the
|      admin settings screen) is enough to make them editable — no component
|      change is needed.
|
| See the notes at the end of this prompt's summary for the exact setting keys
| to add.
*/

export interface Feature {
    /** Setting key holding the title, e.g. "why_1_title". */
    titleKey: string;
    /** Setting key holding the body text, e.g. "why_1_text". */
    textKey: string;
    title: string;
    text: string;
    /** Icon identifier resolved by the feature-icon map below. */
    icon: FeatureIcon;
}

export type FeatureIcon = 'award' | 'scissors' | 'coffee' | 'shield';

/** Default "Почему мы" block, used until the settings above are seeded. */
export const FEATURES: Feature[] = [
    {
        titleKey: 'why_1_title',
        textKey: 'why_1_text',
        title: 'Опытные мастера',
        text: 'От шести до двенадцати лет в профессии. Каждый барбер регулярно проходит обучение и повышает квалификацию.',
        icon: 'award',
    },
    {
        titleKey: 'why_2_title',
        textKey: 'why_2_text',
        title: 'Стрижка держит форму',
        text: 'Обсуждаем результат до начала работы и подбираем форму под тип лица, а не по шаблону из каталога.',
        icon: 'scissors',
    },
    {
        titleKey: 'why_3_title',
        textKey: 'why_3_text',
        title: 'Кофе и никакой спешки',
        text: 'На каждого клиента заложено полноценное время. Винил, кофе и спокойная атмосфера без конвейера.',
        icon: 'coffee',
    },
    {
        titleKey: 'why_4_title',
        textKey: 'why_4_text',
        title: 'Стерильный инструмент',
        text: 'Обрабатываем инструмент после каждого клиента и работаем только с проверенной косметикой.',
        icon: 'shield',
    },
];

/** Section headings and calls to action used across the public pages. */
export const COPY = {
    about: {
        eyebrow: 'О нас',
        // No hardcoded `title`: the heading is the shop name from the
        // `site_name` setting, so a rename happens in /admin/settings instead of
        // a code change.
        cta: 'Подробнее',
        // Used only when the `about_text` setting is empty. Brand-neutral, for
        // the same reason.
        fallback:
            'Барбершоп для мужчин, которые ценят своё время и внимание к деталям. Мы открылись в 2016 году и сегодня это команда из трёх барберов с суммарным опытом более двадцати пяти лет. Работаем без спешки: на каждого клиента заложено полноценное время.',
    },
    services: {
        eyebrow: 'Услуги',
        title: 'Что мы делаем',
        subtitle: 'Четыре направления и понятные цены. Итоговую стоимость мастер подтверждает до начала работы.',
        cta: 'Все услуги',
        empty: 'Услуги скоро появятся',
    },
    masters: {
        eyebrow: 'Команда',
        title: 'Наши мастера',
        subtitle: 'Три барбера, каждый со своей специализацией — от классических стрижек до королевского бритья.',
        cta: 'Все мастера',
        empty: 'Мастера скоро появятся',
    },
    portfolio: {
        eyebrow: 'Портфолио',
        title: 'Наши работы',
        subtitle: 'Стрижки, бороды и королевское бритьё — то, что мастера делают каждый день.',
        cta: 'Смотреть всё портфолио',
        empty: 'Работы скоро появятся',
    },
    features: {
        eyebrow: 'Почему мы',
        title: 'Как мы работаем',
    },
    reviews: {
        eyebrow: 'Отзывы',
        title: 'Что говорят клиенты',
        subtitle: 'Публикуем только отзывы клиентов, которые действительно у нас стриглись.',
        empty: 'Пока нет отзывов',
        prev: 'Предыдущие отзывы',
        next: 'Следующие отзывы',
    },
    contacts: {
        eyebrow: 'Контакты',
        title: 'Как нас найти',
    },
    cta: {
        book: 'Записаться',
        masters: 'Наши мастера',
        callback: 'Заказать звонок',
    },
} as const;

/*
|--------------------------------------------------------------------------
| Masters / Services pages
|--------------------------------------------------------------------------
*/

export const MASTERS_COPY = {
    title: 'Наши мастера',
    subtitle: 'Выберите барбера — на странице мастера видны его услуги, цены и отзывы клиентов.',
    filterLabel: 'Категория услуг',
    filterAll: 'Все категории',
    experience: 'Опыт',
    servicesCount: 'Услуги',
    empty: 'Нет мастеров в этой категории',
    emptyDescription: 'Попробуйте выбрать другую категорию — у остальных мастеров услуги есть.',
    book: 'Записаться',
    profile: 'Подробнее о мастере',
} as const;

export const SERVICE_COPY = {
    title: 'Услуги и цены',
    subtitle: 'Полный прайс по направлениям. Стоимость может отличаться у разных мастеров — точную цену подтверждает мастер.',
    duration: 'Длительность',
    price: 'Цена',
    book: 'Записаться',
    empty: 'Прайс пока пуст',
    emptyDescription: 'Мы обновляем прайс — загляните чуть позже или позвоните нам.',
} as const;

export const CONTACT_COPY = {
    callbackTitle: 'Заказать звонок',
    callbackText: 'Оставьте номер — перезвоним, подберём время и ответим на вопросы.',
    name: 'Имя',
    phone: 'Телефон',
    comment: 'Комментарий',
    submit: 'Отправить',
    sending: 'Отправляем…',
    success: 'Заявка отправлена',
    successText: 'Спасибо! Мы позвоним вам в ближайшее время.',
    address: 'Адрес',
    phoneLabel: 'Телефон',
    emailLabel: 'Email',
    hoursLabel: 'Часы работы',
    socialLabel: 'Мессенджеры',
    mapNote: 'Схема проезда появится здесь после подключения карт.',
} as const;

export const AUTH_COPY = {
    loginTitle: 'Вход в кабинет',
    loginSubtitle: 'Войдите, чтобы записаться онлайн и управлять своими визитами.',
    registerTitle: 'Регистрация',
    registerSubtitle: 'Создайте аккаунт — это займёт меньше минуты и нужно для онлайн-записи.',
} as const;

/*
|--------------------------------------------------------------------------
| Booking wizard / cabinet
|--------------------------------------------------------------------------
*/

export const BOOKING_COPY = {
    title: 'Онлайн-запись',
    subtitle: 'Четыре шага: услуга, мастер, время и подтверждение. Заявку подтвердит мастер.',

    stepHints: {
        service: 'Что делаем',
        master: 'Кто делает',
        datetime: 'Когда удобно',
        confirm: 'Проверьте детали',
    },

    // Step 1
    serviceTitle: 'Выберите услугу',
    serviceSubtitle: 'Сначала направление, затем конкретная услуга. Цены — из прайса барбершопа.',
    categoriesLabel: 'Направления',
    servicesIn: 'Услуги в направлении',
    pickCategory: 'Выберите направление слева',
    pickCategoryHint: 'В списке появятся услуги с ценами и длительностью.',
    serviceEmpty: 'В этом направлении пока нет услуг',
    serviceEmptyHint: 'Выберите другое направление или позвоните нам — подскажем варианты.',
    masterLocked: 'Мастер выбран заранее',
    masterLockedHint: 'Показаны только услуги этого мастера. Изменить мастера можно на следующем шаге.',

    // Step 2
    masterTitle: 'Выберите мастера',
    masterSubtitle: 'Показаны барберы, которые выполняют выбранную услугу.',
    masterEmpty: 'Нет мастеров для этой услуги',
    masterEmptyHint: 'Вернитесь на шаг назад и выберите другую услугу.',
    masterServices: 'Выполняет услугу',
    yourPrice: 'Его цена',
    reviews: 'отзывов',

    // Step 3
    datetimeTitle: 'Выберите дату и время',
    datetimeSubtitle: 'Шаг записи — 30 минут. Доступны только свободные слоты.',
    pickDate: 'Дата',
    pickTime: 'Время',
    pickDateFirst: 'Сначала выберите дату',
    pickDateFirstHint: 'Свободное время появится сразу после выбора дня в календаре.',
    slotsError: 'Не удалось загрузить свободное время.',
    selectedSlot: 'Вы выбрали',

    // Step 4
    confirmTitle: 'Подтвердите запись',
    confirmSubtitle: 'Проверьте детали и добавьте комментарий, если нужно.',
    commentLabel: 'Комментарий для мастера',
    commentPlaceholder: 'Пожелания по стрижке, особенности, удобное время звонка',
    commentHint: 'Необязательно. До 2000 символов.',
    /*
     * The consent line is split so "обработкой персональных данных" can be a
     * real link to the policy page without breaking the sentence.
     */
    agree: 'Согласен с условиями записи и обработкой персональных данных',
    agreePrefix: 'Согласен с условиями записи и ',
    agreeLink: 'обработкой персональных данных',
    agreeError: 'Подтвердите согласие с условиями.',
    agreeRequired: 'Нужно согласие с условиями',
    submit: 'Отправить заявку',
    submitting: 'Отправляем…',
    success: 'Заявка отправлена. Ожидайте подтверждения мастера.',

    // Shared
    back: 'Назад',
    next: 'Далее',
    summary: 'Ваша запись',
    summaryEmpty: 'Выберите услугу, мастера и время — детали появятся здесь.',
    priceNote:
        'Точную стоимость мастер подтвердит после заявки. Итоговая цена не будет выше указанного диапазона без вашего согласия.',
    master: 'Мастер',
    service: 'Услуга',
    date: 'Дата',
    time: 'Время',
    selectMaster: 'Выберите мастера',
    selectService: 'Выберите услугу',
    selectDate: 'Выберите дату',
    selectTime: 'Выберите время',
} as const;

export const CABINET_COPY = {
    title: 'Личный кабинет',
    welcome: (name: string): string => `Здравствуйте, ${name}!`,
    welcomeText: 'Здесь ваши записи, их статусы и отзывы о визитах.',

    stats: {
        total: 'Всего записей',
        upcoming: 'Предстоящие',
        completed: 'Завершено',
    },

    nextTitle: 'Ближайший визит',
    nextEmpty: 'Записей пока нет',
    nextEmptyText: 'Выберите услугу и удобное время — свободные слоты видно сразу.',

    quickActions: 'Быстрые действия',
    repeat: 'Записаться снова',
    repeatHint: 'Повторить последнюю услугу',
    leaveReview: 'Оставить отзыв',
    leaveReviewHint: 'Оценить завершённый визит',
    allAppointments: 'Все записи',
    newBooking: 'Новая запись',

    historyTitle: 'История визитов',

    // Appointments page
    appointmentsTitle: 'Мои записи',
    appointmentsSubtitle: 'Активные визиты, история и отменённые записи.',
    tabs: {
        active: 'Активные',
        history: 'История',
        cancelled: 'Отменённые',
    },
    tabCounts: 'записей',
    emptyActive: 'Нет активных записей',
    emptyActiveText: 'Самое время выбрать услугу и записаться — свободное время видно сразу.',
    emptyHistory: 'История пуста',
    emptyHistoryText: 'Здесь появятся завершённые визиты, по которым можно оставить отзыв.',
    emptyCancelled: 'Отменённых записей нет',
    emptyCancelledText: 'Хорошо, что визиты состоялись.',

    // Actions
    cancel: 'Отменить',
    contactMaster: 'Связаться с мастером',
    reschedule: 'Записаться снова',

    // Cancel modal
    cancelTitle: 'Отменить запись?',
    cancelText: 'Мастер освободит время для другого клиента. Отмена не отменяет возможность записаться снова.',
    cancelReason: 'Причина отмены (необязательно)',
    cancelReasonPlaceholder: 'Например: изменились планы',
    cancelConfirm: 'Да, отменить',
    cancelKeep: 'Оставить запись',
    cancelSuccess: 'Запись отменена',

    // Review modal
    reviewTitle: 'Отзыв о визите',
    reviewText: 'Отзыв появится на сайте после проверки модератором.',
    reviewRating: 'Ваша оценка',
    reviewRatingError: 'Поставьте оценку от 1 до 5.',
    reviewComment: 'Комментарий',
    reviewCommentPlaceholder: 'Что понравилось, что можно улучшить',
    reviewSubmit: 'Отправить отзыв',
    reviewAlready: 'Отзыв оставлен',
    reviewPending: 'Отзыв на модерации',
} as const;

/*
|--------------------------------------------------------------------------
| Master panel
|--------------------------------------------------------------------------
*/

export const MASTER_COPY = {
    dashboardSubtitle: 'Ваши записи, график и услуги в одном месте.',
    scheduleTitle: 'График работы',
    scheduleSubtitle:
        'Отметьте рабочие дни и укажите интервалы. Клиенты видят только часы внутри этих интервалов.',
    servicesTitle: 'Мои услуги',
    servicesSubtitle:
        'Цены и длительность можно сузить относительно прайса барбершопа — базовую услугу изменить нельзя.',
    appointmentsTitle: 'Записи',
    appointmentsSubtitle: 'Новые заявки, подтверждённые визиты и история.',
    tabs: {
        pending: 'Новые',
        confirmed: 'Подтверждённые',
        done: 'Завершённые',
        cancelled: 'Отменённые',
    },
} as const;

/*
|--------------------------------------------------------------------------
| Admin panel
|--------------------------------------------------------------------------
*/

export const ADMIN_COPY = {
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

    create: 'Добавить',
    save: 'Сохранить',
    saving: 'Сохраняем…',
    edit: 'Редактировать',
    delete: 'Удалить',
    cancel: 'Отмена',
    back: 'Назад к списку',
    search: 'Поиск',
    reset: 'Сбросить',
} as const;
