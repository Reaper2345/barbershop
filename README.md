# Барбершоп «Бритва» — booking app

Laravel 11 + Inertia.js + React 18 + TypeScript + TailwindCSS + MySQL 8, with
`spatie/laravel-permission` for the `admin` / `master` / `client` roles.

> **PROMPT 1 of 6 — data layer only.**
> This stage delivers the project skeleton, the database schema, the Eloquent
> models and the seeders. There are intentionally **no controllers, no business
> routes, no admin UI and no booking pages** yet; those arrive in PROMPT 2+.
> The single route in `routes/web.php` renders a smoke-test page so the
> Inertia/React/Tailwind wiring can be verified.

---

## 1. Requirements

| Tool       | Version |
| ---------- | ------- |
| PHP        | 8.2+    |
| Composer   | 2.x     |
| Node.js    | 18+     |
| MySQL      | 8.0     |

## 2. Fresh install (the commands this scaffold was built from)

These are the canonical bootstrap commands. They were **not** executed while
generating this scaffold (no PHP/Composer/Node on the authoring machine), so run
them once on a machine that has the toolchain:

```bash
composer create-project laravel/laravel barbershop
cd barbershop

# Backend dependencies
composer require inertiajs/inertia-laravel spatie/laravel-permission
php artisan inertia:middleware

# Frontend dependencies
npm install
npm install @inertiajs/react react react-dom
npm install -D @vitejs/plugin-react typescript @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer laravel-vite-plugin
npx tailwindcss init -p
```

Then, in an **already generated** project, the data layer is applied with:

```bash
cp .env.example .env
php artisan key:generate

mysql -u root -e "CREATE DATABASE barbershop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

php artisan migrate:fresh --seed
npm run dev
```

## 3. Demo accounts

All passwords are `password`.

| Role   | Email                 |
| ------ | --------------------- |
| Admin  | `admin@barber.test`   |
| Master | `master1@barber.test` |
| Master | `master2@barber.test` |
| Master | `master3@barber.test` |
| Client | `client1@barber.test` |
| Client | `client2@barber.test` |

## 4. Schema overview

```
users ──1:1── masters ──1:N── schedules
  │              │            time_off
  │              │            appointments ──1:1── reviews
  │              └──N:M── services (pivot: master_service)
  │                            │
  │                       categories
  └──1:N── appointments (as client)

settings, pages  — standalone key/value and CMS content
```

`appointments.service_id` uses `ON DELETE RESTRICT` so a booked service cannot
be hard-deleted; every other FK cascades.

## 5. Seeded data

| Entity              | Count | Notes                                              |
| ------------------- | ----- | -------------------------------------------------- |
| Roles               | 3     | `admin`, `master`, `client`                        |
| Users               | 6     | 1 admin, 3 masters, 2 clients                      |
| Categories          | 4     | Стрижки, Борода и усы, Комплексные, Уход            |
| Services            | 14    | realistic RU names and rouble prices               |
| Master ↔ Service    | 8–11 per master | ±10% price variation, rounded to 50 ₽ |
| Schedules           | 5 per master | Tue–Sat 10:00–20:00, break 14:00–15:00      |
| Appointments        | 13    | 8 completed + 2 pending + 3 confirmed              |
| Reviews             | 8     | all approved                                       |
| Settings            | 9     | `site_name`, `phone`, `address`, …                 |
| Pages               | 2     | `about`, `contacts`                                |

`masters.rating` is re-derived from the approved reviews at the end of
`ReviewSeeder`, so the cached column can never contradict its reviews.

## 6. Notable implementation decisions

* **`finalPriceLabel`** (`App\Models\Appointment`) returns a single offer as
  `"2 000 ₽"`, a min/max pair as `"1 800–2 200 ₽"`, and `null` when unpriced. An
  explicit `master_price_offer` always wins over a range.
* **Spatie permission tables** are authored explicitly in
  `0001_01_01_000003_create_permission_tables.php` rather than published from the
  package, so the migration timestamp is guaranteed to sort before the
  barbershop tables. A `config/permission.php` is included for the same reason.
* **`users`** is a single consolidated create migration (stock columns plus
  `phone`, `avatar`, `role`) instead of the stock create + a follow-up ALTER, so
  the column order matches the specification.
* **`time_off`** is singular and does not follow Laravel's pluralisation, so the
  model declares `protected $table = 'time_off'`.
* **`AppointmentSeeder`** only books services that the assigned master actually
  performs, reading prices from the `master_service` pivot.
* **`MasterServiceSeeder`** seeds `mt_srand()` with a fixed value so the
  "random" assignment is reproducible across runs.
* `Setting` caches the whole key/value map under `barbershop.settings` and busts
  it on save/delete.

## 7. Tests

`phpunit.xml` pins the test suite to in-memory SQLite, so it expects PHP's
`pdo_sqlite` extension. MySQL-specific details (native `ENUM`, reserved-word
quoting of `settings.group`) are therefore only exercised structurally.

```bash
php artisan test
```

* `tests/Unit/AppointmentPriceLabelTest.php` — all branches of `finalPriceLabel`.
* `tests/Feature/BookingSchemaTest.php` — migrations, seed counts, relationships,
  schedule shape, scope behaviour and rating consistency.

## 8. Frontend wiring

* `resources/js/app.tsx` — `createInertiaApp` entry point.
* `resources/js/types/index.d.ts` — `SharedProps` (`auth.user`, `flash`) plus the
  `PageProps` module augmentation.
* `resources/js/Layouts/AppLayout.tsx` — minimal shell (real nav in PROMPT 2+).
* `resources/js/Pages/Example.tsx` — smoke-test page rendering shared props.
* `resources/views/app.blade.php` — root template with an anti-flash dark-mode
  snippet.
* `@/*` maps to `resources/js/*` in both `tsconfig.json` and `vite.config.ts`.

## 9. Next step — PROMPT 2

Controllers, form requests, real routes, the public pages (home, masters,
services) and the auth screens.
