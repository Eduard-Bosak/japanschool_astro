/* =============================================
   Blog Post Reading Mode & Enhancements
   Режим чтения и улучшения для статей блога
   ============================================= */

/**
 * EN: Initialize all blog post features
 * RU: Инициализация всех функций для статей блога
 */
export function init() {
  // Check if we're on a blog post page
  // Проверяем, находимся ли мы на странице статьи
  if (!document.querySelector('.post-content')) {
    return;
  }

  initReadingModes();
  initTimeIndicator();
  initShareButton();
  initBookmarks();
  initPrintButton();
}

/**
 * EN: Reading modes (size, view, focus, contrast)
 * RU: Режимы чтения (размер, вид, фокус, контраст)
 */
function initReadingModes() {
  // Load saved modes from localStorage
  // Загружаем сохранённые режимы из localStorage
  const savedModes = JSON.parse(localStorage.getItem('readingModes') || '[]');
  savedModes.forEach((mode) => {
    document.body.classList.add(`reading-mode-${mode}`);
  });

  // Create reading mode panel if it doesn't exist
  // Создаём панель режимов чтения если её нет
  if (!document.querySelector('.reading-controls')) {
    createReadingModePanel();
  }
}

/**
 * EN: Create reading mode control panel
 * RU: Создание панели управления режимами чтения
 */
function createReadingModePanel() {
  const panel = document.createElement('div');
  panel.className = 'reading-controls';
  panel.setAttribute('aria-label', 'Настройки чтения');

  panel.innerHTML = `
    <button class="reading-control-btn" data-mode="size" data-size="decrease" data-tooltip="Меньше" aria-label="Уменьшить текст">A-</button>
    <button class="reading-control-btn" data-mode="size" data-size="reset" data-tooltip="Сбросить" aria-label="Сбросить размер">A</button>
    <button class="reading-control-btn" data-mode="size" data-size="increase" data-tooltip="Больше" aria-label="Увеличить текст">A+</button>
    <div class="reading-controls-separator"></div>
    <button class="reading-control-btn" data-mode="serif" data-tooltip="Шрифт" aria-label="Шрифт с засечками">Aa</button>
    <button class="reading-control-btn" data-mode="sepia" data-tooltip="Сепия" aria-label="Режим сепия">◑</button>
    <button class="reading-control-btn" data-mode="focus" data-tooltip="Фокус" aria-label="Режим фокуса">◉</button>
    <button class="reading-control-btn" data-mode="contrast" data-tooltip="Контраст" aria-label="Высокий контраст">◐</button>
    <div class="reading-controls-separator"></div>
    <button class="reading-control-btn" data-action="share" data-tooltip="Ссылка" aria-label="Поделиться">🔗</button>
    <button class="reading-control-btn" data-action="bookmark" data-tooltip="Закладка" aria-label="Закладка">★</button>
  `;

  document.body.appendChild(panel);

  // Attach event listeners
  // Подключаем обработчики событий
  panel.querySelectorAll('[data-mode]').forEach((btn) => {
    const mode = btn.dataset.mode;
    const isSizeControl = mode === 'size';

    // Restore active state for non-size modes
    // Восстанавливаем активное состояние для не-размерных режимов
    if (!isSizeControl && document.body.classList.contains(`reading-mode-${mode}`)) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      if (isSizeControl) {
        // Handle size increase/decrease/reset
        const sizeAction = btn.dataset.size;
        const currentSize = parseInt(localStorage.getItem('readingMode-fontSize') || '2', 10);
        let newSize = currentSize;

        if (sizeAction === 'increase' && currentSize < 4) {
          newSize = currentSize + 1;
        } else if (sizeAction === 'decrease' && currentSize > 0) {
          newSize = currentSize - 1;
        } else if (sizeAction === 'reset') {
          newSize = 2;
        }

        if (newSize !== currentSize) {
          // Remove all size classes
          for (let i = 0; i <= 4; i++) {
            document.body.classList.remove(`reading-mode-size-${i}`);
          }
          // Add new size class (2 is default, no class needed)
          if (newSize !== 2) {
            document.body.classList.add(`reading-mode-size-${newSize}`);
          }
          localStorage.setItem('readingMode-fontSize', newSize);
        }
      } else {
        // Toggle mode
        // Переключаем режим
        const modeClass = `reading-mode-${mode}`;
        const isActive = document.body.classList.toggle(modeClass);
        btn.classList.toggle('active', isActive);

        // Save to localStorage
        // Сохраняем в localStorage
        const modes = [];
        panel.querySelectorAll('[data-mode]:not([data-size]).active').forEach((b) => {
          modes.push(b.dataset.mode);
        });
        localStorage.setItem('readingModes', JSON.stringify(modes));
      }
    });
  });

  // Action buttons
  // Кнопки действий
  panel.querySelectorAll('[data-action]').forEach((btn) => {
    const action = btn.dataset.action;
    btn.addEventListener('click', () => {
      if (action === 'share') {
        handleShare();
      } else if (action === 'bookmark') {
        handleBookmark(btn);
      }
    });
  });

  // Restore saved modes from localStorage
  // Восстанавливаем сохранённые режимы из localStorage
  const savedModes = JSON.parse(localStorage.getItem('readingModes') || '[]');
  savedModes.forEach((mode) => {
    const modeClass = `reading-mode-${mode}`;
    document.body.classList.add(modeClass);
    panel.querySelector(`[data-mode="${mode}"]:not([data-size])`)?.classList.add('active');
  });

  // Restore font size
  const savedSize = parseInt(localStorage.getItem('readingMode-fontSize') || '2', 10);
  if (savedSize !== 2) {
    document.body.classList.add(`reading-mode-size-${savedSize}`);
  }
}

/**
 * EN: Time indicator (remaining reading time)
 * RU: Индикатор времени (оставшееся время чтения)
 */
function initTimeIndicator() {
  const metaLine = document.querySelector('.post-meta-line');
  if (!metaLine) return;

  const timeMatch = metaLine.textContent.match(/(\d+)\s*мин/);
  if (!timeMatch) return;

  const totalMinutes = parseInt(timeMatch[1], 10);
  if (totalMinutes < 2) return; // Too short
  // Слишком короткая статья

  const indicator = document.createElement('div');
  indicator.className = 'time-indicator';
  indicator.innerHTML = `<span class="time-label">Осталось читать:</span> <span class="time-value">~${totalMinutes} мин</span>`;
  document.body.appendChild(indicator);

  // Update on scroll
  // Обновляем при прокрутке
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateTimeIndicator(indicator, totalMinutes);
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // Initial update
  // Начальное обновление
  updateTimeIndicator(indicator, totalMinutes);
}

function updateTimeIndicator(indicator, totalMinutes) {
  const content = document.querySelector('.post-content');
  if (!content) return;

  const contentHeight = content.offsetHeight;
  const windowHeight = window.innerHeight;
  const scrollTop = window.scrollY;
  const contentTop = content.offsetTop;

  const progress = Math.max(
    0,
    Math.min(1, (scrollTop - contentTop + windowHeight) / contentHeight)
  );

  if (progress > 0.98) {
    // Finished reading
    // Чтение завершено
    indicator.style.opacity = '0';
    return;
  }

  indicator.style.opacity = '1';
  const remaining = Math.max(1, Math.ceil(totalMinutes * (1 - progress)));
  indicator.querySelector('.time-value').textContent = `~${remaining} мин`;
}

/**
 * EN: Share button functionality
 * RU: Функциональность кнопки "Поделиться"
 */
function handleShare() {
  const url = window.location.href;
  const title = document.querySelector('h1')?.textContent || document.title;

  if (navigator.share) {
    // Use native Web Share API
    // Используем нативный Web Share API
    navigator
      .share({ title, url })
      .then(() => console.log('[share] success'))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          fallbackShare(url);
        }
      });
  } else {
    fallbackShare(url);
  }
}

function fallbackShare(url) {
  // Copy to clipboard
  // Копируем в буфер обмена
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
 * EN: Bookmark functionality
 * RU: Функциональность закладок
 */
function initBookmarks() {
  const bookmarkBtn = document.querySelector('[data-action="bookmark"]');
  if (!bookmarkBtn) return;

  const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
  const currentPath = window.location.pathname;

  if (bookmarks.includes(currentPath)) {
    bookmarkBtn.classList.add('active');
    bookmarkBtn.textContent = '★';
  }
}

function handleBookmark(btn) {
  const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
  const currentPath = window.location.pathname;

  const index = bookmarks.indexOf(currentPath);
  if (index > -1) {
    // Remove bookmark
    // Удаляем закладку
    bookmarks.splice(index, 1);
    btn.classList.remove('active');
    btn.textContent = '☆';
    showNotification('Закладка удалена');
  } else {
    // Add bookmark
    // Добавляем закладку
    bookmarks.push(currentPath);
    btn.classList.add('active');
    btn.textContent = '★';
    showNotification('Добавлено в закладки');
  }

  localStorage.setItem('blogBookmarks', JSON.stringify(bookmarks));
}

/**
 * EN: Print button (already handled by window.print, but we can enhance)
 * RU: Кнопка печати (уже обработана window.print, но можем улучшить)
 */
function initPrintButton() {
  // Print styles are handled in CSS (@media print)
  // Стили для печати обрабатываются в CSS (@media print)
}

/**
 * EN: Show notification toast
 * RU: Показать уведомление
 */
function showNotification(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  // Запускаем анимацию
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Auto-initialize on load
// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
