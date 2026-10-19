import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: { alias: { '@': path.resolve(__dirname, 'resources/js') } },
    test: { environment: 'jsdom', include: ['resources/js/__tests__/**/*.test.{ts,tsx}'] },
    esbuild: { jsx: 'automatic' },
});
