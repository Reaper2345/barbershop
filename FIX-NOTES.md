# Исправление: artisan и PSR-4

## Что отсутствовало

- **`artisan`** — CLI-точка входа в корне проекта. Без неё `php artisan` падает
  с ошибкой «Could not open input file: artisan». Файл создан заново
  (форма для Laravel 12: `->handleCommand(new ArgvInput)`).
- `bootstrap/app.php` и остальные файлы каркаса **уже были на месте** — не перезаписывались.

## Что исправлено в namespace

В `app/Enums/Role.php` было объявлено `namespace App;`, хотя файл лежит в `app/Enums/`.
Из-за этого Composer пропускал класс с предупреждением PSR-4, и **18 мест в коде**,
где написано `use App\Enums\Role;`, не могли его найти. Теперь `namespace App\Enums;`.
Второй файл, `app/Enums/AppointmentStatus.php`, уже был корректным.

## Команды по порядку

```bash
composer dump-autoload
php artisan key:generate
php artisan migrate:fresh --seed
npm install
npm run build
```

## Если artisan всё ещё не запускается

1. `php -v` — PHP должен быть доступен в PATH (в OSPanel: Modules → PHP).
2. Существует ли `vendor/autoload.php` (иначе `composer install`).
3. Существует ли `bootstrap/app.php` — именно его подключает `artisan`.
4. На VPS: `chmod +x artisan`, если файл не запускается как `./artisan`.
