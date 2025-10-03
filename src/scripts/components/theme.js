/* =============================================
   Theme Toggle Component
   Компонент переключения темы
   ============================================= */

import { track } from '../utils/analytics.js';

/* EN: Root element and theme order
   RU: Корневой элемент и порядок тем */
const root = document.documentElement;
const themeOrder = ['dark', 'light', 'spring', 'autumn', 'winter', 'sakura'];

/**
 * EN: Initialize theme from localStorage or system preference
 * RU: Инициализация темы из localStorage или системных настроек
 */
export function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme) {
    root.setAttribute('data-theme', storedTheme);
  } else if (prefersDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

/**
 * EN: Cycle through theme presets
 * RU: Переключение между темами
 */
export function cycleTheme() {
  const current = root.getAttribute('data-theme') || 'dark';
  let idx = themeOrder.indexOf(current);
  
  if (idx === -1) idx = 0;
  
  const next = themeOrder[(idx + 1) % themeOrder.length];
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  
  /* EN: Track theme change
     RU: Отслеживание смены темы */
  track('theme_toggle', { to: next, mode: 'cycle' });
}

/**
 * EN: Set specific theme
 * RU: Установка конкретной темы
 * 
 * @param {string} theme - Theme name | Название темы
 */
export function setTheme(theme) {
  if (themeOrder.includes(theme)) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    track('theme_set', { to: theme });
  }
}

/**
 * EN: Get current theme
 * RU: Получение текущей темы
 * 
 * @returns {string} - Current theme | Текущая тема
 */
export function getCurrentTheme() {
  return root.getAttribute('data-theme') || 'dark';
}

/**
 * EN: Setup theme toggle button with animations
 * RU: Настройка кнопки переключения темы с анимациями
 */
export function setupThemeToggle() {
  const themeBtn = document.getElementById('themeToggle');
  if (!themeBtn) return;
  
  /* EN: Add theme transition overlay on toggle
     RU: Добавление оверлея перехода темы при переключении */
  themeBtn.addEventListener('click', () => {
    cycleTheme();
    
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
    const live = document.getElementById('themeStatus') || (() => {
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
export function init() {
  initTheme();
  setupThemeToggle();
}
