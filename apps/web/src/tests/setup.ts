/* =============================================
   Test Setup - Global configuration for Vitest
   Настройка тестов - Глобальная конфигурация Vitest
   ============================================= */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

/* EN: Mock localStorage
   RU: Мок localStorage */
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/* EN: Mock sessionStorage
   RU: Мок sessionStorage */
Object.defineProperty(globalThis, 'sessionStorage', { value: localStorageMock });

/* EN: Mock matchMedia
   RU: Мок matchMedia */
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

/* EN: Mock IntersectionObserver
   RU: Мок IntersectionObserver */
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  /* EN: Simulate intersection | RU: Симуляция пересечения */
  simulateIntersection(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockIntersectionObserver
});

/* EN: Mock ResizeObserver
   RU: Мок ResizeObserver */
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: MockResizeObserver
});

/* EN: Mock requestAnimationFrame
   RU: Мок requestAnimationFrame */
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16)
});

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id)
});

/* EN: Mock scrollTo
   RU: Мок scrollTo */
Object.defineProperty(globalThis, 'scrollTo', {
  value: vi.fn()
});

/* EN: Reset mocks between tests
   RU: Сброс моков между тестами */
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* EN: Export mock utilities for tests
   RU: Экспорт утилит моков для тестов */
export { MockIntersectionObserver, MockResizeObserver };
