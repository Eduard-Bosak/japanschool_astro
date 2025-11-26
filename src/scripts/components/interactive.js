/* =============================================
   Interactive Elements Module
   Модуль интерактивных элементов (Tooltips, Modals, etc.)
   ============================================= */

/**
 * EN: Initialize tooltips for elements with data-tooltip attribute
 * RU: Инициализация подсказок для элементов с атрибутом data-tooltip
 */
export function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach((element) => {
    const tooltipText = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.textContent = tooltipText;
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);

    // Show tooltip on mouseenter
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

    // Hide tooltip on mouseleave
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

/**
 * EN: Smooth scroll to anchor links
 * RU: Плавная прокрутка к якорным ссылкам
 */
export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      if (href === '#' || href === '#!') {
        return;
      }

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
        const targetPosition =
          target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * EN: Back to top button
 * RU: Кнопка "Наверх"
 */
export function initBackToTop() {
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
export function initMobileMenu() {
  const menuToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.main-nav ul');
  const menuLinks = document.querySelectorAll('.main-nav a');

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
  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 860 &&
      mobileMenu.getAttribute('data-open') === 'true' &&
      !mobileMenu.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      mobileMenu.setAttribute('data-open', 'false');
      document.body.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Prevent body scroll when menu is open
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
export function showLoadingIndicator(button) {
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
export function initCopyToClipboard() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async function () {
      const textToCopy = this.getAttribute('data-copy');

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Show feedback
        const originalText = this.textContent;
        this.textContent = '✓ Скопировано!';
        this.classList.add('copied');

        setTimeout(() => {
          this.textContent = originalText;
          this.classList.remove('copied');
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
export function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach((img) => {
      img.src = img.dataset.src;
    });
  }
}

/**
 * EN: Keyboard navigation improvements
 * RU: Улучшение навигации с клавиатуры
 */
export function initKeyboardNavigation() {
  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals
      document.querySelectorAll('.modal').forEach((modal) => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
        }
      });

      // Close mobile menu
      const mobileMenu = document.querySelector('.main-nav ul');
      if (mobileMenu && mobileMenu.getAttribute('data-open') === 'true') {
        mobileMenu.setAttribute('data-open', 'false');
        document.body.classList.remove('nav-open');
      }
    }
  });

  // Tab trap for modals
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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
export function initPrintButton() {
  document.querySelectorAll('[data-print]').forEach((button) => {
    button.addEventListener('click', () => {
      window.print();
    });
  });
}

/**
 * EN: Initialize all interactive elements
 * RU: Инициализация всех интерактивных элементов
 */
export function init() {
  initTooltips();
  initSmoothScroll();
  initBackToTop();
  initMobileMenu();
  initCopyToClipboard();
  initLazyLoading();
  initKeyboardNavigation();
  initPrintButton();
}
