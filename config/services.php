<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | Only credentials that are actually consumed are listed here. The
    | barbershop integration point for later prompts is the inbound webhook
    | secret used by the payment callback.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'payments' => [
        'provider' => env('PAYMENT_PROVIDER', 'manual'),
        'webhook_secret' => env('PAYMENT_WEBHOOK_SECRET'),
    ],

];
