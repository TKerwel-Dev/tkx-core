import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
            input: {
                engine: resolve(__dirname, 'index.html'),
                renderTest: resolve(__dirname, 'render-test.html')
            }
        }
    },
    server: {
        port: 5173,
        strictPort: true
    }
});
