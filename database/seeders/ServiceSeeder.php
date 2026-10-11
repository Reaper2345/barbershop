<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Price list grouped by category slug. Prices are in roubles.
     *
     * @var array<string, list<array{name: string, description: string, min: float, max: float, duration: int}>>
     */
    private const SERVICES = [
        'strizhki' => [
            [
                'name' => 'Мужская стрижка',
                'description' => 'Классическая или модельная стрижка с учётом формы лица. Включает мытьё головы, укладку и рекомендации по домашнему уходу.',
                'min' => 1500,
                'max' => 2500,
                'duration' => 60,
            ],
            [
                'name' => 'Машинкой под одну насадку',
                'description' => 'Быстрая стрижка одной насадкой по всей голове. Оптимальный вариант для коротких волос и поддержания уже готовой формы.',
                'min' => 800,
                'max' => 1200,
                'duration' => 30,
            ],
            [
                'name' => 'Стрижка наголо',
                'description' => 'Бритьё головы машинкой без насадки с последующим уходом и увлажнением кожи. Занимает не более получаса.',
                'min' => 700,
                'max' => 1000,
                'duration' => 30,
            ],
            [
                'name' => 'Детская стрижка до 12 лет',
                'description' => 'Аккуратная стрижка для юных клиентов в комфортной обстановке. Работаем спокойно, без спешки, с мультиками на экране.',
                'min' => 900,
                'max' => 1400,
                'duration' => 40,
            ],
            [
                'name' => 'Оформление висков и затылка',
                'description' => 'Обновление контура стрижки между визитами: чистые виски, затылок и линия роста волос.',
                'min' => 500,
                'max' => 900,
                'duration' => 25,
            ],
        ],

        'boroda-i-usy' => [
            [
                'name' => 'Оформление бороды',
                'description' => 'Моделирование формы бороды машинкой и ножницами, работа с контурами, горячее полотенце и питательное масло.',
                'min' => 900,
                'max' => 1600,
                'duration' => 45,
            ],
            [
                'name' => 'Королевское бритьё',
                'description' => 'Бритьё опасной бритвой в четыре прохода. Два горячих полотенца, премиальный гель для бритья и успокаивающий бальзам.',
                'min' => 1500,
                'max' => 2200,
                'duration' => 60,
            ],
            [
                'name' => 'Стрижка усов',
                'description' => 'Придание формы усам, удаление лишних волос и финальная укладка воском для стойкого результата.',
                'min' => 500,
                'max' => 900,
                'duration' => 25,
            ],
        ],

        'kompleksnye' => [
            [
                'name' => 'Стрижка и борода',
                'description' => 'Комплексная услуга для полного преображения: стрижка волос и оформление бороды за один визит. Выгоднее, чем две отдельные услуги.',
                'min' => 2200,
                'max' => 3600,
                'duration' => 90,
            ],
            [
                'name' => 'Отец и сын',
                'description' => 'Две стрижки подряд для папы и ребёнка. Отличный повод провести время вместе и сэкономить.',
                'min' => 2200,
                'max' => 3200,
                'duration' => 90,
            ],
            [
                'name' => 'Подготовка жениха',
                'description' => 'Полный образ для торжества: стрижка, борода, укладка и уход. Рекомендуем записываться за 5–7 дней до мероприятия.',
                'min' => 3500,
                'max' => 5000,
                'duration' => 120,
            ],
        ],

        'ukhod' => [
            [
                'name' => 'Камуфляж седины',
                'description' => 'Мягкое тонирование седых волос или бороды без эффекта краски. Результат держится от трёх до пяти недель.',
                'min' => 1500,
                'max' => 2000,
                'duration' => 60,
            ],
            [
                'name' => 'Уход и восстановление волос',
                'description' => 'Питательная маска и массаж головы. Восстанавливает волосы после частого использования стайлинга и жёсткой воды.',
                'min' => 1200,
                'max' => 1800,
                'duration' => 45,
            ],
            [
                'name' => 'Чёрная маска и пилинг кожи головы',
                'description' => 'Глубокое очищение кожи головы с последующим увлажнением. Снимает зуд и нормализует работу сальных желёз.',
                'min' => 1000,
                'max' => 1500,
                'duration' => 40,
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::SERVICES as $categorySlug => $services) {
            $category = Category::where('slug', $categorySlug)->firstOrFail();

            foreach ($services as $service) {
                Service::updateOrCreate(
                    ['category_id' => $category->id, 'name' => $service['name']],
                    [
                        'description' => $service['description'],
                        'base_price_min' => $service['min'],
                        'base_price_max' => $service['max'],
                        'duration_min' => $service['duration'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
