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
 * EN: Fetch season theme from portal API and apply it
 * RU: Получение сезонной темы из API портала и применение
 */
export async function fetchSeasonTheme(): Promise<void> {
  try {
    // Try to get theme from portal API
    // In dev: localhost:3001, in prod: use PUBLIC_PORTAL_URL env
    const portalUrl = import.meta.env.PUBLIC_PORTAL_URL || 'http://localhost:3001';
    const response = await fetch(`${portalUrl}/api/season`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch season');
    }

    const data = await response.json();
    const season = data.season as string;

    // Apply season theme (uses data-season attribute, not data-theme)
    root.setAttribute('data-season', season);
    localStorage.setItem('season_theme', season);

    track('season_theme_applied', { season, mode: data.mode });
  } catch {
    // Fallback: auto-detect by date
    const month = new Date().getMonth() + 1;
    let season: string;

    if (month >= 12 || month <= 2) {
      season = 'winter';
    } else if (month >= 3 && month <= 5) {
      season = 'spring';
    } else if (month >= 6 && month <= 8) {
      season = 'summer';
    } else {
      season = 'autumn';
    }

    root.setAttribute('data-season', season);
    localStorage.setItem('season_theme', season);
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
  // First apply season theme from portal API
  fetchSeasonTheme();

  // Then setup theme toggle button
  setupThemeToggle();
}
