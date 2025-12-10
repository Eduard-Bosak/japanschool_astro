/* =============================================
   Reviews Carousel Component (Accessible, Touch-enabled)
   Компонент карусели отзывов (Доступный, С поддержкой касаний)
   ============================================= */

import { track } from '../utils/analytics';

/* EN: Carousel state
   RU: Состояние карусели */
let carouselTrack!: HTMLElement;
let prevBtn!: HTMLButtonElement;
let nextBtn!: HTMLButtonElement;
let dotsWrap!: HTMLElement;
let live: HTMLElement | null = null;

let baseSlides: HTMLElement[] = [];
let slidesWithClones: HTMLElement[] = [];
let dots: HTMLButtonElement[] = [];

let index = 1;
let isTransitioning = false;
let autoTimer: number | null = null;

/* EN: Auto-play interval in milliseconds
   RU: Интервал автопроигрывания в миллисекундах */
const INTERVAL = 6500;

/**
 * EN: Get gap between slides
 * RU: Получение зазора между слайдами
 */
function gap(): number {
  return parseFloat(getComputedStyle(carouselTrack).gap || '32') || 32;
}

/**
 * EN: Get slide width
 * RU: Получение ширины слайда
 */
function slideWidth(): number {
  return baseSlides[0]?.getBoundingClientRect().width || 0;
}

/**
 * EN: Translate carousel to current index
 * RU: Перемещение карусели к текущему индексу
 *
 * @param withTransition Use CSS transition | Использовать CSS переход
 */
function translate(withTransition = true): void {
  if (!withTransition) {
    carouselTrack.style.transition = 'none';
  }

  /* EN: Offset equals slide width + CSS gap to keep spacing consistent
      RU: Смещение равно ширине слайда + CSS-gap для сохранения расстояния */
  const offset = -(slideWidth() + gap()) * index;
  carouselTrack.style.transform = `translateX(${offset}px)`;

  if (!withTransition) {
    /* EN: Force reflow to apply immediate position without transition
       RU: Принудительный reflow для применения мгновенной позиции без перехода */
    carouselTrack.getBoundingClientRect();
    carouselTrack.style.transition = '';
  }
}

/**
 * EN: Get current real slide index (without clones)
 * RU: Получение текущего реального индекса слайда (без клонов)
 */
function currentRealIndex(): number {
  const totalSlides = baseSlides.length;
  const normalized = (index - 1 + totalSlides) % totalSlides;
  return normalized;
}

/**
 * EN: Update dot indicators
 * RU: Обновление индикаторов точек
 */
function updateDots(): void {
  const realIndex = currentRealIndex();

  dots.forEach((d, i) => {
    const isActive = i === realIndex;
    d.setAttribute('aria-selected', String(isActive));
    d.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  if (live) {
    live.textContent = `Слайд ${realIndex + 1} из ${baseSlides.length}`;
  }
}

/**
 * EN: Go to specific slide by real index
 * RU: Переход к конкретному слайду по реальному индексу
 *
 * @param realIndex Real slide index | Реальный индекс слайда
 * @param userTriggered User initiated | Инициировано пользователем
 */
function goToActual(realIndex: number, userTriggered = false): void {
  index = realIndex + 1; // EN: Account for leading clone | RU: Учёт ведущего клона
  translate();
  updateDots();

  if (userTriggered) {
    restartAuto();
    track('reviews_carousel_goTo', { index: realIndex });
  }
}

/**
 * EN: Shift carousel by delta
 * RU: Сдвиг карусели на дельту
 *
 * @param {number} delta - Shift amount | Величина сдвига
 */
function shift(delta: number): void {
  if (isTransitioning) {
    return;
  }

  /* EN: Lock pointer/timer input until transition end to avoid double jumps
     RU: Блокируем ввод до окончания transition чтобы не было двойных прыжков */
  index += delta;
  isTransitioning = true;
  translate();
  updateDots();
}

/**
 * EN: Handle transition end for seamless looping
 * RU: Обработка окончания перехода для бесшовного зацикливания
 */
function handleTransitionEnd(): void {
  isTransitioning = false;

  /* EN: Jump to opposite clone for seamless loop
     RU: Прыжок к противоположному клону для бесшовного зацикливания */
  if (index === 0) {
    // EN: Jumped before first real slide | RU: Прыжок перед первым реальным слайдом
    index = baseSlides.length;
    translate(false);
    updateDots();
  } else if (index === slidesWithClones.length - 1) {
    // EN: Jumped after last real slide | RU: Прыжок после последнего реального слайда
    index = 1;
    translate(false);
    updateDots();
  }
}

/**
 * EN: Navigate to next slide
 * RU: Переход к следующему слайду
 */
function next(): void {
  shift(1);
  restartAuto();
  track('reviews_carousel_next');
}

/**
 * EN: Navigate to previous slide
 * RU: Переход к предыдущему слайду
 */
function prev(): void {
  shift(-1);
  restartAuto();
  track('reviews_carousel_prev');
}

/**
 * EN: Start auto-play
 * RU: Запуск автопроигрывания
 */
export function startAuto(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  stopAuto();
  autoTimer = window.setInterval(() => shift(1), INTERVAL);
}

/**
 * EN: Stop auto-play
 * RU: Остановка автопроигрывания
 */
export function stopAuto(): void {
  if (autoTimer) {
    window.clearInterval(autoTimer);
  }
}

/**
 * EN: Restart auto-play
 * RU: Перезапуск автопроигрывания
 */
function restartAuto(): void {
  stopAuto();
  startAuto();
}

/**
 * EN: Setup drag/swipe interaction
 * RU: Настройка drag/swipe взаимодействия
 */
function setupDragSwipe(): void {
  carouselTrack.addEventListener('pointerdown', (e: PointerEvent) => {
    const startX = e.clientX;
    let moved = false;

    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) > 10) {
        moved = true;
      }
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);

      if (!moved) {
        return;
      }

      /* EN: Compare drag distance to threshold to decide direction
         RU: Сравниваем расстояние перетаскивания с порогом чтобы понять направление */
      const diff = ev.clientX - startX;
      if (diff < -40) {
        next();
      } else if (diff > 40) {
        prev();
      }
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
  });
}

/**
 * EN: Setup keyboard navigation
 * RU: Настройка клавиатурной навигации
 */
function setupKeyboard(): void {
  carouselTrack.setAttribute('tabindex', '0');

  carouselTrack.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      next();
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft') {
      prev();
      e.preventDefault();
    }
    if (e.key === 'Home') {
      goToActual(0, true);
      e.preventDefault();
    }
    if (e.key === 'End') {
      goToActual(baseSlides.length - 1, true);
      e.preventDefault();
    }
  });
}

/**
 * EN: Setup pause on hover/focus
 * RU: Настройка паузы при наведении/фокусе
 */
function setupPauseOnInteraction(): void {
  const region = document.getElementById('reviews');
  if (!region) {
    return;
  }

  region.addEventListener('mouseenter', stopAuto);
  region.addEventListener('mouseleave', startAuto);
  region.addEventListener('focusin', stopAuto);
  region.addEventListener('focusout', startAuto);
}

/**
 * EN: Initialize reviews carousel
 * RU: Инициализация карусели отзывов
 */
export function init(): void {
  const trackEl = document.getElementById('reviewsTrack');
  const prevEl = document.querySelector<HTMLButtonElement>('.reviews-controls [data-dir="prev"]');
  const nextEl = document.querySelector<HTMLButtonElement>('.reviews-controls [data-dir="next"]');
  const dotsEl = document.getElementById('revDots');
  live = document.getElementById('reviewsStatus');

  if (!trackEl || !prevEl || !nextEl || !dotsEl) {
    return;
  }

  carouselTrack = trackEl;
  prevBtn = prevEl;
  nextBtn = nextEl;
  dotsWrap = dotsEl;

  baseSlides = Array.from(carouselTrack.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
  const totalSlides = baseSlides.length;

  if (totalSlides === 0) {
    return;
  }

  /* EN: Setup ARIA attributes
     RU: Настройка ARIA атрибутов */
  carouselTrack.setAttribute('role', 'group');
  carouselTrack.setAttribute('aria-live', 'off');
  carouselTrack.setAttribute('aria-roledescription', 'track');

  /* EN: Clone edge slides for seamless looping
     RU: Клонирование крайних слайдов для бесшовного зацикливания */
  const firstClone = baseSlides[0].cloneNode(true) as HTMLElement;
  const lastClone = baseSlides[totalSlides - 1].cloneNode(true) as HTMLElement;

  firstClone.classList.add('is-clone');
  lastClone.classList.add('is-clone');
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');

  carouselTrack.appendChild(firstClone);
  carouselTrack.insertBefore(lastClone, baseSlides[0]);

  slidesWithClones = Array.from(carouselTrack.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );

  /* EN: Add ARIA labels to real slides
     RU: Добавление ARIA меток к реальным слайдам */
  slidesWithClones.forEach((slide) => {
    if (slide.classList.contains('is-clone')) {
      return;
    }

    slide.setAttribute('role', 'group');
    const idx = baseSlides.indexOf(slide);
    slide.setAttribute('aria-label', `Слайд ${idx + 1} из ${totalSlides}`);
  });

  /* EN: Build dot indicators
     RU: Построение индикаторов точек */
  baseSlides.forEach((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `Отзыв ${i + 1}`);

    if (i === 0) {
      d.setAttribute('aria-selected', 'true');
    }
    d.setAttribute('tabindex', i === 0 ? '0' : '-1');

    d.addEventListener('click', () => goToActual(i, true));
    dotsWrap.appendChild(d);
    dots.push(d);
  });
  if (!dots.length) {
    dots = Array.from(dotsWrap.querySelectorAll('button'));
  }

  /* EN: Setup navigation buttons
     RU: Настройка кнопок навигации */
  prevBtn.addEventListener('click', () => prev());
  nextBtn.addEventListener('click', () => next());

  /* EN: Setup interactions
     RU: Настройка взаимодействий */
  carouselTrack.addEventListener('transitionend', handleTransitionEnd);
  setupDragSwipe();
  setupKeyboard();
  setupPauseOnInteraction();

  /* EN: Update on window resize
     RU: Обновление при изменении размера окна */
  window.addEventListener('resize', () => {
    translate(false);
  });

  /* EN: Initial setup
     RU: Начальная настройка */
  translate(false);
  updateDots();
  startAuto();

  /* EN: Export control functions
     RU: Экспорт функций управления */
  window.startCarouselAuto = startAuto;
  window.stopCarouselAuto = stopAuto;
}

declare global {
  interface Window {
    startCarouselAuto?: typeof startAuto;
    stopCarouselAuto?: typeof stopAuto;
  }
}
