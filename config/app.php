<?php

use Illuminate\Support\Facades\Facade;
use Illuminate\Support\ServiceProvider;

return [
    'name' => env('APP_NAME', 'Барбершоп'),

    'env' => env('APP_ENV', 'production'),

    'debug' => (bool) env('APP_DEBUG', false),

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Timezone & locale
    |--------------------------------------------------------------------------
    |
    | The barbershop trades in Moscow, so the whole application — and therefore
    | every schedule and appointment boundary — runs on Europe/Moscow time.
    | This must stay a valid IANA identifier: a malformed value makes Carbon
    | throw at boot time.
    |
    */

    'timezone' => env('APP_TIMEZONE', 'Europe/Moscow'),

    'locale' => env('APP_LOCALE', 'ru'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'ru_RU'),

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', env('APP_PREVIOUS_KEYS', '')),
        ),
    ],

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

    'providers' => ServiceProvider::defaultProviders()->merge([
        /*
         * Package service providers are registered through
         * bootstrap/providers.php in Laravel 11; application providers belong
         * in that file too.
         */
    ])->toArray(),

    'aliases' => Facade::defaultAliases()->merge([
        //
    ])->toArray(),

];
