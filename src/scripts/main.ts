/* =============================================
   Main Entry Point - Import and Initialize All Modules
   Главная точка входа - Импорт и инициализация всех модулей
   ============================================= */

/* EN: Import all component modules
  RU: Импорт всех модулей компонентов */
import * as theme from './components/theme.ts';
import * as preloader from './components/preloader.ts';
import * as navigation from './components/navigation.ts';
import * as animations from './components/animations.ts';
import * as enhancedAnimations from './components/enhanced-animations.ts';
import * as interactive from './components/interactive.ts';
import * as sakura from './components/sakura.ts';
import * as faq from './components/faq.ts';
import * as carousel from './components/carousel.ts';
import * as gallery from './components/gallery.ts';
import * as forms from './components/forms.ts';
import * as blog from './components/blog.ts';

/* EN: Import utilities
  RU: Импорт утилит */
import { track } from './utils/analytics';

/* EN: Import API configuration
  RU: Импорт конфигурации API */
import './config/api.config.ts';

type ResponsiveEntry = {
  avif: string[];
  webp: string[];
};

type ResponsiveManifest = Record<string, ResponsiveEntry>;

type AppModules = {
  theme: typeof theme;
  preloader: typeof preloader;
  navigation: typeof navigation;
  animations: typeof animations;
  sakura: typeof sakura;
  faq: typeof faq;
  carousel: typeof carousel;
  gallery: typeof gallery;
  forms: typeof forms;
  track: typeof track;
};

/**
 * EN: Initialize all components on DOM ready
 * RU: Инициализация всех компонентов при готовности DOM
 */
function initializeApp(): void {
  /* EN: Initialize theme system first (runs before DOM ready)
     RU: Инициализация системы тем в первую очередь (выполняется до готовности DOM) */
  theme.initTheme();

  /* EN: Initialize components after DOM is ready
     RU: Инициализация компонентов после готовности DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponents);
  } else {
    initComponents();
  }
}

/**
 * EN: Initialize all UI components
 * RU: Инициализация всех UI компонентов
 */
function initComponents(): void {
  /* EN: Core components
     RU: Основные компоненты */
  try {
    theme.setupThemeToggle();
  } catch (e) {
    console.error('Theme init failed', e);
  }
  try {
    preloader.init();
  } catch (e) {
    console.error('Preloader init failed', e);
  }
  try {
    navigation.init();
  } catch (e) {
    console.error('Navigation init failed', e);
  }
  try {
    animations.init();
  } catch (e) {
    console.error('Animations init failed', e);
  }
  try {
    enhancedAnimations.init();
  } catch (e) {
    console.error('Enhanced Animations init failed', e);
  }
  try {
    interactive.init();
  } catch (e) {
    console.error('Interactive init failed', e);
  }
  try {
    sakura.init();
  } catch (e) {
    console.error('Sakura init failed', e);
  }

  /* EN: Interactive components
     RU: Интерактивные компоненты */
  try {
    faq.init();
  } catch (e) {
    console.error('FAQ init failed', e);
  }
  try {
    carousel.init();
  } catch (e) {
    console.error('Carousel init failed', e);
  }
  try {
    forms.init();
  } catch (e) {
    console.error('Forms init failed', e);
  }

  /* EN: Additional features
      RU: Дополнительные функции */
  void setupResponsiveImages().then(() => {
    /* EN: Initialize gallery AFTER images are processed
       RU: Инициализация галереи ПОСЛЕ обработки изображений */
    try {
      gallery.init();
    } catch (e) {
      console.error('Gallery init failed', e);
    }
  });

  // Initialize blog section interactions
  try {
    blog.init();
  } catch (e) {
    console.error('Blog init failed', e);
  }

  updateFooterYear();

  /* EN: Track page view
     RU: Отслеживание просмотра страницы */
  try {
    track('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });
  } catch (e) {
    console.error('Analytics failed', e);
  }

  // EN: Mark global init flag so fallback (public/index.html) knows app booted
  // RU: Устанавливаем глобальный флаг инициализации чтобы fallback знал, что приложение запустилось
  if (typeof window !== 'undefined') {
    window.__appInitialized = true;
  }

  // EN: Remove no-js class LAST to prevent FOUC/flashing
  // RU: Удаляем класс no-js В ПОСЛЕДНЮЮ ОЧЕРЕДЬ, чтобы предотвратить мигание контента
  document.documentElement.classList.remove('no-js');
}

/**
 * EN: Update footer year dynamically
 * RU: Динамическое обновление года в футере
 */
function updateFooterYear(): void {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

/**
 * EN: Setup responsive image enhancement using manifest
 * RU: Настройка улучшения адаптивных изображений с использованием манифеста
 * @returns {Promise} Promise that resolves when images are processed
 */
function isResponsiveEntry(entry: unknown): entry is ResponsiveEntry {
  return (
    !!entry &&
    typeof entry === 'object' &&
    Array.isArray((entry as ResponsiveEntry).avif) &&
    Array.isArray((entry as ResponsiveEntry).webp)
  );
}

async function setupResponsiveImages(): Promise<void> {
  try {
    const response = await fetch('img-manifest.json');
    if (!response || !response.ok) {
      return;
    }
    const manifest = (await response.json()) as unknown;
    if (!manifest || typeof manifest !== 'object') {
      return;
    }

    const typedManifest = manifest as Partial<ResponsiveManifest>;

    /* EN: Build srcset from array of responsive images
         RU: Построение srcset из массива адаптивных изображений */
    const buildSrcSet = (arr: string[]): string =>
      arr
        .map((p) => {
          const sizeMatch = /-w(\d+)(?:\.\w+)?$/u.exec(p);
          return sizeMatch ? `${p} ${sizeMatch[1]}w` : p;
        })
        .join(', ');

    /* EN: Enhance gallery images with modern formats
         RU: Улучшение изображений галереи современными форматами */
    document.querySelectorAll<HTMLImageElement>('#galleryGrid img').forEach((img) => {
      const orig = img.getAttribute('src');
      if (!orig) {
        return;
      }

      const entry = typedManifest[orig];
      if (!isResponsiveEntry(entry)) {
        return;
      }

      const picture = document.createElement('picture');

      /* EN: Add AVIF source
           RU: Добавление AVIF источника */
      const avif = document.createElement('source');
      avif.type = 'image/avif';
      avif.srcset = buildSrcSet(entry.avif);

      /* EN: Add WebP source
           RU: Добавление WebP источника */
      const webp = document.createElement('source');
      webp.type = 'image/webp';
      webp.srcset = buildSrcSet(entry.webp);

      const sizes = '(max-width: 640px) 50vw, 240px';
      img.setAttribute('sizes', sizes);

      picture.appendChild(avif);
      picture.appendChild(webp);
      picture.appendChild(img.cloneNode(true));
      img.replaceWith(picture);
    });
  } catch {
    /* EN: Silently fail if manifest not found
       RU: Тихий отказ если манифест не найден */
  }
}

/* EN: Start application
   RU: Запуск приложения */
initializeApp();

/* EN: Export for debugging/testing
   RU: Экспорт для отладки/тестирования */
if (typeof window !== 'undefined') {
  window.__japanSchoolApp = {
    theme,
    preloader,
    navigation,
    animations,
    sakura,
    faq,
    carousel,
    gallery,
    forms,
    track
  };
}

declare global {
  interface Window {
    __appInitialized?: boolean;
    __japanSchoolApp?: AppModules;
  }
}
