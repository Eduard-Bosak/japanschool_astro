/* =============================================
   Blog Post Reading Mode & Enhancements
   Режим чтения и улучшения для статей блога
   ============================================= */

import { store } from './utils/store';

type ToggleMode = 'serif' | 'sepia' | 'focus' | 'contrast';
type SizeAction = 'increase' | 'decrease' | 'reset';
type NotificationType = 'success' | 'error';
type ShareActionButton = 'share' | 'bookmark';

const READING_MODES_KEY = 'readingModes';
const FONT_SIZE_KEY = 'blog.fontSize' as const;
const BOOKMARKS_KEY = 'blog.bookmarks' as const;
const DEFAULT_FONT_SIZE = 2;
const MIN_FONT_SIZE = 0;
const MAX_FONT_SIZE = 4;

/**
 * EN: Entry point for article enhancements
 * RU: Запускает все улучшения страницы статьи
 */
export function init(): void {
  if (!document.querySelector('.blog-post')) {
    return;
  }

  initReadingModes();
  initTimeIndicator();
  initShareButton();
  initBookmarks();
  initPrintButton();
}

/**
 * EN: Restore reading modes and ensure control panel exists
 * RU: Восстанавливает сохранённые режимы чтения и создаёт панель управления
 */
function initReadingModes(): void {
  getSavedToggleModes().forEach((mode) => {
    document.body.classList.add(`reading-mode-${mode}`);
  });

  if (!document.querySelector('.reading-controls')) {
    createReadingModePanel();
  } else {
    restoreFontSize();
  }
}

/**
 * EN: Build floating control panel with toggles and actions
 * RU: Создаёт плавающую панель с настройками режима чтения
 */
function createReadingModePanel(): void {
  const panel = document.createElement('div');
  panel.className = 'reading-controls';
  panel.setAttribute('aria-label', 'Настройки чтения');

  // Simplified panel: font size + theme toggle + share
  panel.innerHTML = `
    <button class="reading-controls__btn" data-mode="size" data-size="decrease" data-tooltip="Меньше" aria-label="Уменьшить текст">A-</button>
    <button class="reading-controls__btn" data-mode="size" data-size="increase" data-tooltip="Больше" aria-label="Увеличить текст">A+</button>
    <div class="reading-controls__separator"></div>
    <button class="reading-controls__btn" data-mode="sepia" data-tooltip="Сепия" aria-label="Режим сепия">☀</button>
    <button class="reading-controls__btn" data-action="share" data-tooltip="Ссылка" aria-label="Поделиться">🔗</button>
  `;

  document.body.appendChild(panel);

  panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    const mode = btn.dataset.mode;
    if (!mode) {
      return;
    }

    const isSizeControl = mode === 'size';

    if (!isSizeControl && document.body.classList.contains(`reading-mode-${mode}`)) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      if (isSizeControl) {
        const sizeAction = btn.dataset.size as SizeAction | undefined;
        if (!sizeAction) {
          return;
        }
        handleFontSizeAction(sizeAction);
      } else if (isToggleMode(mode)) {
        const modeClass = `reading-mode-${mode}`;
        const isActive = document.body.classList.toggle(modeClass);
        btn.classList.toggle('active', isActive);

        const modes: ToggleMode[] = [];
        panel
          .querySelectorAll<HTMLButtonElement>('[data-mode]:not([data-size]).active')
          .forEach((activeBtn) => {
            const activeMode = activeBtn.dataset.mode;
            if (activeMode && isToggleMode(activeMode)) {
              modes.push(activeMode);
            }
          });
        // Keep READING_MODES_KEY in localStorage (not critical data)
        localStorage.setItem(READING_MODES_KEY, JSON.stringify(modes));
      }
    });
  });

  panel.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    const action = btn.dataset.action as ShareActionButton | undefined;
    if (!action) {
      return;
    }

    btn.addEventListener('click', () => {
      if (action === 'share') {
        handleShare();
      } else if (action === 'bookmark') {
        handleBookmark(btn);
      }
    });
  });

  getSavedToggleModes().forEach((mode) => {
    const modeClass = `reading-mode-${mode}`;
    document.body.classList.add(modeClass);
    panel
      .querySelector<HTMLButtonElement>(`[data-mode="${mode}"]:not([data-size])`)
      ?.classList.add('active');
  });

  restoreFontSize();
}

/**
 * EN: Attach dynamic time-to-read indicator
 * RU: Добавляет индикатор оставшегося времени чтения
 */
function initTimeIndicator(): void {
  const metaLine = document.querySelector<HTMLElement>('.blog-post__meta');
  if (!metaLine || !metaLine.textContent) {
    return;
  }

  const timeMatch = metaLine.textContent.match(/(\d+)\s*мин/);
  if (!timeMatch) {
    return;
  }

  const totalMinutes = Number.parseInt(timeMatch[1], 10);
  if (!Number.isFinite(totalMinutes) || totalMinutes < 2) {
    return;
  }

  const indicator = document.createElement('div');
  indicator.className = 'time-indicator';
  indicator.innerHTML =
    '<span class="time-label">Осталось читать:</span> <span class="time-value"></span>';
  document.body.appendChild(indicator);

  let ticking = false;
  const handleScroll = (): void => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(() => {
      updateTimeIndicator(indicator, totalMinutes);
      ticking = false;
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  updateTimeIndicator(indicator, totalMinutes);
}

/**
 * EN: Recalculate indicator value based on scroll progress
 * RU: Пересчитывает оставшееся время чтения по прогрессу скролла
 */
function updateTimeIndicator(indicator: HTMLDivElement, totalMinutes: number): void {
  const content = document.querySelector<HTMLElement>('.blog-post');
  if (!content) {
    return;
  }

  const contentHeight = Math.max(1, content.offsetHeight);
  const windowHeight = window.innerHeight;
  const scrollTop = window.scrollY;
  const contentTop = content.offsetTop;
  const progress = Math.max(
    0,
    Math.min(1, (scrollTop - contentTop + windowHeight) / contentHeight)
  );

  if (progress > 0.98) {
    indicator.style.opacity = '0';
    return;
  }

  indicator.style.opacity = '1';
  const remaining = Math.max(1, Math.ceil(totalMinutes * (1 - progress)));
  const valueEl = indicator.querySelector<HTMLElement>('.time-value');
  if (valueEl) {
    valueEl.textContent = `~${remaining} мин`;
  }
}

/**
 * EN: Wire share/bookmark buttons declared in markup
 * RU: Подключает кнопки «поделиться» и «закладка» из шаблона
 */
function initShareButton(): void {
  document
    .querySelectorAll<HTMLElement>('[data-share-trigger], [data-share-button]')
    .forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        handleShare();
      });
    });
}

/**
 * EN: Share current post via Web Share API with clipboard fallback
 * RU: Пытается шарить через Web Share API и откатывается к клипборду
 */
function handleShare(): void {
  const url = window.location.href;
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;

  if ('share' in navigator && typeof navigator.share === 'function') {
    void navigator.share({ title, url }).catch((error: DOMException) => {
      if (error.name !== 'AbortError') {
        fallbackShare(url);
      }
    });
  } else {
    fallbackShare(url);
  }
}

/**
 * EN: Copy article URL to clipboard and notify user
 * RU: Копирует ссылку статьи в буфер и показывает уведомление
 */
function fallbackShare(url: string): void {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    showNotification('Не удалось скопировать ссылку', 'error');
    return;
  }

  navigator.clipboard
    .writeText(url)
    .then(() => {
      showNotification('Ссылка скопирована в буфер обмена!');
    })
    .catch(() => {
      showNotification('Не удалось скопировать ссылку', 'error');
    });
}

/**
 * EN: Highlight bookmark button when current article is saved
 * RU: Подсвечивает кнопку закладки если статья уже сохранена
 */
function initBookmarks(): void {
  const bookmarkBtn = document.querySelector<HTMLButtonElement>('[data-action="bookmark"]');
  if (!bookmarkBtn) {
    return;
  }

  const bookmarks = getBookmarks();
  const currentPath = window.location.pathname;

  if (bookmarks.includes(currentPath)) {
    bookmarkBtn.classList.add('active');
    bookmarkBtn.textContent = '★';
  }
}

/**
 * EN: Toggle bookmark state and persist to localStorage
 * RU: Переключает закладку и сохраняет список статей локально
 */
function handleBookmark(btn: HTMLButtonElement): void {
  const bookmarks = getBookmarks();
  const currentPath = window.location.pathname;
  const index = bookmarks.indexOf(currentPath);

  if (index > -1) {
    bookmarks.splice(index, 1);
    btn.classList.remove('active');
    btn.textContent = '☆';
    showNotification('Закладка удалена');
  } else {
    bookmarks.push(currentPath);
    btn.classList.add('active');
    btn.textContent = '★';
    showNotification('Добавлено в закладки');
  }

  saveStringArray(BOOKMARKS_KEY, bookmarks);
}

/**
 * EN: Placeholder in case печать потребует JS в будущем
 * RU: Заглушка на случай дальнейшей логики печати
 */
function initPrintButton(): void {
  /* EN: Print styles handled in CSS (@media print)
     RU: Стили для печати задаются в CSS (@media print) */
}

/**
 * EN: Show transient toast with success/error styling
 * RU: Показывает краткое всплывающее уведомление об успехе/ошибке
 */
function showNotification(message: string, type: NotificationType = 'success'): void {
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * EN: Read stored toggle modes and filter by allow-list
 * RU: Получает сохранённые режимы чтения и отбрасывает лишние значения
 */
function getSavedToggleModes(): ToggleMode[] {
  return getStoredStringArray(READING_MODES_KEY).filter(isToggleMode);
}

function isToggleMode(value: string): value is ToggleMode {
  return value === 'serif' || value === 'sepia' || value === 'focus' || value === 'contrast';
}

/**
 * EN: Adjusts font size state and delegates обновление классов
 * RU: Меняет состояние размера шрифта с проверкой границ
 */
function handleFontSizeAction(action: SizeAction): void {
  const currentSize = getStoredFontSize();
  let nextSize = currentSize;

  if (action === 'increase' && currentSize < MAX_FONT_SIZE) {
    nextSize = currentSize + 1;
  } else if (action === 'decrease' && currentSize > MIN_FONT_SIZE) {
    nextSize = currentSize - 1;
  } else if (action === 'reset') {
    nextSize = DEFAULT_FONT_SIZE;
  }

  if (nextSize !== currentSize) {
    setFontSize(nextSize);
  }
}

/**
 * EN: Apply persisted font size class при загрузке панели
 * RU: Восстанавливает сохранённый размер текста
 */
function restoreFontSize(): void {
  setFontSize(getStoredFontSize());
}

/**
 * EN: Update body classes for current font size and persist value
 * RU: Обновляет классы body под выбранный размер и записывает его
 */
function setFontSize(size: number): void {
  for (let i = MIN_FONT_SIZE; i <= MAX_FONT_SIZE; i += 1) {
    document.body.classList.remove(`reading-mode-size-${i}`);
  }

  if (size !== DEFAULT_FONT_SIZE) {
    document.body.classList.add(`reading-mode-size-${size}`);
  }

  store.set(FONT_SIZE_KEY, size);
}

/**
 * EN: Read stored font size with sane defaults
 * RU: Считывает сохранённый размер текста и валидирует диапазон
 */
function getStoredFontSize(): number {
  const size = store.get(FONT_SIZE_KEY);
  if (!size || !Number.isFinite(size)) {
    return DEFAULT_FONT_SIZE;
  }

  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
}

/**
 * EN: Helper to read bookmarks массив из localStorage
 * RU: Возвращает список сохранённых путей статей
 */
function getBookmarks(): string[] {
  return store.get(BOOKMARKS_KEY) || [];
}

/**
 * EN: Parse JSON массив из localStorage и фильтрует типы
 * RU: Служебная функция чтения массивов строк из localStorage
 */
function getStoredStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * EN: Persist массив строк в localStorage
 * RU: Сохраняет массив строковых значений в localStorage
 */
function saveStringArray(key: typeof BOOKMARKS_KEY, values: string[]): void {
  store.set(key, values);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
