import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths'; // <-- 1. IMPORTA IL PLUGIN

export default defineConfig({
    plugins: [tsconfigPaths()], // <-- 2. AGGIUNGILO NELL'ARRAY PLUGINS
    test: {
        environment: 'node',
        // le tue altre configurazioni...
    },
});
