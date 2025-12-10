/* =============================================
   Test Utilities - Helper functions for testing
   Тестовые утилиты - Вспомогательные функции
   ============================================= */

import { vi } from 'vitest';

/**
 * EN: Create a mock DOM element with specified attributes
 * RU: Создание мок DOM элемента с указанными атрибутами
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  innerHTML: string = ''
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (innerHTML) {
    element.innerHTML = innerHTML;
  }

  return element;
}

/**
 * EN: Setup basic page structure for testing
 * RU: Настройка базовой структуры страницы для тестирования
 */
export function setupBasicPage(): void {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.classList.add('no-js');

  document.body.innerHTML = `
    <header class="site-header">
      <nav class="main-nav">
        <button class="nav-toggle" aria-expanded="false">Menu</button>
        <div id="navMenu" data-open="false">
          <a href="#about">О нас</a>
          <a href="#courses">Курсы</a>
          <a href="#contact">Контакты</a>
        </div>
      </nav>
      <button id="themeToggle" aria-label="Переключить тему">🌙</button>
    </header>
    <main id="main-content">
      <section id="about">About</section>
      <section id="courses">Courses</section>
      <section id="contact">Contact</section>
    </main>
  `;
}

/**
 * EN: Setup FAQ structure for testing
 * RU: Настройка структуры FAQ для тестирования
 */
export function setupFAQPage(): void {
  document.body.innerHTML = `
    <section class="faq" id="faq">
      <div class="faq__controls" style="display:none"></div>
      <div class="faq__search-wrap" style="display:none">
        <input type="search" id="faqSearch" placeholder="Поиск...">
        <button id="faqSearchReset">Сбросить</button>
      </div>
      <div class="faq__filters" style="display:none">
        <button class="faq__filter" data-cat="all">Все</button>
      </div>
      <div class="faq__progress" style="display:none">
        <div class="faq__progress-bar"><span></span></div>
        <span id="faqProgressOpened">0</span>/<span id="faqProgressTotal">3</span>
        <span id="faqProgressVisible">3</span>
      </div>
      <div id="faqList" class="faq__list" role="tablist">
        <div class="faq__item" data-cat="general">
          <button class="faq__trigger" aria-expanded="false" aria-controls="faq-panel-1">
            Вопрос 1
          </button>
          <div class="faq__panel" id="faq-panel-1" hidden>Ответ 1</div>
        </div>
        <div class="faq__item" data-cat="general">
          <button class="faq__trigger" aria-expanded="false" aria-controls="faq-panel-2">
            Вопрос 2
          </button>
          <div class="faq__panel" id="faq-panel-2" hidden>Ответ 2</div>
        </div>
        <div class="faq__item" data-cat="general">
          <button class="faq__trigger" aria-expanded="false" aria-controls="faq-panel-3">
            Вопрос 3
          </button>
          <div class="faq__panel" id="faq-panel-3" hidden>Ответ 3</div>
        </div>
      </div>
      <div id="faqResults" aria-live="polite"></div>
    </section>
  `;
}

/**
 * EN: Setup carousel structure for testing
 * RU: Настройка структуры карусели для тестирования
 */
export function setupCarouselPage(): void {
  document.body.innerHTML = `
    <section id="reviews">
      <div id="reviewsTrack" class="reviews-track">
        <div class="review-slide">Отзыв 1</div>
        <div class="review-slide">Отзыв 2</div>
        <div class="review-slide">Отзыв 3</div>
      </div>
      <div class="reviews-controls">
        <button data-dir="prev" aria-label="Предыдущий">←</button>
        <button data-dir="next" aria-label="Следующий">→</button>
      </div>
      <div id="revDots" role="tablist"></div>
      <div id="reviewsStatus" aria-live="polite"></div>
    </section>
  `;
}

/**
 * EN: Setup form structure for testing
 * RU: Настройка структуры формы для тестирования
 */
export function setupFormPage(): void {
  document.body.innerHTML = `
    <form id="contactForm" class="contact-form">
      <div class="form-group">
        <label for="name">Имя</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="phone">Телефон</label>
        <input type="tel" id="phone" name="phone" pattern="[+]?[0-9]{10,15}">
      </div>
      <div class="form-group">
        <label for="message">Сообщение</label>
        <textarea id="message" name="message"></textarea>
      </div>
      <button type="submit">Отправить</button>
    </form>
    <div id="formStatus" aria-live="polite"></div>
  `;
}

/**
 * EN: Wait for next tick (microtask queue flush)
 * RU: Ожидание следующего тика (очистка очереди микрозадач)
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * EN: Wait for specified milliseconds
 * RU: Ожидание указанного количества миллисекунд
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * EN: Simulate user click event
 * RU: Симуляция клика пользователя
 */
export function click(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/**
 * EN: Simulate keyboard event
 * RU: Симуляция события клавиатуры
 */
export function pressKey(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {}
): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options
    })
  );
}

/**
 * EN: Simulate input event
 * RU: Симуляция события ввода
 */
export function typeText(input: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * EN: Mock fetch API
 * RU: Мок fetch API
 */
export function mockFetch(response: unknown, ok = true): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response))
  });
}

/**
 * EN: Get computed style property
 * RU: Получение вычисленного стиля
 */
export function getStyle(element: HTMLElement, property: string): string {
  return getComputedStyle(element).getPropertyValue(property);
}
