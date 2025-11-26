/* =============================================
   Animations Component (Intersection Observer, Reveal Effects)
   Компонент анимаций (Intersection Observer, Эффекты появления)
   ============================================= */

/**
 * EN: Setup intersection observer for fade-up and scale-in animations
 * RU: Настройка Intersection Observer для анимаций появления
 */
function setupRevealAnimations() {
  /* EN: Observer for animated elements
     RU: Observer для анимированных элементов */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('animate-in');
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.15 }
  );

  /* EN: Observe all elements with animation classes
     RU: Наблюдение за всеми элементами с классами анимации */
  const animated = document.querySelectorAll('.fx-fade-up, .fx-scale-in');
  animated.forEach((el) => {
    observer.observe(el);
  });

  // EN: Instantly reveal elements within initial viewport when preloader is about to hide
  // RU: Мгновенно показать элементы в стартовой области видимости когда прелоадер скрывается
  function revealInitialViewport() {
    const vh = window.innerHeight;
    animated.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        // Apply delay if specified
        const delay = el.dataset.delay || 0;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('animate-in');
        observer.unobserve(el);
      }
    });
  }

  // Export for immediate call
  return revealInitialViewport;
}

/**
 * EN: Setup micro observer for reveal-on-scroll elements
 * RU: Настройка micro observer для элементов reveal-on-scroll
 */
function setupMicroAnimations() {
  const microObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          microObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  /* EN: Observe reveal-on-scroll elements
     RU: Наблюдение за элементами reveal-on-scroll */
  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    microObserver.observe(el);
  });
}

/**
 * EN: Setup count-up animation for metric numbers
 * RU: Настройка анимации подсчёта для метрик
 */
function setupCountUpAnimations() {
  const nums = document.querySelectorAll('.metric .num');
  if (!nums.length) {
    console.log('[Animations] No metric numbers found');
    return;
  }

  console.log('[Animations] Found', nums.length, 'metric numbers');

  const runAnimation = (el) => {
    const targetVal = parseInt(el.dataset.count, 10) || 0;
    console.log('[Animations] Starting count-up animation for', targetVal);

    let startTimestamp = null;
    const duration = 2000;

    function step(timestamp) {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(targetVal * eased);
      el.textContent = current;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = targetVal;
        console.log('[Animations] Count-up completed:', targetVal);
      }
    }
    window.requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const metricObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('[Animations] Metric visible, starting animation');
            runAnimation(entry.target);
            metricObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    nums.forEach((el) => {
      console.log('[Animations] Observing metric:', el.dataset.count);
      metricObserver.observe(el);
    });
  } else {
    // Fallback
    console.log('[Animations] IntersectionObserver not supported, using fallback');
    nums.forEach((el) => {
      el.textContent = el.dataset.count;
    });
  }
}

/**
 * EN: Setup hero parallax effect on scroll
 * RU: Настройка эффекта параллакса героя при прокрутке
 */
function setupHeroParallax() {
  /* EN: Skip if reduced motion preference
     RU: Пропустить если предпочтение уменьшенного движения */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const hero = document.querySelector('.hero');
  if (!hero) {
    return;
  }

  /* EN: Parallax scroll handler
     RU: Обработчик параллакс-прокрутки */
  function updateParallax() {
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;

    /* EN: Only apply parallax if hero is in viewport
       RU: Применять параллакс только если герой в области просмотра */
    if (scrollY < heroHeight) {
      const offset = scrollY * 0.4;
      hero.style.transform = `translateY(${offset}px)`;
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
}

/**
 * EN: Setup spotlight cursor effect
 * RU: Настройка эффекта прожектора курсора
 */
function setupSpotlightCursor() {
  /* EN: Skip if reduced motion preference
     RU: Пропустить если предпочтение уменьшенного движения */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  /* EN: Track mouse position for spotlight effect
     RU: Отслеживание позиции мыши для эффекта прожектора */
  let spotlightActive = false;

  function updateSpotlight(e) {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    document.body.style.setProperty('--spot-x', `${x}%`);
    document.body.style.setProperty('--spot-y', `${y}%`);

    if (!spotlightActive) {
      document.body.classList.add('has-spotlight');
      spotlightActive = true;
    }
  }

  /* EN: Debounce mouse move for performance
     RU: Debounce движения мыши для производительности */
  let rafId = null;
  window.addEventListener('mousemove', (e) => {
    if (rafId) {
      return;
    }
    rafId = requestAnimationFrame(() => {
      updateSpotlight(e);
      rafId = null;
    });
  });

  /* EN: Remove spotlight when mouse leaves window
     RU: Удаление прожектора когда курсор покидает окно */
  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget) {
      document.body.classList.remove('has-spotlight');
      spotlightActive = false;
    }
  });
}

/**
 * EN: Initialize all animation systems
 * RU: Инициализация всех систем анимации
 */
export function init() {
  const revealInitial = setupRevealAnimations();

  // EN: Immediately reveal visible elements to prevent flash when no-js is removed
  // RU: Мгновенно показываем видимые элементы, чтобы предотвратить мигание при удалении no-js
  if (revealInitial) {
    revealInitial();
  }

  setupMicroAnimations();
  setupCountUpAnimations();
  setupHeroParallax();
  setupSpotlightCursor();
}
