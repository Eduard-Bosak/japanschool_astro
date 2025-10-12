/* =============================================
   Blog Posts - Search, Filter, Share
   ============================================= */

/**
 * Initialize blog posts functionality
 */
export function init() {
  setupPostCards();
  setupSearch();
  setupCategoryFilters();
  setupShareButtons();
}

/**
 * Setup post card lazy loading and image optimization
 */
function setupPostCards() {
  const cards = document.querySelectorAll('.post-card');

  if (!cards.length) {
    return;
  }

  // Lazy load post card images
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const media = entry.target.querySelector('.post-card-media');
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

  // Add ripple effect on click
  cards.forEach((card) => {
    const link = card.querySelector('.post-card-link');
    if (!link) {
      return;
    }

    link.addEventListener('click', (e) => {
      // Create ripple effect
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
      ripple.style.left = e.clientX - rect.left + 'px';
      ripple.style.top = e.clientY - rect.top + 'px';

      card.style.position = 'relative';
      card.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * Setup search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById('postSearch');
  const resetBtn = document.getElementById('postSearchReset');
  const resultsCount = document.getElementById('postResultsCount');
  const cards = document.querySelectorAll('.post-card');

  if (!searchInput || !cards.length) {
    return;
  }

  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.toLowerCase().trim();

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

      // Update results count
      if (query) {
        resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'результат' : 'результатов'}`;
      } else {
        resultsCount.textContent = '';
      }
    }, 300);
  });

  // Reset search
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
 */
function setupCategoryFilters() {
  const filters = document.querySelectorAll('.cat-filter');
  const cards = document.querySelectorAll('.post-card');

  if (!filters.length || !cards.length) {
    return;
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.cat;

      // Update active state
      filters.forEach((f) => {
        f.classList.remove('active');
        f.setAttribute('aria-pressed', 'false');
      });
      filter.classList.add('active');
      filter.setAttribute('aria-pressed', 'true');

      // Filter cards
      cards.forEach((card) => {
        const cardCats = (card.dataset.cats || '').split(',').filter(Boolean);

        if (category === '__all' || cardCats.includes(category)) {
          card.style.display = '';
          // Animate in
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
 */
function setupShareButtons() {
  const shareButtons = document.querySelectorAll('.share-btn');

  shareButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = btn.dataset.share;

      try {
        // Try native share API first (mobile)
        if (navigator.share) {
          await navigator.share({
            title: document.title,
            url: url
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(url);

          // Show feedback
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
  const style = document.createElement('style');
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
