/* =============================================
   Enhanced Animations Module
   Расширенные анимации для улучшения UX
   ============================================= */

/**
 * EN: Parallax scroll effect for hero section
 * RU: Параллакс эффект для hero секции
 */
export function initParallax(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) {
    return;
  }

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * 0.5;

    if (hero) {
      hero.style.transform = `translateY(${rate}px)`;
    }
  });
}

/**
 * EN: Smooth scroll reveal animations
 * RU: Плавное появление элементов при прокрутке
 */
export function initScrollReveal(): void {
  // Элементы для анимации появления
  const elementsToReveal = document.querySelectorAll<HTMLElement>(`
    .program-card,
    .benefit-card,
    .review-card,
    .faq-item,
    .contact-info,
    section > h2,
    section > p
  `);

  if (!elementsToReveal.length) {
    return;
  }

  elementsToReveal.forEach((el) => {
    el.classList.add('reveal');
  });

  const revealElement = (el: HTMLElement) => {
    if (!el.classList.contains('revealed')) {
      el.classList.add('revealed');
    }
  };

  let observer: IntersectionObserver | null = null;

  const revealVisibleElements = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    elementsToReveal.forEach((el) => {
      if (el.classList.contains('revealed')) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportHeight * 0.95 && rect.bottom >= 0) {
        revealElement(el);
        if (observer) {
          observer.unobserve(el);
        }
      }
    });
  };

  if (!('IntersectionObserver' in window)) {
    // Фолбэк для старых браузеров — показать сразу
    elementsToReveal.forEach(revealElement);
    return;
  }

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -80px 0px'
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        revealElement(entry.target as HTMLElement);
        observer?.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elementsToReveal.forEach((el) => {
    observer?.observe(el);
  });

  // Подстраховка: мгновенно показываем элементы, уже находящиеся в зоне видимости
  requestAnimationFrame(revealVisibleElements);
  window.addEventListener('load', revealVisibleElements, { once: true });
  window.addEventListener('preloader:will-hide', revealVisibleElements, { once: true });
  window.addEventListener('resize', revealVisibleElements);
}

/**
 * EN: Enhanced hover effects for cards
 * RU: Улучшенные hover эффекты для карточек
 */
export function initCardHoverEffects(): void {
  const cards = document.querySelectorAll<HTMLElement>(
    '.program-card, .benefit-card, .review-card'
  );

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    // 3D tilt effect
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/**
 * EN: Animated counter for statistics
 * RU: Анимированный счетчик для статистики
 */
export function initCounterAnimation(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-counter]');

  const animateCounter = (counter: HTMLElement) => {
    const target = parseInt(counter.getAttribute('data-counter') || '0', 10);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current).toString();
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toString();
      }
    };

    updateCounter();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement;
      if (entry.isIntersecting && !target.classList.contains('counted')) {
        animateCounter(target);
        target.classList.add('counted');
        observer.unobserve(target);
      }
    });
  });

  counters.forEach((counter) => observer.observe(counter));
}

/**
 * EN: Typing animation effect
 * RU: Эффект печатного текста
 */
export function initTypingEffect(selector: string, text: string, speed = 100): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return;
  }

  let index = 0;
  element.textContent = '';

  const type = () => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      window.setTimeout(type, speed);
    }
  };

  type();
}

/**
 * EN: Ripple effect on button click
 * RU: Эффект ряби при клике на кнопку
 */
export function initRippleEffect(): void {
  const buttons = document.querySelectorAll<HTMLElement>('.btn, button');

  buttons.forEach((button) => {
    button.addEventListener('click', (e: MouseEvent) => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      button.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * EN: Floating animation for images
 * RU: Плавающая анимация для изображений
 */
export function initFloatingAnimation(): void {
  const floatingElements = document.querySelectorAll<HTMLElement>('[data-float]');

  floatingElements.forEach((el, index) => {
    el.style.animation = `float ${3 + index * 0.5}s ease-in-out infinite`;
    el.style.animationDelay = `${index * 0.2}s`;
  });
}

/**
 * EN: Text gradient animation
 * RU: Анимация градиента текста
 */
export function initGradientText(): void {
  const gradientTexts = document.querySelectorAll<HTMLElement>('[data-gradient]');

  gradientTexts.forEach((text) => {
    text.style.backgroundImage = 'linear-gradient(45deg, var(--primary), var(--accent))';
    text.style.backgroundSize = '200% 200%';
    text.style.animation = 'gradientShift 3s ease infinite';
    text.style.setProperty('-webkit-background-clip', 'text');
    text.style.setProperty('-webkit-text-fill-color', 'transparent');
  });
}

/**
 * EN: Stagger animation for lists
 * RU: Поэтапная анимация для списков
 */
export function initStaggerAnimation(selector: string, delay = 100): void {
  const items = document.querySelectorAll<HTMLElement>(selector);

  items.forEach((item, index) => {
    item.style.animationDelay = `${index * delay}ms`;
    item.classList.add('stagger-item');
  });
}

/**
 * EN: Progress bar animation on scroll
 * RU: Анимация прогресс-бара при прокрутке
 */
export function initScrollProgress(): void {
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    z-index: 9999;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = windowHeight > 0 ? (window.pageYOffset / windowHeight) * 100 : 0;
    progressBar.style.width = scrolled + '%';
  });
}

/**
 * EN: Magnetic button effect
 * RU: Магнитный эффект для кнопок
 */
export function initMagneticButtons(): void {
  const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');

  buttons.forEach((button) => {
    button.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
}

/**
 * EN: Initialize all enhanced animations
 * RU: Инициализация всех расширенных анимаций
 */
export function init(): void {
  // Основные анимации
  initScrollReveal();
  initCardHoverEffects();
  initRippleEffect();
  initScrollProgress();

  // Опциональные (можно включить при необходимости)
  // initParallax();
  // initCounterAnimation();
  // initFloatingAnimation();
  // initGradientText();
  // initMagneticButtons();
}
