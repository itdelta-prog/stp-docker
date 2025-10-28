import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: "0.0.0.0",
        cors: {
            origin: 'http://tool.nextvision.cz:8181',
            credentials: true,
        },
        hmr: {
            host: 'tool.nextvision.cz',   // для браузера
        },
    },
    
    // loader: { '.js': 'jsx' }
});
