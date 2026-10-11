<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Service categories, ordered as they should appear in the booking menu.
     *
     * @var list<array{name: string, slug: string, sort_order: int}>
     */
    private const CATEGORIES = [
        ['name' => 'Стрижки', 'slug' => 'strizhki', 'sort_order' => 10],
        ['name' => 'Борода и усы', 'slug' => 'boroda-i-usy', 'sort_order' => 20],
        ['name' => 'Комплексные', 'slug' => 'kompleksnye', 'sort_order' => 30],
        ['name' => 'Уход', 'slug' => 'ukhod', 'sort_order' => 40],
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name'], 'sort_order' => $category['sort_order']],
            );
        }
    }
}
