/** @type {import('tailwindcss').Config} */
export default {
    // The public site is dark-only; the token palette is defined in absolute
    // near-black values so no `dark:` variant is needed in components.
    // `darkMode: 'class'` is retained so the legacy `.dark:` utilities used by
    // the PROMPT 1 smoke page keep compiling.
    darkMode: 'class',
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.ts',
        './resources/**/*.tsx',
        './app/**/*.php',
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    ],
    theme: {
        extend: {
            fontFamily: {
                // Body copy — Inter, loaded from Google Fonts in app.blade.php.
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                // Headings — Playfair Display serif.
                display: ['"Playfair Display"', 'Georgia', 'ui-serif', 'serif'],
            },
            colors: {
                'bg-primary': '#0a0a0a',
                'bg-secondary': '#141414',
                'bg-elevated': '#1c1c1c',
                border: '#2a2a2a',
                'text-primary': '#f5f5f5',
                'text-secondary': '#a3a3a3',
                accent: {
                    DEFAULT: '#c9a961',
                    hover: '#d9b971',
                },
                danger: '#dc2626',
                success: '#16a34a',
            },
            // The PROMPT 1 palette is still referenced by the smoke page and by
            // `progress.color`; keeping it avoids breaking those references.
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(100%)' },
                    to: { transform: 'translateX(0)' },
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.96)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 300ms ease-out both',
                'fade-up': 'fade-up 500ms ease-out both',
                'slide-in-right': 'slide-in-right 300ms ease-out both',
                'scale-in': 'scale-in 200ms ease-out both',
            },
        },
    },
    plugins: [],
};
