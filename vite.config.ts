import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            // Mirrors the "@/*" path mapping declared in tsconfig.json
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        host: '127.0.0.1',
    },
});
