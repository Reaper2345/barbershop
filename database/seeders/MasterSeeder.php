<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\Master;
use App\Models\User;
use Illuminate\Database\Seeder;

class MasterSeeder extends Seeder
{
    /**
     * Three working barbers, each with a login account and a Master profile.
     *
     * The `rating` values are the averages that ReviewSeeder re-derives from the
     * approved reviews, so the cached column matches its reviews from the start.
     *
     * `photo` is deliberately null. The repository ships no image binaries, and
     * `public/storage` (the `php artisan storage:link` symlink) does not exist
     * in a fresh checkout, so a value of `masters/ivan-sokolov.jpg` resolved to
     * /storage/masters/ivan-sokolov.jpg and Apache answered 403 for a path it
     * could not serve. With null, the UI falls back to the bundled SVG
     * placeholders in public/images/masters/ via lib/image.ts + UI/Img.tsx.
     * Upload real photos through the admin panel (Admin\Masters\Form) instead.
     *
     * @var list<array<string, mixed>>
     */
    private const MASTERS = [
        [
            'name' => 'Иван Соколов',
            'email' => 'master1@barber.test',
            'phone' => '+7 916 340-12-08',
            'photo' => null,
            'experience_years' => 9,
            'rating' => 4.67,
            'bio' => 'Топ-барбер с девятью годами опыта. Специализируюсь на классических мужских стрижках, fade любой сложности и оформлении бороды опасной бритвой. Работаю только с премиальной косметикой American Crew и Reuzel.',
        ],
        [
            'name' => 'Артём Кузнецов',
            'email' => 'master2@barber.test',
            'phone' => '+7 926 815-77-31',
            'photo' => null,
            'experience_years' => 6,
            'rating' => 4.75,
            'bio' => 'Мастер по работе с длинными волосами и текстурным стрижкам. Отлично чувствую форму головы и подбираю стрижку под тип лица. Отдельно занимаюсь камуфляжем седины и восстановлением волос после неудачных экспериментов.',
        ],
        [
            'name' => 'Дмитрий Волков',
            'email' => 'master3@barber.test',
            'phone' => '+7 903 442-95-16',
            'photo' => null,
            'experience_years' => 12,
            'rating' => 5.00,
            'bio' => 'Основатель барбершопа, двенадцать лет в профессии. Королевское бритьё, сложные формы бороды и подготовка женихов к свадьбе — моя основная специализация. Регулярно прохожу обучение в Европе.',
        ],
    ];

    public function run(): void
    {
        foreach (self::MASTERS as $data) {
            /*
             * `updateOrCreate` (not `firstOrCreate`) so the null photo is
             * written on EVERY run, including rows that already exist from an
             * earlier seeding with `masters/*.jpg` values. `firstOrCreate` would
             * skip the update and leave the stale path in place, which is the
             * usual reason one master keeps requesting /storage/masters/*.jpg
             * after this change.
             */
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    // Null as well: the User avatar uses the same path.
                    'avatar' => null,
                    'role' => RoleEnum::Master,
                    'password' => 'password',
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles([RoleEnum::Master->value]);

            Master::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'bio' => $data['bio'],
                    'photo' => null,
                    'experience_years' => $data['experience_years'],
                    'rating' => $data['rating'],
                    'is_active' => true,
                ],
            );
        }

        /*
         * Corrective sweep.
         *
         * Nulls any remaining photo that points at one of the bundled-but-absent
         * fixture images. This covers a master created or edited outside this
         * seeder — for example by an earlier run against a different checkout —
         * and is idempotent: a real upload through the admin panel lives under a
         * different filename and is left untouched.
         */
        Master::query()
            ->whereIn('photo', [
                'masters/ivan-sokolov.jpg',
                'masters/artem-kuznetsov.jpg',
                'masters/dmitry-volkov.jpg',
            ])
            ->update(['photo' => null]);
    }
}
