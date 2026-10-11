<?php

namespace Database\Seeders;

use App\Models\Master;
use App\Models\PortfolioItem;
use Illuminate\Database\Seeder;

class PortfolioSeeder extends Seeder
{
    /**
     * Four showcase works per master, using the bundled placeholder SVGs in
     * public/images/portfolio/. The files are served straight from /images (no
     * storage disk involved), so a fresh checkout renders the grid without
     * running the upload flow first.
     *
     * Photo paths are allocated in blocks of four so no master repeats one.
     *
     * @var list<array{title: string, description: string}>
     */
    private const WORKS = [
        [
            'title' => 'Классический фейд',
            'description' => 'Плавный переход от короткой машинки к длине сверху. Укладывается за пару минут и держит форму три-четыре недели.',
        ],
        [
            'title' => 'Борода с чётким контуром',
            'description' => 'Оформление опасной бритвой с выведением линии щёк и шеи. Финиш — масло для бороды и укладка щёткой.',
        ],
        [
            'title' => 'Оформление висков',
            'description' => 'Аккуратная линия виска и затылка машинкой без насадки. Подходит как самостоятельная процедура между стрижками.',
        ],
        [
            'title' => 'Комплекс: стрижка + борода',
            'description' => 'Полный образ за один визит: стрижка, королевское бритьё головы и моделирование бороды.',
        ],
    ];

    public function run(): void
    {
        $masters = Master::query()->orderBy('id')->get();

        foreach ($masters as $index => $master) {
            foreach (self::WORKS as $position => $work) {
                // Blocks of four: master #1 gets 01-04, #2 gets 05-08, …
                $photoNumber = ($index * count(self::WORKS)) + $position + 1;
                $photoPath = sprintf('portfolio/%02d.svg', $photoNumber);

                PortfolioItem::updateOrCreate(
                    [
                        'master_id' => $master->id,
                        'photo_path' => $photoPath,
                    ],
                    [
                        'title' => $work['title'],
                        'description' => $work['description'],
                        'sort_order' => $position + 1,
                        'is_published' => true,
                    ],
                );
            }
        }
    }
}
