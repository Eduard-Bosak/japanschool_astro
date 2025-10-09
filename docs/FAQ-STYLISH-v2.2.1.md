# FAQ Stylish Update - 6 октября 2025

## FAQ в стиле сайта с продвинутыми анимациями

**Версия:** 2.2.1 (Stylish FAQ)  
**Дата:** 6 октября 2025  
**Build:** `main.55d4b793c7.js` + `styles.fef1b1456b.css`

---

## 🎨 Новые стили и анимации

### Добавлено:

#### 1. **Градиентный фон секции**

```css
.faq::before {
  background:
    radial-gradient(
      circle at 20% 30%,
      rgba(var(--primary-rgb), 0.04),
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(var(--accent-rgb), 0.03),
      transparent 50%
    );
}
```

✨ Тонкие радиальные градиенты создают глубину

#### 2. **Декоративная градиентная линия**

```css
.faq-list::before {
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(var(--primary-rgb), 0.3) 20%,
    rgba(var(--primary-rgb), 0.3) 80%,
    transparent
  );
  opacity: 0;
  transition: opacity var(--trans-fast);
}

.faq-list:hover::before {
  opacity: 1;
}
```

✨ Вертикальная линия появляется при наведении

#### 3. **Hover glow effect** (эффект свечения)

```css
.faq-item::before {
  background: radial-gradient(
    ellipse at center,
    rgba(var(--primary-rgb), 0.08),
    transparent 70%
  );
  opacity: 0;
  transition: all 0.6s var(--ease-spring);
}

.faq-item:hover::before {
  height: 120%;
  opacity: 1;
}
```

✨ Радиальное свечение расширяется при hover

#### 4. **Accent dot indicator** (пульсирующая точка)

```css
.faq-item.open::after {
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(var(--primary-rgb), 0.6);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}
```

✨ Пульсирующая точка показывает активный вопрос

#### 5. **Text shadow glow** (свечение текста)

```css
.faq-item.open .faq-trigger-text {
  text-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3);
}
```

✨ Текст светится при открытии

#### 6. **Gradient icon background** (градиент иконки)

```css
.faq-item.open .faq-icon {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow:
    0 4px 12px rgba(var(--primary-rgb), 0.4),
    0 0 20px rgba(var(--primary-rgb), 0.2);
}
```

✨ Градиент от розового к жёлтому + двойная тень

#### 7. **Icon glow on hover** (свечение иконки при hover)

```css
.faq-item:hover .faq-icon::before,
.faq-item:hover .faq-icon::after {
  background: var(--primary);
  box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.6);
}
```

✨ Линии светятся розовым при наведении

#### 8. **Decorative quote mark** (декоративная кавычка)

```css
.faq-panel-inner::before {
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary), transparent);
  opacity: 0;
  transition: opacity 0.4s ease 0.2s;
}

.faq-item.open .faq-panel-inner::before {
  opacity: 0.6;
}
```

✨ Вертикальная градиентная полоса слева от ответа

#### 9. **Stagger animation on load** (каскадная анимация)

```css
@keyframes faqFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-item {
  animation: faqFadeIn 0.6s var(--ease-spring) backwards;
}

.faq-item:nth-child(1) {
  animation-delay: calc(var(--stagger-step) * 0);
}
.faq-item:nth-child(2) {
  animation-delay: calc(var(--stagger-step) * 1);
}
.faq-item:nth-child(3) {
  animation-delay: calc(var(--stagger-step) * 2);
}
```

✨ FAQ элементы появляются один за другим (70ms задержка)

#### 10. **Enhanced transitions** (улучшенные переходы)

```css
.faq-trigger {
  transition: all var(--trans-fast);
  /* --trans-fast: .25s cubic-bezier(.4, .0, .2, 1) */
}

.faq-panel {
  transition:
    max-height 0.6s var(--ease-spring),
    opacity 0.5s ease,
    transform 0.5s var(--ease-spring);
  /* --ease-spring: cubic-bezier(.18, .89, .29, 1.18) */
}
```

✨ Пружинистые переходы из CSS переменных сайта

---

## 🎭 Визуальные улучшения

### До (v2.2.0):

```
────────────────────────────────
Вопрос 1                      ⊕
────────────────────────────────
Вопрос 2                      ⊕
────────────────────────────────
```

### После (v2.2.1):

```
│ ← градиентная линия (появляется на hover)
│
│  [subtle glow]
│    Вопрос 1 ← text shadow        ⊕ ← gradient icon
│    ─────────
│  ● ← pulsing dot
│  │ Ответ 1...
│  ↑ gradient quote mark
│
│  Вопрос 2 ← hover: translateX(2px)  ⊕
│
```

---

## 🎨 Цветовые эффекты

### 1. **Hover состояние:**

- Background: `rgba(var(--primary-rgb), 0.02)`
- Radial glow: `rgba(var(--primary-rgb), 0.08)`
- Transform: `translateX(4px) + padding-left: 2rem`
- Icon background: `rgba(var(--primary-rgb), 0.15)`
- Icon scale: `1.1`

### 2. **Open состояние:**

- Background: `rgba(var(--primary-rgb), 0.04)`
- Border: `rgba(var(--primary-rgb), 0.15)`
- Text color: `var(--primary)` (#f06b93)
- Text shadow: `0 0 20px rgba(var(--primary-rgb), 0.3)`
- Icon gradient: `linear-gradient(135deg, #f06b93, #ffc107)`
- Icon shadow: двойная (blur + glow)
- Pulsing dot: `6px` с box-shadow blur 12px

### 3. **Panel анимация:**

- Transform: `translateY(-12px)` → `translateY(0)`
- Opacity: `0` → `1`
- Timing: `0.6s spring ease`
- Text delay: `0.1s` (каскадное появление)

---

## 📐 Размеры и отступы

| Элемент             | v2.2.0     | v2.2.1                | Изменение        |
| ------------------- | ---------- | --------------------- | ---------------- |
| **Padding left**    | 0          | 1.5rem → 2rem (hover) | +33%             |
| **Trigger padding** | 1.4rem 0   | 1.5rem 0              | +7%              |
| **Font size**       | 1rem       | 1.05rem               | +5%              |
| **Font family**     | inherit    | var(--font-display)   | Playfair Display |
| **Icon size**       | 24px       | 28px                  | +17%             |
| **Icon lines**      | 10px × 2px | 12px × 2.5px          | +20%             |
| **Gap**             | 1.5rem     | 2rem                  | +33%             |

---

## ⚡ Производительность

### Новые эффекты:

- ✅ **GPU acceleration**: transform, opacity (не вызывают reflow)
- ✅ **will-change**: не используется (браузер сам оптимизирует)
- ✅ **Reduced motion**: все анимации отключаются через media query
- ✅ **Кеширование**: CSS переменные (--primary-rgb) вычисляются 1 раз

### Размер файлов:

| Файл    | v2.2.0 | v2.2.1     | Изменение                 |
| ------- | ------ | ---------- | ------------------------- |
| **CSS** | ~45 KB | **~48 KB** | +6.7% (добавлены эффекты) |
| **JS**  | ~24 KB | **~24 KB** | без изменений             |

---

## 🎯 Детали анимаций

### 1. **Hover sequence** (200ms):

```
0ms:   cursor enters
↓
50ms:  background fade-in (rgba primary 2%)
       icon scale 1 → 1.1
       icon bg: gray → primary 15%
↓
100ms: radial glow expands (height 0 → 120%)
       text translateX(0 → 2px)
↓
200ms: icon shadow appears
       finished
```

### 2. **Open sequence** (600ms):

```
0ms:   click event
↓
0ms:   item.classList.add('open')
       requestAnimationFrame
↓
50ms:  icon rotate(0 → 45deg)
       icon gradient appears
       dot fade-in + pulse animation starts
↓
100ms: panel max-height: 0 → auto
       panel opacity: 0 → 1
       panel translateY: -12px → 0
↓
200ms: quote mark appears (opacity 0 → 0.6)
↓
300ms: text inside panel fades in
       (delay 0.1s for cascade)
↓
600ms: finished (spring ease)
```

### 3. **Stagger on load** (420ms):

```
0ms:   page load
↓
0ms:   FAQ item 1 starts fading in
↓
70ms:  FAQ item 2 starts (stagger-step)
↓
140ms: FAQ item 3 starts
↓
210ms: FAQ item 4 starts
↓
280ms: FAQ item 5 starts
↓
350ms: FAQ item 6 starts
↓
420ms: all items visible (70ms × 6)
```

---

## 🎨 Spring ease визуализация

```css
--ease-spring: cubic-bezier(0.18, 0.89, 0.29, 1.18);
```

**Кривая Безье:**

```
 1.18 │       ╱‾‾╲  ← overshoot (пружинный эффект)
      │      ╱    ╲
 1.0  │     │      ╲___
      │    ╱
      │   ╱
 0.0  │  ╱
      └──────────────────
      0   0.18  0.89  1.0
```

**Используется для:**

- Icon scale (1 → 1.1 → 1.05 → 1.1)
- Panel transform (slide + overshoot)
- Radial glow expansion
- FAQ item load animation

---

## 📱 Адаптивность

### Mobile (<768px):

```css
.faq-item {
  padding-left: 1rem; /* вместо 1.5rem */
}

.faq-trigger {
  font-size: 0.98rem; /* вместо 1.05rem */
  gap: 1.5rem; /* вместо 2rem */
}

.faq-icon {
  --sz: 24px; /* вместо 28px */
}

.faq-list::before {
  display: none; /* скрыта градиентная линия */
}
```

### Tablet (769-1024px):

```css
.faq-trigger {
  font-size: 1.02rem; /* промежуточный размер */
}

.faq-icon {
  --sz: 26px; /* промежуточный размер */
}
```

---

## 🔧 Интеграция со стилем сайта

### Используются переменные:

```css
/* Из variables.css */
--primary: #f06b93 --primary-rgb: 240 107 147 --accent: #ffc107
  --accent-rgb: 255 193 7 --ink: #f5f7fa --ink-soft: #cdd3db --trans-fast: 0.25s
  cubic-bezier(0.4, 0, 0.2, 1)
  --ease-spring: cubic-bezier(0.18, 0.89, 0.29, 1.18)
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1) --stagger-step: 70ms
  --radius-xs: 4px --font-display: 'Playfair Display';
```

### Стиль как в Hero:

**Hero:**

```css
.hero-bg-layer::after {
  background: conic-gradient(...);
  animation: heroSpin 24s linear infinite;
}
```

**FAQ:**

```css
.faq::before {
  background: radial-gradient(...);
  /* Статичный, без вращения */
}
```

**Общие черты:**

- Радиальные/конические градиенты
- Subtle opacity (0.04-0.08)
- Primary/accent цвета
- Overlay/blend эффекты

---

## ✅ Checklist для тестирования

### Hover эффекты:

- [ ] Курсор на вопрос → subtle glow появляется
- [ ] Иконка увеличивается (scale 1.1)
- [ ] Текст сдвигается вправо (2px)
- [ ] Линии иконки светятся розовым
- [ ] Градиентная линия слева появляется

### Open эффекты:

- [ ] Иконка поворачивается 45° (плюс → крестик)
- [ ] Иконка меняет фон на градиент (розовый → жёлтый)
- [ ] Двойная тень под иконкой
- [ ] Текст вопроса светится (text-shadow)
- [ ] Пульсирующая точка слева (6px круг)
- [ ] Панель появляется плавно (slide + fade)
- [ ] Градиентная кавычка слева от ответа
- [ ] Текст ответа каскадно появляется (+100ms)

### Load анимация:

- [ ] FAQ элементы появляются последовательно
- [ ] Задержка между элементами ~70ms
- [ ] Fade-in + translateY (20px → 0)
- [ ] Spring ease эффект

### Mobile:

- [ ] Размеры уменьшены (24px icon, 0.98rem text)
- [ ] Градиентная линия скрыта
- [ ] Отступы уменьшены
- [ ] Все анимации работают

### Accessibility:

- [ ] prefers-reduced-motion отключает анимации
- [ ] Focus outline видимый (2px primary)
- [ ] Клавиатурная навигация работает
- [ ] ARIA атрибуты на месте

---

## 📦 Build Output

```bash
npm run build

[images] generated responsive variants
[sitemap] sitemap.xml generated
[robots] robots.txt generated
[feed] rss.xml & atom.xml generated
[build] done: styles.fef1b1456b.css main.55d4b793c7.js
```

**Новые хеши:**

- CSS: `fef1b1456b` (**NEW** - стильный FAQ)
- JS: `55d4b793c7` (без изменений)

---

## 🎨 Кастомизация

### Изменить цвет акцента:

```css
.faq-item.open .faq-icon {
  background: linear-gradient(135deg, var(--danger), var(--accent));
  /* вместо primary → accent */
}
```

### Убрать пульсирующую точку:

```css
.faq-item.open::after {
  display: none;
}
```

### Ускорить анимации:

```css
.faq-panel {
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease,
    transform 0.3s ease;
}
```

### Убрать spring ease:

```css
.faq-icon {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* вместо var(--ease-spring) */
}
```

### Отключить stagger:

```css
.faq-item {
  animation: none;
}
```

---

## 🚀 Deployment

```bash
# 1. Пересобрать
npm run build

# 2. Hard refresh
Ctrl + F5

# 3. Проверить:
# - Градиенты на месте
# - Анимации плавные
# - Hover эффекты работают
# - Пульсирующая точка видна
# - Стиль согласован с сайтом
```

---

## 📊 Сравнение версий

| Параметр           | v2.2.0  | v2.2.1 (Stylish)    |
| ------------------ | ------- | ------------------- |
| **Градиенты**      | 0       | 5 ✨                |
| **Glow эффекты**   | 0       | 4 ✨                |
| **Тени**           | 1       | 4 ✨                |
| **Анимаций**       | 5       | 11 ✨               |
| **CSS переменных** | 2       | 12 ✨               |
| **Spring ease**    | Нет     | Да ✨               |
| **Stagger load**   | Нет     | Да ✨               |
| **Font family**    | inherit | Playfair Display ✨ |
| **Размер CSS**     | 45 KB   | 48 KB (+3 KB)       |

---

**FAQ теперь полностью в стиле сайта!** 🎨✨  
**С продвинутыми анимациями и эффектами!** 🚀
