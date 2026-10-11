<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Static content pages. `content` holds the HTML produced by the future
     * admin editor (PROMPT 4+), so the markup is kept minimal and semantic.
     *
     * The HTML is written with implode() over an array of single-quoted lines
     * instead of a heredoc inside a class constant: that combination is valid
     * PHP but easy to break with indentation rules, and this form stays
     * readable and unambiguous.
     */
    public function run(): void
    {
        Page::updateOrCreate(
            ['slug' => 'about'],
            [
                'title' => 'О барбершопе',
                'content' => implode("\n", [
                    '<h2>Кто мы такие</h2>',
                    '<p>«Бритва» — барбершоп для мужчин, которые ценят своё время и внимание к деталям. Мы открылись в 2016 году как небольшая студия на двоих мастеров, а сегодня это команда из трёх барберов с суммарным опытом более двадцати пяти лет.</p>',
                    '',
                    '<h2>Наши принципы</h2>',
                    '<ul>',
                    '    <li>Стрижём так, чтобы форма держалась месяц, а не неделю.</li>',
                    '    <li>Обсуждаем результат до начала работы, а не после.</li>',
                    '    <li>Стерилизуем инструмент после каждого клиента.</li>',
                    '    <li>Никогда не навязываем услуги, которые вам не нужны.</li>',
                    '</ul>',
                    '',
                    '<h2>Мастера</h2>',
                    '<p>Иван Соколов — девять лет опыта, специализация на классических стрижках и fade любой сложности.</p>',
                    '<p>Артём Кузнецов — шесть лет опыта, работает с длинными и текстурными волосами, занимается камуфляжем седины.</p>',
                    '<p>Дмитрий Волков — основатель барбершопа, двенадцать лет в профессии, королевское бритьё и сложные формы бороды.</p>',
                    '',
                    '<h2>Атмосфера</h2>',
                    '<p>Кофе, винил и спокойная музыка. Мы не работаем в режиме конвейера: на каждого клиента заложено полноценное время без спешки.</p>',
                ]),
                'is_published' => true,
            ],
        );

        Page::updateOrCreate(
            ['slug' => 'contacts'],
            [
                'title' => 'Контакты',
                'content' => implode("\n", [
                    '<h2>Адрес</h2>',
                    '<p>г. Москва, ул. Покровка, д. 14, стр. 2 — пять минут пешком от метро «Китай-город».</p>',
                    '',
                    '<h2>Как связаться</h2>',
                    '<ul>',
                    '    <li>Телефон: <a href="tel:+74951204567">+7 (495) 120-45-67</a></li>',
                    '    <li>Email: <a href="mailto:hello@barber.test">hello@barber.test</a></li>',
                    '    <li>Instagram: <a href="https://instagram.com/britva.barbershop" rel="noopener">@britva.barbershop</a></li>',
                    '</ul>',
                    '',
                    '<h2>Часы работы</h2>',
                    '<p>Вторник — суббота: с 10:00 до 20:00. Воскресенье и понедельник — выходные. Последняя запись принимается в 19:00.</p>',
                    '',
                    '<h2>Как добраться</h2>',
                    '<p>Вход со стороны двора. Рядом есть платная парковка, а также остановка автобусов 3 и 38.</p>',
                ]),
                'is_published' => true,
            ],
        );
    }
}
