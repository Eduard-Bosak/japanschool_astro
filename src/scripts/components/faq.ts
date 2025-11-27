/* =============================================
   FAQ Accordion Component (Accessible)
   Компонент аккордеона FAQ (Доступный)
   ============================================= */

import { track } from '../utils/analytics';

/* EN: Storage key for persisting FAQ state
   RU: Ключ хранилища для сохранения состояния FAQ */
const STORAGE_KEY = 'faqState.v1';

/* EN: FAQ state
   RU: Состояние FAQ */
let list: HTMLElement | null = null;
let items: HTMLElement[] = [];
let triggers: HTMLElement[] = [];
let expandAllBtn: HTMLElement | null = null;
let collapseAllBtn: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let resetBtn: HTMLElement | null = null;
let resultsEl: HTMLElement | null = null;
let filterBar: HTMLElement | null = null;
let progOpenedEl: HTMLElement | null = null;
let progTotalEl: HTMLElement | null = null;
let progVisibleEl: HTMLElement | null = null;
let progBarFill: HTMLElement | null = null;
let activeCat = '__all';
let lastQuery = '';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface FAQState {
  q: string;
  cat: string;
  open: string[];
}

/**
 * EN: Measure panel intrinsic height
 * RU: Измерение внутренней высоты панели
 */
function measure(panel: HTMLElement): number {
  // EN: Robust measurement
  // RU: Надежное измерение
  const wasHidden = panel.hasAttribute('hidden');
  const prevDisplay = panel.style.display;
  const prevVis = panel.style.visibility;
  const prevPos = panel.style.position;
  const prevMax = panel.style.maxHeight;

  if (wasHidden) {
    panel.removeAttribute('hidden');
  }

  // Force visible state for measurement
  panel.style.display = 'block';
  panel.style.visibility = 'hidden';
  panel.style.position = 'absolute'; // Prevent layout shift
  panel.style.maxHeight = 'none';

  const h = panel.scrollHeight;

  // Restore
  panel.style.display = prevDisplay;
  panel.style.visibility = prevVis;
  panel.style.position = prevPos;
  panel.style.maxHeight = prevMax;

  if (wasHidden) {
    panel.setAttribute('hidden', '');
  }

  return h + 30; // Increased Buffer
}

/**
 * EN: Open FAQ item
 * RU: Открытие элемента FAQ
 */
function open(trigger: HTMLElement, silent = false): void {
  const id = trigger.getAttribute('aria-controls');
  if (!id) return;

  const panel = document.getElementById(id);
  const item = trigger.closest('.faq-item');

  if (!panel || !item || item.classList.contains('open')) {
    return;
  }

  // 1. Unhide and measure
  panel.removeAttribute('hidden');
  panel.style.maxHeight = '0px';

  // Force reflow
  void panel.offsetHeight;

  /* EN: Pre-calc max height once and store in CSS var to sync with styles
      RU: Один раз вычисляем высоту и сохраняем в CSS переменной для синхронизации со стилями */
  const h = measure(panel);
  panel.style.setProperty('--panel-max', h + 'px');

  // 2. Animate
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      item.classList.add('open');
      panel.style.maxHeight = h + 'px';
    });
  });

  trigger.setAttribute('aria-expanded', 'true');
  if (!silent) {
    track('faq_open', { id });
  }
  updateProgress();
  persist();
}

/**
 * EN: Close FAQ item
 * RU: Закрытие элемента FAQ
 */
function close(trigger: HTMLElement, silent = false): void {
  const id = trigger.getAttribute('aria-controls');
  if (!id) return;

  const panel = document.getElementById(id);
  const item = trigger.closest('.faq-item');

  if (!panel || !item || !item.classList.contains('open')) {
    return;
  }

  const h = panel.getBoundingClientRect().height;
  panel.style.setProperty('--panel-max', h + 'px');

  requestAnimationFrame(() => {
    item.classList.remove('open');
    panel.style.setProperty('--panel-max', '0px');
  });

  trigger.setAttribute('aria-expanded', 'false');

  if (!silent) {
    track('faq_close', { id });
  }
  updateProgress();
  persist();

  if (!reduced) {
    panel.addEventListener(
      'transitionend',
      function te(ev) {
        if (ev.propertyName === 'max-height' && !item.classList.contains('open')) {
          panel.setAttribute('hidden', '');
          panel.removeEventListener('transitionend', te);
        }
      },
      { once: true }
    );
  } else {
    panel.setAttribute('hidden', '');
  }
}

/**
 * EN: Toggle FAQ item
 * RU: Переключение элемента FAQ
 */
function toggle(trigger: HTMLElement): void {
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  expanded ? close(trigger) : open(trigger);
}

/**
 * EN: Expand all FAQ items
 * RU: Развернуть все элементы FAQ
 */
function expandAll(): void {
  triggers.forEach((t) => open(t, true));
  track('faq_expand_all');
}

/**
 * EN: Collapse all FAQ items
 * RU: Свернуть все элементы FAQ
 */
function collapseAll(): void {
  triggers.forEach((t) => close(t, true));
  track('faq_collapse_all');
}

/**
 * EN: Normalize string for comparison
 * RU: Нормализация строки для сравнения
 */
function norm(s: string | null): string {
  return (s || '').toLowerCase();
}

/**
 * EN: Highlight search query in text
 * RU: Подсветка поискового запроса в тексте
 */
function highlight(text: string, q: string): string {
  if (!q) {
    return text;
  }
  try {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(' + esc + ')', 'ig');
    return text.replace(re, '<mark>$1</mark>');
  } catch {
    return text;
  }
}

/**
 * EN: Apply search and category filters
 * RU: Применение поиска и фильтров категорий
 */
function applyFilter(): void {
  const q = norm(searchInput?.value.trim() || '');

  if (q === lastQuery && (applyFilter as any).__lastCat === activeCat) {
    return;
  }

  lastQuery = q;
  (applyFilter as any).__lastCat = activeCat;

  let visible = 0;

  items.forEach((item) => {
    const cat = item.getAttribute('data-cat');
    const triggerTextEl = item.querySelector('.faq-trigger-text');

    if (!triggerTextEl) {
      return;
    }

    /* EN: Store original text
       RU: Сохранение оригинального текста */
    if (!(triggerTextEl as any).__orig) {
      /* EN: Cache original HTML once to avoid nested marks
         RU: Кэшируем оригинальный HTML чтобы избежать вложенных <mark> */
      (triggerTextEl as any).__orig = triggerTextEl.innerHTML;
    }

    const base = (triggerTextEl as any).__orig;
    const text = norm(triggerTextEl.textContent);
    const catOk = activeCat === '__all' || cat === activeCat;
    const qOk = !q || text.includes(q);
    const show = catOk && qOk;

    item.classList.toggle('filter-hide', !show);

    if (show) {
      visible++;
      triggerTextEl.innerHTML = q ? highlight(base, q) : base;
    } else {
      triggerTextEl.innerHTML = base;
    }
  });

  if (resultsEl) {
    resultsEl.textContent = visible ? `Найдено: ${visible}` : 'Нет результатов';
  }

  if (resetBtn) {
    resetBtn.hidden = !q;
  }

  track('faq_filter_apply', { q, category: activeCat, visible });
  updateProgress();
  persist();
}

/**
 * EN: Update progress indicators
 * RU: Обновление индикаторов прогресса
 */
function updateProgress(): void {
  const total = items.length;
  const visibleItems = items.filter((i) => !i.classList.contains('filter-hide'));
  const openedVisible = visibleItems.filter((i) => i.classList.contains('open')).length;

  if (progTotalEl) {
    progTotalEl.textContent = total.toString();
  }
  if (progVisibleEl) {
    progVisibleEl.textContent = visibleItems.length.toString();
  }
  if (progOpenedEl) {
    progOpenedEl.textContent = openedVisible.toString();
  }

  if (progBarFill) {
    const ratio = visibleItems.length ? openedVisible / visibleItems.length : 0;
    progBarFill.style.width = (ratio * 100).toFixed(1) + '%';
  }
}

/**
 * EN: Persist FAQ state to localStorage
 * RU: Сохранение состояния FAQ в localStorage
 */
function persist(): void {
  try {
    const openIds = triggers
      .filter((t) => t.getAttribute('aria-expanded') === 'true')
      .map((t) => t.id);

    const state: FAQState = {
      q: searchInput?.value || '',
      cat: activeCat,
      open: openIds
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* EN: Silently fail | RU: Тихий отказ */
  }
}

/**
 * EN: Restore FAQ state from localStorage
 * RU: Восстановление состояния FAQ из localStorage
 */
function restore(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const state: FAQState = JSON.parse(raw);

    /* EN: Restore search query
       RU: Восстановление поискового запроса */
    if (state.q && searchInput) {
      searchInput.value = state.q;
    }

    /* EN: Restore category filter
       RU: Восстановление фильтра категорий */
    if (state.cat && filterBar) {
      activeCat = state.cat;
      Array.from(filterBar.querySelectorAll('.faq-filter')).forEach((b) => {
        const on = b.getAttribute('data-cat') === activeCat;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }

    applyFilter();

    /* EN: Restore open items
       RU: Восстановление открытых элементов */
    if (Array.isArray(state.open)) {
      state.open.forEach((id) => {
        const trig = document.getElementById(id);
        if (trig) {
          open(trig, true);
        }
      });
    }

    updateProgress();
  } catch (_) {
    /* EN: Silently fail | RU: Тихий отказ */
  }
}

/**
 * EN: Setup FAQ accordion keyboard navigation
 * RU: Настройка клавиатурной навигации аккордеона FAQ
 */
function setupKeyboardNav(): void {
  triggers.forEach((btn) => {
    btn.addEventListener('click', () => toggle(btn));

    btn.addEventListener('keydown', (e) => {
      const idx = triggers.indexOf(btn);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        triggers[(idx + 1) % triggers.length].focus();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        triggers[(idx - 1 + triggers.length) % triggers.length].focus();
      }

      if (e.key === 'Home') {
        e.preventDefault();
        triggers[0].focus();
      }

      if (e.key === 'End') {
        e.preventDefault();
        triggers[triggers.length - 1].focus();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(btn);
      }
    });
  });
}

/**
 * EN: Setup search and filters
 * RU: Настройка поиска и фильтров
 */
function setupSearch(): void {
  searchInput?.addEventListener('input', () => {
    applyFilter();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchInput) searchInput.value = '';
      applyFilter();
    }
  });

  resetBtn?.addEventListener('click', () => {
    if (!searchInput) {
      return;
    }
    searchInput.value = '';
    searchInput.focus();
    applyFilter();
  });

  filterBar?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.faq-filter');
    if (!btn) {
      return;
    }

    const cat = btn.getAttribute('data-cat');
    if (!cat || cat === activeCat) {
      return;
    }

    activeCat = cat;

    Array.from(filterBar!.querySelectorAll('.faq-filter')).forEach((b) => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    applyFilter();
  });
}

/**
 * EN: Handle deep link to FAQ item
 * RU: Обработка прямой ссылки на элемент FAQ
 */
function handleDeepLink(): void {
  if (location.hash.startsWith('#faq-panel-')) {
    const panel = document.querySelector(location.hash);
    if (panel) {
      const trigId = panel.getAttribute('aria-labelledby');
      if (trigId) {
        const trig = document.getElementById(trigId);
        if (trig) {
          open(trig, true);
          setTimeout(() => {
            trig.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    }
  }
}

/**
 * EN: Initialize FAQ accordion component
 * RU: Инициализация компонента аккордеона FAQ
 */
export function init(): void {
  list = document.getElementById('faqList');
  if (!list) {
    return;
  }

  items = Array.from(list.querySelectorAll('.faq-item'));
  triggers = items.map((i) => i.querySelector('.faq-trigger')).filter(Boolean) as HTMLElement[];

  if (!triggers.length) {
    return;
  }

  /* EN: Get UI elements
     RU: Получение элементов UI */
  expandAllBtn = document.getElementById('faqExpandAll');
  collapseAllBtn = document.getElementById('faqCollapseAll');
  searchInput = document.getElementById('faqSearch') as HTMLInputElement;
  resetBtn = document.getElementById('faqSearchReset');
  resultsEl = document.getElementById('faqResults');
  filterBar = document.querySelector('.faq-filters');
  progOpenedEl = document.getElementById('faqProgressOpened');
  progTotalEl = document.getElementById('faqProgressTotal');
  progVisibleEl = document.getElementById('faqProgressVisible');
  progBarFill = document.querySelector('.faq-progress-bar span');

  /* EN: Setup expand/collapse buttons
     RU: Настройка кнопок развернуть/свернуть */
  expandAllBtn?.addEventListener('click', expandAll);
  collapseAllBtn?.addEventListener('click', collapseAll);

  /* EN: Pre-measure intrinsic heights for smoother first open
     RU: Предварительное измерение высот для плавного первого открытия */
  items.forEach((item) => {
    const panel = item.querySelector('.faq-panel') as HTMLElement;
    if (!panel) {
      return;
    }

    measure(panel); // Pre-measure for smoother animation
    panel.style.setProperty('--panel-max', '0px');
    panel.setAttribute('hidden', '');
  });

  /* EN: Setup interactions
     RU: Настройка взаимодействий */
  setupKeyboardNav();
  setupSearch();

  /* EN: Apply initial filter and restore state
     RU: Применение начального фильтра и восстановление состояния */
  applyFilter();
  restore();
  updateProgress();

  /* EN: Handle deep links
     RU: Обработка прямых ссылок */
  handleDeepLink();
}
