<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Master;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Approved reviews attached to the completed demo appointments created by
     * AppointmentSeeder. Exactly 8 entries are defined (one per completed
     * appointment in the seeder's list order); amounts and durations are
     * spelled out in words so no non-breaking-space handling is required.
     *
     * @var list<array{rating: int, text: string}>
     */
    private const REVIEWS = [
        [
            'rating' => 5,
            'text' => 'Хожу к Ивану уже второй год и ни разу не пожалел. Стрижка всегда держит форму ровно месяц, виски и затылок выведены идеально. Отдельное спасибо за то, что всегда подскажет, как уложить волосы дома.',
        ],
        [
            'rating' => 5,
            'text' => 'Артём — мастер с золотыми руками. У меня непослушные волосы, которые раньше никто не мог нормально уложить в форму, а здесь получилось с первого раза. Атмосфера в барбершопе спокойная, кофе вкусный, музыка не громкая.',
        ],
        [
            'rating' => 5,
            'text' => 'Делал королевское бритьё у Дмитрия. Это не просто процедура, а целый ритуал: два горячих полотенца, опасная бритва, массаж лица в конце. Кожа после бритья абсолютно спокойная, раздражения нет вообще.',
        ],
        [
            'rating' => 5,
            'text' => 'Записывался на комплекс «стрижка и борода». Заняло полтора часа, но результат того стоит: борода наконец-то имеет чёткую форму, а не выглядит как заросли. Цену назвали сразу, доплат никаких не было.',
        ],
        [
            'rating' => 5,
            'text' => 'Приводил сына на детскую стрижку. Мастер нашёл подход к ребёнку с первых минут, отвлекал разговорами и мультиками, так что слёз и истерик не было. Получилось аккуратно и, что важно, быстро.',
        ],
        [
            'rating' => 5,
            'text' => 'Делал камуфляж седины перед свадьбой. Эффект естественный, никто из гостей не догадался, что это тонирование. Продержалось почти пять недель, как и обещали. Обязательно вернусь.',
        ],
        [
            'rating' => 5,
            'text' => 'Отличный барбершоп в центре. Записался через сайт за пару минут, напомнили о визите в день записи. Стрижкой доволен, мастер уточнил все пожелания до начала работы, а не начал резать наугад.',
        ],
        [
            'rating' => 4,
            'text' => 'В целом всё понравилось: чисто, аккуратно, мастера знают своё дело. Единственный момент — пришлось подождать минут десять, предыдущий клиент задержался. Стрижка получилась отличная, поэтому оценку снижать сильно не буду.',
        ],
    ];

    public function run(): void
    {
        // One review per completed appointment, oldest first.
        $appointments = Appointment::query()
            ->where('status', AppointmentStatus::Done->value)
            ->orderBy('starts_at')
            ->limit(count(self::REVIEWS))
            ->get();

        if ($appointments->isEmpty()) {
            $this->command?->warn('ReviewSeeder: no completed appointments found, run AppointmentSeeder first.');

            return;
        }

        foreach ($appointments as $index => $appointment) {
            $review = self::REVIEWS[$index] ?? null;

            if ($review === null) {
                break;
            }

            // updateOrCreate keeps the seeder idempotent (appointment_id is unique).
            Review::updateOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'client_id' => $appointment->client_id,
                    'master_id' => $appointment->master_id,
                    'rating' => $review['rating'],
                    'text' => $review['text'],
                    'is_approved' => true,
                ],
            );
        }

        // Re-derive the cached rating so masters.rating always matches its reviews.
        Master::query()->each(fn (Master $master) => $master->recalculateRating());
    }
}
