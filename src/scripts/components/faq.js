/* =============================================
   FAQ Accordion Component (Accessible)
   Компонент аккордеона FAQ (Доступный)
   ============================================= */

import { track } from '../utils/analytics.js';

/* EN: Storage key for persisting FAQ state
   RU: Ключ хранилища для сохранения состояния FAQ */
const STORAGE_KEY = 'faqState.v1';

/* EN: FAQ state
   RU: Состояние FAQ */
let list, items, triggers;
let expandAllBtn, collapseAllBtn;
let searchInput, resetBtn, resultsEl;
let filterBar;
let progOpenedEl, progTotalEl, progVisibleEl, progBarFill;
let activeCat = '__all';
let lastQuery = '';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * EN: Measure panel intrinsic height
 * RU: Измерение внутренней высоты панели
 * 
 * @param {HTMLElement} panel - Panel element | Элемент панели
 * @returns {number} - Height in pixels | Высота в пикселях
 */
function measure(panel) {
  const wasHidden = panel.hasAttribute('hidden');
  if (wasHidden) panel.removeAttribute('hidden');
  
  panel.style.maxHeight = 'none';
  const inner = panel.querySelector('.faq-panel-inner');
  const h = (inner ? inner.getBoundingClientRect().height : panel.scrollHeight) + 24;
  panel.style.maxHeight = '';
  
  if (wasHidden) panel.setAttribute('hidden', '');
  return h;
}

/**
 * EN: Open FAQ item
 * RU: Открытие элемента FAQ
 * 
 * @param {HTMLElement} trigger - Trigger button | Кнопка триггера
 * @param {boolean} silent - Don't track event | Не отслеживать событие
 */
function open(trigger, silent = false) {
  const id = trigger.getAttribute('aria-controls');
  const panel = document.getElementById(id);
  const item = trigger.closest('.faq-item');
  
  if (!panel || !item || item.classList.contains('open')) return;
  
  panel.removeAttribute('hidden');
  const h = measure(panel);
  panel.style.setProperty('--panel-max', h + 'px');
  
  requestAnimationFrame(() => {
    item.classList.add('open');
  });
  
  trigger.setAttribute('aria-expanded', 'true');
  
  if (!silent) track('faq_open', { id });
  updateProgress();
  persist();
}

/**
 * EN: Close FAQ item
 * RU: Закрытие элемента FAQ
 * 
 * @param {HTMLElement} trigger - Trigger button | Кнопка триггера
 * @param {boolean} silent - Don't track event | Не отслеживать событие
 */
function close(trigger, silent = false) {
  const id = trigger.getAttribute('aria-controls');
  const panel = document.getElementById(id);
  const item = trigger.closest('.faq-item');
  
  if (!panel || !item || !item.classList.contains('open')) return;
  
  const h = panel.getBoundingClientRect().height;
  panel.style.setProperty('--panel-max', h + 'px');
  
  requestAnimationFrame(() => {
    item.classList.remove('open');
    panel.style.setProperty('--panel-max', '0px');
  });
  
  trigger.setAttribute('aria-expanded', 'false');
  
  if (!silent) track('faq_close', { id });
  updateProgress();
  persist();
  
  if (!reduced) {
    panel.addEventListener('transitionend', function te(ev) {
      if (ev.propertyName === 'max-height' && !item.classList.contains('open')) {
        panel.setAttribute('hidden', '');
        panel.removeEventListener('transitionend', te);
      }
    }, { once: true });
  } else {
    panel.setAttribute('hidden', '');
  }
}

/**
 * EN: Toggle FAQ item
 * RU: Переключение элемента FAQ
 * 
 * @param {HTMLElement} trigger - Trigger button | Кнопка триггера
 */
function toggle(trigger) {
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  expanded ? close(trigger) : open(trigger);
}

/**
 * EN: Expand all FAQ items
 * RU: Развернуть все элементы FAQ
 */
function expandAll() {
  triggers.forEach(t => open(t, true));
  track('faq_expand_all');
}

/**
 * EN: Collapse all FAQ items
 * RU: Свернуть все элементы FAQ
 */
function collapseAll() {
  triggers.forEach(t => close(t, true));
  track('faq_collapse_all');
}

/**
 * EN: Normalize string for comparison
 * RU: Нормализация строки для сравнения
 */
function norm(s) {
  return (s || '').toLowerCase();
}

/**
 * EN: Highlight search query in text
 * RU: Подсветка поискового запроса в тексте
 */
function highlight(text, q) {
  if (!q) return text;
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
function applyFilter() {
  const q = norm(searchInput?.value.trim());
  
  if (q === lastQuery && applyFilter.__lastCat === activeCat) return;
  
  lastQuery = q;
  applyFilter.__lastCat = activeCat;
  
  let visible = 0;
  
  items.forEach(item => {
    const cat = item.getAttribute('data-cat');
    const triggerTextEl = item.querySelector('.faq-trigger-text');
    
    if (!triggerTextEl) return;
    
    /* EN: Store original text
       RU: Сохранение оригинального текста */
    if (!triggerTextEl.__orig) {
      triggerTextEl.__orig = triggerTextEl.innerHTML;
    }
    
    const base = triggerTextEl.__orig;
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
function updateProgress() {
  const total = items.length;
  const visibleItems = items.filter(i => !i.classList.contains('filter-hide'));
  const openedVisible = visibleItems.filter(i => i.classList.contains('open')).length;
  
  if (progTotalEl) progTotalEl.textContent = total.toString();
  if (progVisibleEl) progVisibleEl.textContent = visibleItems.length.toString();
  if (progOpenedEl) progOpenedEl.textContent = openedVisible.toString();
  
  if (progBarFill) {
    const ratio = visibleItems.length ? (openedVisible / visibleItems.length) : 0;
    progBarFill.style.width = (ratio * 100).toFixed(1) + '%';
  }
}

/**
 * EN: Persist FAQ state to localStorage
 * RU: Сохранение состояния FAQ в localStorage
 */
function persist() {
  try {
    const openIds = triggers
      .filter(t => t.getAttribute('aria-expanded') === 'true')
      .map(t => t.id);
    
    const state = {
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
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    const state = JSON.parse(raw);
    
    /* EN: Restore search query
       RU: Восстановление поискового запроса */
    if (state.q && searchInput) {
      searchInput.value = state.q;
    }
    
    /* EN: Restore category filter
       RU: Восстановление фильтра категорий */
    if (state.cat && filterBar) {
      activeCat = state.cat;
      Array.from(filterBar.querySelectorAll('.faq-filter')).forEach(b => {
        const on = b.getAttribute('data-cat') === activeCat;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    
    applyFilter();
    
    /* EN: Restore open items
       RU: Восстановление открытых элементов */
    if (Array.isArray(state.open)) {
      state.open.forEach(id => {
        const trig = document.getElementById(id);
        if (trig) open(trig, true);
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
function setupKeyboardNav() {
  triggers.forEach(btn => {
    btn.addEventListener('click', () => toggle(btn));
    
    btn.addEventListener('keydown', e => {
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
function setupSearch() {
  searchInput?.addEventListener('input', () => {
    applyFilter();
  });
  
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      applyFilter();
    }
  });
  
  resetBtn?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    searchInput.focus();
    applyFilter();
  });
  
  filterBar?.addEventListener('click', e => {
    const btn = e.target.closest('.faq-filter');
    if (!btn) return;
    
    const cat = btn.getAttribute('data-cat');
    if (!cat || cat === activeCat) return;
    
    activeCat = cat;
    
    Array.from(filterBar.querySelectorAll('.faq-filter')).forEach(b => {
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
function handleDeepLink() {
  if (location.hash.startsWith('#faq-panel-')) {
    const panel = document.querySelector(location.hash);
    if (panel) {
      const trigId = panel.getAttribute('aria-labelledby');
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

/**
 * EN: Initialize FAQ accordion component
 * RU: Инициализация компонента аккордеона FAQ
 */
export function init() {
  list = document.getElementById('faqList');
  if (!list) return;
  
  items = Array.from(list.querySelectorAll('.faq-item'));
  triggers = items.map(i => i.querySelector('.faq-trigger')).filter(Boolean);
  
  if (!triggers.length) return;
  
  /* EN: Get UI elements
     RU: Получение элементов UI */
  expandAllBtn = document.getElementById('faqExpandAll');
  collapseAllBtn = document.getElementById('faqCollapseAll');
  searchInput = document.getElementById('faqSearch');
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
  items.forEach(item => {
    const panel = item.querySelector('.faq-panel');
    if (!panel) return;
    
    const h = measure(panel);
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
