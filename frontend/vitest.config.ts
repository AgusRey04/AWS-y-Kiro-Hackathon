import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Los property tests con fast-check (100+ runs con render/unmount de React)
    // superan los 5s por defecto cuando la suite corre en paralelo.
    testTimeout: 30000,
  },
});
