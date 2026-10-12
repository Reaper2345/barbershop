<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{--
        The first-paint title. `site_name` (editable in /admin/settings) wins;
        APP_NAME via config('app.name') is the fallback. Inertia replaces this
        with the per-page title once the app hydrates (`@inertiaHead`).
    --}}
    <title inertia>{{ \App\Models\Setting::allCached()['site_name'] ?? config('app.name', 'Барбершоп') }}</title>

    {{--
        Typography: Playfair Display for headings, Inter for body copy.
        `display=swap` keeps first paint immediate while the fonts load; the
        Tailwind font stacks declare serif/sans fallbacks for offline setups.
    --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap"
    >

    {{-- Prevent a flash of light theme when dark mode is stored in localStorage. --}}
    <script>
        (function () {
            try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (stored === null && prefersDark)) {
                    document.documentElement.classList.add('dark');
                }
            } catch (e) {
                /* localStorage can be unavailable in private mode - ignore. */
            }
        })();
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="font-sans antialiased bg-bg-primary text-text-primary">
    @inertia
</body>
</html>
