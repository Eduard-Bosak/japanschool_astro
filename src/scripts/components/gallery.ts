/* =============================================
   Gallery Lightbox Component (Accessible, Keyboard Navigation)
   Компонент галереи с лайтбоксом (Доступный, Клавиатурная навигация)
   ============================================= */

import { track } from '../utils/analytics';
import { eventBus } from '../utils/events';

/* EN: Lightbox state
  RU: Состояние лайтбокса */
let lightbox: HTMLDivElement | null = null;
let imgEl: HTMLImageElement | null = null;
let caption: HTMLParagraphElement | null = null;
let closeBtn: HTMLButtonElement | null = null;
let prevNav: HTMLButtonElement | null = null;
let nextNav: HTMLButtonElement | null = null;

let images: HTMLImageElement[] = [];
let current = 0;
let lastFocus: HTMLElement | null = null;

/**
 * EN: Open lightbox at specific image index
 * RU: Открытие лайтбокса с конкретным изображением
 *
 * @param {number} i - Image index | Индекс изображения
 */
function open(i: number): void {
  if (!images.length || !lightbox || !imgEl || !caption || !closeBtn) {
    return;
  }

  current = (i + images.length) % images.length;

  const fig = images[current].closest('figure');

  /* EN: Update lightbox content
     RU: Обновление содержимого лайтбокса */
  imgEl.src = images[current].src;
  imgEl.alt = images[current].alt || '';
  caption.textContent = fig?.querySelector('figcaption')?.textContent || '';

  /* EN: Show lightbox
     RU: Показ лайтбокса */
  lightbox.classList.add('open');

  /* EN: Store last focused element and focus close button
     RU: Сохранение последнего сфокусированного элемента и фокус на кнопку закрытия */
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  window.setTimeout(() => closeBtn?.focus(), 40);

  track('lightbox_open', { index: current, src: imgEl.src });
}

/**
 * EN: Close lightbox and restore focus
 * RU: Закрытие лайтбокса и восстановление фокуса
 */
function close(): void {
  if (!lightbox) {
    return;
  }

  lightbox.classList.remove('open');

  /* EN: Restore focus to triggering element
     RU: Восстановление фокуса на триггерный элемент */
  if (lastFocus) {
    lastFocus.focus();
  }
}

/**
 * EN: Navigate to previous/next image
 * RU: Навигация к предыдущему/следующему изображению
 *
 * @param {number} dir - Direction (-1 or 1) | Направление (-1 или 1)
 */
function show(dir: number): void {
  open(current + dir);
}

/**
 * EN: Setup keyboard navigation
 * RU: Настройка клавиатурной навигации
 */
function setupKeyboard(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!lightbox || !lightbox.classList.contains('open')) {
      return;
    }

    if (e.key === 'Escape') {
      close();
    }
    if (e.key === 'ArrowRight') {
      show(1);
    }
    if (e.key === 'ArrowLeft') {
      show(-1);
    }
  });
}

/**
 * EN: Create lightbox DOM structure
 * RU: Создание DOM структуры лайтбокса
 */
function createLightbox(): void {
  lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox__inner" role="dialog" aria-modal="true" aria-label="Просмотр изображения">
      <div class="lightbox__figure">
        <button class="lightbox__nav prev" aria-label="Предыдущее изображение">‹</button>
        <img alt="" />
        <button class="lightbox__nav next" aria-label="Следующее изображение">›</button>
        <button class="lightbox__close" aria-label="Закрыть">✕</button>
      </div>
      <p class="lightbox__caption" aria-live="polite"></p>
    </div>
  `;

  document.body.appendChild(lightbox);

  /* EN: Get lightbox elements
     RU: Получение элементов лайтбокса */
  imgEl = lightbox.querySelector<HTMLImageElement>('img');
  caption = lightbox.querySelector<HTMLParagraphElement>('.lightbox__caption');
  closeBtn = lightbox.querySelector<HTMLButtonElement>('.lightbox__close');
  prevNav = lightbox.querySelector<HTMLButtonElement>('.lightbox__nav.prev');
  nextNav = lightbox.querySelector<HTMLButtonElement>('.lightbox__nav.next');
}

/**
 * EN: Setup lightbox event listeners
 * RU: Настройка обработчиков событий лайтбокса
 */
function setupEventListeners(): void {
  if (!lightbox || !closeBtn || !prevNav || !nextNav) {
    return;
  }

  /* EN: Close button
     RU: Кнопка закрытия */
  closeBtn.addEventListener('click', close);

  /* EN: Navigation buttons
     RU: Кнопки навигации */
  prevNav.addEventListener('click', () => show(-1));
  nextNav.addEventListener('click', () => show(1));

  /* EN: Click outside to close
     RU: Клик вне области для закрытия */
  lightbox.addEventListener('click', (e: MouseEvent) => {
    if (e.target === lightbox) {
      close();
    }
  });
}

/**
 * EN: Setup gallery image click handlers
 * RU: Настройка обработчиков кликов по изображениям галереи
 */
function setupGalleryImages(): void {
  const gallery = document.querySelector<HTMLElement>('.gallery');
  if (!gallery) {
    console.warn('[Gallery] Gallery element not found');
    return;
  }

  const figures = Array.from(gallery.querySelectorAll('.gallery__item'));
  console.log('[Gallery] Setting up click handlers for', figures.length, 'items');

  figures.forEach((figure, i) => {
    /* EN: Make figures focusable and clickable
       RU: Сделать фигуры фокусируемыми и кликабельными */
    (figure as HTMLElement).style.cursor = 'zoom-in';
    figure.setAttribute('tabindex', '0');

    /* EN: Click handler
       RU: Обработчик клика */
    figure.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Gallery] Opening image', i);
      open(i);
    });

    /* EN: Keyboard handler
       RU: Обработчик клавиатуры */
    figure.addEventListener('keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        console.log('[Gallery] Opening image via keyboard', i);
        open(i);
      }
    }) as EventListener);
  });
}

/**
 * EN: Initialize gallery lightbox component
 * RU: Инициализация компонента галереи с лайтбоксом
 */
export function init(): void {
  console.log('[Gallery] Initializing...');
  const gallery = document.querySelector<HTMLElement>('.gallery');
  if (!gallery) {
    console.warn('[Gallery] Gallery element not found');
    return;
  }

  /* EN: Get all gallery images
     RU: Получение всех изображений галереи */
  const figures = Array.from(gallery.querySelectorAll('.gallery__item'));
  images = figures
    .map((f) => f.querySelector('img'))
    .filter((img): img is HTMLImageElement => img instanceof HTMLImageElement);

  console.log('[Gallery] Found', images.length, 'images');

  if (images.length === 0) {
    console.warn('[Gallery] No images found');
    return;
  }

  /* EN: Create and setup lightbox
     RU: Создание и настройка лайтбокса */
  createLightbox();
  setupEventListeners();
  setupKeyboard();
  setupGalleryImages();

  console.log('[Gallery] Initialization complete');
}

/* EN: Subscribe to images:ready event for proper initialization timing
   RU: Подписка на событие images:ready для правильного времени инициализации */
eventBus.on('images:ready', () => {
  try {
    init();
  } catch (e) {
    console.error('Gallery init failed', e);
  }
});
