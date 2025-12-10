/* =============================================
   Gallery Lightbox Component with PhotoSwipe
   Компонент галереи с PhotoSwipe лайтбоксом
   ============================================= */

import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { track } from '../utils/analytics';
import { eventBus } from '../utils/events';
import { debug, warn } from '../utils/logger';

/* EN: PhotoSwipe instance
   RU: Экземпляр PhotoSwipe */
let lightbox: PhotoSwipeLightbox | null = null;

/**
 * EN: Initialize gallery with PhotoSwipe lightbox
 * RU: Инициализация галереи с PhotoSwipe лайтбоксом
 */
export function init(): void {
  debug('Initializing PhotoSwipe gallery...', 'Gallery');

  const gallery = document.querySelector<HTMLElement>('.gallery');
  if (!gallery) {
    warn('Gallery element not found', 'Gallery');
    return;
  }

  const items = gallery.querySelectorAll('.gallery__item');
  if (items.length === 0) {
    warn('No gallery items found', 'Gallery');
    return;
  }

  debug(`Found ${items.length} gallery items`, 'Gallery');

  /* EN: Prepare gallery items for PhotoSwipe
     RU: Подготовка элементов галереи для PhotoSwipe */
  items.forEach((item, index) => {
    const img = item.querySelector('img');
    if (!img) return;

    /* EN: Make items clickable and focusable
       RU: Делаем элементы кликабельными и фокусируемыми */
    (item as HTMLElement).style.cursor = 'zoom-in';
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Открыть изображение ${index + 1}`);

    /* EN: Create link wrapper for PhotoSwipe
       RU: Создание обёртки-ссылки для PhotoSwipe */
    const link = document.createElement('a');
    link.href = img.src;
    link.setAttribute('data-pswp-width', String(img.naturalWidth || 1200));
    link.setAttribute('data-pswp-height', String(img.naturalHeight || 800));

    /* EN: Get caption from figcaption if exists
       RU: Получение подписи из figcaption если есть */
    const figcaption = item.querySelector('figcaption');
    if (figcaption) {
      link.setAttribute('data-pswp-caption', figcaption.textContent || '');
    }

    /* EN: Wrap image in link
       RU: Обернуть изображение в ссылку */
    img.parentNode?.insertBefore(link, img);
    link.appendChild(img);
  });

  /* EN: Initialize PhotoSwipe Lightbox
     RU: Инициализация PhotoSwipe Lightbox */
  lightbox = new PhotoSwipeLightbox({
    gallery: '.gallery',
    children: 'a',
    pswpModule: () => import('photoswipe'),

    /* EN: Accessibility options
       RU: Опции доступности */
    closeOnVerticalDrag: true,
    tapAction: 'close',

    /* EN: UI customization
       RU: Кастомизация UI */
    bgOpacity: 0.9,
    showHideAnimationType: 'zoom',
    zoomSVG:
      '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7c1.4 0 2.7-.4 3.8-1.1l4.1 4.1 1.4-1.4-4.1-4.1c.7-1.1 1.1-2.4 1.1-3.8C13.3 3.1 10.2 0 7.3 0H7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" fill="currentColor"/></svg>',

    /* EN: Padding for mobile
       RU: Отступы для мобильных */
    paddingFn: () => ({ top: 30, bottom: 30, left: 20, right: 20 })
  });

  /* EN: Track lightbox open event
     RU: Отслеживание события открытия лайтбокса */
  lightbox.on('openingAnimationStart', () => {
    const currentIndex = lightbox?.pswp?.currIndex ?? 0;
    track('lightbox_open', { index: currentIndex });
    debug(`Opened image ${currentIndex}`, 'Gallery');
  });

  /* EN: Track slide change
     RU: Отслеживание смены слайда */
  lightbox.on('change', () => {
    const currentIndex = lightbox?.pswp?.currIndex ?? 0;
    track('lightbox_slide', { index: currentIndex });
  });

  /* EN: Initialize lightbox
     RU: Инициализация лайтбокса */
  lightbox.init();

  debug('PhotoSwipe gallery initialized', 'Gallery');
}

/**
 * EN: Destroy lightbox instance
 * RU: Уничтожение экземпляра лайтбокса
 */
export function destroy(): void {
  if (lightbox) {
    lightbox.destroy();
    lightbox = null;
    debug('PhotoSwipe gallery destroyed', 'Gallery');
  }
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
