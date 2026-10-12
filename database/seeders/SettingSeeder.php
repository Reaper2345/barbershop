<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Site-wide settings, keyed by `key`. `group` is used by the admin panel to
     * split the settings form into tabs.
     *
     * @var list<array{key: string, value: string, group: string}>
     */
    private const SETTINGS = [
        [
            'key' => 'site_name',
            'value' => 'Ксививайд',
            'group' => 'general',
        ],
        [
            'key' => 'phone',
            'value' => '+7 (495) 120-45-67',
            'group' => 'contacts',
        ],
        [
            'key' => 'address',
            'value' => 'г. Москва, ул. Покровка, д. 14, стр. 2',
            'group' => 'contacts',
        ],
        [
            'key' => 'email',
            'value' => 'hello@barber.test',
            'group' => 'contacts',
        ],
        [
            'key' => 'instagram',
            'value' => 'https://instagram.com/britva.barbershop',
            'group' => 'contacts',
        ],
        [
            'key' => 'work_hours',
            'value' => 'Вт–Сб: 10:00–20:00, Вс и Пн — выходные',
            'group' => 'contacts',
        ],
        /*
         * Coordinates of the address above (Покровка 14, стр. 2 — five minutes
         * from Китай-город). They drive the Yandex Maps block on the home page
         * and on /contacts; clearing them falls back to a static panel with an
         * "Открыть в картах" link.
         */
        [
            'key' => 'map_lat',
            'value' => '55.756789',
            'group' => 'contacts',
        ],
        [
            'key' => 'map_lng',
            'value' => '37.648578',
            'group' => 'contacts',
        ],
        /*
         * Yandex Maps JS API v3 key (paste it here from the Yandex developer
         * cabinet). While it is empty the contacts map renders the keyless
         * OpenStreetMap embed instead, so the block is never blank.
         */
        [
            'key' => 'yandex_maps_api_key',
            'value' => '',
            'group' => 'contacts',
        ],
        [
            'key' => 'hero_title',
            'value' => 'Мужская стрижка, которая держит форму',
            'group' => 'homepage',
        ],
        [
            'key' => 'hero_subtitle',
            'value' => 'Опытные барберы, опасная бритва, кофе и никакой спешки. Запишитесь онлайн за пару минут — свободное время видно сразу.',
            'group' => 'homepage',
        ],
        [
            'key' => 'about_text',
            'value' => '«Ксививайд» — барбершоп для мужчин, которые ценят своё время и внимание к деталям. Мы открылись в 2016 году как небольшая студия на двоих мастеров, а сегодня это команда из трёх барберов с суммарным опытом более двадцати пяти лет. Работаем только с проверенной косметикой, стерилизуем инструмент после каждого клиента и никогда не навязываем лишних услуг.',
            'group' => 'about',
        ],
        /*
         * "Почему мы" block.
         *
         * Prompts 3 and 4 rendered these from bundled defaults because no
         * setting rows existed. They are seeded here so the admin settings
         * screen can actually edit them; the component already reads
         * `siteSettings[feature.titleKey]` first and falls back to the defaults.
         */
        [
            'key' => 'why_1_title',
            'value' => 'Опытные мастера',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_1_text',
            'value' => 'От шести до двенадцати лет в профессии. Каждый барбер регулярно проходит обучение и повышает квалификацию.',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_2_title',
            'value' => 'Стрижка держит форму',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_2_text',
            'value' => 'Обсуждаем результат до начала работы и подбираем форму под тип лица, а не по шаблону из каталога.',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_3_title',
            'value' => 'Кофе и никакой спешки',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_3_text',
            'value' => 'На каждого клиента заложено полноценное время. Винил, кофе и спокойная атмосфера без конвейера.',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_4_title',
            'value' => 'Стерильный инструмент',
            'group' => 'homepage',
        ],
        [
            'key' => 'why_4_text',
            'value' => 'Обрабатываем инструмент после каждого клиента и работаем только с проверенной косметикой.',
            'group' => 'homepage',
        ],
        /*
         * The JSON form of the same block, so the admin can edit it as one
         * document. Kept in sync with why_* by hand; the home page reads the
         * individual keys, this row is the structured view.
         */
        [
            'key' => 'features',
            'value' => '[{"title":"Опытные мастера","text":"От шести до двенадцати лет в профессии. Каждый барбер регулярно проходит обучение и повышает квалификацию.","icon":"award"},{"title":"Стрижка держит форму","text":"Обсуждаем результат до начала работы и подбираем форму под тип лица, а не по шаблону из каталога.","icon":"scissors"},{"title":"Кофе и никакой спешки","text":"На каждого клиента заложено полноценное время. Винил, кофе и спокойная атмосфера без конвейера.","icon":"coffee"},{"title":"Стерильный инструмент","text":"Обрабатываем инструмент после каждого клиента и работаем только с проверенной косметикой.","icon":"shield"}]',
            'group' => 'homepage',
        ],
        /*
         * SEO defaults. The layout does not read them yet; they exist so the
         * admin screen has the fields the brief asks for.
         */
        [
            'key' => 'meta_title',
            'value' => 'Ксививайд — мужские стрижки и бритьё в центре Москвы',
            'group' => 'seo',
        ],
        [
            'key' => 'meta_description',
            'value' => 'Мужские стрижки, оформление бороды и королевское бритьё. Онлайн-запись за пару минут, опытные барберы, стерильный инструмент.',
            'group' => 'seo',
        ],
    ];

    public function run(): void
    {
        foreach (self::SETTINGS as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'group' => $setting['group']],
            );
        }
    }
}
