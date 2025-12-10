/* =============================================
   Unified Animations Module - Optimized
   Единый модуль анимаций - Оптимизированный
   ============================================= */

// ============================================
// Types
// ============================================

interface AnimationConfig {
  threshold: number;
  rootMargin: string;
  once: boolean;
}

// ============================================
// Utilities
// ============================================

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Throttle function for performance
 */
function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * RAF-based throttle for smooth animations
 */
function rafThrottle<T extends (...args: Parameters<T>) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  return (...args: Parameters<T>) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  };
}

// ============================================
// Scroll Reveal Animations
// ============================================

const defaultConfig: AnimationConfig = {
  threshold: 0.12,
  rootMargin: '0px 0px -60px 0px',
  once: true
};

/**
 * Initialize scroll reveal for elements
 * Supports: .fx-fade-up, .fx-scale-in, .reveal, .reveal-on-scroll
 */
export function initScrollReveal(config: Partial<AnimationConfig> = {}): void {
  if (prefersReducedMotion()) return;

  const options = { ...defaultConfig, ...config };

  const revealElements = document.querySelectorAll<HTMLElement>(
    '.fx-fade-up, .fx-scale-in, .reveal, .reveal-on-scroll'
  );

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = el.dataset.delay || '0';
          el.style.transitionDelay = `${delay}ms`;

          // Add appropriate class based on original
          if (el.classList.contains('reveal') || el.classList.contains('reveal-on-scroll')) {
            el.classList.add('revealed', 'is-visible');
          } else {
            el.classList.add('animate-in');
          }

          if (options.once) {
            observer.unobserve(el);
          }
        }
      });
    },
    { threshold: options.threshold, rootMargin: options.rootMargin }
  );

  revealElements.forEach((el) => observer.observe(el));

  // Reveal elements already in viewport
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    revealElements.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        const delay = el.dataset.delay || '0';
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('animate-in', 'revealed', 'is-visible');
        observer.unobserve(el);
      }
    });
  });
}

// ============================================
// Count Up Animation
// ============================================

/**
 * Animate numbers counting up
 * Use: data-count="100" or data-counter="100"
 */
export function initCountUp(): void {
  if (prefersReducedMotion()) {
    // Just show final numbers
    document.querySelectorAll<HTMLElement>('[data-count], [data-counter]').forEach((el) => {
      el.textContent = el.dataset.count || el.dataset.counter || '0';
    });
    return;
  }

  const counters = document.querySelectorAll<HTMLElement>('[data-count], [data-counter]');
  if (!counters.length) return;

  const animateCounter = (el: HTMLElement) => {
    const target = parseInt(el.dataset.count || el.dataset.counter || '0', 10);
    const duration = 2000;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased).toString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toString();
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          if (!el.classList.contains('counted')) {
            animateCounter(el);
            el.classList.add('counted');
          }
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  counters.forEach((el) => observer.observe(el));
}

// ============================================
// Card Hover Effects (Optimized)
// ============================================

/**
 * 3D tilt effect on cards - throttled for performance
 */
export function initCardEffects(): void {
  if (prefersReducedMotion()) return;

  const cards = document.querySelectorAll<HTMLElement>(
    '.program-card, .benefit-card, .review-card'
  );

  cards.forEach((card) => {
    // Throttled mousemove handler
    const handleMove = rafThrottle((e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 8;
      const rotateY = ((centerX - x) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseenter', () => {
      card.style.willChange = 'transform';
    });

    card.addEventListener('mousemove', handleMove as EventListener);

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.willChange = '';
    });
  });
}

// ============================================
// Ripple Effect (Optimized - CSS-driven)
// ============================================

/**
 * Material-style ripple effect using CSS animations
 * Much lighter than creating DOM elements
 */
export function initRipple(): void {
  if (prefersReducedMotion()) return;

  // Use event delegation instead of per-button listeners
  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest<HTMLElement>('.btn, button[type="submit"]');

      if (!button || button.classList.contains('no-ripple')) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Use CSS custom properties for position
      button.style.setProperty('--ripple-x', `${x}px`);
      button.style.setProperty('--ripple-y', `${y}px`);
      button.classList.add('rippling');

      // Remove class after animation
      setTimeout(() => button.classList.remove('rippling'), 600);
    },
    { passive: true }
  );
}

// ============================================
// Spotlight Cursor Effect
// ============================================

/**
 * Subtle spotlight following cursor
 */
export function initSpotlight(): void {
  if (prefersReducedMotion()) return;

  let active = false;

  const updateSpotlight = rafThrottle((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    document.body.style.setProperty('--spot-x', `${x}%`);
    document.body.style.setProperty('--spot-y', `${y}%`);

    if (!active) {
      document.body.classList.add('has-spotlight');
      active = true;
    }
  });

  window.addEventListener('mousemove', updateSpotlight as EventListener, { passive: true });

  window.addEventListener(
    'mouseout',
    (e) => {
      if (!e.relatedTarget) {
        document.body.classList.remove('has-spotlight');
        active = false;
      }
    },
    { passive: true }
  );
}

// ============================================
// Scroll Progress Bar
// ============================================

let progressBar: HTMLElement | null = null;

/**
 * Reading progress indicator
 */
export function initScrollProgress(): void {
  // Only on blog posts or long pages
  if (!document.querySelector('.blog-post, [data-scroll-progress]')) return;

  progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-label', 'Reading progress');
  document.body.appendChild(progressBar);

  const updateProgress = throttle(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(progress).toString());
    }
  }, 16); // ~60fps

  window.addEventListener('scroll', updateProgress, { passive: true });
}

// ============================================
// Stagger Animation
// ============================================

/**
 * Apply staggered animation delays to list items
 */
export function initStagger(selector: string, baseDelay = 50): void {
  if (prefersReducedMotion()) return;

  const items = document.querySelectorAll<HTMLElement>(selector);
  items.forEach((item, i) => {
    item.style.animationDelay = `${i * baseDelay}ms`;
  });
}

// ============================================
// Magnetic Buttons
// ============================================

/**
 * Subtle magnetic pull effect on hover
 */
export function initMagnetic(): void {
  if (prefersReducedMotion()) return;

  const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');

  buttons.forEach((btn) => {
    const handleMove = rafThrottle((e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mousemove', handleMove as EventListener);
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ============================================
// Main Init
// ============================================

/**
 * Initialize all animation systems
 */
export function init(): void {
  // Core animations
  initScrollReveal();
  initCountUp();

  // Interactive effects
  initCardEffects();
  initRipple();
  initSpotlight();

  // Optional - enable as needed
  // initScrollProgress();
  // initMagnetic();
}

// Export individual functions for selective use
export { prefersReducedMotion, throttle, rafThrottle };
