import { store } from '../utils/store';

const STORAGE_KEY = 'faq_expanded_items';

export function initFAQ() {
  const list = document.getElementById('faqList');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.faq__item'));
  const triggers = Array.from(list.querySelectorAll('.faq__trigger'));
  const controls = document.querySelector('.faq__controls');
  const searchWrap = document.querySelector('.faq__search-wrap');
  const filters = document.querySelector('.faq__filters');
  const filterBtns = Array.from(document.querySelectorAll('.faq__filter'));
  const bulk = document.querySelector('.faq__bulk');
  const progress = document.querySelector('.faq__progress');
  const progressBar = document.querySelector('.faq__progress-bar span') as HTMLElement;
  const progressOpened = document.getElementById('faqProgressOpened');
  const progressTotal = document.getElementById('faqProgressTotal');
  const progressVisible = document.getElementById('faqProgressVisible');
  const searchInput = document.getElementById('faqSearch') as HTMLInputElement;
  const resetBtn = document.getElementById('faqSearchReset');
  const resultsContainer = document.getElementById('faqResults');
  const expandAllBtn = document.getElementById('faqExpandAll');
  const collapseAllBtn = document.getElementById('faqCollapseAll');

  // Restore state from Store
  const savedState = store.get(STORAGE_KEY) || [];
  if (savedState.length > 0) {
    savedState.forEach((idx) => {
      const item = items[idx];
      if (item) {
        openItem(item as HTMLElement);
      }
    });
  }

  // Show controls if JS enabled
  if (controls) (controls as HTMLElement).style.display = 'flex';
  if (searchWrap) (searchWrap as HTMLElement).style.display = 'flex';
  if (filters) (filters as HTMLElement).style.display = 'flex';
  if (bulk) (bulk as HTMLElement).style.display = 'flex';
  if (progress) (progress as HTMLElement).style.display = 'flex';

  updateProgress();

  // Event Listeners
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      const item = btn.closest('.faq__item') as HTMLElement;
      toggleItem(item);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      handleSearch(searchInput.value.trim());
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        handleSearch('');
        searchInput.focus();
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      if (cat) applyFilter(cat);
    });
  });

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      items.forEach((item) => {
        if (!item.classList.contains('faq__item--hidden')) {
          openItem(item as HTMLElement);
        }
      });
      saveState();
      updateProgress();
    });
  }

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      items.forEach((item) => closeItem(item as HTMLElement));
      saveState();
      updateProgress();
    });
  }

  // Functions
  function toggleItem(item: HTMLElement) {
    const isOpen = item.classList.contains('faq__item--open');
    if (isOpen) {
      closeItem(item);
    } else {
      openItem(item);
    }
    saveState();
    updateProgress();
  }

  function openItem(item: HTMLElement) {
    item.classList.add('faq__item--open');
    const panel = item.querySelector('.faq__panel') as HTMLElement;
    const trigger = item.querySelector('.faq__trigger') as HTMLElement;
    if (panel) {
      panel.hidden = false;
      panel.style.maxHeight = panel.scrollHeight + 'px';
      // Set CSS variable for animation
      panel.style.setProperty('--panel-max', panel.scrollHeight + 'px');
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function closeItem(item: HTMLElement) {
    item.classList.remove('faq__item--open');
    const panel = item.querySelector('.faq__panel') as HTMLElement;
    const trigger = item.querySelector('.faq__trigger') as HTMLElement;
    if (panel) {
      panel.style.maxHeight = '0';
      setTimeout(() => {
        if (!item.classList.contains('faq__item--open')) {
          panel.hidden = true;
        }
      }, 800); // Match CSS transition
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function saveState() {
    const openIndices = items
      .map((item, idx) => (item.classList.contains('faq__item--open') ? idx : -1))
      .filter((idx) => idx !== -1);
    store.set(STORAGE_KEY, openIndices);
  }

  function updateProgress() {
    const total = items.length;
    const visibleItems = items.filter((i) => !i.classList.contains('faq__item--hidden'));
    const visibleCount = visibleItems.length;
    const opened = visibleItems.filter((i) => i.classList.contains('faq__item--open')).length;

    if (progressOpened) progressOpened.textContent = opened.toString();
    if (progressTotal) progressTotal.textContent = total.toString();
    if (progressVisible) progressVisible.textContent = visibleCount.toString();

    if (progressBar && visibleCount > 0) {
      const percent = Math.round((opened / visibleCount) * 100);
      progressBar.style.width = `${percent}%`;
    }
  }

  function applyFilter(cat: string) {
    // Update buttons
    filterBtns.forEach((btn) => {
      const isMatch = btn.getAttribute('data-cat') === cat;
      btn.classList.toggle('faq__filter--active', isMatch);
      btn.setAttribute('aria-pressed', isMatch.toString());
    });

    // Filter items
    items.forEach((item) => {
      const itemCat = item.getAttribute('data-cat');
      const show = cat === '__all' || itemCat === cat;
      item.classList.toggle('faq__item--hidden', !show);
    });

    // Reset search if filtering
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      if (resetBtn) resetBtn.hidden = true;
      if (resultsContainer) resultsContainer.innerHTML = '';
    }

    updateProgress();
  }

  function handleSearch(query: string) {
    const q = query.toLowerCase();

    if (resetBtn) resetBtn.hidden = !q;

    let matchCount = 0;

    items.forEach((item) => {
      const triggerTextEl = item.querySelector('.faq__trigger-text');
      const panelTextEl = item.querySelector('.faq__panel-inner p');

      if (!triggerTextEl || !panelTextEl) return;

      const triggerText = triggerTextEl.textContent || '';
      const panelText = panelTextEl.textContent || '';
      const base = triggerText; // Original text

      const matchTrigger = triggerText.toLowerCase().includes(q);
      const matchPanel = panelText.toLowerCase().includes(q);
      const show = !q || matchTrigger || matchPanel;

      item.classList.toggle('faq__item--hidden', !show);

      // Highlight
      if (show) {
        matchCount++;
        // Simple highlight logic for trigger only
        triggerTextEl.innerHTML = q ? highlight(base, q) : base;
      } else {
        triggerTextEl.innerHTML = base;
      }
    });

    if (resultsContainer) {
      resultsContainer.textContent = q ? `Найдено: ${matchCount}` : '';
    }

    // Reset filters visual state to "All" if searching (optional UX)
    if (q) {
      filterBtns.forEach((btn) => {
        btn.classList.remove('faq__filter--active');
        btn.setAttribute('aria-pressed', 'false');
      });
    }

    updateProgress();
  }

  function highlight(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
