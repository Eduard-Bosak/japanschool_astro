<div align="center">

# 🎌 Школа японского языка — Лендинг

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Eduard-Bosak/japanschool)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Code Style](https://img.shields.io/badge/code_style-modular-blueviolet)](https://github.com/Eduard-Bosak/japanschool)

**Профессиональный одностраничный сайт-презентация с акцентом на визуальный
вау‑эффект, анимации и конверсию**

[🚀 Демо](#) • [📖 Документация](docs/) •
[🐛 Баг-репорты](https://github.com/Eduard-Bosak/japanschool/issues)

</div>

---

## 📋 Содержание

- [✨ Особенности](#-особенности)
- [🚀 Быстрый старт](#-быстрый-старт)
- [🏗️ Архитектура](#️-архитектура)
- [🛠️ Технологии](#️-технологии)
- [📁 Структура проекта](#-структура-проекта)
- [🎨 Визуальная концепция](#-визуальная-концепция)
- [🔧 Разработка](#-разработка)
- [📝 Лицензия](#-лицензия)

---

## ✨ Особенности

- 🎯 **Модульная архитектура** — TypeScript + CSS модули
- 🌐 **Билингвальные комментарии** — EN/RU для международных команд
- ⚡ **Производительность** — Lighthouse Score 95+
- ♿ **Доступность (A11y)** — ARIA, keyboard navigation, screen readers
- 📱 **Полностью адаптивный** — Mobile-first дизайн
- 🎨 **6 тем оформления** — Dark, Light + 4 сезонные (Spring, Autumn, Winter,
  Sakura)
- 🖼️ **Адаптивные изображения** — AVIF/WebP/JPG в 5 размерах
- 📝 **Статический блог** — Markdown → HTML с RSS/Atom
- 🌸 **Canvas анимации** — Падающие лепестки сакуры
- 🚀 **PWA Support** — Offline-first с Service Worker
- 🔍 **SEO-оптимизация** — Sitemap, JSON-LD, OpenGraph
- 🎭 **Анимации** — IntersectionObserver, parallax, count-up
- 🖼️ **PhotoSwipe галерея** — Pinch-zoom, swipe gestures, плавные анимации
- 🎉 **Confetti эффект** — Празднование при успешной заявке
- 🧪 **E2E тесты** — Playwright для автотестирования
- 🔒 **Безопасность** — Helmet.js, admin auth, CORS whitelist

---

## 🚀 Быстрый старт

### Требования

- **Node.js** 18+ ([скачать](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Eduard-Bosak/japanschool.git
cd japanschool

# 2. Установить зависимости (все пакеты монорепо)
pnpm install

# 3. Запустить dev-сервер
pnpm dev
# Открыть http://localhost:4321

# 4. Собрать production
pnpm build
# Результат в папке apps/web/dist/
```

### Доступные команды

```bash
# 🎯 Основные команды (monorepo)
pnpm dev            # Astro dev server (http://localhost:4321)
pnpm dev:server     # Express API server
pnpm dev:portal     # Next.js admin portal
pnpm build          # Production сборка web
pnpm build:portal   # Production сборка portal

# 🎨 Code Quality
pnpm lint           # Проверка кода с ESLint
pnpm format         # Форматирование с Prettier

# 🧪 Тестирование
pnpm test           # Unit тесты (Vitest)
pnpm e2e            # E2E тесты (Playwright)

# 📦 Запуск отдельных пакетов
pnpm --filter @japanschool/web dev
pnpm --filter @japanschool/server start
pnpm --filter @japanschool/portal dev
```

### 📁 Monorepo структура

```
japanschool/
├── apps/
│   ├── web/        ← Astro лендинг (@japanschool/web)
│   ├── server/     ← Express API (@japanschool/server)
│   └── portal/     ← Next.js админка (@japanschool/portal)
├── packages/
│   └── shared/     ← Общие типы и утилиты
├── pnpm-workspace.yaml
└── package.json  ← Root workspace
```

---

## 🛠️ Технологии

### Core

- **HTML5** — Семантическая разметка
- **CSS3** — CSS Custom Properties, Grid, Flexbox
- **JavaScript ES6+** — Модули, async/await

### Build Tools

- **[esbuild](https://esbuild.github.io/)** — Ультра-быстрый бандлер JS (100x
  быстрее Webpack)
- **[PostCSS](https://postcss.org/)** — Autoprefixer + cssnano
- **[sharp](https://sharp.pixelplumbing.com/)** — Генерация адаптивных
  изображений (AVIF/WebP/JPG)

### Code Quality

- **[ESLint](https://eslint.org/)** — Линтер JavaScript с правилами ES6+
- **[Prettier](https://prettier.io/)** — Автоматическое форматирование кода
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** —
  Автоматический аудит производительности

### Development

- **Chokidar** — File watcher для hot-reload
- **Node.js** — Build pipeline и SSG для блога

### Features

- **Canvas API** — Анимация лепестков сакуры
- **IntersectionObserver** — Lazy animations
- **Service Worker** — PWA с offline-режимом
- **LocalStorage** — Сохранение темы и очереди форм

---

## 📁 Структура проекта

```
japanschool/
├── 📁 src/                 # Исходный код Astro
│   ├── 📁 pages/          # Страницы Astro
│   │   ├── index.astro    # Главная страница
│   │   ├── atom.xml.ts    # Atom фид
│   │   ├── rss.xml.ts     # RSS фид
│   │   └── blog/          # Страницы блога
│   │
│   ├── 📁 layouts/        # Astro layouts
│   │   └── MainLayout.astro
│   │
│   ├── 📁 components/     # Astro компоненты
│   │   └── ResponsiveImage.astro
│   │
│   ├── 📁 content/        # Markdown контент (Astro Content Collections)
│   │   ├── config.ts      # Схема контента
│   │   └── blog/          # Статьи блога
│   │
│   ├── 📁 scripts/        # TypeScript модули (31 файл)
│   │   ├── main.ts        # 🎯 Точка входа
│   │   ├── index.ts       # Barrel export
│   │   ├── 📁 components/ # UI компоненты + тесты
│   │   │   ├── theme.ts           # Переключение тем
│   │   │   ├── preloader.ts       # Прелоадер
│   │   │   ├── navigation.ts      # Навигация + Scroll Spy
│   │   │   ├── animations-unified.ts  # IntersectionObserver
│   │   │   ├── sakura.ts          # Canvas анимация
│   │   │   ├── faq.ts             # FAQ аккордеон
│   │   │   ├── carousel.ts        # Карусель
│   │   │   ├── gallery.ts         # Lightbox
│   │   │   ├── forms.ts           # Валидация форм
│   │   │   ├── blog.ts            # Блог функционал
│   │   │   ├── interactive.ts     # Интерактивные элементы
│   │   │   └── *.test.ts          # Unit тесты (Vitest)
│   │   │
│   │   ├── 📁 utils/      # Утилиты
│   │   │   ├── analytics.ts   # Аналитика
│   │   │   ├── api.ts         # API клиент
│   │   │   ├── events.ts      # Event bus
│   │   │   ├── logger.ts      # Логирование
│   │   │   ├── performance.ts # Web Vitals
│   │   │   ├── sentry.ts      # Error tracking
│   │   │   └── store.ts       # State management
│   │   │
│   │   └── 📁 config/     # Конфигурация
│   │       └── api.config.ts
│   │
│   ├── 📁 styles/         # CSS модули (26 файлов после очистки)
│   │   ├── styles.css     # 🎯 CSS агрегатор (@import)
│   │   ├── 📁 base/       # Базовые стили
│   │   │   ├── variables.css  # Design tokens
│   │   │   ├── themes.css     # Сезонные темы
│   │   │   ├── reset.css      # CSS reset
│   │   │   ├── layout.css     # Container система
│   │   │   └── critical.css   # Critical CSS
│   │   │
│   │   └── 📁 components/ # UI компоненты (21 файл)
│   │       ├── header.css, hero.css, footer.css
│   │       ├── buttons.css, forms.css, modal.css
│   │       ├── faq.css, gallery.css, sections.css
│   │       ├── blog-card.css, blog-feed.css, blog-post.css
│   │       ├── rich-text.css, reading-mode.css
│   │       ├── preloader.css, interactive.css
│   │       ├── animations-optimized.css, redesign.css
│   │       ├── seasons.css, stats.css, utilities.css
│   │
│   ├── 📁 tests/          # Тестовые утилиты
│   └── 📁 lib/            # Вспомогательные функции
│
├── 📁 public/              # Статические файлы
│   ├── manifest.json      # PWA манифест
│   ├── favicon.svg        # Иконка сайта
│   └── robots.txt         # Файл для роботов
│
├── 📁 server/              # Express.js API сервер (отдельный package.json)
│   ├── index.js           # API endpoints
│   ├── admin.html         # Админ-панель
│   └── utils/             # Серверные утилиты
│
├── 📁 portal/              # Next.js админ-панель (отдельный package.json)
│   └── src/               # Next.js приложение
│
├── 📁 docs/                # Документация
│   └── ...                # Отчёты и гайды
│
├── 📁 dist/                # Build артефакты (генерируется Astro)
│
├── 📄 astro.config.mjs     # Конфигурация Astro
├── 📄 tsconfig.json        # TypeScript конфигурация
├── 📄 vitest.config.ts     # Конфигурация тестов
├── 📄 site.config.json     # Конфиг сайта (URL, название)
├── 📄 package.json         # Зависимости проекта
├── 📄 postcss.config.cjs   # Конфиг PostCSS
└── 📄 README.md            # Эта документация
```

---

## �️ Архитектура

### Модульная система

Проект построен на **полностью модульной архитектуре** для максимальной
поддерживаемости:

#### 📦 **27 независимых модулей**

- **16 CSS модулей** (2,500+ строк) — компонентный подход
- **11 JavaScript модулей** (1,900+ строк) — ES6 modules

#### 🌐 **Билингвальные комментарии**

Все модули содержат **двуязычные комментарии EN/RU** для международных команд:

```javascript
/* =============================================
   Component Name
   Название компонента
   ============================================= */

/* EN: Initialize theme switcher
   RU: Инициализация переключателя тем */
function initTheme() {
  // ...
}
```

```css
/* =============================================
   Button Component
   Компонент кнопки
   ============================================= */

/* Primary button variant | Вариант основной кнопки */
.btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
}
```

#### 📊 Детальная документация модулей

- **[AUDIT-REPORT.md](docs/AUDIT-REPORT.md)** — Полный анализ всех 27 модулей с
  метриками
- **[MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md)** — Руководство по переходу на
  модульную структуру
- **[MODULARIZATION-COMPLETE.md](docs/MODULARIZATION-COMPLETE.md)** — Отчёт о
  завершении модуляризации

---

## 🔧 Разработка

### Code Quality Tools

Проект использует современные инструменты для поддержания высокого качества
кода:

#### ESLint

Проверка JavaScript кода на соответствие стандартам:

```bash
# Проверить весь код
npm run lint

# Автоматически исправить проблемы
npm run lint:fix
```

**Конфигурация:** `.eslintrc.json`

- ES6+ правила
- Единый стиль кода
- Автоматическая проверка в CI/CD

#### Prettier

Автоматическое форматирование кода для единообразия:

```bash
# Отформатировать весь код
npm run format

# Проверить форматирование (без изменений)
npm run format:check
```

**Конфигурация:** `.prettierrc.json`

- Единые отступы (2 пробела)
- Single quotes для JS
- Автоматический line wrap

#### Lighthouse CI

Автоматический аудит производительности и доступности:

```bash
# Запустить Lighthouse аудит
npm run lighthouse

# Запустить и открыть отчёт
npm run lighthouse:open
```

**Конфигурация:** `lighthouserc.json`

- Performance: ≥ 95
- Accessibility: 100
- Best Practices: ≥ 95
- SEO: ≥ 95

**Core Web Vitals Budgets:**

- FCP (First Contentful Paint): < 2s
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- TBT (Total Blocking Time): < 300ms

**GitHub Actions Integration:**

- Автоматический аудит при каждом push/PR
- Комментарии с результатами в Pull Requests
- Artifacts с детальными отчётами

### CSS модули (16 файлов, 2,500+ строк)

**Base система:**

- `variables.css` (76 строк) — Design tokens, цвета, spacing, shadows
- `themes.css` (52 строки) — 4 сезонные темы (spring, autumn, winter, sakura)
- `reset.css` (69 строк) — Глобальные сбросы, smooth scroll
- `layout.css` (74 строки) — Container, skip-link, page transitions

**UI компоненты:**

- `preloader.css` (125 строк) — Загрузочный экран с анимированным кольцом
- `header.css` (173 строки) — Фиксированная шапка с blur, мобильное меню
- `hero.css` (208 строк) — Hero с градиентами и photo stack
- `faq.css` (438 строк) — Extreme minimalism FAQ аккордеон
- `buttons.css` (73 строки) — 5 вариантов кнопок
- `forms.css` (113 строк) — Поля форм, валидация, error states
- `sections.css` (305 строк) — About, Programs, Timeline, Gallery
- `reviews.css` (211 строк) — Карусель отзывов с touch support
- `modal.css` (100 строк) — Модальные окна с backdrop filter
- `gallery.css` (119 строк) — Lightbox с навигацией
- `footer.css` (121 строка) — Footer с social links
- `utilities.css` (180 строк) — Анимации, responsive helpers

### TypeScript модули (11 файлов, ES Modules)

**Utilities:**

- `analytics.ts` — Легковесная очередь событий аналитики
- `api.ts` — Отправка на backend, offline queue, mock mode

**Компоненты:**

- `theme.ts` — Переключение между 6 темами (dark, light, spring, autumn, winter,
  sakura)
- `preloader.ts` — Fade-out прелоадера после загрузки
- `navigation.ts` — Мобильное меню, smooth scroll, scroll spy, scroll progress
- `animations.ts` — IntersectionObserver, count-up, parallax, spotlight cursor
- `sakura.ts` — Canvas анимация падающих лепестков сакуры (200+ строк)
- `faq.ts` — FAQ аккордеон с поиском, фильтрами, прогресс-баром, localStorage
  (480+ строк)
- `carousel.ts` — Карусель отзывов с auto-play, drag/swipe, keyboard nav (330+
  строк)
- `gallery.ts` — Lightbox с клавиатурной навигацией и accessibility (160+ строк)
- `forms.ts` — Валидация форм, modal управление, отправка данных (280+ строк)

**Main entry:**

- `main.ts` — Импорт и инициализация всех модулей, responsive images

### Добавление нового модуля

#### CSS модуль:

1. Создать файл в `src/styles/components/my-component.css`
2. Добавить импорт в `src/styles.css`:
   ```css
   @import './styles/components/my-component.css';
   ```
3. Запустить `npm run build`

#### TypeScript модуль:

1. Создать файл в `src/scripts/components/myComponent.ts`
2. Добавить импорт в `src/scripts/main.ts`:

```typescript
import { initMyComponent } from './components/myComponent.ts';
```

3. Вызвать функцию инициализации

### Создание новой статьи в блоге

1. Создать файл `content/blog/my-post.md`
2. Добавить front-matter:

   ```yaml
   ---
   title: 'Заголовок статьи'
   slug: my-post
   date: 2025-10-03
   description: 'Краткое описание'
   keywords: ['ключ1', 'ключ2']
   cover: image.jpg # опционально
   ---
   Текст статьи в **Markdown**
   ```

3. Запустить `npm run build`
4. Статья доступна: `dist/blog/my-post/index.html`

### Адаптивные изображения

Система автоматически генерирует 5 размеров в 3 форматах (AVIF/WebP/JPG):

1. Поместить исходный JPG в `src/assets/images/`
2. Запустить `npm run build`
3. Результат в `dist/img/` + манифест `img-manifest.json`

**Генерируемые размеры:**

- 320px, 480px, 640px, 800px, 1024px

**Форматы:**

- AVIF (лучшее сжатие, ~50% меньше JPG)
- WebP (хорошее сжатие, ~30% меньше JPG)
- JPG (fallback для старых браузеров)

### Кастомизация

**Цвета и темы:**

```css
/* src/styles/base/variables.css */
:root {
  --primary: #ff6b9d; /* Сакура розовый */
  --accent: #ffd700; /* Золотой */
  --bg: #0f1115; /* Тёмный фон */
}
```

**Скорость анимаций:**

```css
:root {
  --trans-fast: 0.2s;
  --trans-slow: 0.6s;
}
```

**Количество лепестков сакуры:**

```typescript
/* src/scripts/components/sakura.ts */
const PETAL_COUNT = 50; // Уменьшить для слабых устройств
```

---

- `variables.css` (76 строк) — Design tokens, цвета, spacing, shadows
- `themes.css` (52 строки) — 4 сезонные темы (spring, autumn, winter, sakura)
- `reset.css` (69 строк) — Глобальные сбросы, smooth scroll
- `layout.css` (74 строки) — Container, skip-link, page transitions

**UI компоненты:**

- `preloader.css` (125 строк) — Загрузочный экран с анимированным кольцом
- `header.css` (173 строки) — Фиксированная шапка с blur, мобильное меню
- `hero.css` (208 строк) — Hero с градиентами и photo stack
- `faq.css` (438 строк) — Extreme minimalism FAQ аккордеон
- `buttons.css` (73 строки) — 5 вариантов кнопок
- `forms.css` (113 строк) — Поля форм, валидация, error states
- `sections.css` (305 строк) — About, Programs, Timeline, Gallery
- `reviews.css` (211 строк) — Карусель отзывов с touch support
- `modal.css` (100 строк) — Модальные окна с backdrop filter
- `gallery.css` (119 строк) — Lightbox с навигацией
- `footer.css` (121 строка) — Footer с social links
- `utilities.css` (180 строк) — Анимации, responsive helpers

### 🚀 JavaScript модули (11 файлов, ES6)

**Utilities:**

- `analytics.js` — Легковесная очередь событий аналитики
- `api.js` — Отправка на backend, offline queue, mock mode

**Компоненты:**

- `theme.js` — Переключение между 6 темами (dark, light, spring, autumn, winter,
  sakura)
- `preloader.js` — Fade-out прелоадера после загрузки
- `navigation.js` — Мобильное меню, smooth scroll, scroll spy, scroll progress
- `animations.js` — IntersectionObserver, count-up, parallax, spotlight cursor
- `sakura.js` — Canvas анимация падающих лепестков сакуры (200+ строк)
- `faq.js` — FAQ аккордеон с поиском, фильтрами, прогресс-баром, localStorage
  (480+ строк)
- `carousel.js` — Карусель отзывов с auto-play, drag/swipe, keyboard nav (330+
  строк)
- `gallery.js` — Lightbox с клавиатурной навигацией и accessibility (160+ строк)
- `forms.js` — Валидация форм, modal управление, отправка данных (280+ строк)

**Main entry:**

- `main.js` — Импорт и инициализация всех модулей, responsive images

### 🌐 Билингвальные комментарии

Все модули содержат **полностью двуязычные комментарии** (EN/RU) для
мультинациональных команд:

```javascript
/* =============================================
   Component Name
   Название компонента
   ============================================= */

/* EN: Description of what this does
   RU: Описание того, что это делает */
function example() {
  // ...
}
```

```css
/* =============================================
   Button Component
   Компонент кнопки
   ============================================= */

/* Primary button variant | Вариант основной кнопки */
.btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
}
```

## 🚀 Деплой

### GitHub Pages

```bash
# 1. Собрать проект
npm run build

# 2. Настроить GitHub Pages
# Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /dist

# 3. Обновить site.config.json
{
  "siteUrl": "https://eduard-bosak.github.io/japanschool",
  "siteName": "Школа японского языка"
}

# 4. Пересобрать с правильным URL
npm run build
```

### Netlify

1. Подключить репозиторий GitHub
2. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Deploy!

### Vercel

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel --prod

# Или через GitHub интеграцию (автодеплой при push)
```

### Собственный сервер

```bash
# 1. Собрать проект
npm run build

# 2. Загрузить содержимое dist/ на сервер
scp -r dist/* user@server:/var/www/japanschool/

# 3. Настроить Nginx/Apache для статики
```

---

## 🤝 Разработка и вклад

### Требования к коду

- ✅ **Модульная структура** — один модуль = одна ответственность
- ✅ **Билингвальные комментарии** — EN/RU для всех функций и компонентов
- ✅ **Семантический HTML** — правильные теги, ARIA-атрибуты
- ✅ **BEM или utility-first** — единый стиль именования CSS
- ✅ **ES6+** — современный JavaScript (async/await, modules)

### Workflow

1. Создать ветку: `git checkout -b feature/my-feature`
2. Внести изменения
3. Протестировать: `npm run build`
4. Коммит: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/my-feature`
6. Создать Pull Request

### Коммиты (Conventional Commits)

```
feat: новая функциональность
fix: исправление бага
docs: изменения в документации
style: форматирование кода (без изменения логики)
refactor: рефакторинг кода
perf: улучшение производительности
test: добавление тестов
chore: обновление зависимостей, конфигов
```

---

## 📊 Метрики производительности

### Lighthouse Scores

- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

### Размеры файлов (после сборки)

- **CSS (minified):** ~3 KB
- **JavaScript (minified):** ~27 KB
- **HTML (gzipped):** ~8 KB
- **Total page weight:** ~50 KB (без изображений)

### Поддержка браузеров

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android 90+

---

1. Hero + call-to-action
2. О школе (ценности)
3. Основатель (био + метрики)
4. Достижения (таймлайн)
5. Программы (карточки с hover/tilt)
6. Методика (модули)
7. Галерея (грид + полноэкранный лайтбокс)
8. Отзывы (автокарусель + свайп + точки)
9. Контактная форма (валидация на клиенте)
10. Footer

## 🎨 Визуальная концепция

### Дизайн-система

#### Цветовая палитра

**Dark Theme (по умолчанию):**

```css
--primary: #ff6b9d /* Сакура розовый */ --accent: #ffd700 /* Золотой */
  --bg: #0f1115 /* Глубокий тёмный */ --surface: #1a1d24
  /* Поверхность карточек */ --ink: #e8eaed /* Основной текст */;
```

**Light Theme:**

```css
--bg: #f5f7fa /* Светлый фон */ --ink: #1a1d24 /* Тёмный текст */;
```

**Сезонные темы:**

- 🌸 **Spring** — Нежно-розовый, свежая зелень
- 🍂 **Autumn** — Тёплый оранжевый, коричневый
- ❄️ **Winter** — Холодный синий, серебристый
- 🌸 **Sakura** — Насыщенный розовый (дефолт)

#### Типографика

- **Заголовки:** Playfair Display (serif) — элегантный, классический
- **Текст:** Inter (sans-serif) — читабельный, современный
- **Японский:** Noto Sans JP — аутентичный шрифт для иероглифов

#### Эффекты

- **Glassmorphism** — backdrop-filter: blur(14px)
- **Градиенты** — linear-gradient(135deg, primary, accent)
- **Тени** — многослойные box-shadow для глубины
- **Анимации** — cubic-bezier для плавности

### Секции лендинга

1. **Hero** — Призыв к действию с photo stack
2. **О школе** — Ценности и миссия
3. **Основатель** — Биография + достижения
4. **Таймлайн** — История школы
5. **Программы** — Карточки курсов с hover-эффектами
6. **Методика** — Модульная система обучения
7. **Галерея** — Lightbox с адаптивными изображениями
8. **Отзывы** — Автокарусель с swipe-жестами
9. **Контакты** — Форма с валидацией
10. **Footer** — Социальные сети и копирайт

### Адаптивность

**Брейкпоинты:**

```css
@media (max-width: 860px) {
  /* Мобильная версия */
}
```

**Подход:** Mobile-first + Progressive Enhancement

---

## 📱 PWA функциональность

### Service Worker

- **Кэширование** — CSS, JS, шрифты, изображения
- **Offline-режим** — Fallback на offline.html
- **Стратегия:** Cache-first для статики

### Манифест

```json
{
  "name": "Школа японского языка",
  "short_name": "JapanSchool",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ff6b9d",
  "background_color": "#0f1115"
}
```

### Установка на устройство

iOS Safari и Android Chrome автоматически предложат "Добавить на главный экран"

---

## ♿ Доступность (A11y)

### Реализованные практики

- ✅ **Семантический HTML** — правильные теги (nav, main, article)
- ✅ **ARIA-атрибуты** — aria-label, aria-labelledby, aria-expanded
- ✅ **Keyboard navigation** — Tab, Enter, Esc, Arrow keys
- ✅ **Focus-visible** — кастомные стили фокуса
- ✅ **Screen readers** — alt для изображений, aria-live для динамики
- ✅ **Color contrast** — WCAG AA (4.5:1 для текста)
- ✅ **Reduced motion** — prefers-reduced-motion для отключения анимаций
- ✅ **Skip links** — быстрый переход к контенту

### Тестирование

```bash
# Lighthouse Accessibility Audit
npm run build
# Открыть dist/index.html в Chrome DevTools → Lighthouse
```

---

## 🔍 SEO оптимизация

### Реализовано

- ✅ **Semantic HTML** — h1-h6 иерархия
- ✅ **Meta tags** — description, keywords, viewport
- ✅ **OpenGraph** — og:title, og:description, og:image
- ✅ **Twitter Cards** — twitter:card, twitter:image
- ✅ **JSON-LD** — Organization, Person, Article
- ✅ **Sitemap.xml** — автогенерация с changefreq/priority
- ✅ **Robots.txt** — разрешение индексации
- ✅ **Canonical URLs** — избежание дублирования
- ✅ **RSS/Atom feeds** — для блога
- ✅ **Adaptive images** — srcset для SEO-дружественных изображений

### Конфигурация

```json
// site.config.json
{
  "siteUrl": "https://example.com",
  "siteName": "Школа японского языка"
}
```

**Override через ENV:**

```bash
SITE_URL=https://prod.com npm run build
```

---

## 🚀 Деплой

### GitHub Pages

```bash
# 1. Собрать проект
npm run build

# 2. Настроить GitHub Pages
# Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /dist

# 3. Обновить site.config.json
{
  "siteUrl": "https://eduard-bosak.github.io/japanschool",
  "siteName": "Школа японского языка"
}

# 4. Пересобрать с правильным URL
npm run build
```

### Netlify

1. Подключить репозиторий GitHub
2. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Deploy!

### Vercel

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel --prod

# Или через GitHub интеграцию (автодеплой при push)
```

### Собственный сервер

```bash
# 1. Собрать проект
npm run build

# 2. Загрузить содержимое dist/ на сервер
scp -r dist/* user@server:/var/www/japanschool/

# 3. Настроить Nginx/Apache для статики
```

---

## 🤝 Разработка и вклад

### Требования к коду

- ✅ **Модульная структура** — один модуль = одна ответственность
- ✅ **Билингвальные комментарии** — EN/RU для всех функций и компонентов
- ✅ **Семантический HTML** — правильные теги, ARIA-атрибуты
- ✅ **BEM или utility-first** — единый стиль именования CSS
- ✅ **ES6+** — современный JavaScript (async/await, modules)

### Workflow

1. Создать ветку: `git checkout -b feature/my-feature`
2. Внести изменения
3. Протестировать: `npm run build`
4. Коммит: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/my-feature`
6. Создать Pull Request

### Коммиты (Conventional Commits)

```
feat: новая функциональность
fix: исправление бага
docs: изменения в документации
style: форматирование кода (без изменения логики)
refactor: рефакторинг кода
perf: улучшение производительности
test: добавление тестов
chore: обновление зависимостей, конфигов
```

---

## 📊 Метрики производительности

### Lighthouse Scores

- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

### Размеры файлов (после сборки)

- **CSS (minified):** ~3 KB
- **JavaScript (minified):** ~27 KB
- **HTML (gzipped):** ~8 KB
- **Total page weight:** ~50 KB (без изображений)

### Поддержка браузеров

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android 90+

---

## 🧪 Интеграция с Backend

### Формы (заглушка)

До подключения сервера формы работают в демо-режиме:

- Данные сохраняются в `localStorage` (ключ `japanschool.pendingForms`)
- Пользователю показывается успешная отправка

### Подключение реального API

```html
<script>
  window.__API_ENDPOINTS = {
    lead: 'https://your-domain/api/leads',
    program: 'https://your-domain/api/program-interest'
  };
</script>
```

**Формат запроса:** `POST application/json`

**Поля:**

- `name`, `email`, `goal`, `level`, `message`
- `program` (для модального окна)
- Автоматические: `page`, `utm`, `timestamp`

---

## 📝 Changelog

### Version 1.0.0 (2025-10-03)

#### ✨ Features

- 🎯 Модульная архитектура (27 модулей)
- 🌐 Билингвальные комментарии (EN/RU)
- 🎨 6 тем оформления (dark, light, 4 сезонные)
- 🖼️ Адаптивные изображения (AVIF/WebP/JPG)
- 📝 Статический блог с RSS/Atom
- 🌸 Canvas анимация лепестков сакуры
- 🚀 PWA с offline-режимом
- 🔍 SEO-оптимизация (sitemap, JSON-LD)

#### 🏗️ Architecture

- Build система (esbuild + PostCSS)
- Responsive images pipeline (sharp)
- Service Worker caching
- LocalStorage для тем и форм

#### ♿ Accessibility

- ARIA-атрибуты
- Keyboard navigation
- Screen reader support
- WCAG AA контраст

---

## 🛣️ Roadmap

### Планы на будущее

**v1.1 (Q4 2025)**

- [ ] Автотесты (Jest + Testing Library)
- [ ] CI/CD через GitHub Actions
- [ ] Автоматический деплой на Netlify
- [ ] Performance бюджет в Lighthouse CI

**v1.2 (Q1 2026)**

- [ ] Интеграция с CMS (Headless)
- [ ] Реальный backend API
- [ ] Админ-панель для управления контентом
- [ ] Email уведомления

**v2.0 (Q2 2026)**

- [ ] LMS функциональность (личный кабинет)
- [ ] Система записи на курсы
- [ ] Онлайн-оплата
- [ ] Видео-уроки

---

## 📝 Лицензия

**MIT License**

Copyright (c) 2025 Eduard Bosak

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🙏 Благодарности

- **[esbuild](https://esbuild.github.io/)** — за невероятную скорость сборки
- **[sharp](https://sharp.pixelplumbing.com/)** — за обработку изображений
- **[PostCSS](https://postcss.org/)** — за гибкую обработку CSS
- **Сообщество GitHub** — за вдохновение и open-source инструменты

---

## 📞 Контакты

**Автор:** Eduard Bosak **GitHub:**
[@Eduard-Bosak](https://github.com/Eduard-Bosak) **Репозиторий:**
[japanschool](https://github.com/Eduard-Bosak/japanschool)

---

<div align="center">

**⭐ Поставьте звезду, если проект был полезен!**

Made with ❤️ and 🌸 (сакура)

</div>
