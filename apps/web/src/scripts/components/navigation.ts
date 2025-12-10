/* =============================================
   Navigation Component (Mobile Menu, Scroll Spy, Smooth Scroll)
   Компонент навигации (Мобильное меню, Scroll Spy, Плавная прокрутка)
   ============================================= */

import { track } from '../utils/analytics';

/**
 * EN: Setup mobile navigation toggle with backdrop
 * RU: Настройка переключения мобильного меню с backdrop
 */
function setupMobileNav(): void {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('navMenu');
  if (!navToggle || !navMenu) {
    return;
  }

  /* EN: Create backdrop element for mobile menu
     RU: Создание элемента backdrop для мобильного меню */
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    /* EN: Close menu on backdrop click
       RU: Закрытие меню при клике на backdrop */
    backdrop.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.setAttribute('data-open', 'false');
      document.body.classList.remove('nav-open');
    });
  }

  /* EN: Toggle mobile menu on button click
     RU: Переключение мобильного меню по клику на кнопку */
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu.setAttribute('data-open', String(!expanded));
    document.body.classList.toggle('nav-open', !expanded);
  });

  /* EN: Close menu when link is clicked on mobile
     RU: Закрытие меню при клике на ссылку на мобильном */
  navMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth < 860) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('data-open', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  });
}

/**
 * EN: Setup smooth scroll with offset for fixed header
 * RU: Настройка плавной прокрутки с отступом для фиксированной шапки
 */
function setupSmoothScroll(): void {
  /* EN: Offset scroll handler for anchor links
     RU: Обработчик прокрутки с отступом для якорных ссылок */
  function offsetScroll(this: HTMLAnchorElement, e: Event): void {
    if (this.hash) {
      const target = document.querySelector(this.hash);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  /* EN: Add scroll handler to all anchor links
     RU: Добавление обработчика прокрутки ко всем якорным ссылкам */
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', offsetScroll);

    /* EN: Track anchor clicks
       RU: Отслеживание кликов по якорям */
    a.addEventListener('click', () => {
      track('nav_anchor_click', { target: a.getAttribute('href') });
    });
  });
}

/**
 * EN: Setup scroll spy for navigation highlighting
 * RU: Настройка scroll spy для подсветки навигации
 */
function setupScrollSpy(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.main-nav a[href^="#"]'));
  if (!links.length || typeof IntersectionObserver === 'undefined') {
    return;
  }

  /* EN: Map sections to navigation links
     RU: Сопоставление секций и навигационных ссылок */
  const map = new Map<Element, HTMLAnchorElement>();
  links.forEach((link) => {
    const hash = link.getAttribute('href');
    if (!hash || hash.length < 2) {
      return;
    }

    const id = hash.slice(1);
    const section = document.getElementById(id);
    if (section) {
      map.set(section, link);
    }
  });

  if (!map.size) {
    return;
  }

  let activeId: string | null = null;

  /* EN: Activate link by section ID
     RU: Активация ссылки по ID секции */
  const activate = (id: string) => {
    if (id === activeId) {
      return;
    }
    activeId = id;

    links.forEach((link) => {
      const linkId = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', linkId === id);
    });
  };

  /* EN: Observe sections for intersection
     RU: Наблюдение за пересечением секций */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const link = map.get(entry.target);
        if (link) {
          activate(entry.target.id);
        }
      });
    },
    { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
  );

  /* EN: Start observing all sections
     RU: Начало наблюдения за всеми секциями */
  map.forEach((_link, section) => observer.observe(section));

  /* EN: Set first link active on load
     RU: Установка первой ссылки активной при загрузке */
  const first = links[0];
  if (first) {
    activate(first.getAttribute('href')?.slice(1) || '');
  }
}

/**
 * EN: Setup scroll progress bar
 * RU: Настройка индикатора прогресса прокрутки
 */
function setupScrollProgress(): void {
  const progressBar = document.querySelector<HTMLElement>('.scroll-progress span');
  if (!progressBar) {
    return;
  }

  /* EN: Update scroll progress on scroll
     RU: Обновление прогресса прокрутки при скролле */
  function updateScrollProgress(): void {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progressBar) {
      progressBar.style.width = (ratio * 100).toFixed(2) + '%';
    }
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  /* EN: Initial update on load
     RU: Начальное обновление при загрузке */
  window.addEventListener('load', updateScrollProgress);
}

/**
 * EN: Restore scroll position from session storage
 * RU: Восстановление позиции прокрутки из session storage
 */
function setupScrollRestore(): void {
  const STORAGE_KEY = 'scroll:restore';

  const restore = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }

      const { path, y } = JSON.parse(saved);
      if (path === window.location.pathname) {
        window.scrollTo(0, y);
      }
    } catch (_) {
      /* EN: Ignore errors | RU: Игнорировать ошибки */
    }
  };

  /* EN: Restore scroll position on load and BFCache return
     RU: Восстановление позиции при загрузке и возврате из BFCache */
  window.addEventListener('load', restore);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      restore();
    }
  });

  const save = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          path: window.location.pathname,
          y: window.scrollY
        })
      );
    } catch (_) {
      /* EN: Ignore errors | RU: Игнорировать ошибки */
    }
  };

  /* EN: Use pagehide/visibilitychange to stay BFCache-friendly
     RU: Используем pagehide/visibilitychange для совместимости с BFCache */
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      save();
    }
  });
}

/**
 * EN: Setup link prefetching on hover for faster navigation
 * RU: Настройка prefetch ссылок при наведении для быстрой навигации
 */
function setupLinkPrefetch(): void {
  const prefetched = new Set<string>();

  /* EN: Prefetch internal links on hover after delay
     RU: Prefetch внутренних ссылок при наведении после задержки */
  document.addEventListener(
    'pointerenter',
    (e) => {
      const link = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) {
        return;
      }

      /* EN: Skip if already prefetched | RU: Пропуск если уже prefetched */
      if (prefetched.has(href)) return;

      /* EN: Use requestIdleCallback or setTimeout fallback
         RU: Использование requestIdleCallback или setTimeout */
      const prefetch = () => {
        if (prefetched.has(href)) return;
        prefetched.add(href);

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = 'document';
        document.head.appendChild(link);
      };

      if ('requestIdleCallback' in window) {
        (
          window as Window & {
            requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void;
          }
        ).requestIdleCallback(prefetch, { timeout: 300 });
      } else {
        globalThis.setTimeout(prefetch, 100);
      }
    },
    { passive: true, capture: true }
  );
}

/**
 * EN: Initialize navigation component
 * RU: Инициализация компонента навигации
 */
export function init(): void {
  setupMobileNav();
  setupSmoothScroll();
  setupScrollSpy();
  setupScrollProgress();
  setupScrollRestore();
  setupLinkPrefetch();
}
