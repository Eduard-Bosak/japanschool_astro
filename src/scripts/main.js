/* =============================================
   Main Entry Point - Import and Initialize All Modules
   Главная точка входа - Импорт и инициализация всех модулей
   ============================================= */

/* EN: Import all component modules
   RU: Импорт всех модулей компонентов */
import * as theme from './components/theme.js';
import * as preloader from './components/preloader.js';
import * as navigation from './components/navigation.js';
import * as animations from './components/animations.js';
import * as sakura from './components/sakura.js';
import * as faq from './components/faq.js';
import * as carousel from './components/carousel.js';
import * as gallery from './components/gallery.js';
import * as forms from './components/forms.js';

/* EN: Import utilities
   RU: Импорт утилит */
import { track } from './utils/analytics.js';

/**
 * EN: Initialize all components on DOM ready
 * RU: Инициализация всех компонентов при готовности DOM
 */
function initializeApp() {
  /* EN: Initialize theme system first (runs before DOM ready)
     RU: Инициализация системы тем в первую очередь (выполняется до готовности DOM) */
  theme.initTheme();
  
  /* EN: Initialize components after DOM is ready
     RU: Инициализация компонентов после готовности DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initComponents();
    });
  } else {
    initComponents();
  }
}

/**
 * EN: Initialize all UI components
 * RU: Инициализация всех UI компонентов
 */
function initComponents() {
  /* EN: Core components
     RU: Основные компоненты */
  theme.setupThemeToggle();
  preloader.init();
  navigation.init();
  animations.init();
  sakura.init();
  
  /* EN: Interactive components
     RU: Интерактивные компоненты */
  faq.init();
  carousel.init();
  gallery.init();
  forms.init();
  
  /* EN: Additional features
     RU: Дополнительные функции */
  setupResponsiveImages();
  
  /* EN: Track page view
     RU: Отслеживание просмотра страницы */
  track('page_view', { 
    path: window.location.pathname,
    referrer: document.referrer
  });
}

/**
 * EN: Setup responsive image enhancement using manifest
 * RU: Настройка улучшения адаптивных изображений с использованием манифеста
 */
function setupResponsiveImages() {
  fetch('img-manifest.json')
    .then(r => r && r.ok ? r.json() : null)
    .then(manifest => {
      if (!manifest) return;
      
      /* EN: Build srcset from array of responsive images
         RU: Построение srcset из массива адаптивных изображений */
      function buildSrcSet(arr) {
        return arr.map(p => {
          const m = p.match(/-w(\d+)\./);
          return m ? `${p} ${m[1]}w` : p;
        }).join(', ');
      }
      
      /* EN: Enhance gallery images with modern formats
         RU: Улучшение изображений галереи современными форматами */
      document.querySelectorAll('#galleryGrid img').forEach(img => {
        const orig = img.getAttribute('src');
        if (!manifest[orig]) return;
        
        const picture = document.createElement('picture');
        
        /* EN: Add AVIF source
           RU: Добавление AVIF источника */
        const avif = document.createElement('source');
        avif.type = 'image/avif';
        avif.srcset = buildSrcSet(manifest[orig].avif);
        
        /* EN: Add WebP source
           RU: Добавление WebP источника */
        const webp = document.createElement('source');
        webp.type = 'image/webp';
        webp.srcset = buildSrcSet(manifest[orig].webp);
        
        const sizes = '(max-width: 640px) 50vw, 240px';
        img.setAttribute('sizes', sizes);
        
        picture.appendChild(avif);
        picture.appendChild(webp);
        picture.appendChild(img.cloneNode(true));
        img.replaceWith(picture);
      });
    })
    .catch(() => {
      /* EN: Silently fail if manifest not found
         RU: Тихий отказ если манифест не найден */
    });
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
