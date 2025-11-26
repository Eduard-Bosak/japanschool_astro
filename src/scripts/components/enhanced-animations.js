/* =============================================
   Enhanced Animations Module
   Расширенные анимации для улучшения UX
   ============================================= */

/**
 * EN: Parallax scroll effect for hero section
 * RU: Параллакс эффект для hero секции
 */
export function initParallax() {
  const hero = document.querySelector('.hero');
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
export function initScrollReveal() {
  // Элементы для анимации появления
  const elementsToReveal = document.querySelectorAll(`
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

  const revealElement = (el) => {
    if (!el.classList.contains('revealed')) {
      el.classList.add('revealed');
    }
  };

  let observer = null;

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
        revealElement(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elementsToReveal.forEach((el) => {
    observer.observe(el);
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
export function initCardHoverEffects() {
  const cards = document.querySelectorAll('.program-card, .benefit-card, .review-card');

  cards.forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });

    // 3D tilt effect
    card.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });
}

/**
 * EN: Animated counter for statistics
 * RU: Анимированный счетчик для статистики
 */
export function initCounterAnimation() {
  const counters = document.querySelectorAll('[data-counter]');

  const animateCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-counter'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    updateCounter();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        animateCounter(entry.target);
        entry.target.classList.add('counted');
        observer.unobserve(entry.target);
      }
    });
  });

  counters.forEach((counter) => observer.observe(counter));
}

/**
 * EN: Typing animation effect
 * RU: Эффект печатного текста
 */
export function initTypingEffect(selector, text, speed = 100) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  let index = 0;
  element.textContent = '';

  const type = () => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  };

  type();
}

/**
 * EN: Ripple effect on button click
 * RU: Эффект ряби при клике на кнопку
 */
export function initRippleEffect() {
  const buttons = document.querySelectorAll('.btn, button');

  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * EN: Floating animation for images
 * RU: Плавающая анимация для изображений
 */
export function initFloatingAnimation() {
  const floatingElements = document.querySelectorAll('[data-float]');

  floatingElements.forEach((el, index) => {
    el.style.animation = `float ${3 + index * 0.5}s ease-in-out infinite`;
    el.style.animationDelay = `${index * 0.2}s`;
  });
}

/**
 * EN: Text gradient animation
 * RU: Анимация градиента текста
 */
export function initGradientText() {
  const gradientTexts = document.querySelectorAll('[data-gradient]');

  gradientTexts.forEach((text) => {
    text.style.backgroundImage = 'linear-gradient(45deg, var(--primary), var(--accent))';
    text.style.backgroundSize = '200% 200%';
    text.style.animation = 'gradientShift 3s ease infinite';
    text.style.webkitBackgroundClip = 'text';
    text.style.webkitTextFillColor = 'transparent';
  });
}

/**
 * EN: Stagger animation for lists
 * RU: Поэтапная анимация для списков
 */
export function initStaggerAnimation(selector, delay = 100) {
  const items = document.querySelectorAll(selector);

  items.forEach((item, index) => {
    item.style.animationDelay = `${index * delay}ms`;
    item.classList.add('stagger-item');
  });
}

/**
 * EN: Progress bar animation on scroll
 * RU: Анимация прогресс-бара при прокрутке
 */
export function initScrollProgress() {
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
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    progressBar.style.width = scrolled + '%';
  });
}

/**
 * EN: Magnetic button effect
 * RU: Магнитный эффект для кнопок
 */
export function initMagneticButtons() {
  const buttons = document.querySelectorAll('[data-magnetic]');

  buttons.forEach((button) => {
    button.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      this.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    button.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });
}

/**
 * EN: Initialize all enhanced animations
 * RU: Инициализация всех расширенных анимаций
 */
export function init() {
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
