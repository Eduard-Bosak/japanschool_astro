/* =============================================
   Theme Toggle Component
   Компонент переключения темы
   ============================================= */

import { track } from '../utils/analytics';
import { store } from '../utils/store';

/* EN: Root element and theme order
   RU: Корневой элемент и порядок тем */
const root = document.documentElement as HTMLElement;

type Theme = 'light' | 'dark';

/**
 * EN: Initialize theme from localStorage or system preference
 * RU: Инициализация темы из localStorage или системных настроек
 */
export function initTheme(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = store.get('theme');

  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    root.setAttribute('data-theme', storedTheme);
  } else if (prefersDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

/**
 * EN: Toggle between light and dark theme
 * RU: Переключение между светлой и темной темой
 */
export function cycleTheme(): void {
  const current = (root.getAttribute('data-theme') as Theme) || 'dark';
  const next: Theme = current === 'dark' ? 'light' : 'dark';

  root.setAttribute('data-theme', next);
  store.set('theme', next);

  /* EN: Track theme change
     RU: Отслеживание смены темы */
  track('theme_toggle', { to: next, mode: 'toggle' });
}

/**
 * EN: Set specific theme
 * RU: Установка конкретной темы
 */
export function setTheme(theme: Theme): void {
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
    store.set('theme', theme);
    track('theme_set', { to: theme });
  }
}

/**
 * EN: Get current theme
 * RU: Получение текущей темы
 */
export function getCurrentTheme(): Theme {
  return (root.getAttribute('data-theme') as Theme) || 'dark';
}

/**
 * EN: Setup theme toggle button with animations
 * RU: Настройка кнопки переключения темы с анимациями
 */
export function setupThemeToggle(): void {
  const themeBtn = document.getElementById('themeToggle');
  if (!themeBtn) {
    return;
  }

  /* EN: Set initial ARIA state | RU: Установка начального ARIA состояния */
  const currentTheme = getCurrentTheme();
  themeBtn.setAttribute('aria-pressed', String(currentTheme === 'dark'));
  themeBtn.setAttribute(
    'aria-label',
    `Переключить тему (текущая: ${currentTheme === 'dark' ? 'тёмная' : 'светлая'})`
  );

  /* EN: Add theme transition overlay on toggle
     RU: Добавление оверлея перехода темы при переключении */
  themeBtn.addEventListener('click', () => {
    cycleTheme();

    /* EN: Update ARIA state | RU: Обновление ARIA состояния */
    const newTheme = getCurrentTheme();
    themeBtn.setAttribute('aria-pressed', String(newTheme === 'dark'));
    themeBtn.setAttribute(
      'aria-label',
      `Переключить тему (текущая: ${newTheme === 'dark' ? 'тёмная' : 'светлая'})`
    );

    /* EN: Add transition effect
       RU: Добавление эффекта перехода */
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 950);

    /* EN: Animate button
       RU: Анимация кнопки */
    themeBtn.classList.remove('animating');
    void themeBtn.offsetWidth; // EN: Force reflow | RU: Принудительный reflow
    themeBtn.classList.add('animating');

    /* EN: Update screen reader status
       RU: Обновление статуса для скринридеров */
    const live =
      document.getElementById('themeStatus') ||
      (() => {
        const s = document.createElement('span');
        s.id = 'themeStatus';
        s.className = 'visually-hidden';
        s.setAttribute('aria-live', 'polite');
        document.body.appendChild(s);
        return s;
      })();
    live.textContent = 'Тема: ' + getCurrentTheme();
  });

  /* EN: Remove animation class after animation ends
     RU: Удаление класса анимации после её завершения */
  themeBtn.addEventListener('animationend', () => {
    themeBtn.classList.remove('animating');
  });
}

/**
 * EN: Initialize theme system
 * RU: Инициализация системы тем
 */
export function init(): void {
  initTheme();
  setupThemeToggle();
}
