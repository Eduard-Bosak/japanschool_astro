/* =============================================
   Animations Component (Intersection Observer, Reveal Effects)
   Компонент анимаций (Intersection Observer, Эффекты появления)
   ============================================= */

/**
 * EN: Setup intersection observer for fade-up and scale-in animations
 * RU: Настройка Intersection Observer для анимаций появления
 */
function setupRevealAnimations(): (() => void) | undefined {
  /* EN: Observer for animated elements
     RU: Observer для анимированных элементов */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = el.dataset.delay || '0';
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
  const animated = document.querySelectorAll<HTMLElement>('.fx-fade-up, .fx-scale-in');
  animated.forEach((el) => {
    observer.observe(el);
  });

  // EN: Instantly reveal elements within initial viewport when preloader is about to hide
  // RU: Мгновенно показать элементы в стартовой области видимости когда прелоадер скрывается
  function revealInitialViewport(): void {
    const vh = window.innerHeight;
    animated.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        // Apply delay if specified
        const delay = el.dataset.delay || '0';
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
function setupMicroAnimations(): void {
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
function setupCountUpAnimations(): void {
  const nums = document.querySelectorAll<HTMLElement>('.metric .num');
  if (!nums.length) {
    return;
  }

  const runAnimation = (el: HTMLElement) => {
    const targetVal = parseInt(el.dataset.count || '0', 10) || 0;

    let startTimestamp: number | null = null;
    const duration = 2000;

    function step(timestamp: number) {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      /* EN: Cubic easing for smoother finish
         RU: Кубическое плавное замедление к финалу */
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(targetVal * eased);
      el.textContent = current.toString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = targetVal.toString();
      }
    }
    window.requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const metricObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runAnimation(entry.target as HTMLElement);
            metricObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    nums.forEach((el) => {
      metricObserver.observe(el);
    });
  } else {
    // Fallback
    nums.forEach((el) => {
      el.textContent = el.dataset.count || '0';
    });
  }
}

/**
 * EN: Setup hero parallax effect on scroll
 * RU: Настройка эффекта параллакса героя при прокрутке
 */
function setupHeroParallax(): void {
  /* EN: Skip if reduced motion preference
     RU: Пропустить если предпочтение уменьшенного движения */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) {
    return;
  }

  /* EN: Parallax scroll handler
     RU: Обработчик параллакс-прокрутки */
  function updateParallax(): void {
    const scrollY = window.scrollY;
    const heroHeight = hero!.offsetHeight;

    /* EN: Only apply parallax if hero is in viewport
       RU: Применять параллакс только если герой в области просмотра */
    if (scrollY < heroHeight) {
      const offset = scrollY * 0.4;
      hero!.style.transform = `translateY(${offset}px)`;
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
}

/**
 * EN: Setup spotlight cursor effect
 * RU: Настройка эффекта прожектора курсора
 */
function setupSpotlightCursor(): void {
  /* EN: Skip if reduced motion preference
     RU: Пропустить если предпочтение уменьшенного движения */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  /* EN: Track mouse position for spotlight effect
     RU: Отслеживание позиции мыши для эффекта прожектора */
  let spotlightActive = false;

  function updateSpotlight(e: MouseEvent): void {
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
  let rafId: number | null = null;
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
export function init(): void {
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
