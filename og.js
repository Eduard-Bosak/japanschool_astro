/* =============================================
   Dynamic OG Image Generator (SVG to PNG)
   Генератор динамических OG изображений (SVG в PNG)
   ============================================= */

/* EN: Simple SVG-based OG image generator with optional PNG conversion via sharp
   RU: Простой генератор OG изображений на основе SVG с опциональной конвертацией в PNG через sharp */

import { promises as fs } from 'fs';
import path from 'path';

const dist = path.join(process.cwd(), 'dist');

/**
 * EN: Generate Open Graph image for social media sharing
 * RU: Генерация Open Graph изображения для социальных сетей
 * 
 * @param {Object} options - Configuration | Конфигурация
 * @param {string} options.title - Main title | Основной заголовок
 * @param {string} options.subtitle - Subtitle text | Текст подзаголовка
 * @param {string} options.outName - Output filename | Имя выходного файла
 * @returns {Promise<Object>} Paths to generated files | Пути к сгенерированным файлам
 */
export async function generateOgImage(options = {}) {
  const {
    title = 'Школа японского языка',
    subtitle = 'Погружение в язык и культуру',
    outName = 'og-image.png'
  } = options;

  const width = 1200;
  const height = 630;
  const gradient = 'linear-gradient(135deg,#0f1115,#1e242d 55%,#2c3641)';

  /* EN: Build SVG markup with gradients and text
     RU: Построение SVG разметки с градиентами и текстом */
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n` +
  `<defs>\n` +
  `  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n` +
  `    <stop offset="0%" stop-color="#0f1115"/>\n` +
  `    <stop offset="55%" stop-color="#1e242d"/>\n` +
  `    <stop offset="100%" stop-color="#2c3641"/>\n` +
  `  </linearGradient>\n` +
  `  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">\n` +
  `    <stop offset="0%" stop-color="#f06b93"/>\n` +
  `    <stop offset="100%" stop-color="#ffc107"/>\n` +
  `  </linearGradient>\n` +
  `  <style><![CDATA[\n` +
  `    .title { font:700 70px 'Inter', 'Arial', sans-serif; fill:#f5f7fa; letter-spacing:1px; }\n` +
  `    .subtitle { font:500 34px 'Inter', 'Arial', sans-serif; fill:#cdd3db; }\n` +
  `    .badge { font:600 22px 'Inter', 'Arial', sans-serif; fill:#0f1115; }\n` +
  `  ]]></style>\n` +
  `</defs>\n` +
  `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#g)"/>\n` +
  `<g opacity="0.25">\n` +
  `  <circle cx="1040" cy="120" r="260" fill="url(#accent)"/>\n` +
  `  <circle cx="160" cy="540" r="180" fill="url(#accent)"/>\n` +
  `</g>\n` +
  `<text x="80" y="300" class="title">${escapeXML(title)}</text>\n` +
  `<text x="80" y="380" class="subtitle">${escapeXML(subtitle)}</text>\n` +
  `<g transform="translate(80,440)">\n` +
  `  <rect rx="14" ry="14" width="560" height="82" fill="url(#accent)"/>\n` +
  `  <text x="40" y="54" class="badge">日本語 • CULTURE • JLPT</text>\n` +
  `</g>\n` +
  `</svg>`;

  /* EN: Write SVG file | RU: Запись SVG файла */
  const svgPath = path.join(dist, 'og-image.svg');
  await fs.writeFile(svgPath, svg, 'utf8');

  /* EN: Try to convert to PNG using sharp (optional)
     RU: Попытка конвертации в PNG через sharp (опционально) */
  let pngWritten = false;
  try {
    const sharp = await import('sharp').then(m=>m.default || m);
    const buf = await sharp(Buffer.from(svg)).png({ quality:90 }).toBuffer();
    await fs.writeFile(path.join(dist,outName), buf);
    pngWritten = true;
  } catch(err){
    /* EN: sharp not installed - keep only SVG
       RU: sharp не установлен - оставляем только SVG */
    await fs.writeFile(path.join(dist,outName+'.note.txt'), Buffer.from('PNG not generated (sharp not installed). Using og-image.svg as OG asset.'));    
  }
  return { svg: 'og-image.svg', png: pngWritten ? outName : null };
}

/**
 * EN: Escape XML special characters
 * RU: Экранирование специальных символов XML
 * 
 * @param {string} str - String to escape | Строка для экранирования
 * @returns {string} Escaped string | Экранированная строка
 */
function escapeXML(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[s]));
}

/* EN: Run standalone if executed directly | RU: Запуск standalone при прямом выполнении */
if (import.meta.url === `file://${process.argv[1]}`){
  generateOgImage().then(r=>console.log('[og] generated', r)).catch(e=>{ console.error(e); process.exit(1); });
}
