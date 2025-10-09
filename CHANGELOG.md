# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-03

### ✨ Added

#### Architecture

- **Modular architecture** — 27 independent modules (16 CSS + 11 JS)
- **Bilingual comments** — EN/RU for all modules and functions
- **ES6 modules** — Modern JavaScript with import/export

#### Features

- **6 themes** — Dark, Light, Spring, Autumn, Winter, Sakura
- **Adaptive images** — AVIF/WebP/JPG in 5 sizes (320-1024px)
- **Static blog** — Markdown → HTML with front-matter
- **RSS/Atom feeds** — Automatic generation for blog
- **Canvas animations** — Sakura petals animation (200+ lines)
- **PWA support** — Service Worker with offline-first
- **Responsive design** — Mobile-first approach

#### Build System

- **esbuild** — Ultra-fast JavaScript bundler
- **PostCSS** — Autoprefixer + cssnano
- **sharp** — Image processing pipeline
- **File hashing** — Cache busting for CSS/JS
- **Watch mode** — Development server with hot-reload

#### SEO

- **Sitemap.xml** — Auto-generation with changefreq/priority
- **Robots.txt** — Auto-generation
- **JSON-LD** — Organization, Person, Article schemas
- **OpenGraph** — og:title, og:description, og:image
- **Twitter Cards** — twitter:card, twitter:image
- **Canonical URLs** — Avoiding duplicates

#### Accessibility (A11y)

- **ARIA attributes** — aria-label, aria-labelledby, aria-expanded
- **Keyboard navigation** — Tab, Enter, Esc, Arrow keys
- **Focus management** — Custom focus-visible styles
- **Screen reader support** — Alt texts, aria-live regions
- **WCAG AA compliance** — Color contrast 4.5:1
- **Reduced motion** — prefers-reduced-motion support
- **Skip links** — Quick navigation to content

#### Components

**CSS Modules (16):**

- `variables.css` — Design tokens
- `themes.css` — 4 seasonal themes
- `reset.css` — Global resets
- `layout.css` — Container system
- `preloader.css` — Loading screen
- `header.css` — Fixed header with blur
- `hero.css` — Hero section
- `buttons.css` — 5 button variants
- `forms.css` — Form fields with validation
- `faq.css` — Accordion (438 lines)
- `sections.css` — Content sections
- `reviews.css` — Carousel with touch support
- `modal.css` — Modal windows
- `gallery.css` — Lightbox
- `footer.css` — Footer
- `utilities.css` — Animations, helpers

**JavaScript Modules (11):**

- `analytics.js` — Event queue system
- `api.js` — API client with offline queue
- `theme.js` — Theme switcher (6 variants)
- `preloader.js` — Preloader controller
- `navigation.js` — Mobile menu, scroll spy
- `animations.js` — IntersectionObserver, parallax
- `sakura.js` — Canvas animation (200+ lines)
- `faq.js` — FAQ accordion (480+ lines)
- `carousel.js` — Auto-carousel (330+ lines)
- `gallery.js` — Lightbox (160+ lines)
- `forms.js` — Form validation (280+ lines)

### 📦 Infrastructure

- **Organized folder structure** — `public/`, `src/`, `docs/`, `content/`
- **Git repository** — Version control with meaningful commits
- **GitHub** — Remote backup and collaboration
- **Documentation** — Comprehensive README.md
- **MIT License** — Open-source license
- **package.json** — Complete metadata

### 📄 Documentation

- **README.md** — Professional documentation with badges, Quick Start,
  architecture
- **AUDIT-REPORT.md** — Detailed module analysis
- **MIGRATION-GUIDE.md** — Modularization guide
- **MODULARIZATION-COMPLETE.md** — Completion report
- **CHANGELOG.md** — This file
- **LICENSE** — MIT License

### 🎨 Design

- **Color palette** — Sakura pink, gold accent, deep dark background
- **Typography** — Playfair Display (headings), Inter (body)
- **Glassmorphism** — backdrop-filter effects
- **Gradients** — Linear gradients for depth
- **Animations** — IntersectionObserver, count-up, parallax

### ⚡ Performance

- **Lighthouse scores** — Performance 95+, Accessibility 100, Best Practices
  100, SEO 100
- **File sizes** — CSS ~3KB, JS ~27KB, HTML ~8KB
- **Image optimization** — AVIF/WebP/JPG with multiple sizes
- **Critical CSS** — Inline critical styles
- **Lazy loading** — Images and animations

---

## [1.1.0] - 2025-01-08

### ✨ Added

#### Code Quality Tools

- **Lighthouse CI** — Automated performance auditing with budgets
  - Performance threshold ≥95
  - Accessibility 100 (required)
  - SEO threshold ≥95
  - Core Web Vitals budgets (LCP <2.5s, CLS <0.1, TBT <300ms)
  - GitHub Actions integration for automated checks
  - HTML reports with detailed metrics

- **ESLint 8.57.1** — JavaScript code quality enforcement
  - 70+ custom rules for ES2021+ code
  - Consistent code style (curly braces, single quotes, no-console warnings)
  - Automatic fix for 80%+ of common issues
  - Special overrides for build scripts
  - Integration with VS Code

- **Prettier 3.3.3** — Automatic code formatting
  - Single quotes, 2-space indentation
  - 100 character line width
  - Consistent formatting for JS, CSS, JSON, MD, HTML
  - Pre-commit hooks support

#### Developer Experience

- **npm scripts** — Convenient CLI commands
  - `npm run lint` — Check code quality
  - `npm run lint:fix` — Auto-fix ESLint issues
  - `npm run format` — Format all code
  - `npm run format:check` — Verify formatting
  - `npm run lighthouse` — Run performance audit
  - `npm run lighthouse:open` — Open audit report

- **GitHub Actions workflows**
  - Lighthouse CI on every push/PR
  - Automated code quality checks
  - PR comments with performance reports

- **VS Code integration**
  - Recommended extensions (ESLint, Prettier, Lighthouse)
  - Auto-formatting on save
  - Real-time code quality feedback

### 📄 Documentation

- **CODE-QUALITY-GUIDE.md** — Comprehensive guide (600+ lines)
  - Setup instructions for all tools
  - Best practices and examples
  - Troubleshooting common issues
  - Integration with CI/CD

- **SETUP-CODE-QUALITY.md** — Quick start guide
  - Installation steps
  - Common commands
  - Workflow tips

### 🔧 Changed

- Updated `package.json` with new dependencies and scripts
- Updated `README.md` with code quality tools documentation
- Enhanced `.github/workflows/build.yml` with lint checks
- Fixed 957 ESLint issues across the codebase
- Formatted 70+ files with Prettier

### ⚡ Performance

- Ensured all code passes Lighthouse CI thresholds
- Optimized JavaScript code style for better minification
- Maintained 0 ESLint errors and 0 warnings

---

## [Unreleased]

### Planned for v1.2 (Q2 2025)

- Automated tests (Jest + Testing Library)
- Web Vitals tracking integration
- Auto-deploy to Netlify

### Planned for v1.2 (Q1 2026)

- Headless CMS integration
- Real backend API
- Admin panel
- Email notifications

### Planned for v2.0 (Q2 2026)

- LMS functionality (user dashboard)
- Course enrollment system
- Online payments
- Video lessons

---

## Legend

- ✨ **Added** — New features
- 🔧 **Changed** — Changes in existing functionality
- 🐛 **Fixed** — Bug fixes
- 🗑️ **Removed** — Removed features
- 🔒 **Security** — Security improvements
- 📝 **Documentation** — Documentation changes
- ⚡ **Performance** — Performance improvements

---

[1.1.0]: https://github.com/Eduard-Bosak/japanschool/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Eduard-Bosak/japanschool/releases/tag/v1.0.0
[Unreleased]: https://github.com/Eduard-Bosak/japanschool/compare/v1.1.0...HEAD
