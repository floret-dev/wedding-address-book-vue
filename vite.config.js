import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    build: {
        sourcemap: 'inline',
        rolldownOptions: {
            output: {
                assetFileNames: '[ext]/[name].[hash][extname]',
                chunkFileNames: '[ext]/[name].[hash].js',
                entryFileNames: '[ext]/[name].js',
            }
        }
    },
    plugins: [vue()],
    server: {
        port: process.env.CLIENT_PORT || 8080,
        proxy: {
            '/api': `http://127.0.0.1:${process.env.API_PROXY_PORT || 8081}`
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    }
})
