# 🚀 Code Quality & Performance Guide

**Дата:** 9 октября 2025 **Версия:** 1.1.0

---

## 📋 Содержание

- [ESLint - JavaScript Linting](#eslint---javascript-linting)
- [Prettier - Code Formatting](#prettier---code-formatting)
- [Lighthouse CI - Performance Audit](#lighthouse-ci---performance-audit)
- [GitHub Actions Integration](#github-actions-integration)
- [VS Code Integration](#vs-code-integration)
- [Best Practices](#best-practices)

---

## 🔍 ESLint - JavaScript Linting

### Что это?

ESLint — это инструмент для статического анализа JavaScript кода, который
помогает находить и исправлять проблемы.

### Команды

```bash
# Проверить весь JavaScript код
npm run lint

# Автоматически исправить проблемы
npm run lint:fix

# Проверить конкретный файл
npx eslint src/scripts/main.js

# Проверить с детальным выводом
npx eslint src/**/*.js --format stylish
```

### Конфигурация (.eslintrc.json)

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  }
}
```

### Основные правила

- ✅ `no-console`: Warn (разрешены `console.warn` и `console.error`)
- ✅ `no-unused-vars`: Warn (переменные начинающиеся с `_` игнорируются)
- ✅ `prefer-const`: Warn (использовать `const` вместо `let` где возможно)
- ✅ `no-var`: Error (запрет `var`, только `let`/`const`)
- ✅ `eqeqeq`: Error (строгое сравнение `===`)
- ✅ `semi`: Error (обязательные точки с запятой)
- ✅ `quotes`: Single quotes для строк

### Игнорирование файлов

ESLint автоматически игнорирует:

- `dist/` — собранные файлы
- `node_modules/` — зависимости
- `*.min.js` — минифицированные файлы
- `.lighthouseci/` — отчёты Lighthouse

### Типичные ошибки и решения

#### 1. `'variable' is assigned a value but never used`

```javascript
// ❌ Плохо
const unusedVar = 42;

// ✅ Хорошо
const _unusedVar = 42; // Префикс _ для игнорирования

// ✅ Или удалить
// (удалить переменную)
```

#### 2. `Expected '===' and instead saw '=='`

```javascript
// ❌ Плохо
if (value == null) {
}

// ✅ Хорошо
if (value === null) {
}
```

#### 3. `Unexpected console statement`

```javascript
// ❌ Плохо
console.log('debug info');

// ✅ Хорошо (для production)
if (isDev) {
  console.log('debug info');
}

// ✅ Или использовать warn/error
console.error('Critical error');
```

---

## 🎨 Prettier - Code Formatting

### Что это?

Prettier — это opinionated форматтер кода, который автоматически делает код
единообразным.

### Команды

```bash
# Отформатировать весь проект
npm run format

# Проверить форматирование (без изменений)
npm run format:check

# Отформатировать конкретную папку
npx prettier --write "src/**/*.js"

# Отформатировать конкретный тип файлов
npx prettier --write "**/*.json"
```

### Конфигурация (.prettierrc.json)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "none",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Правила форматирования

- **Отступы:** 2 пробела (не табы)
- **Кавычки:** Single quotes `'string'`
- **Точки с запятой:** Всегда
- **Trailing commas:** Никогда
- **Длина строки:** 100 символов
- **Bracket spacing:** `{ key: value }`
- **Arrow parens:** `(x) => x`

### Форматирование разных типов файлов

```bash
# JavaScript/TypeScript
npx prettier --write "**/*.{js,ts}"

# CSS/SCSS
npx prettier --write "**/*.{css,scss}"

# HTML
npx prettier --write "**/*.html"

# Markdown
npx prettier --write "**/*.md"

# JSON
npx prettier --write "**/*.json"

# Все сразу
npm run format
```

### Игнорирование файлов (.prettierignore)

```
dist/
node_modules/
*.min.js
*.bundle.js
.lighthouseci/
package-lock.json
```

### Интеграция с ESLint

Prettier интегрирован с ESLint через `eslint-config-prettier`, что предотвращает
конфликты правил.

```bash
# Сначала линтинг, потом форматирование
npm run lint:fix && npm run format
```

---

## 🚀 Lighthouse CI - Performance Audit

### Что это?

Lighthouse CI — это инструмент для автоматического аудита производительности,
доступности, SEO и лучших практик веб-приложений.

### Команды

```bash
# Локальный запуск Lighthouse
npm run lighthouse

# Запуск с открытием отчёта
npm run lighthouse:open

# Ручной запуск через CLI
npx lhci autorun

# Только сбор данных (без assertions)
npx lhci collect

# Только проверка assertions
npx lhci assert
```

### Конфигурация (lighthouserc.json)

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npx http-server dist -p 8080 -c-1",
      "url": ["http://localhost:8080/"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

### Метрики и бюджеты

#### Core Web Vitals

| Метрика | Бюджет  | Описание                 |
| ------- | ------- | ------------------------ |
| **FCP** | < 2.0s  | First Contentful Paint   |
| **LCP** | < 2.5s  | Largest Contentful Paint |
| **CLS** | < 0.1   | Cumulative Layout Shift  |
| **TBT** | < 300ms | Total Blocking Time      |
| **SI**  | < 3.0s  | Speed Index              |

#### Lighthouse Scores

| Категория      | Минимум | Цель |
| -------------- | ------- | ---- |
| Performance    | 95      | 100  |
| Accessibility  | 100     | 100  |
| Best Practices | 95      | 100  |
| SEO            | 95      | 100  |
| PWA            | 80      | 100  |

#### Bundle Size Budgets

| Ресурс                | Бюджет   |
| --------------------- | -------- |
| CSS (minified)        | < 50 KB  |
| JavaScript (minified) | < 100 KB |
| Total page weight     | < 500 KB |
| Images per page       | < 2 MB   |

### Чтение отчётов

После выполнения `npm run lighthouse` отчёты сохраняются в `.lighthouseci/`:

```
.lighthouseci/
├── lhr-1.html          # Детальный HTML отчёт (запуск 1)
├── lhr-2.html          # Детальный HTML отчёт (запуск 2)
├── lhr-3.html          # Детальный HTML отчёт (запуск 3)
├── manifest.json       # Метаданные
└── assertions.json     # Результаты проверок
```

**Открыть отчёт:**

```bash
# Windows
start .lighthouseci/lhr-1.html

# macOS
open .lighthouseci/lhr-1.html

# Linux
xdg-open .lighthouseci/lhr-1.html
```

### Исправление типичных проблем

#### 1. Performance < 95

**Проблемы:**

- Большие изображения
- Неминифицированный CSS/JS
- Отсутствие кэширования

**Решения:**

```bash
# Оптимизация изображений
npm run build  # Автоматически генерирует AVIF/WebP

# Минификация
NODE_ENV=production npm run build

# Проверка размеров
du -sh dist/*
```

#### 2. Accessibility < 100

**Проблемы:**

- Отсутствие `alt` на изображениях
- Неправильные ARIA атрибуты
- Низкий контраст цветов

**Решения:**

```html
<!-- ✅ Добавить alt -->
<img src="photo.jpg" alt="Описание изображения" />

<!-- ✅ ARIA labels -->
<button aria-label="Закрыть меню">×</button>

<!-- ✅ Семантические теги -->
<nav aria-label="Основная навигация">...</nav>
```

#### 3. Best Practices < 95

**Проблемы:**

- console.log в production
- HTTP вместо HTTPS
- Уязвимые зависимости

**Решения:**

```javascript
// Удалить console.log или обернуть
if (process.env.NODE_ENV !== 'production') {
  console.log('debug');
}
```

#### 4. SEO < 95

**Проблемы:**

- Отсутствие meta description
- Неправильные заголовки
- Отсутствие robots.txt

**Решения:**

```html
<!-- ✅ Meta description -->
<meta name="description" content="Описание страницы" />

<!-- ✅ Правильная иерархия заголовков -->
<h1>Главный заголовок</h1>
<h2>Подзаголовок</h2>
```

---

## 🔄 GitHub Actions Integration

### Автоматические проверки

При каждом push/PR автоматически запускаются:

1. **Build & Test** (build.yml)
   - Установка зависимостей
   - Сборка проекта
   - Проверка размеров файлов

2. **Lint** (build.yml)
   - Prettier форматирование
   - ESLint проверка
   - Поиск TODO/FIXME

3. **Lighthouse CI** (lighthouse.yml)
   - Performance аудит
   - Accessibility аудит
   - SEO аудит
   - Генерация отчётов

### Workflows

#### .github/workflows/build.yml

```yaml
- name: 🎨 Run Prettier Check
  run: npm run format:check

- name: 🔍 Run ESLint
  run: npm run lint
```

#### .github/workflows/lighthouse.yml

```yaml
- name: 🔍 Run Lighthouse CI
  run: |
    npm install -g @lhci/cli@0.14.x
    lhci autorun
```

### Просмотр результатов

1. Перейти в **Actions** на GitHub
2. Выбрать последний workflow run
3. Посмотреть Summary с метриками
4. Скачать artifacts для детальных отчётов

### PR Comments

При создании Pull Request, Lighthouse CI автоматически добавляет комментарий с
результатами:

```markdown
## 🚀 Lighthouse Performance Report

### 📊 Scores

- 🎯 Performance: 98/100 ✅
- ♿ Accessibility: 100/100 ✅
- ✅ Best Practices: 100/100 ✅
- 🔍 SEO: 97/100 ✅
```

---

## 💻 VS Code Integration

### Рекомендуемые расширения

Создайте `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Настройки VS Code

Создайте `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Keyboard Shortcuts

- **Format Document:** `Shift + Alt + F` (Windows/Linux) или
  `Shift + Option + F` (macOS)
- **Fix ESLint:** `Ctrl + Shift + P` → "ESLint: Fix all auto-fixable Problems"

---

## 📝 Best Practices

### Workflow для разработки

1. **Перед началом работы:**

   ```bash
   npm install  # Установить/обновить зависимости
   ```

2. **Во время разработки:**

   ```bash
   npm run dev  # Запустить dev сервер с hot-reload
   ```

3. **Перед коммитом:**

   ```bash
    npm run lint          # Проверить код (также работает husky)
    npm run format        # Отформатировать
    npm run typecheck     # Запустить строгий анализ типов
    npm run test:unit     # Прогнать unit-тесты
    npm run build         # Проверить сборку
   ```

4. **Перед PR:**
   ```bash
    npm run deploy:check  # Полный прогонquality gate + smoke
    npm run lighthouse    # Проверить производительность
   ```

### Git Hooks (автоматически включены)

- **pre-commit**: `npm run lint`, `npm run format:check`, `npm run typecheck`,
  `npm run test:unit`
- **pre-push**: `npm run deploy:check`

> Husky уже настроен в репозитории. Коммиты и push не пройдут, если любая
> команда завершится ошибкой.

### Инварианты качества

- ✅ Node.js версии **18+** обязателен (проверяется `engines` и TypeScript
  setup)
- ✅ `server/utils/storage.js` обеспечивает сериализацию записей — не удаляйте
  очередь без альтернативы
- ✅ `npm run typecheck` и `npm run test:unit` должны оставаться зелёными перед
  любым мерджем
- ✅ `server/submissions.json` хранится пустым в git, наполнение происходит
  только в рантайме/тестах
- ✅ `deploy:check` выступает финальным gate для CI и локальных push, не
  удаляйте команды из цепочки

### Continuous Improvement

- 📊 Регулярно проверяйте Lighthouse отчёты
- 🔍 Следите за bundle size
- ♿ Тестируйте accessibility с screen readers
- 📱 Проверяйте на реальных устройствах
- ⚡ Мониторьте Core Web Vitals в production

---

## 📞 Troubleshooting

### ESLint не работает

```bash
# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install

# Проверить конфигурацию
npx eslint --print-config src/scripts/main.js
```

### Prettier конфликтует с ESLint

```bash
# Убедиться что установлен eslint-config-prettier
npm list eslint-config-prettier

# Проверить порядок в extends
# .eslintrc.json должен содержать "prettier" в конце
```

### Lighthouse CI падает

```bash
# Проверить что dist/ существует
npm run build

# Запустить вручную
npx lhci collect --numberOfRuns=1
```

### GitHub Actions не проходят

1. Проверить логи в Actions
2. Запустить те же команды локально
3. Проверить версии Node.js

---

## 🎓 Дополнительные ресурсы

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Автор:** Eduard Bosak **Проект:** JapanSchool Landing **Дата обновления:** 9
октября 2025
