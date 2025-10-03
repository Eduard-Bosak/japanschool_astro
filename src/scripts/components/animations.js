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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('animate-in');
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  
  /* EN: Observe all elements with animation classes
     RU: Наблюдение за всеми элементами с классами анимации */
  document.querySelectorAll('.fx-fade-up, .fx-scale-in').forEach(el => {
    observer.observe(el);
  });
  
  /* EN: Refined stagger using data-index if present
     RU: Уточнённая задержка с использованием data-index если присутствует */
  document.querySelectorAll('.post-card.fx-fade-up').forEach(el => {
    const idx = parseInt(el.getAttribute('data-index') || '0', 10);
    if (!isNaN(idx)) {
      el.style.transitionDelay = `calc(var(--stagger-step) * ${idx})`;
    }
  });
}

/**
 * EN: Setup micro observer for reveal-on-scroll elements
 * RU: Настройка micro observer для элементов reveal-on-scroll
 */
function setupMicroAnimations() {
  const microObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        microObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  
  /* EN: Observe reveal-on-scroll elements
     RU: Наблюдение за элементами reveal-on-scroll */
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    microObserver.observe(el);
  });
}

/**
 * EN: Setup count-up animation for metric numbers
 * RU: Настройка анимации подсчёта для метрик
 */
function setupCountUpAnimations() {
  const metricObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numEl = entry.target;
        const targetVal = parseInt(numEl.dataset.count, 10) || 0;
        const duration = 1400;
        const start = performance.now();
        
        /* EN: Animation tick function
           RU: Функция тика анимации */
        function tick(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3); // EN: Ease-out cubic | RU: Ease-out кубический
          numEl.textContent = Math.round(targetVal * eased).toString();
          if (progress < 1) requestAnimationFrame(tick);
        }
        
        requestAnimationFrame(tick);
        metricObserver.unobserve(numEl);
      }
    });
  }, { threshold: 0.4 });
  
  /* EN: Observe all metric numbers
     RU: Наблюдение за всеми метриками */
  document.querySelectorAll('.metric .num').forEach(el => {
    metricObserver.observe(el);
  });
}

/**
 * EN: Setup hero parallax effect on scroll
 * RU: Настройка эффекта параллакса героя при прокрутке
 */
function setupHeroParallax() {
  /* EN: Skip if reduced motion preference
     RU: Пропустить если предпочтение уменьшенного движения */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
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
    if (rafId) return;
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
  setupRevealAnimations();
  setupMicroAnimations();
  setupCountUpAnimations();
  setupHeroParallax();
  setupSpotlightCursor();
}
