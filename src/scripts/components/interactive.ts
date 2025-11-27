/* =============================================
   Interactive Elements Module
   Модуль интерактивных элементов (Tooltips, Modals, etc.)
   ============================================= */

/**
 * EN: Initialize tooltips for elements with data-tooltip attribute
 * RU: Инициализация подсказок для элементов с атрибутом data-tooltip
 */
export function initTooltips(): void {
  const tooltipElements = document.querySelectorAll<HTMLElement>('[data-tooltip]');

  tooltipElements.forEach((element) => {
    const tooltipText = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';

    if (!tooltipText) {
      return;
    }

    // EN: Build detached tooltip once per element | RU: Создаём один tooltip на элемент
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.textContent = tooltipText;
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);

    // EN: On hover calculate coordinates against viewport | RU: На hover вычисляем координаты относительно вьюпорта
    element.addEventListener('mouseenter', () => {
      const rect = element.getBoundingClientRect();
      let top;
      let left;

      switch (position) {
        case 'top':
          top = rect.top - tooltip.offsetHeight - 10;
          left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
          left = rect.left - tooltip.offsetWidth - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
          left = rect.right + 10;
          break;
        default:
          top = rect.top - tooltip.offsetHeight - 10;
          left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
      }

      tooltip.style.top = `${top + window.pageYOffset}px`;
      tooltip.style.left = `${left}px`;
      tooltip.style.opacity = '1';
    });

    // EN: Smoothly hide without DOM removals | RU: Плавно скрываем без удаления узла
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

/**
 * EN: Smooth scroll to anchor links
 * RU: Плавная прокрутка к якорным ссылкам
 */
export function initSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e: MouseEvent) => {
      const href = anchor.getAttribute('href');

      if (!href || href === '#' || href === '#!') {
        return;
      }

      e.preventDefault();
      const target = document.querySelector<HTMLElement>(href);
      if (!target) {
        return;
      }

      /* EN: Offset target by header height so anchor is not hidden
        RU: Смещаем цель на высоту хедера чтобы якорь не перекрывался */
      const headerHeight = document.querySelector<HTMLElement>('.main-header')?.offsetHeight || 0;
      const targetPosition =
        target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/**
 * EN: Back to top button
 * RU: Кнопка "Наверх"
 */
export function initBackToTop(): void {
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.innerHTML = '↑';
  backToTop.setAttribute('aria-label', 'Наверх');
  backToTop.style.opacity = '0';
  backToTop.style.pointerEvents = 'none';
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTop.style.opacity = '1';
      backToTop.style.pointerEvents = 'auto';
    } else {
      backToTop.style.opacity = '0';
      backToTop.style.pointerEvents = 'none';
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * EN: Enhanced mobile menu with slide animation
 * RU: Улучшенное мобильное меню с анимацией
 */
export function initMobileMenu(): void {
  const menuToggle = document.querySelector<HTMLElement>('.nav-toggle');
  const mobileMenu = document.querySelector<HTMLElement>('.main-nav ul');
  const menuLinks = document.querySelectorAll<HTMLAnchorElement>('.main-nav a');

  if (!menuToggle || !mobileMenu) {
    return;
  }

  // Close menu when clicking on link
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 860) {
        mobileMenu.setAttribute('data-open', 'false');
        document.body.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e: MouseEvent) => {
    if (
      window.innerWidth <= 860 &&
      mobileMenu.getAttribute('data-open') === 'true' &&
      e.target instanceof Node &&
      !mobileMenu.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      mobileMenu.setAttribute('data-open', 'false');
      document.body.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Prevent body scroll when menu is open
  /* EN: Observe open/close attribute to lock scroll
     RU: Следим за атрибутом открытия чтобы блокировать скролл */
  const observer = new MutationObserver(() => {
    if (mobileMenu.getAttribute('data-open') === 'true') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  observer.observe(mobileMenu, { attributes: true });
}

/**
 * EN: Loading indicator for forms
 * RU: Индикатор загрузки для форм
 */
export function showLoadingIndicator(button: HTMLButtonElement | null): (() => void) | void {
  if (!button) {
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.classList.add('loading');
  button.innerHTML = '<span class="spinner"></span> Отправка...';

  return () => {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = originalText;
  };
}

/**
 * EN: Copy to clipboard functionality
 * RU: Функция копирования в буфер обмена
 */
export function initCopyToClipboard(): void {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const textToCopy = button.getAttribute('data-copy') || '';

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Show feedback
        const originalText = button.textContent;
        button.textContent = '✓ Скопировано!';
        button.classList.add('copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });
}

/**
 * EN: Lazy loading images with Intersection Observer
 * RU: Ленивая загрузка изображений с Intersection Observer
 */
export function initLazyLoading(): void {
  const lazyImages = document.querySelectorAll<HTMLImageElement>('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.add('loaded');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach((img) => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
      }
    });
  }
}

/**
 * EN: Keyboard navigation improvements
 * RU: Улучшение навигации с клавиатуры
 */
export function initKeyboardNavigation(): void {
  // ESC key to close modals
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close any open modals
      document.querySelectorAll<HTMLElement>('.modal').forEach((modal) => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
        }
      });

      // Close mobile menu
      const mobileMenu = document.querySelector<HTMLElement>('.main-nav ul');
      if (mobileMenu && mobileMenu.getAttribute('data-open') === 'true') {
        mobileMenu.setAttribute('data-open', 'false');
        document.body.classList.remove('nav-open');
      }
    }
  });

  // Tab trap for modals
  document.querySelectorAll<HTMLElement>('.modal').forEach((modal) => {
    modal.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        /* EN: Trap focus between first/last elements
           RU: Цепляем фокус между первым и последним элементами */
        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements.length) {
          return;
        }
        const firstElement = focusableElements[0];
        const lastIndex = focusableElements.length - 1;
        const lastElement = focusableElements[lastIndex];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  });
}

/**
 * EN: Print page functionality
 * RU: Функция печати страницы
 */
export function initPrintButton(): void {
  document.querySelectorAll<HTMLElement>('[data-print]').forEach((button) => {
    button.addEventListener('click', () => {
      window.print();
    });
  });
}

/**
 * EN: Initialize all interactive elements
 * RU: Инициализация всех интерактивных элементов
 */
export function init(): void {
  initTooltips();
  initSmoothScroll();
  initBackToTop();
  initMobileMenu();
  initCopyToClipboard();
  initLazyLoading();
  initKeyboardNavigation();
  initPrintButton();
}
