import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        target: 'es2020',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return;
                    if (/[/\\]react(-dom)?[/\\]/.test(id))
                        return 'vendor-react';
                    if (/[/\\]lucide-react[/\\]/.test(id))
                        return 'vendor-icons';
                    return 'vendor-libs';
                },
            },
        },
    },
});
