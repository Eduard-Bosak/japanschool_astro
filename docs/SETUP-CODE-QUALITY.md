# ✅ Установка инструментов Code Quality

**Дата:** 9 октября 2025

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

Это установит:

- `@lhci/cli` — Lighthouse CI
- `eslint` — JavaScript линтер
- `prettier` — Code formatter
- `eslint-config-prettier` — Интеграция ESLint + Prettier

### 2. Установка расширений VS Code (рекомендуется)

Откройте Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) и выберите:

**"Extensions: Show Recommended Extensions"**

Или установите вручную:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### 3. Проверка установки

```bash
# Проверить ESLint
npm run lint

# Проверить Prettier
npm run format:check

# Запустить Lighthouse (требует сборки)
npm run lighthouse
```

---

## 📋 Доступные команды

### Code Quality

```bash
# ESLint - проверка кода
npm run lint               # Проверить JavaScript
npm run lint:fix           # Автоисправление

# Prettier - форматирование
npm run format             # Отформатировать весь код
npm run format:check       # Проверка без изменений
```

### Performance Audit

```bash
# Lighthouse CI
npm run lighthouse         # Полный аудит
npm run lighthouse:open    # Аудит + открыть отчёт
```

### Development

```bash
npm run dev                # Dev сервер
npm run build              # Production сборка
npm run clean              # Очистка dist/
```

---

## 🎯 Workflow для разработки

### Перед коммитом

```bash
# 1. Отформатировать код
npm run format

# 2. Проверить линтинг
npm run lint:fix

# 3. Собрать проект
npm run build

# 4. (Опционально) Проверить производительность
npm run lighthouse
```

### В VS Code

После установки расширений:

1. **Автоформатирование при сохранении** — уже настроено
2. **Автоисправление ESLint** — работает при сохранении
3. **Горячие клавиши:**
   - Format Document: `Shift + Alt + F`
   - Fix ESLint: `Ctrl + Shift + P` → "ESLint: Fix all"

---

## 🔄 GitHub Actions

После push в GitHub автоматически запускаются:

### Build & Lint (build.yml)

- ✅ Prettier форматирование
- ✅ ESLint проверка
- ✅ Сборка проекта
- ✅ Проверка размеров файлов

### Lighthouse CI (lighthouse.yml)

- ✅ Performance audit
- ✅ Accessibility audit
- ✅ Best Practices audit
- ✅ SEO audit
- 📊 Комментарии в PR с результатами

---

## 📊 Стандарты качества

### Lighthouse Scores

| Метрика        | Минимум | Цель |
| -------------- | ------- | ---- |
| Performance    | 95      | 100  |
| Accessibility  | 100     | 100  |
| Best Practices | 95      | 100  |
| SEO            | 95      | 100  |

### Core Web Vitals

| Метрика | Бюджет  |
| ------- | ------- |
| FCP     | < 2.0s  |
| LCP     | < 2.5s  |
| CLS     | < 0.1   |
| TBT     | < 300ms |

### Bundle Size

| Ресурс     | Максимум |
| ---------- | -------- |
| CSS        | 50 KB    |
| JavaScript | 100 KB   |
| Total page | 500 KB   |

---

## 📚 Документация

Подробная документация: [`docs/CODE-QUALITY-GUIDE.md`](./CODE-QUALITY-GUIDE.md)

Включает:

- Детальные инструкции по ESLint
- Правила Prettier
- Руководство по Lighthouse CI
- Troubleshooting
- Best practices

---

## 🐛 Возможные проблемы

### ESLint показывает ошибки в VS Code

**Решение:**

1. Установить расширение ESLint
2. Перезапустить VS Code
3. Выполнить: `npm run lint:fix`

### Prettier не форматирует при сохранении

**Решение:**

1. Установить расширение Prettier
2. Проверить настройки: `.vscode/settings.json` должен содержать:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```
3. Перезапустить VS Code

### Lighthouse CI падает

**Решение:**

```bash
# Убедиться что проект собран
npm run build

# Запустить вручную
npx lhci autorun --numberOfRuns=1
```

---

## 🎉 Готово!

Теперь у проекта есть:

- ✅ Автоматическое форматирование (Prettier)
- ✅ Проверка качества кода (ESLint)
- ✅ Мониторинг производительности (Lighthouse CI)
- ✅ CI/CD интеграция (GitHub Actions)

**Следующие шаги:**

1. Запустить `npm install`
2. Установить расширения VS Code
3. Выполнить `npm run lint:fix && npm run format`
4. Сделать коммит и проверить GitHub Actions

---

**Автор:** Eduard Bosak **Проект:** JapanSchool **Версия:** 1.1.0
