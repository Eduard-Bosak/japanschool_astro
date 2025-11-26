# CI/CD Guide / Гайд по CI/CD

**Complete automated pipeline for testing, building and deployment / Полный
автоматизированный пайплайн для тестирования, сборки и деплоя**

---

## 📋 Table of Contents / Содержание

- [Overview / Обзор](#overview--обзор)
- [CI Pipeline / CI Пайплайн](#ci-pipeline--ci-пайплайн)
- [CD Pipeline / CD Пайплайн](#cd-pipeline--cd-пайплайн)
- [GitHub Pages Setup / Настройка GitHub Pages](#github-pages-setup--настройка-github-pages)
- [Environment Variables / Переменные окружения](#environment-variables--переменные-окружения)
- [Manual Deployment / Ручной деплой](#manual-deployment--ручной-деплой)
- [Status Badges / Бейджи статуса](#status-badges--бейджи-статуса)
- [Troubleshooting / Решение проблем](#troubleshooting--решение-проблем)

---

## Overview / Обзор

The project has two GitHub Actions workflows:

Проект использует два GitHub Actions workflow:

1. **CI (Continuous Integration)** - `.github/workflows/ci.yml`
   - Runs on every push to `main`/`develop` and PRs
   - Tests code quality (lint, format)
   - Verifies successful build
   - Runs Lighthouse audit on PRs

2. **CD (Continuous Deployment)** - `.github/workflows/deploy.yml`
   - Runs on every push to `main`
   - Automatically deploys to GitHub Pages
   - Can be triggered manually

---

## CI Pipeline / CI Пайплайн

### Triggers / Триггеры

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

### Jobs / Задачи

#### 1️⃣ Build Matrix Test

Tests on multiple Node.js versions (18.x, 20.x):

Тестирование на нескольких версиях Node.js (18.x, 20.x):

```bash
# Lint check / Проверка линтера
npm run lint

# Format check / Проверка форматирования
npm run format:check

# Build / Сборка
npm run build

# Verify output / Проверка результата
test -f dist/index.html || exit 1
```

**Artifacts uploaded / Загружаемые артефакты:**

- `dist-${{ matrix.node-version }}` - Build output for each Node version

#### 2️⃣ Lighthouse Audit (PR only)

Runs performance audit on pull requests:

Запускает аудит производительности на pull request'ах:

```bash
npm run build
npm run lighthouse
```

**Artifacts uploaded / Загружаемые артефакты:**

- `lighthouse-reports` - Performance audit results

---

## CD Pipeline / CD Пайплайн

### Triggers / Триггеры

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch: # Manual trigger
```

### Jobs / Задачи

#### 1️⃣ Build

```bash
npm ci
SITE_URL=https://YOUR-USERNAME.github.io/japanschool npm run build
```

**Required environment variable / Требуется переменная окружения:**

- `SITE_URL` - Full URL where site will be deployed

#### 2️⃣ Deploy to GitHub Pages

- Uses `actions/deploy-pages@v4`
- Requires permissions:
  - `pages: write`
  - `id-token: write`
- Outputs deployment URL in job summary

---

## GitHub Pages Setup / Настройка GitHub Pages

### Initial Configuration / Первичная настройка

1. Go to repository **Settings → Pages**

   Перейдите в **Settings → Pages** репозитория

2. Set **Source** to "GitHub Actions"

   Установите **Source** в "GitHub Actions"

3. No need to select branch - Actions will handle deployment

   Не нужно выбирать ветку - Actions сам выполнит деплой

### Custom Domain (Optional) / Свой домен (опционально)

If using custom domain:

Если используете свой домен:

1. Add `CNAME` file to `public/` folder:

   Добавьте файл `CNAME` в папку `public/`:

   ```
   yourdomain.com
   ```

2. Configure DNS:

   Настройте DNS:

   ```
   Type: CNAME
   Name: www (or @)
   Value: YOUR-USERNAME.github.io
   ```

3. Enable HTTPS in GitHub Pages settings

   Включите HTTPS в настройках GitHub Pages

---

## Environment Variables / Переменные окружения

### SITE_URL

**Required for deployment / Требуется для деплоя**

Set in `.github/workflows/deploy.yml`:

Установите в `.github/workflows/deploy.yml`:

```yaml
env:
  SITE_URL: https://YOUR-USERNAME.github.io/japanschool
```

**Replace with your actual GitHub Pages URL or custom domain:**

**Замените на ваш реальный URL GitHub Pages или собственный домен:**

- GitHub Pages: `https://username.github.io/repository`
- Custom domain: `https://yourdomain.com`

### GitHub Secrets (Optional) / GitHub Secrets (опционально)

For external services (analytics, monitoring):

Для внешних сервисов (аналитика, мониторинг):

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add secrets as needed

Example secrets:

Примеры секретов:

```yaml
- ANALYTICS_ID
- SENTRY_DSN
- DEPLOYMENT_TOKEN
```

Use in workflow:

Использование в workflow:

```yaml
env:
  ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}
```

---

## Manual Deployment / Ручной деплой

### Using npm scripts / Через npm скрипты

```bash
# Build for production / Сборка для продакшена
npm run build

# Verify build / Проверка сборки
npm run preview

# The dist/ folder is ready for deployment
# Папка dist/ готова к деплою
```

### Using GitHub Actions UI / Через интерфейс GitHub Actions

1. Go to **Actions** tab in repository

   Перейдите на вкладку **Actions** в репозитории

2. Select **Deploy to GitHub Pages** workflow

   Выберите workflow **Deploy to GitHub Pages**

3. Click **Run workflow** button

   Нажмите кнопку **Run workflow**

4. Select branch (usually `main`)

   Выберите ветку (обычно `main`)

5. Click **Run workflow**

   Нажмите **Run workflow**

### Using gh CLI / Через gh CLI

```bash
# Trigger deployment workflow / Запустить workflow деплоя
gh workflow run deploy.yml

# Check workflow status / Проверить статус workflow
gh run list --workflow=deploy.yml

# View workflow logs / Просмотр логов workflow
gh run view
```

---

## Status Badges / Бейджи статуса

Add to `README.md`:

Добавьте в `README.md`:

```markdown
<!-- CI Status -->

[![CI](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/ci.yml)

<!-- Deployment Status -->

[![Deploy](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/deploy.yml)

<!-- Pages Status -->

[![pages-build-deployment](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/YOUR-USERNAME/japanschool/actions/workflows/pages/pages-build-deployment)
```

Replace `YOUR-USERNAME` with your GitHub username.

Замените `YOUR-USERNAME` на ваше имя пользователя GitHub.

---

## Troubleshooting / Решение проблем

### ❌ Build fails with "Module not found"

**Problem:** Missing dependencies

**Проблема:** Отсутствуют зависимости

**Solution:**

**Решение:**

```bash
# Ensure package-lock.json is committed
# Убедитесь, что package-lock.json закоммичен
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### ❌ Deployment fails with 403 error

**Problem:** Missing GitHub Pages permissions

**Проблема:** Отсутствуют права GitHub Pages

**Solution:**

**Решение:**

1. Check `.github/workflows/deploy.yml` has:

   Проверьте, что `.github/workflows/deploy.yml` содержит:

   ```yaml
   permissions:
     pages: write
     id-token: write
   ```

2. Enable GitHub Pages in repository settings

   Включите GitHub Pages в настройках репозитория

### ❌ Lighthouse job fails

**Problem:** Build artifacts not found

**Проблема:** Артефакты сборки не найдены

**Solution:**

**Решение:**

Check that `dist/` folder exists after build:

Проверьте, что папка `dist/` существует после сборки:

```yaml
- name: Verify build
  run: |
    test -f dist/index.html || exit 1
```

### ❌ Workflow doesn't trigger

**Problem:** Branch protection or workflow disabled

**Проблема:** Защита ветки или workflow отключён

**Solution:**

**Решение:**

1. Check that workflows are enabled:

   Проверьте, что workflows включены:

   **Settings → Actions → General → Actions permissions**

2. Verify branch name matches trigger:

   Проверьте, что имя ветки совпадает с триггером:

   ```yaml
   on:
     push:
       branches: [main] # Must match your default branch
   ```

### ❌ Site not updating after deployment

**Problem:** Browser cache or CDN delay

**Проблема:** Кеш браузера или задержка CDN

**Solution:**

**Решение:**

1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

   Жёсткое обновление браузера: `Ctrl+Shift+R` (Windows) или `Cmd+Shift+R` (Mac)

2. Wait 1-2 minutes for CDN propagation

   Подождите 1-2 минуты для распространения через CDN

3. Check deployment URL in Actions output

   Проверьте URL деплоя в выводе Actions

### 🔍 View deployment logs

**В случае проблем смотрите логи деплоя:**

1. Go to **Actions** tab

   Перейдите на вкладку **Actions**

2. Click on failed workflow run

   Кликните на упавший workflow run

3. Expand failed job to see detailed logs

   Разверните упавшую задачу для просмотра детальных логов

---

## Best Practices / Лучшие практики

### ✅ Development Workflow / Рабочий процесс разработки

```bash
# 1. Create feature branch / Создайте ветку для фичи
git checkout -b feature/new-feature

# 2. Develop with live reload / Разработка с live reload
npm run dev:stable

# 3. Test build / Тестовая сборка
npm run build
npm run preview

# 4. Commit changes / Закоммитьте изменения
git add .
git commit -m "feat: add new feature"

# 5. Push and create PR / Запушьте и создайте PR
git push origin feature/new-feature

# 6. CI runs automatically on PR / CI запустится автоматически на PR
# Review Lighthouse results in Actions artifacts
# Просмотрите результаты Lighthouse в артефактах Actions

# 7. Merge to main / Смержите в main
# CD deploys automatically / CD автоматически выполнит деплой
```

### ✅ Pre-commit Checks / Проверки перед коммитом

Run locally before pushing:

Запустите локально перед пушем:

```bash
npm run lint       # Check code style / Проверка стиля кода
npm run format     # Auto-fix formatting / Автоисправление форматирования
npm run build      # Ensure build works / Убедитесь, что сборка работает
```

### ✅ Deployment Checklist / Чеклист деплоя

Before merging to `main`:

Перед мержем в `main`:

- [ ] All CI checks pass / Все проверки CI прошли
- [ ] Lighthouse scores acceptable / Результаты Lighthouse приемлемы
- [ ] Tested locally with `npm run preview` / Протестировано локально с
      `npm run preview`
- [ ] SITE_URL is correct in deploy.yml / SITE_URL корректен в deploy.yml
- [ ] No console errors in browser / Нет ошибок в консоли браузера
- [ ] Mobile responsiveness checked / Проверена адаптивность

---

## Additional Resources / Дополнительные ресурсы

### GitHub Actions Documentation

- [Workflow syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Environment variables](https://docs.github.com/en/actions/reference/environment-variables)

### Related Project Docs

- [DEV-SETUP.md](./DEV-SETUP.md) - Development environment setup
- [CODE-QUALITY-GUIDE.md](./CODE-QUALITY-GUIDE.md) - Code style and linting
- [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) - Project architecture

---

**Last Updated:** 2025-01-15 **Maintained by:** Development Team
