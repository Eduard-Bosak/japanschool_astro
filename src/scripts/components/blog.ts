/* =============================================
  Blog Posts - Search, Filter, Share
  Блок блога — поиск, фильтрация и шаринг
  ============================================= */

type PostCardElement = HTMLElement;
type ShareButton = HTMLButtonElement | HTMLAnchorElement;

/**
 * Initialize blog posts functionality
 * RU: Точка входа для логики карточек блога
 */
export function init(): void {
  setupPostCards();
  setupSearch();
  setupCategoryFilters();
  setupShareButtons();
}

/**
 * Setup post card lazy loading and image optimization
 * RU: Настройка ленивой загрузки и визуальных эффектов карточек
 */
function setupPostCards(): void {
  const cards = document.querySelectorAll<PostCardElement>('.post-card');

  if (!cards.length) {
    return;
  }

  // EN: Lazy load post card images
  // RU: Лениво подгружаем фоновые превью
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cardEl = entry.target as PostCardElement;
          const media = cardEl.querySelector<HTMLElement>('.post-card-media');
          if (media) {
            const bg = media.dataset.bg;
            if (bg) {
              const img = new Image();
              img.onload = () => {
                media.style.backgroundImage = `url('${bg}')`;
                media.dataset.state = 'loaded';
              };
              img.src = bg;
            }
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px' }
  );

  cards.forEach((card) => observer.observe(card));

  // EN: Add ripple effect on click
  // RU: Добавляем эффект «рябь» при клике по карточке
  cards.forEach((card) => {
    const link = card.querySelector<HTMLElement>('.post-card-link');
    if (!link) {
      return;
    }

    link.addEventListener('click', (e: MouseEvent) => {
      // EN: Create ripple highlight at click position
      // RU: Создаём круг подсветки в точке клика
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(var(--primary-rgb) / 0.3);
        width: 100px;
        height: 100px;
        margin-left: -50px;
        margin-top: -50px;
        animation: ripple 0.6s;
        pointer-events: none;
      `;

      const rect = card.getBoundingClientRect();
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;

      card.style.position = 'relative';
      card.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600); // RU: Удаляем эффект после анимации
    });
  });
}

/**
 * Setup search functionality
 * RU: Запускаем поиск по заголовку, описанию и ключевым словам
 */
function setupSearch(): void {
  const searchInput = document.getElementById('postSearch') as HTMLInputElement | null;
  const resetBtn = document.getElementById('postSearchReset') as HTMLButtonElement | null;
  const resultsCount = document.getElementById('postResultsCount');
  const cards = document.querySelectorAll<PostCardElement>('.post-card');

  if (!searchInput || !resetBtn || !resultsCount || !cards.length) {
    return;
  }

  let searchTimeout: number | undefined;

  searchInput.addEventListener('input', (e: Event) => {
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }
    searchTimeout = window.setTimeout(() => {
      const target = e.target as HTMLInputElement;
      const query = target.value.toLowerCase().trim();

      if (query) {
        resetBtn.hidden = false;
      } else {
        resetBtn.hidden = true;
      }

      let visibleCount = 0;

      cards.forEach((card) => {
        const title = (card.dataset.title || '').toLowerCase();
        const desc = (card.dataset.desc || '').toLowerCase();
        const keywords = (card.dataset.keywords || '').toLowerCase();

        const matches = title.includes(query) || desc.includes(query) || keywords.includes(query);

        if (matches || !query) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // EN: Update results count subtitle
      // RU: Обновляем подпись с количеством найденных карточек
      if (query) {
        resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'результат' : 'результатов'}`;
      } else {
        resultsCount.textContent = '';
      }
    }, 300);
  });

  // EN: Reset search state
  // RU: Сброс ввода и возврат всех карточек
  resetBtn?.addEventListener('click', () => {
    searchInput.value = '';
    resetBtn.hidden = true;
    resultsCount.textContent = '';
    cards.forEach((card) => {
      card.style.display = '';
    });
    searchInput.focus();
  });
}

/**
 * Setup category filters
 * RU: Подключаем фильтрацию карточек по категориям
 */
function setupCategoryFilters(): void {
  const filters = document.querySelectorAll<HTMLElement>('.cat-filter');
  const cards = document.querySelectorAll<PostCardElement>('.post-card');

  if (!filters.length || !cards.length) {
    return;
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.cat || '__all';

      // EN: Update active state for filter buttons
      // RU: Переключаем визуальное состояние кнопок фильтра
      filters.forEach((f) => {
        f.classList.remove('active');
        f.setAttribute('aria-pressed', 'false');
      });
      filter.classList.add('active');
      filter.setAttribute('aria-pressed', 'true');

      // EN: Show/hide cards by selected category
      // RU: Отображаем только карточки выбранной категории
      cards.forEach((card) => {
        const cardCats = (card.dataset.cats || '').split(',').filter(Boolean);

        if (category === '__all' || cardCats.includes(category)) {
          card.style.display = '';
          // EN: Play fade-in animation for visible cards
          // RU: Лёгкая анимация появления для оставленных карточек
          card.style.animation = 'fadeInUp 0.4s ease-out';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Setup share buttons
 * RU: Настройка кнопок «поделиться» (Web Share + fallback)
 */
function setupShareButtons(): void {
  const shareButtons = document.querySelectorAll<ShareButton>('.share-btn');

  shareButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = btn.dataset.share || window.location.href;

      try {
        // EN: Try native share API first (mobile)
        // RU: Сначала пытаемся вызвать нативное меню шаринга
        if ('share' in navigator && typeof navigator.share === 'function') {
          await navigator.share({
            title: document.title,
            url: url
          });
        } else {
          // EN: Fallback to clipboard copy
          // RU: Резервный вариант — копируем ссылку в буфер
          await navigator.clipboard?.writeText(url);

          // EN: Highlight success for 2 seconds
          // RU: Показываем короткий визуальный отклик
          const originalText = btn.innerHTML;
          btn.innerHTML = '✓';
          btn.style.background = 'var(--primary)';
          btn.style.color = 'var(--bg)';

          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    });
  });
}

// Add CSS for ripple animation
if (typeof document !== 'undefined') {
  const existing = document.head.querySelector('style[data-blog-effects]');
  if (!existing) {
    const style = document.createElement('style');
    style.dataset.blogEffects = 'true';
    style.textContent = `
    @keyframes ripple {
      from {
        opacity: 1;
        transform: scale(0);
      }
      to {
        opacity: 0;
        transform: scale(4);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
    document.head.appendChild(style);
  }
}
