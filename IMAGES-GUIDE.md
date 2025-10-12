# Генерация изображений для статей блога

## Текущие обложки статей

Сейчас используются существующие фотографии из `src/assets/images/`:

1. **jlpt-n3-preparation.md** → `i-XMW1h47xc.jpg` (человек в Японии)
2. **jlpt-n3-strategy.md** → `PicsArt_11-13-01.54.52.jpg` (японская культура)
3. **kanji-memorization-techniques.md** → `1507374093345.jpg` (учебный процесс)
4. **japanese-etiquette.md** → `1507374101244.jpg` (Токио)

## Рекомендации для новых изображений

### Инструменты для генерации

Можно использовать AI-генераторы изображений:

1. **DALL-E 3** (через ChatGPT Plus)
2. **Midjourney**
3. **Stable Diffusion**
4. **Leonardo.ai** (бесплатно 150 кредитов/день)

### Промпты для статей

#### Для статьи про JLPT N3:

```
Japanese language study scene, modern minimalist style, notebook with hiragana and kanji characters,
coffee cup, natural lighting, soft pastel colors, top-down view, high quality, photorealistic
```

#### Для статьи про кандзи:

```
Beautiful Japanese calligraphy, brush writing kanji characters, traditional ink and paper,
artistic composition, warm lighting, elegant and peaceful atmosphere, high quality
```

#### Для статьи про этикет:

```
Japanese traditional tea ceremony setting, hands performing respectful gestures,
minimalist zen aesthetic, soft natural light, cultural authenticity, serene mood
```

### Требования к изображениям

- **Формат:** JPG или WebP
- **Размер:** минимум 1200x630px (для Open Graph)
- **Соотношение сторон:** 16:9 или близкое
- **Вес файла:** желательно < 200KB (оптимизация)
- **Имена файлов:** латиница, lowercase, без пробелов

### Как добавить новое изображение

1. Сохраните изображение в `src/assets/images/`
2. В frontmatter статьи укажите:
   ```yaml
   cover: your-image-name.jpg
   ```
3. Пересоберите проект: `npm run build`

### Оптимизация изображений

Проект автоматически генерирует адаптивные версии через `processImages()` в
`build.mjs`:

- Создаются размеры: 320, 480, 640, 800, 1024px
- Форматы: AVIF, WebP, JPG
- Плейсхолдеры и доминантные цвета

## Текущее состояние

✅ Все 4 статьи имеют контент ✅ Все статьи имеют cover изображения ✅
Изображения оптимизируются автоматически ✅ Блог работает корректно

## Если нужны новые изображения

1. Используйте один из AI-генераторов выше
2. Или найдите бесплатные на:
   - [Unsplash](https://unsplash.com) — поиск "japan study"
   - [Pexels](https://pexels.com) — японская тематика
   - [Pixabay](https://pixabay.com) — японская культура

3. Убедитесь что лицензия позволяет коммерческое использование

## Пример команды для оптимизации вручную

Если нужно сжать изображение:

```bash
# Через ImageMagick
magick input.jpg -resize 1200x630^ -gravity center -extent 1200x630 -quality 85 output.jpg

# Через FFmpeg
ffmpeg -i input.jpg -vf scale=1200:630 -q:v 3 output.jpg
```
