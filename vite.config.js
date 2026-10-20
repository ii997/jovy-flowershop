import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        // Laravel serves the page from its own origin while Vite serves modules
        // and HMR from :5173 during local development.
        cors: true,
    },
    plugins: [
        tailwindcss(),
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                'resources/js/admin.tsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
