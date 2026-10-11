<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Inertia settings
    |--------------------------------------------------------------------------
    |
    | The root view and the SSR entry point. `ssr` stays disabled for now; the
    | client-side renderer in resources/js/app.tsx is used exclusively.
    |
    */

    'ssr' => [
        'enabled' => false,
        'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714'),
    ],

    'testing' => [
        'ensure_pages_exist' => true,
        'page_paths' => [
            resource_path('js/Pages'),
        ],
        'page_extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],
    ],

    'history' => [
        'encrypt' => env('INERTIA_ENCRYPT_HISTORY', false),
    ],

];
