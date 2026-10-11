<?php

/*
|--------------------------------------------------------------------------
| Human-readable Russian attribute names
|--------------------------------------------------------------------------
|
| Used by the validator to build messages like
| "Поле «номер телефона» обязательно для заполнения."
|
*/

return [
    // Auth / users
    'name' => 'имя',
    'email' => 'адрес электронной почты',
    'password' => 'пароль',
    'password_confirmation' => 'подтверждение пароля',
    'phone' => 'номер телефона',
    'avatar' => 'аватар',
    'role' => 'роль',
    'current_password' => 'текущий пароль',

    // Catalogue
    'category_id' => 'категория',
    'slug' => 'адрес',
    'sort_order' => 'порядок сортировки',
    'service_id' => 'услуга',
    'base_price_min' => 'минимальная цена',
    'base_price_max' => 'максимальная цена',
    'duration_min' => 'длительность',
    'is_active' => 'активность',
    'is_published' => 'публикация',

    // Masters
    'user_id' => 'пользователь',
    'bio' => 'описание',
    'photo' => 'фотография',
    'experience_years' => 'опыт работы',
    'rating' => 'рейтинг',

    // Booking
    'master_id' => 'мастер',
    'starts_at' => 'время записи',
    'ends_at' => 'время окончания',
    'client_comment' => 'комментарий',
    'master_comment' => 'комментарий мастера',
    'price_min' => 'минимальная цена',
    'price_max' => 'максимальная цена',
    'price_offer' => 'точная цена',
    'status' => 'статус',

    // Schedule
    'days' => 'график',
    'days.*.is_active' => 'рабочий день',
    'days.*.start_time' => 'время начала',
    'days.*.end_time' => 'время окончания',
    'days.*.break_start' => 'начало перерыва',
    'days.*.break_end' => 'окончание перерыва',
    'weekday' => 'день недели',
    'date' => 'дата',
    'reason' => 'причина',

    // Reviews
    'appointment_id' => 'запись',
    'text' => 'отзыв',

    // Content
    'title' => 'заголовок',
    'content' => 'содержимое',
    'settings' => 'настройки',
    'website' => 'веб-сайт',
    'comment' => 'комментарий',
];
