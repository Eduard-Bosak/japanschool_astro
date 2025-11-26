# 🎯 Interactive Elements Guide

## Руководство по интерактивным элементам

Это руководство описывает новый модуль интерактивных элементов для улучшения UX.

---

## ✨ Features | Возможности

### 1. **Tooltips** (Всплывающие подсказки)

Красивые подсказки с 4 позициями размещения.

**Использование:**

```html
<button data-tooltip="Это подсказка" data-tooltip-position="top">
  Наведи на меня
</button>
```

**Позиции:**

- `top` - сверху (по умолчанию)
- `bottom` - снизу
- `left` - слева
- `right` - справа

**Стилизация:**

- Темный фон с белым текстом
- Стрелка указывает на элемент
- Плавная анимация появления/исчезновения

---

### 2. **Back to Top Button** (Кнопка "Наверх")

Автоматически появляется при прокрутке > 300px.

**Особенности:**

- Градиентный фон (primary → accent)
- Плавное появление/исчезновение
- Smooth scroll анимация
- Фиксированная позиция (bottom-right)

**Стили:**

```css
.back-to-top {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: fixed;
  bottom: 30px;
  right: 30px;
}
```

---

### 3. **Smooth Scroll** (Плавная прокрутка)

Автоматическая плавная прокрутка для всех якорных ссылок.

**Работает с:**

```html
<a href="#about">О школе</a>
<a href="#programs">Программы</a>
<a href="#contact">Контакты</a>
```

**Особенности:**

- Учитывает высоту хедера
- Отступ 20px для лучшей видимости
- Native smooth scroll behavior

---

### 4. **Enhanced Mobile Menu** (Улучшенное мобильное меню)

Дополнительные возможности для мобильной навигации.

**Функции:**

- ✅ Закрытие при клике на ссылку
- ✅ Закрытие при клике вне меню
- ✅ Блокировка скролла body при открытом меню
- ✅ Темный overlay с backdrop-filter
- ✅ Slide-in анимация

**Стили:**

```css
@media (max-width: 860px) {
  .main-nav ul[data-open='true'] {
    animation: slideInRight 0.3s ease-out;
  }

  body.nav-open::before {
    content: '';
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(14px);
  }
}
```

---

### 5. **Loading Indicator** (Индикатор загрузки)

Показывает спиннер при отправке форм.

**Использование в коде:**

```javascript
import { showLoadingIndicator } from './components/interactive.js';

const button = document.querySelector('.submit-btn');
const hideLoading = showLoadingIndicator(button);

// После завершения операции:
hideLoading();
```

**Эффекты:**

- Button становится disabled
- Появляется спиннер
- Текст меняется на "Отправка..."
- CSS класс `.loading` добавляется

---

### 6. **Copy to Clipboard** (Копирование в буфер)

Легкое копирование текста одним кликом.

**Использование:**

```html
<button data-copy="info@japanschool.com">📋 Скопировать email</button>
```

**Обратная связь:**

- ✓ Текст кнопки: "✓ Скопировано!"
- Зеленый фон на 2 секунды
- Автоматическое возвращение к исходному состоянию

---

### 7. **Lazy Loading Images** (Ленивая загрузка изображений)

Оптимизация производительности через Intersection Observer.

**Использование:**

```html
<img data-src="images/photo.jpg" alt="Описание" />
```

**Преимущества:**

- 🚀 Загрузка только видимых изображений
- 📱 Экономия трафика на мобильных
- ⚡ Быстрая первоначальная загрузка страницы
- Плавное появление (fade-in)

**Fallback:** Для браузеров без IntersectionObserver - загружает сразу все.

---

### 8. **Keyboard Navigation** (Улучшенная навигация с клавиатуры)

Accessibility-friendly навигация.

**Функции:**

#### ESC для закрытия:

- Модальные окна
- Мобильное меню
- Любые overlay элементы

#### Tab Trap в модалях:

- Фокус остается внутри модального окна
- Shift+Tab для обратного перехода
- Цикличная навигация (первый ↔ последний элемент)

**Focus Styles:**

```css
a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

### 9. **Print Styles** (Стили для печати)

Кнопка печати страницы.

**Использование:**

```html
<button data-print>🖨️ Печать</button>
```

**Оптимизация печати:**

```css
@media print {
  /* Скрывает UI элементы */
  .back-to-top,
  .nav-toggle,
  button[data-print] {
    display: none !important;
  }

  /* Белый фон для экономии чернил */
  body {
    background: white !important;
  }

  /* Показывает ссылки */
  a[href^='http']::after {
    content: ' (' attr(href) ')';
  }
}
```

---

### 10. **Custom Scrollbar** (Кастомный скроллбар)

Стильный скроллбар с брендовыми цветами.

**Особенности:**

- Градиент (primary → accent)
- Скругленные углы
- Hover эффект (реверсный градиент)
- Только для WebKit браузеров (Chrome, Safari, Edge)

```css
::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--accent), var(--primary));
}
```

---

## 🎨 Стилизация

### Переменные цветов

Используются CSS переменные из `variables.css`:

```css
--primary: #f06b93;
--accent: #ffc107;
--dark: #0f1115;
--light: #f5f7fa;
```

### Анимации

Все анимации используют `ease` или `cubic-bezier` для плавности.

### Transitions

```css
button,
a,
input,
select,
textarea {
  transition: all 0.2s ease;
}
```

---

## ♿ Accessibility (Доступность)

### Skip to Content

```html
<a href="#main-content" class="skip-to-content"> Перейти к контенту </a>
```

### Focus Management

- Видимые focus индикаторы
- Tab trap в модалях
- Keyboard shortcuts (ESC)

### Screen Readers

- `aria-label` на кнопках
- `aria-expanded` на toggle элементах
- Semantic HTML

---

## 📱 Responsive Design

### Mobile Optimizations

- Overlay с blur при открытом меню
- Блокировка скролла body
- Touch-friendly размеры кнопок (min 44x44px)
- Адаптивные tooltip позиции

### Media Queries

```css
@media (max-width: 860px) {
  /* Mobile styles */
}
@media (prefers-reduced-motion: reduce) {
  /* No animations */
}
```

---

## ⚡ Performance

### Lazy Loading

- IntersectionObserver API
- Загрузка по требованию
- Fade-in при появлении

### Debouncing

- Scroll events оптимизированы
- ResizeObserver для адаптивности

### CSS Containment

```css
.back-to-top {
  contain: layout style;
}
```

---

## 🧪 Testing

### Проверка в браузерах:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

### Тестирование функций:

```javascript
// В консоли браузера
window.__japanSchoolApp.interactive.initTooltips();
```

### Manual Testing Checklist:

- [ ] Tooltips появляются корректно
- [ ] Back to top работает
- [ ] Smooth scroll плавный
- [ ] Mobile menu закрывается правильно
- [ ] Copy to clipboard показывает feedback
- [ ] Lazy loading активен
- [ ] ESC закрывает модали
- [ ] Tab navigation работает
- [ ] Print стили корректные

---

## 🔧 Customization

### Изменение позиции Back to Top:

```css
.back-to-top {
  bottom: 20px; /* вместо 30px */
  left: 20px; /* вместо right: 30px */
}
```

### Изменение цвета tooltips:

```css
.tooltip {
  background: var(--primary); /* вместо rgba(0,0,0,0.9) */
  color: white;
}
```

### Отключение функций:

```javascript
// В main.js закомментируйте нужные:
// interactive.initTooltips();
// interactive.initBackToTop();
```

---

## 📚 API Reference

### `initTooltips()`

Инициализирует tooltips для элементов с `[data-tooltip]`.

### `initSmoothScroll()`

Добавляет smooth scroll для якорных ссылок.

### `initBackToTop()`

Создает кнопку "Наверх".

### `initMobileMenu()`

Улучшает мобильное меню.

### `showLoadingIndicator(button)`

Показывает loading на кнопке. Возвращает функцию для скрытия.

### `initCopyToClipboard()`

Активирует copy функционал для `[data-copy]`.

### `initLazyLoading()`

Запускает lazy loading для `img[data-src]`.

### `initKeyboardNavigation()`

Настраивает keyboard shortcuts.

### `initPrintButton()`

Активирует кнопки печати `[data-print]`.

### `init()`

Инициализирует все функции сразу.

---

## 🐛 Troubleshooting

### Tooltips не появляются

- Проверьте атрибут `data-tooltip`
- Убедитесь что `interactive.css` подключен
- Проверьте `z-index: 10000`

### Back to Top не показывается

- Scroll > 300px?
- Проверьте CSS: `opacity` и `pointer-events`
- Проверьте `position: fixed`

### Smooth Scroll не работает

- Проверьте `href="#section-id"`
- Убедитесь что элемент с этим ID существует
- CSS `scroll-behavior: smooth` может конфликтовать

### Lazy Loading не активен

- Проверьте `data-src` (не `src`)
- IntersectionObserver поддерживается?
- Проверьте консоль на ошибки

---

## 📖 Examples

### Пример страницы с tooltips:

```html
<section class="features">
  <div
    class="feature"
    data-tooltip="Бесплатная консультация"
    data-tooltip-position="top"
  >
    💬 Консультация
  </div>
  <div
    class="feature"
    data-tooltip="Гибкий график"
    data-tooltip-position="right"
  >
    ⏰ График
  </div>
  <div class="feature" data-tooltip="Сертификат" data-tooltip-position="bottom">
    🎓 Сертификат
  </div>
</section>
```

### Пример с copy button:

```html
<div class="contact-info">
  <p>Email: info@japanschool.com</p>
  <button data-copy="info@japanschool.com" class="btn-copy">
    📋 Скопировать
  </button>
</div>
```

### Пример lazy loading gallery:

```html
<div class="gallery">
  <img data-src="images/photo1.jpg" alt="Photo 1" />
  <img data-src="images/photo2.jpg" alt="Photo 2" />
  <img data-src="images/photo3.jpg" alt="Photo 3" />
</div>
```

---

## 🚀 Performance Metrics

### Target Metrics:

- ⏱️ Time to Interactive: < 3s
- 📦 Bundle Size: ~8KB (minified)
- 🎯 Lighthouse Score: 95+
- ♿ Accessibility Score: 100

### Current Optimizations:

- ✅ Passive event listeners
- ✅ CSS containment
- ✅ IntersectionObserver (no polling)
- ✅ Debounced scroll handlers
- ✅ Minimal repaints/reflows

---

## 📝 Changelog

### v1.0.0 (Current)

- ✨ Initial release
- ✅ 10 interactive features
- ✅ Full mobile support
- ✅ Accessibility compliant
- ✅ Print optimization
- ✅ Reduced motion support

---

## 🎯 Future Enhancements

### Planned Features:

- [ ] Toast notifications system
- [ ] Infinite scroll for blog
- [ ] Image lightbox/zoom
- [ ] Drag & drop file upload
- [ ] Voice search integration
- [ ] PWA offline mode enhancements

---

## 📞 Support

Если возникли вопросы или проблемы:

1. Проверьте консоль браузера на ошибки
2. Убедитесь что все файлы подключены
3. Проверьте совместимость браузера
4. Откройте issue в репозитории

---

**Последнее обновление:** 2025-01-15 **Версия:** 1.0.0 **Статус:** ✅ Production
Ready
