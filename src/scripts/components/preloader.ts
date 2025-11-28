/* =============================================
   Preloader Component
   Компонент прелоадера
   ============================================= */

/**
 * EN: Preloader initialization and fade out
 * RU: Инициализация прелоадера и его исчезновение
 */
export function init(): void {
  const preloader = document.getElementById('preloader');
  if (!preloader) {
    return;
  }

  const root = document.documentElement;
  if (root) {
    root.classList.add('preloader-active');
  }

  // Dynamic timing strategy
  const MIN_SHOW = 800; // минимальное время для плавной анимации загрузки
  const MAX_SHOW = 2500; // максимальное время показа прелоадера
  const start = performance.now();
  let done = false;
  let progress = 0;
  const percentEl = document.getElementById('preloaderPercent');
  const barFill = document.getElementById('preloaderBarFill');

  function now(): number {
    return performance.now();
  }

  function elapsed(): number {
    return now() - start;
  }

  function safeHide(): void {
    if (done) {
      return;
    }
    done = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('preloader:will-hide'));
    }
    if (root) {
      root.classList.remove('preloader-active');
    }
    preloader?.classList.add('fade-out');
    setTimeout(() => {
      if (preloader) preloader.style.display = 'none';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preloader:done'));
      }
    }, 550);
    // Final surge animation to 100%
    const surgeStart = progress;
    const surgeDur = 260;
    const surgeFromTime = performance.now();
    function surgeTick(now: number) {
      const t = Math.min(1, (now - surgeFromTime) / surgeDur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = surgeStart + (100 - surgeStart) * eased;
      if (percentEl) {
        percentEl.textContent = Math.round(val) + '%';
      }
      if (barFill) {
        barFill.style.width = Math.round(val) + '%';
      }
      if (t < 1) {
        requestAnimationFrame(surgeTick);
      }
    }
    requestAnimationFrame(surgeTick);
  }

  function attemptHide(trigger: string): void {
    // Wait at least MIN_SHOW; if not elapsed, delay remaining
    const remain = MIN_SHOW - elapsed();
    if (remain > 0) {
      setTimeout(() => attemptHide(trigger), remain);
      return;
    }
    safeHide();
  }

  // Wait for full load OR a heuristic of readiness (DOM + hero image loaded)
  function readinessHeuristic(): boolean {
    const hero = document.querySelector('.hero');
    return !!hero; // could be expanded with image decode checks
  }

  // Simulated progressive percent updates
  function tickProgress(): void {
    if (done) {
      return;
    }
    const e = elapsed();
    let target;
    if (e < MIN_SHOW) {
      target = 70 * (e / MIN_SHOW); // accelerate to 70% in min window
    } else if (e < 4000) {
      const t = (e - MIN_SHOW) / (4000 - MIN_SHOW);
      target = 70 + 20 * t; // 70 -> 90
    } else {
      target = 95;
    }
    if (target > progress) {
      progress = target;
      const shown = Math.round(progress);
      if (percentEl) {
        percentEl.textContent = shown + '%';
      }
      if (barFill) {
        barFill.style.width = shown + '%';
      }
    }
    requestAnimationFrame(tickProgress);
  }
  tickProgress();

  // If document already complete schedule hide respecting min time
  if (document.readyState === 'complete') {
    requestAnimationFrame(() => attemptHide('already-complete'));
  } else {
    window.addEventListener('load', () => attemptHide('window-load'));
    document.addEventListener('DOMContentLoaded', () => {
      // Fallback: if images slow, still hide after reasonable buffer once DOM ready
      const CHECK_INTERVAL = 180;
      const CHECK_LIMIT = 8; // ~1.4s after DOM
      let checks = 0;
      const safetyTimeout = setTimeout(() => attemptHide('dom-safety'), 2200);
      const int = setInterval(() => {
        if (readinessHeuristic()) {
          clearInterval(int);
          clearTimeout(safetyTimeout);
          attemptHide('heuristic-fast');
        } else if (++checks >= CHECK_LIMIT) {
          clearInterval(int);
          clearTimeout(safetyTimeout);
          attemptHide('dom-quick-timeout');
        }
      }, CHECK_INTERVAL);
    });
  }

  // Hard cap
  setTimeout(() => attemptHide('max-cap'), MAX_SHOW);
}
