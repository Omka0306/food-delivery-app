import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/main.jsx',
        'dist/**',
        '**/*.config.{js,ts}',
        'postcss.config.js',
        'tailwind.config.js',
      ],
      thresholds: {
        lines: 40,
        statements: 40,
        functions: 35,
        branches: 30,
      },
    },
  },
})
