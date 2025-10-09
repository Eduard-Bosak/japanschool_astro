# FAQ Smooth Hover Fix - 6 октября 2025

## Исправление резкого колебания текста при hover

**Версия:** 2.2.2 (Smooth Hover)  
**Build:** `styles.f142a806fe.css`

---

## 🐛 Проблема

При наведении курсора на FAQ текст резко колебался из-за изменения
`padding-left`:

**Было:**

```css
.faq-item {
  padding: 0 0 0 1.5rem;
  transition: all var(--trans-fast); /* 0.25s */
}

.faq-item:hover {
  padding-left: 2rem; /* Изменение padding → текст прыгает */
  transform: translateX(4px);
}

.faq-item:open {
  padding-left: 2rem; /* То же самое */
}
```

**Эффект:** Текст сдвигается на `0.5rem + 4px` = ~12px → резкое колебание ⚠️

---

## ✅ Решение

### 1. **Убрано изменение padding**

```css
.faq-item {
  padding: 0 0 0 1.5rem; /* Константа */
}

.faq-item:hover {
  /* padding-left убран! */
  transform: translateX(2px); /* Только легкий сдвиг */
}

.faq-item.open {
  /* padding-left убран! */
}
```

### 2. **Улучшены transitions**

```css
.faq-item {
  transition:
    background 0.4s ease,
    border-color 0.4s ease,
    transform 0.3s var(--ease-spring);
  /* Разделены свойства для плавности */
}

.faq-trigger-text {
  transition:
    color 0.3s ease,
    font-weight 0.3s ease;
  /* Убран transform */
}
```

### 3. **Убраны сдвиги текста**

```css
/* УДАЛЕНО */
.faq-item:hover .faq-trigger-text {
  transform: translateX(2px); /* ← причина колебания */
}

.faq-item.open .faq-trigger-text {
  transform: translateX(4px); /* ← причина колебания */
}

/* ЗАМЕНЕНО НА */
.faq-item:hover .faq-trigger-text {
  color: var(--primary); /* Только цвет */
}
```

### 4. **Усилена подсветка**

```css
.faq-item::before {
  background: radial-gradient(
    ellipse at center,
    rgba(var(--primary-rgb), 0.12),
    /* Было 0.08 */ transparent 70%
  );
  transition:
    height 0.5s var(--ease-spring),
    /* Замедлено */ opacity 0.4s ease;
}

.faq-item:hover {
  background: rgba(var(--primary-rgb), 0.04); /* Было 0.02 */
}
```

---

## 🎯 Результаты

### До (v2.2.1):

```
Hover → padding: 1.5rem → 2rem
     → text translateX: 0 → 2px
     → item translateX: 0 → 4px

Итого: ~12px сдвиг → резкое колебание ⚠️
```

### После (v2.2.2):

```
Hover → padding: 1.5rem (константа)
     → text: только color
     → item translateX: 0 → 2px

Итого: 2px плавный сдвиг → стабильно ✅
```

---

## 📊 Сравнение

| Параметр            | v2.2.1            | v2.2.2          | Улучшение  |
| ------------------- | ----------------- | --------------- | ---------- |
| **Padding change**  | 1.5rem → 2rem     | Нет             | ✅ Убрано  |
| **Text transform**  | translateX(0-4px) | Нет             | ✅ Убрано  |
| **Item transform**  | translateX(4px)   | translateX(2px) | ✅ -50%    |
| **Hover bg**        | rgba(0.02)        | rgba(0.04)      | ✅ +100%   |
| **Glow opacity**    | 0.08              | 0.12            | ✅ +50%    |
| **Transition time** | 0.25s             | 0.3-0.5s        | ✅ Плавнее |

---

## 🎨 Новые эффекты

### Плавная подсветка:

```css
/* Более яркий glow */
.faq-item::before {
  background: radial-gradient(
    ellipse at center,
    rgba(var(--primary-rgb), 0.12),
    /* +50% brightness */ transparent 70%
  );
}

/* Более яркий фон */
.faq-item:hover {
  background: rgba(var(--primary-rgb), 0.04); /* +100% brightness */
}

/* Плавная трансформация */
.faq-item {
  transition: transform 0.3s var(--ease-spring); /* Spring ease */
}
```

### Цветовая подсветка текста:

```css
.faq-item:hover .faq-trigger-text {
  color: var(--primary); /* Сразу розовый при hover */
}
```

---

## 🚀 Build Output

```bash
[build] done: styles.f142a806fe.css main.55d4b793c7.js
```

**Новый CSS:** `f142a806fe` (smooth transitions)

---

## ✅ Checklist

### Проверить:

- [ ] Hover на вопрос → текст НЕ колеблется
- [ ] Hover → более яркая подсветка (radial glow)
- [ ] Hover → текст меняет цвет на розовый плавно
- [ ] Item сдвигается только на 2px (было 4px)
- [ ] Padding остаётся константой (1.5rem)
- [ ] Transition плавный (0.3-0.5s spring ease)

---

## 🎯 Что изменилось

### Убрано:

- ❌ `padding-left: 2rem` при hover/open
- ❌ `transform: translateX(2px)` на тексте при hover
- ❌ `transform: translateX(4px)` на тексте при open
- ❌ `text-shadow` на тексте при open (было избыточно)

### Добавлено:

- ✅ Константный `padding: 1.5rem` (не меняется)
- ✅ `color: var(--primary)` на тексте при hover
- ✅ Более яркий glow: `0.12` вместо `0.08`
- ✅ Более яркий фон: `0.04` вместо `0.02`
- ✅ Раздельные transitions для плавности
- ✅ Уменьшенный сдвиг: `2px` вместо `4px`

---

## 📱 Mobile

Без изменений, mobile стили остались прежними:

```css
@media (max-width: 768px) {
  .faq-item {
    padding-left: 1rem; /* Константа */
  }

  .faq-item:hover,
  .faq-item.open {
    /* Без изменения padding */
  }
}
```

---

**Резкое колебание исправлено!** ✅  
**Hover теперь плавный и красивый!** 🎨
