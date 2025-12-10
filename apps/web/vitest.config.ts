import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    /* EN: Use happy-dom for DOM testing
       RU: Использование happy-dom для DOM тестирования */
    environment: 'happy-dom',

    /* EN: Global test utilities
       RU: Глобальные утилиты для тестов */
    globals: true,

    /* EN: Setup files run before each test file
       RU: Файлы настройки запускаются перед каждым тестовым файлом */
    setupFiles: ['./src/tests/setup.ts'],

    /* EN: Include test patterns
       RU: Паттерны включения тестов */
    include: ['src/**/*.{test,spec}.{js,ts}'],

    /* EN: Coverage configuration
       RU: Конфигурация покрытия */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/scripts/**/*.ts'],
      exclude: ['src/scripts/**/*.test.ts', 'src/tests/**/*']
    },

    /* EN: Reporter configuration
       RU: Конфигурация репортера */
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json'
    }
  },

  resolve: {
    alias: {
      '@scripts': resolve(__dirname, './src/scripts'),
      '@components': resolve(__dirname, './src/components'),
      '@tests': resolve(__dirname, './src/tests')
    }
  }
});
