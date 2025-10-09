/* =============================================
   Build System for Japan School Landing Page
   Система сборки для лендинга школы японского языка
   ============================================= */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import * as esbuild from 'esbuild';
import { generateOgImage } from './og.js';
import { marked } from 'marked';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;
const dist = path.join(root, 'dist');
const WORDS_PER_MINUTE = 180;

const isWatch = process.argv.includes('--watch');
const isClean = process.argv.includes('--clean');
const env = process.env.NODE_ENV || (isWatch ? 'development' : 'production');

/**
 * EN: Recursively delete directory
 * RU: Рекурсивное удаление директории
 */
async function rimraf(p){
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch {}
}

/**
 * EN: Generate SHA-256 hash for content-based cache busting
 * RU: Генерация SHA-256 хеша для cache busting на основе содержимого
 */
function hashContent(buf){
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0,10);
}

/**
 * EN: Run shell command as a child process
 * RU: Запуск shell команды как дочернего процесса
 */
async function run(cmd, args, opts={}){
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    ps.on('close', code => code === 0 ? resolve() : reject(new Error(cmd+ ' exit '+code)));
  });
}

/**
 * EN: Ensure directory exists (create if needed)
 * RU: Убедиться что директория существует (создать если нужно)
 */
async function ensureDir(p){
  await fs.mkdir(p, { recursive: true });
}

/**
 * EN: Build and minify CSS with PostCSS
 * RU: Сборка и минификация CSS через PostCSS
 */
async function buildCSS(){
  /* EN: Use modular entry point src/styles.css
     RU: Использование модульной точки входа src/styles.css */
  const cssPath = path.join(root, 'src', 'styles.css');
  const cssRaw = await fs.readFile(cssPath, 'utf8');
  const tmpIn = path.join(root, '.tmp.styles.css');
  const tmpOut = path.join(root, '.tmp.out.css');
  await fs.writeFile(tmpIn, cssRaw, 'utf8');
  await run('npx', ['postcss', tmpIn, '--config', path.join(root,'postcss.config.cjs'), '-o', tmpOut]);
  const processed = await fs.readFile(tmpOut);
  await fs.rm(tmpIn, { force: true });
  await fs.rm(tmpOut, { force: true });
  const hash = hashContent(processed);
  const outName = `styles.${hash}.css`;
  await fs.writeFile(path.join(dist, outName), processed);
  return outName;
}

/**
 * EN: Build and bundle JavaScript with esbuild
 * RU: Сборка и бандлинг JavaScript через esbuild
 */
async function buildJS(){
  /* EN: Use modular entry point src/scripts/main.js with ES6 bundling
     RU: Использование модульной точки входа src/scripts/main.js с ES6 бандлингом */
  const entry = path.join(root, 'src', 'scripts', 'main.js');
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: env === 'production',
    sourcemap: env !== 'production',
    target: 'es2018',
    format: 'esm',
    write: false
  });
  const outFile = result.outputFiles[0];
  const hash = hashContent(outFile.contents);
  const outName = `main.${hash}.js`;
  await fs.writeFile(path.join(dist, outName), outFile.contents);
  if(env !== 'production' && result.metafile){
    await fs.writeFile(path.join(dist,'meta.json'), JSON.stringify(result.metafile,null,2));
  }
  return outName;
}

/**
 * EN: Self-host Google Fonts (download and serve locally)
 * RU: Самостоятельный хостинг Google Fonts (загрузка и локальная раздача)
 */
async function buildFonts(){
  try {
    const indexHtml = await fs.readFile(path.join(root,'public','index.html'),'utf8');
    const m = indexHtml.match(/<link[^>]+href="(https:\/\/fonts\.googleapis[^"']+)"/i);
    if(!m){
      return { preload: null };
    }
    const cssUrl = m[1];
    const res = await fetch(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if(!res.ok) {
      throw new Error('fonts css fetch failed '+res.status);
    }
    let cssText = await res.text();
    const fontDir = path.join(dist,'fonts');
    await ensureDir(fontDir);
    const urlRegex = /url\((https:[^\)]+\.woff2)\)/g;
    const found = [];
    let match;
    while((match = urlRegex.exec(cssText))){
      const fUrl = match[1].split('?')[0];
      const fileName = path.basename(fUrl);
      if(found.includes(fileName)) {
        continue;
      }
      try {
        const fRes = await fetch(fUrl);
        if(!fRes.ok) {
          throw new Error('font fetch '+fRes.status);
        }
        const buf = new Uint8Array(await fRes.arrayBuffer());
        await fs.writeFile(path.join(fontDir,fileName), buf);
        found.push(fileName);
        cssText = cssText.replaceAll(match[1], 'fonts/'+fileName);
      } catch(err){
        console.warn('[fonts] single font failed', fileName, err.message);
      }
    }
    await fs.writeFile(path.join(dist,'fonts.css'), cssText, 'utf8');
    const preloadCandidate = found.find(f => /playfair/i.test(f)) || found[0] || null;
    return { preload: preloadCandidate };
  } catch(e){
    console.warn('[fonts] skipped:', e.message);
    return { preload: null };
  }
}

/**
 * EN: Generate blog post HTML template with all features
 * RU: Генерация HTML шаблона поста блога со всеми фичами
 */
function generateBlogPostHTML({ title, desc, keywords, ogImageMeta, isoDate, dateModified, twitterMeta, articleJson, breadcrumbJson, cssRef, jsRef, localeDate, readingTime, catsHtml, coverFigure, tocHtml, htmlBodyWithFootnotes, site, slug }) {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="ru" data-theme="dark"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><meta name="description" content="${desc.replace(/"/g,'&quot;')}"><meta name="keywords" content="${keywords}"><meta property="og:type" content="article"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${desc.replace(/"/g,'&quot;')}"/>${ogImageMeta}<meta property="og:url" content="${site.replace(/\/$/,'')}/blog/${slug}/"/><meta property="article:published_time" content="${isoDate}"/><meta property="article:modified_time" content="${dateModified || isoDate}"/><meta property="og:updated_time" content="${dateModified || isoDate}"/>${twitterMeta}__CANONICAL__<link rel="alternate" type="application/rss+xml" title="RSS" href="/__RSS__"/><link rel="alternate" type="application/atom+xml" title="Atom" href="/__ATOM__"/><link rel="stylesheet" href="/${cssRef}"/><script defer src="/${jsRef}"></script><style>.reading-progress{position:fixed;top:0;left:0;height:3px;width:100%;background:rgba(255 255 255/.08);z-index:300}.reading-progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--primary),var(--accent));transition:width .15s}.site-header{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(var(--bg-rgb)/.85);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255 255 255/.06)}.header-inner{display:flex;align-items:center;justify-content:space-between;min-height:70px;width:min(1240px,100% - 3rem);margin:0 auto}.brand{font-family:'Playfair Display',serif;font-size:1.35rem;letter-spacing:.5px;color:var(--ink);display:flex;align-items:center;gap:.25rem;text-decoration:none}.brand span{color:var(--primary);font-weight:700}.main-nav ul{list-style:none;padding:0;margin:0;display:flex;gap:1.75rem;align-items:center}.main-nav a{text-decoration:none;color:var(--ink-soft);font-size:.85rem;font-weight:500;transition:color .25s;letter-spacing:.3px}.main-nav a:hover,.main-nav a.cta-link{color:var(--primary)}.nav-toggle{display:none}@media(max-width:900px){.main-nav{position:fixed;top:70px;left:0;right:0;background:var(--surface);border-bottom:1px solid rgba(255 255 255/.08);padding:1.5rem;transform:translateY(-100%);opacity:0;pointer-events:none;transition:transform .3s,opacity .3s}.main-nav.open{transform:translateY(0);opacity:1;pointer-events:auto}.main-nav ul{flex-direction:column;gap:1.25rem;align-items:flex-start}.nav-toggle{display:block;background:none;border:none;width:32px;height:32px;cursor:pointer;position:relative}.nav-toggle span,.nav-toggle span::before,.nav-toggle span::after{display:block;width:24px;height:2px;background:var(--ink-soft);transition:transform .3s,opacity .3s}.nav-toggle span{position:relative}.nav-toggle span::before,.nav-toggle span::after{content:'';position:absolute;left:0}.nav-toggle span::before{top:-7px}.nav-toggle span::after{top:7px}.nav-toggle[aria-expanded="true"] span{background:transparent}.nav-toggle[aria-expanded="true"] span::before{transform:rotate(45deg);top:0}.nav-toggle[aria-expanded="true"] span::after{transform:rotate(-45deg);top:0}}</style><script type="application/ld+json">${articleJson}</script><script type="application/ld+json">${breadcrumbJson}</script></head><body><canvas id="sakura-canvas" aria-hidden="true"></canvas><div class="reading-progress" aria-hidden="true"><span id="readingBar"></span></div><header class="site-header"><div class="header-inner"><a href="/" class="brand">日本語<span>School</span></a><nav class="main-nav" aria-label="Главная навигация"><button class="nav-toggle" aria-expanded="false" aria-controls="navMenu" aria-label="Меню"><span></span></button><ul id="navMenu"><li><a href="/">Главная</a></li><li><a href="/#about">О школе</a></li><li><a href="/#programs">Программы</a></li><li><a href="/blog/">Блог</a></li><li><a href="/#contact" class="cta-link">Запись</a></li></ul></nav><div class="header-actions"><button id="themeToggle" class="theme-toggle" aria-label="Переключить тему"></button></div></div></header><main class="container rich-text" style="padding:7rem 0 4rem;max-width:820px"><nav style="margin-bottom:1.5rem"><a href="/" style="text-decoration:none;font-size:.75rem;letter-spacing:1px;text-transform:uppercase;color:var(--primary)">← Главная</a> <span style="color:var(--ink-dim);margin:0 .5rem">/</span> <a href="/blog/" style="text-decoration:none;font-size:.75rem;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft)">Блог</a></nav><h1 style="margin-top:1rem">${title}</h1><p class="post-meta-line"><time datetime="${isoDate}">${localeDate}</time> · <span class="rt">${readingTime} мин чтения</span></p>${catsHtml}${coverFigure}${tocHtml}<article class="post-content">${htmlBodyWithFootnotes}</article></main><aside class="reading-controls" aria-label="Настройки чтения"><button class="reading-control-btn" data-mode="small" data-tooltip="Мельче" aria-label="Уменьшить размер текста">A-</button><button class="reading-control-btn" data-mode="large" data-tooltip="Крупнее" aria-label="Увеличить размер текста">A+</button><div class="reading-controls-separator"></div><button class="reading-control-btn" data-mode="serif" data-tooltip="Serif" aria-label="Шрифт с засечками">Aa</button><button class="reading-control-btn" data-mode="wide" data-tooltip="Шире" aria-label="Широкая колонка">⇔</button><button class="reading-control-btn" data-mode="focus" data-tooltip="Фокус" aria-label="Режим фокуса">◉</button><button class="reading-control-btn" data-mode="contrast" data-tooltip="Контраст" aria-label="Высокий контраст">◐</button><div class="reading-controls-separator"></div><button class="reading-control-btn print-btn" onclick="window.print()" data-tooltip="Печать" aria-label="Распечатать статью">🖨</button><button class="reading-control-btn share-btn" id="shareBtn" data-tooltip="Поделиться" aria-label="Поделиться статьей">🔗</button><button class="reading-control-btn bookmark-btn" id="bookmarkBtn" data-tooltip="Закладка" aria-label="Добавить в закладки">★</button></aside><div class="reading-time-estimate" id="timeEstimate" data-time="${readingTime}">Осталось: <span class="reading-time-value">~${readingTime} мин</span></div><footer class="site-footer"><div class="footer-grid"><div class="foot-brand"><div class="brand sm">日本語<span>School</span></div><p class="foot-tagline">Японский язык как система мышления.</p></div><nav class="foot-nav" aria-label="Дополнительные ссылки"><ul><li><a href="/#programs">Программы</a></li><li><a href="/#method">Методика</a></li><li><a href="/#contact">Контакты</a></li></ul></nav><div class="foot-meta"><p>© ${currentYear} Школа японского языка. Все права защищены.</p></div></div></footer><script>(function(){const bar=document.getElementById('readingBar');const timeEst=document.getElementById('timeEstimate');const totalTime=parseInt(timeEst?.dataset.time||'5',10);function upd(){const el=document.querySelector('.post-content');if(!el)return;const max=el.offsetHeight - window.innerHeight;const y=window.scrollY-(el.offsetTop-70);const ratio=max>0?Math.min(1,Math.max(0,y/max)):0;if(bar)bar.style.width=(ratio*100).toFixed(2)+'%';if(timeEst){const remaining=Math.ceil(totalTime*(1-ratio));if(remaining>0&&ratio>0.05&&ratio<0.98){timeEst.classList.remove('hidden');timeEst.querySelector('.reading-time-value').textContent='~'+remaining+' мин';}else{timeEst.classList.add('hidden');}}}window.addEventListener('scroll',upd,{passive:true});window.addEventListener('load',()=>{const el=document.querySelector('.post-content');if(el&&el.offsetHeight<window.innerHeight*1.2){if(bar)bar.parentElement.style.display='none';if(timeEst)timeEst.style.display='none';}upd();});})();(function(){const toc=document.querySelector('.post-toc');if(!toc)return;const links=[...toc.querySelectorAll('a[href^="#"]')];const map=new Map();links.forEach(a=>{const id=a.getAttribute('href').slice(1);const h=document.getElementById(id);if(h)map.set(h,a);});if(!map.size)return;let active=null;const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const link=map.get(e.target);if(link){if(active)active.parentElement.classList.remove('active');active=link;link.parentElement.classList.add('active');}}});},{rootMargin:'-55% 0px -40% 0px',threshold:[0,1]});map.forEach((_,h)=>io.observe(h));})();(function(){const btns=document.querySelectorAll('.reading-control-btn[data-mode]');const KEY='readingModes';let modes=new Set();try{const saved=localStorage.getItem(KEY);if(saved)modes=new Set(JSON.parse(saved));}catch{}modes.forEach(m=>document.body.classList.add('reading-mode-'+m));btns.forEach(btn=>{const mode=btn.dataset.mode;if(modes.has(mode))btn.classList.add('active');btn.addEventListener('click',()=>{const isSize=['small','large'].includes(mode);const wasActive=modes.has(mode);if(isSize){['small','large'].forEach(m=>{modes.delete(m);document.body.classList.remove('reading-mode-'+m);const other=document.querySelector('[data-mode="'+m+'"]');if(other)other.classList.remove('active');});}if(wasActive&&isSize){return;}if(wasActive){modes.delete(mode);document.body.classList.remove('reading-mode-'+mode);btn.classList.remove('active');}else{modes.add(mode);document.body.classList.add('reading-mode-'+mode);btn.classList.add('active');}try{localStorage.setItem(KEY,JSON.stringify([...modes]));}catch{}});});const shareBtn=document.getElementById('shareBtn');if(shareBtn){shareBtn.addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:document.title,url:window.location.href});}catch{}}else{try{await navigator.clipboard.writeText(window.location.href);shareBtn.textContent='✓';setTimeout(()=>shareBtn.textContent='🔗',2000);}catch{}}});}const bookmarkBtn=document.getElementById('bookmarkBtn');if(bookmarkBtn){const BOOKMARKS_KEY='blogBookmarks';let bookmarks=[];try{bookmarks=JSON.parse(localStorage.getItem(BOOKMARKS_KEY)||'[]');}catch{}if(bookmarks.includes(window.location.pathname)){bookmarkBtn.classList.add('active');}bookmarkBtn.addEventListener('click',()=>{const path=window.location.pathname;if(bookmarks.includes(path)){bookmarks=bookmarks.filter(b=>b!==path);bookmarkBtn.classList.remove('active');}else{bookmarks.push(path);bookmarkBtn.classList.add('active');}try{localStorage.setItem(BOOKMARKS_KEY,JSON.stringify(bookmarks));}catch{}});}const toggle=document.querySelector('.nav-toggle');const nav=document.querySelector('.main-nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',!expanded);nav.classList.toggle('open');});}})();</script></body></html>`;
}

/**
 * EN: Build blog from Markdown files (parse, generate HTML, RSS/Atom feeds)
 * RU: Сборка блога из Markdown файлов (парсинг, генерация HTML, RSS/Atom лент)
 */
async function buildBlog(site){
  const contentDir = path.join(root,'content','blog');
  let entries = [];
  try {
    entries = await fs.readdir(contentDir);
  } catch{
    return [];
  }
  const outBase = path.join(dist,'blog');
  await ensureDir(outBase);
  const indexItems = [];
  const postsMeta = [];
  const cssRef = await findCurrent('css');
  const jsRef = await findCurrent('js');
  let imageManifest = null;
  try {
    const manifestRaw = await fs.readFile(path.join(dist,'img-manifest.json'),'utf8');
    imageManifest = JSON.parse(manifestRaw);
  } catch {}
  for(const file of entries){
    if(!file.endsWith('.md')) {
      continue;
    }
    const abs = path.join(contentDir,file);
    const raw = await fs.readFile(abs,'utf8');
    const parsed = matter(raw);
    const front = parsed.data || {};
    const body = parsed.content || '';
    const slug = front.slug || slugify(front.title || file.replace(/\.md$/,''));
    const title = front.title || slug;
    const desc = front.description || '';
    const date = front.date || '';
    if(!front.title){
      console.warn('[blog] warning: missing title in', file);
    }
    if(!front.date){
      console.warn('[blog] warning: missing date in', file);
    }
    let isoDate = date;
    try {
      if(date){
        const d = new Date(date); if(!isNaN(d.getTime())) {
          isoDate = d.toISOString();
        }
      }
    } catch{}
    let dateModified = '';
    try {
      const st = await fs.stat(abs); dateModified = st.mtime.toISOString();
    } catch {}
    const keywords = Array.isArray(front.keywords) ? front.keywords.join(',') : (front.keywords || '');
    const htmlBody = marked.parse(body);
    let workingBody = body;
    const footnoteDefRegex = /^\[\^([a-zA-Z0-9_-]+)\]:\s+(.+)$/gm;
    const footnotes = [];
    let mfn;
    while((mfn = footnoteDefRegex.exec(body))){
      footnotes.push({ id: mfn[1], text: mfn[2].trim() });
    }
    if(footnotes.length){
      workingBody = workingBody.replace(footnoteDefRegex, '');
    }
    let refIndex = 1;
    const refOrderMap = {};
    workingBody = workingBody.replace(/\[\^([a-zA-Z0-9_-]+)\]/g, (match, fid) => {
      if(!refOrderMap[fid]) {
        refOrderMap[fid] = refIndex++;
      }
      const n = refOrderMap[fid];
      return `<sup class=\"fn-ref\" id=\"fnref-${fid}\"><a href=\"#fn-${fid}\" aria-label=\"Сноска ${n}\">${n}</a></sup>`;
    });
    let htmlBodyWithFootnotes = marked.parse(workingBody);
    if(footnotes.length){
      const list = footnotes.map(fn => {
        const n = refOrderMap[fn.id];
        if(!n) {
          return '';
        }
        return `<li id=\"fn-${fn.id}\"><p>${fn.text} <a href=\"#fnref-${fn.id}\" class=\"fn-back\" aria-label=\"Назад к тексту\">↩</a></p></li>`;
      }).filter(Boolean).join('');
      if(list){
        htmlBodyWithFootnotes += `<section class=\"footnotes\" aria-label=\"Примечания\"><ol>${list}</ol></section>`;
      }
    }
    const tocItems = [];
    htmlBodyWithFootnotes = htmlBodyWithFootnotes.replace(/<h([23])>([^<]+)<\/h\1>/g, (full, level, text) => {
      const base = text.replace(/<[^>]+>/g,'').trim();
      const hidRaw = base.toLowerCase().replace(/[^a-z0-9а-яё\-\s]+/gi,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
      let hid = hidRaw;
      let dupe = 1;
      while(tocItems.find(i => i.id===hid)) {
        hid = hidRaw + '-' + (++dupe);
      }
      tocItems.push({ level: parseInt(level,10), title: base, id: hid });
      return `<h${level} id=\"${hid}\"><a class=\"h-anchor\" href=\"#${hid}\" aria-hidden=\"true\">#</a>${text}</h${level}>`;
    });
    let tocHtml = '';
    if(tocItems.filter(i => i.level===2 || i.level===3).length >= 3){
      const tocList = tocItems.map(it => `<li class=\"toc-li lvl-${it.level}\"><a href=\"#${it.id}\">${it.title}</a></li>`).join('');
      tocHtml = `<nav class=\"post-toc\" aria-label=\"Оглавление статьи\"><div class=\"toc-title\">Содержание</div><ol class=\"toc-list\">${tocList}</ol></nav>`;
    }
    let readingTime = 1;
    let wordCount = 0;
    try {
      const plain = body
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
      wordCount = plain ? plain.split(/\s+/).length : 0;
      readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
    } catch {}
    let categories = [];
    try {
      const rawCats = front.categories || front.category || [];
      if(Array.isArray(rawCats)) {
        categories = rawCats.filter(Boolean).map(c => String(c).trim()).filter(Boolean);
      } else if(typeof rawCats === 'string') {
        categories = rawCats.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch {}
    const esc = s => String(s).replace(/"/g,'&quot;');
    let coverFigure = '';
    let ogImageMeta = '';
    let coverFileResolved = '';
    if(front.cover){
      const coverFile = front.cover;
      coverFileResolved = coverFile;
      ogImageMeta = `<meta property=\"og:image\" content=\"/${coverFile}\" />`;
      let picture = '';
      let dominantStyle = '';
      try {
        if(imageManifest){
          const baseName = path.basename(coverFile);
          let entry = imageManifest[baseName];
          if(!entry){
            const key = Object.keys(imageManifest).find(k => k.toLowerCase() === baseName.toLowerCase());
            if(key) {
              entry = imageManifest[key];
            }
          }
          if(entry){
            const avif = (entry.avif||[]).map(src => `${src} ${src.match(/-w(\d+)\./)?RegExp.$1+'w':''}`).join(', ');
            const webp = (entry.webp||[]).map(src => `${src} ${src.match(/-w(\d+)\./)?RegExp.$1+'w':''}`).join(', ');
            const jpg = (entry.jpg||[]).map(src => `${src} ${src.match(/-w(\d+)\./)?RegExp.$1+'w':''}`).join(', ');
            picture = `<picture>`+
            (avif?`<source type=\"image/avif\" srcset=\"${avif}\" sizes=\"(max-width: 860px) 100vw, 820px\">`:'')+
            (webp?`<source type=\"image/webp\" srcset=\"${webp}\" sizes=\"(max-width: 860px) 100vw, 820px\">`:'')+
            `<img src=\"../${coverFile}\" alt=\"${title}\" loading=\"lazy\" decoding=\"async\" style=\"width:100%;height:auto\"/>`+
          `</picture>`;
            if(entry.placeholder){
            }
            if(entry.dominant){
              const { r,g,b } = entry.dominant;
              const lighten = (c, amt) => Math.min(255, Math.round(c + (255-c)*amt));
              const darken = (c, amt) => Math.max(0, Math.round(c*(1-amt)));
              const light = `rgb(${lighten(r,.4)} ${lighten(g,.4)} ${lighten(b,.4)})`;
              const dark = `rgb(${darken(r,.35)} ${darken(g,.35)} ${darken(b,.35)})`;
              dominantStyle = `--cover-accent-from:${light};--cover-accent-to:${dark};`;
            }
          }
        }
      } catch{}
      if(!picture){
        picture = `<img src=\"../${coverFile}\" alt=\"${title}\" loading=\"lazy\" decoding=\"async\" style=\"width:100%;height:auto\"/>`;
      }
      coverFigure = `<figure class=\"post-cover\" style=\"${dominantStyle}\">${picture}</figure>`;
    }
    indexItems.push({ title, slug, date: isoDate, description: desc });
    let placeholder = '';
    try {
      if(coverFileResolved && imageManifest){
        const baseName2 = path.basename(coverFileResolved);
        let entry2 = imageManifest[baseName2];
        if(!entry2){
          const key2 = Object.keys(imageManifest).find(k => k.toLowerCase() === baseName2.toLowerCase());
          if(key2) {
            entry2 = imageManifest[key2];
          }
        }
        if(entry2 && entry2.placeholder){
          placeholder = entry2.placeholder;
        }
      }
    } catch{}
    let accent = null;
    try {
      if(coverFileResolved && imageManifest){
        const base = path.basename(coverFileResolved);
        let entry = imageManifest[base];
        if(!entry){
          const key = Object.keys(imageManifest).find(k => k.toLowerCase() === base.toLowerCase());
          if(key) {
            entry = imageManifest[key];
          }
        }
        if(entry && entry.dominant){
          accent = `rgb(${entry.dominant.r} ${entry.dominant.g} ${entry.dominant.b})`;
        }
      }
    } catch{}
    postsMeta.push({ title, slug, description: desc, date: isoDate, modified: dateModified || isoDate, cover: coverFileResolved, keywords, readingTime, wordCount, categories, placeholder, accent });
    let jsonLdImage = null;
    if(coverFileResolved && imageManifest){
      const baseName = path.basename(coverFileResolved);
      let entry = imageManifest[baseName];
      if(!entry){
        const key = Object.keys(imageManifest).find(k => k.toLowerCase() === baseName.toLowerCase());
        if(key) {
          entry = imageManifest[key];
        }
      }
      if(entry && entry.jpg && entry.jpg.length){
        jsonLdImage = site.replace(/\/$/,'') + '/' + entry.jpg[entry.jpg.length-1];
      }
    }
    if(!jsonLdImage){
      if(coverFileResolved){
        jsonLdImage = site.replace(/\/$/,'') + '/' + coverFileResolved;
      } else {
        jsonLdImage = site.replace(/\/$/,'') + '/og-image.png';
      }
    }
    const articleJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      datePublished: isoDate,
      dateModified: dateModified || isoDate,
      description: desc,
      image: jsonLdImage,
      mainEntityOfPage: site.replace(/\/$/,'')+`/blog/${slug}/`,
      author: { '@type': 'Organization', name: 'Школа японского языка' },
      articleSection: categories[0] || undefined,
      keywords: keywords,
      wordCount: wordCount,
      timeRequired: `PT${readingTime}M`,
      about: categories.map(c => ({ '@type': 'Thing', name: c }))
    });
    const twitterMeta = desc ? `<meta name=\"twitter:card\" content=\"summary_large_image\"/><meta name=\"twitter:title\" content=\"${title}\"/><meta name=\"twitter:description\" content=\"${desc.replace(/\"/g,'&quot;')}\"/>` : '';
    const catsHtml = categories.length ? `<div class=\"post-cats\">${categories.map(c => `<span class=\"cat-pill\">${esc(c)}</span>`).join('')}</div>` : '';
    const localeDate = (() => {
      try {
        return new Date(isoDate).toLocaleDateString('ru-RU',{ day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
      } catch {
        return isoDate.split('T')[0];
      }
    })();
    const breadcrumbJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: site + '/' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: site + '/blog/' },
        { '@type': 'ListItem', position: 3, name: title, item: site + `/blog/${slug}/` }
      ]
    });
    const page = generateBlogPostHTML({
      title,
      desc,
      keywords,
      ogImageMeta,
      isoDate,
      dateModified,
      twitterMeta,
      articleJson,
      breadcrumbJson,
      cssRef,
      jsRef,
      localeDate,
      readingTime,
      catsHtml,
      coverFigure,
      tocHtml,
      htmlBodyWithFootnotes,
      site,
      slug
    });
    const outDir = path.join(outBase, slug);
    await ensureDir(outDir);
    await fs.writeFile(path.join(outDir,'index.html'), page, 'utf8');
  }
  if(indexItems.length){
    const rtMap = Object.fromEntries(postsMeta.map(p => [p.slug, p.readingTime]));
    const formatted = indexItems.sort((a,b) => (a.date < b.date ? 1 : -1)).map(it => {
      const minutes = rtMap[it.slug] || 1;
      const dateShort = (() => {
        try {
          return new Date(it.date).toLocaleDateString('ru-RU',{ day: '2-digit', month: 'short' }).replace('.', '');
        } catch {
          return '';
        }
      })();
      return `<li class=\"blog-list-item\"><a href=\"${it.slug}/\" class=\"blog-list-link\"><span class=\"b-meta\"><time datetime=\"${it.date}\">${dateShort}</time> · ${minutes} мин</span><span class=\"b-title\">${it.title}</span></a><p class=\"b-desc\">${it.description}</p></li>`;
    }).join('\n');
    const idx = `<!DOCTYPE html><html lang=\"ru\" data-theme=\"dark\"><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>Блог — Школа японского языка</title><meta name=\"description\" content=\"Статьи о японском языке, культуре и методиках обучения\"><meta property=\"og:url\" content=\"${site.replace(/\/$/,'')}/blog/\">__CANONICAL__<link rel=\"alternate\" type=\"application/rss+xml\" title=\"RSS\" href=\"/__RSS__\"/><link rel=\"alternate\" type=\"application/atom+xml\" title=\"Atom\" href=\"/__ATOM__\"/><link rel=\"stylesheet\" href=\"/${cssRef}\"/><script defer src=\"/${jsRef}\"></script><style>.blog-list-item{background:linear-gradient(150deg,var(--surface),var(--surface-alt));border:1px solid rgba(255 255 255 / .06);padding:1.15rem 1.25rem 1.25rem;border-radius:var(--radius-lg);box-shadow:var(--shadow);transition:transform .6s cubic-bezier(.19,1,.22,1),box-shadow .5s,border-color .5s}.blog-list-item:hover{transform:translateY(-6px) scale(1.01);box-shadow:var(--shadow-lg);border-color:rgba(var(--primary-rgb)/0.35)}.blog-list-link{text-decoration:none;display:block;color:inherit}.blog-list-item .b-meta{display:flex;gap:.45rem;font-size:.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-dim);margin-bottom:.4rem}.blog-list-item .b-title{display:block;font-weight:600;font-family:var(--font-display);font-size:1.05rem;background:linear-gradient(90deg,var(--ink),var(--primary));-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.25}.blog-list-item .b-desc{margin:.55rem 0 0;font-size:.8rem;line-height:1.45;color:var(--ink-dim);} [data-theme=\"light\"] .blog-list-item{border:1px solid rgba(0 0 0 / .08);box-shadow:var(--shadow);} [data-theme=\"light\"] .blog-list-item .b-title{background:linear-gradient(90deg,var(--ink),var(--primary));-webkit-background-clip:text;background-clip:text;color:transparent}.site-header{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(var(--bg-rgb)/.85);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255 255 255/.06)}.header-inner{display:flex;align-items:center;justify-content:space-between;min-height:70px;width:min(1240px,100% - 3rem);margin:0 auto}.brand{font-family:'Playfair Display',serif;font-size:1.35rem;letter-spacing:.5px;color:var(--ink);display:flex;align-items:center;gap:.25rem;text-decoration:none}.brand span{color:var(--primary);font-weight:700}.site-footer{background:var(--surface);border-top:1px solid rgba(255 255 255/.08);padding:3rem 0 2rem}.footer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2.5rem;width:min(1240px,100% - 3rem);margin:0 auto}.foot-brand .brand.sm{font-size:1.15rem}.foot-tagline{margin-top:.5rem;font-size:.8rem;color:var(--ink-dim)}.foot-nav ul{list-style:none;padding:0;margin:0;display:grid;gap:.6rem}.foot-nav a{text-decoration:none;color:var(--ink-soft);font-size:.85rem;transition:color .25s}.foot-nav a:hover{color:var(--primary)}.foot-meta{font-size:.75rem;color:var(--ink-dim)}</style></head><body><header class=\"site-header\"><div class=\"header-inner\"><a href=\"/\" class=\"brand\">日本語<span>School</span></a><div class=\"header-actions\"><button id=\"themeToggle\" class=\"theme-toggle\" aria-label=\"Переключить тему\"></button></div></div></header><main class=\"container\" style=\"padding:7rem 0 4rem;max-width:860px\"><nav style=\"margin-bottom:1.5rem\"><a href=\"/\" style=\"text-decoration:none;font-size:.75rem;letter-spacing:1px;text-transform:uppercase;color:var(--primary)\">← Главная</a></nav><h1 style=\"margin-bottom:2.5rem\">Блог</h1><ul style=\"list-style:none;padding:0;display:grid;gap:1.75rem\">${formatted}</ul></main><footer class=\"site-footer\"><div class=\"footer-grid\"><div class=\"foot-brand\"><div class=\"brand sm\">日本語<span>School</span></div><p class=\"foot-tagline\">Японский язык как система мышления.</p></div><nav class=\"foot-nav\" aria-label=\"Дополнительные ссылки\"><ul><li><a href=\"/#programs\">Программы</a></li><li><a href=\"/#method\">Методика</a></li><li><a href=\"/#contact\">Контакты</a></li></ul></nav><div class=\"foot-meta\"><p>© ${new Date().getFullYear()} Школа японского языка. Все права защищены.</p></div></div></footer></body></html>`;
    await fs.writeFile(path.join(outBase,'index.html'), idx, 'utf8');
  }
  return postsMeta;
}

/**
 * EN: Copy static files to dist (manifest, favicon, offline page, service worker, images)
 * RU: Копирование статических файлов в dist (manifest, favicon, offline страница, service worker, изображения)
 */
async function copyStatic(extras){
  /* EN: Copy static files from public/ folder
     RU: Копирование статических файлов из папки public/ */
  const staticFiles = ['manifest.json','favicon.svg','offline.html','service-worker.js'];
  for(const f of staticFiles){
    try {
      await fs.copyFile(path.join(root,'public',f), path.join(dist,f));
    } catch {}
  }
  /* EN: Copy images from src/assets/images/ folder
     RU: Копирование изображений из папки src/assets/images/ */
  const imagesDir = path.join(root,'src','assets','images');
  try {
    const files = await fs.readdir(imagesDir);
    const imgExt = /\.(?:jpe?g|png|webp|avif|gif|svg)$/i;
    for(const f of files){
      if(imgExt.test(f) && !f.startsWith('favicon')){
        await fs.copyFile(path.join(imagesDir,f), path.join(dist,f));
      }
    }
  } catch(e){
    console.warn('[copy] images dir not found:', e.message);
  }
}

/**
 * EN: Generate responsive images (AVIF/WebP/JPG) with placeholders and dominant colors
 * RU: Генерация адаптивных изображений (AVIF/WebP/JPG) с плейсхолдерами и доминантными цветами
 */
async function processImages(){
  const sizes = [320,480,640,800,1024];
  const outDir = path.join(dist,'img');
  await ensureDir(outDir);
  let sharpLib = null;
  try {
    sharpLib = (await import('sharp')).default;
  } catch(err){
    console.warn('[images] sharp not available, skipping responsive generation');
    return null;
  }
  /* EN: Process images from src/assets/images/
     RU: Обработка изображений из src/assets/images/ */
  const imagesDir = path.join(root,'src','assets','images');
  let files = [];
  try {
    files = await fs.readdir(imagesDir);
  } catch(e){
    console.warn('[images] source directory not found:', imagesDir);
    return null;
  }
  const targetExt = /\.(?:jpe?g)$/i;
  const manifest = {};
  for(const file of files){
    if(!targetExt.test(file)) {
      continue;
    }
    const base = file.replace(/\.(jpe?g)$/i,'');
    const srcPath = path.join(imagesDir,file);
    manifest[file] = { jpg: [], webp: [], avif: [], placeholder: null, dominant: null };
    for(const w of sizes){
      try {
        const img = sharpLib(srcPath).rotate();
        const meta = await img.metadata();
        if(meta.width && meta.width < w){
          continue;
        }
        const jpgName = `${base}-w${w}.jpg`;
        const webpName = `${base}-w${w}.webp`;
        const avifName = `${base}-w${w}.avif`;
        await Promise.all([
          sharpLib(srcPath).resize({ width: w }).jpeg({ quality: 74, mozjpeg: true }).toFile(path.join(outDir, jpgName)),
          sharpLib(srcPath).resize({ width: w }).webp({ quality: 70 }).toFile(path.join(outDir, webpName)),
          sharpLib(srcPath).resize({ width: w }).avif({ quality: 45 }).toFile(path.join(outDir, avifName))
        ]);
        manifest[file].jpg.push('img/'+jpgName);
        manifest[file].webp.push('img/'+webpName);
        manifest[file].avif.push('img/'+avifName);
      } catch(e){
        console.warn('[images] failed size', file, w, e.message);
      }
    }
    try {
      const pipeline = sharpLib(srcPath).rotate();
      const tiny = await pipeline.clone().resize({ width: 28 }).blur().jpeg({ quality: 38 }).toBuffer();
      manifest[file].placeholder = 'data:image/jpeg;base64,' + tiny.toString('base64');
      try {
        const stats = await pipeline.clone().stats();
        const r = Math.round(stats.channels[0].mean);
        const g = Math.round(stats.channels[1].mean);
        const b = Math.round(stats.channels[2].mean);
        manifest[file].dominant = { r, g, b };
      } catch(eStats){ }
    } catch(e){
      console.warn('[images] placeholder/stat fail', file, e.message);
    }
  }
  await fs.writeFile(path.join(dist,'img-manifest.json'), JSON.stringify(manifest,null,2), 'utf8');
  console.log('[images] generated responsive variants');
  return manifest;
}

/**
 * EN: Convert string to URL-friendly slug
 * RU: Конвертация строки в URL-friendly slug
 */
function slugify(str){
  return str.toLowerCase().replace(/[^a-z0-9а-яё\-\s]+/gi,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

/**
 * EN: Find current hashed CSS or JS file in dist
 * RU: Найти текущий хешированный CSS или JS файл в dist
 */
async function findCurrent(type){
  const files = await fs.readdir(dist);
  if(type === 'css') {
    return files.find(f => /^styles\.[a-f0-9]+\.css$/.test(f));
  }
  if(type === 'js') {
    return files.find(f => /^main\.[a-f0-9]+\.js$/.test(f));
  }
  return '';
}

/**
 * EN: Patch index.html with hashed asset names and optimize loading
 * RU: Обновление index.html с хешированными именами ресурсов и оптимизация загрузки
 */
function patchIndex(html, cssName, jsName, fontPreload){
  html = html.replace(/href="styles\.css"/g, `href="${cssName}"`);
  html = html.replace(/src="main\.js"/g, `src="${jsName}"`);
  html = html.replace(/\n?\s*<link[^>]+fonts\.googleapis[^>]+>\n?/g,'');
  const inject = fontPreload ? [
    `<link rel="preload" href="fonts/${fontPreload}" as="font" type="font/woff2" crossorigin>`,
    '<link rel="stylesheet" href="fonts.css" />'
  ].join('\n    ') : '';
  if(inject){
    html = html.replace('<link rel="preload" as="image"', inject + '\n  <link rel="preload" as="image"');
  }
  if(!/rel="preload"[^>]+as="style"/.test(html)){
    const critical = `/* critical:start */\n.site-header{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);background:linear-gradient(to bottom,rgba(15 17 21/.82),rgba(15 17 21/.55));border-bottom:1px solid rgba(255 255 255/.06);}body{background:var(--bg);color:var(--ink-soft);margin:0;font-family:var(--font-sans);}h1{font-family:var(--font-display);}/* critical:end */`;
    html = html.replace(/<head>/,'<head>\n<link rel="preload" as="style" href="'+cssName+'"/>\n<style data-critical>'+critical+'</style>');
  }
  return html;
}

/**
 * EN: Minify HTML (remove extra whitespace and newlines)
 * RU: Минификация HTML (удаление лишних пробелов и переносов строк)
 */
function minifyHtml(html){
  try {
    return html
      .replace(/>\s+</g,'><')
      .replace(/\s{2,}/g,' ')
      .trim();
  } catch {
    return html;
  }
}

/**
 * EN: Update service worker with new asset names and bump version
 * RU: Обновление service worker с новыми именами ресурсов и повышение версии
 */
async function updateServiceWorker(cssName, jsName){
  const swPath = path.join(dist,'service-worker.js');
  let sw = await fs.readFile(swPath,'utf8');
  const ts = Date.now().toString(36);
  sw = sw.replace(/const VERSION = 'v\d+';/, `const VERSION = 'v'+ '${ts}';`);
  sw = sw.replace(/(['"])\/styles\.css\1/, `'/${cssName}'`);
  sw = sw.replace(/(['"])\/main\.js\1/, `'/${jsName}'`);
  if(!/\/fonts\.css/.test(sw)){
    sw = sw.replace(/(const CORE_ASSETS = \[)/, `$1\n  '/fonts.css',`);
  }
  await fs.writeFile(swPath, sw, 'utf8');
}

/**
 * EN: Main build orchestration function (CSS, JS, fonts, blog, images, sitemap, feeds)
 * RU: Главная функция оркестрации сборки (CSS, JS, шрифты, блог, изображения, sitemap, ленты)
 */
async function build(){
  await ensureDir(dist);
  let siteConfig = { siteUrl: 'https://example.com', siteName: 'Школа японского языка' };
  try {
    const cfgRaw = await fs.readFile(path.join(root,'site.config.json'),'utf8');
    const parsed = JSON.parse(cfgRaw);
    siteConfig = { ...siteConfig, ...parsed };
  } catch(e){ }
  const argSite = process.argv.find(a => a.startsWith('--siteUrl='));
  if(process.env.SITE_URL){
    siteConfig.siteUrl = process.env.SITE_URL;
  }
  if(argSite){
    siteConfig.siteUrl = argSite.split('=')[1];
  }
  siteConfig.siteUrl = siteConfig.siteUrl.replace(/\/$/,'');
  const [cssName, jsName] = await Promise.all([buildCSS(), buildJS()]);
  const fontMeta = await buildFonts();
  await copyStatic([cssName, jsName]);
  await processImages().catch(e => console.warn('[images] pipeline error', e.message));
  const site = siteConfig.siteUrl.replace(/\/?$/,'');
  const postsMeta = await buildBlog(site).catch(e => {
    console.warn('[blog] build error', e.message); return [];
  });
  const indexRaw = await fs.readFile(path.join(root,'public','index.html'),'utf8');
  const patched = patchIndex(indexRaw, cssName, jsName, fontMeta.preload);
  await fs.writeFile(path.join(dist,'index.html'), patched, 'utf8');
  try {
    let idxHtml = await fs.readFile(path.join(dist,'index.html'),'utf8');
    const canon = `<link rel="canonical" href="${site}/"/>`;
    const ogUrl = `<meta property="og:url" content="${site}/"/>`;
    if(!/rel="canonical"/.test(idxHtml)){
      idxHtml = idxHtml.replace(/<head>/,'<head>'+canon+ogUrl+`<link rel="alternate" type="application/rss+xml" title="RSS" href="${site}/rss.xml"/><link rel="alternate" type="application/atom+xml" title="Atom" href="${site}/atom.xml"/>`);
    } else {
      if(!/property="og:url"/.test(idxHtml)){
        idxHtml = idxHtml.replace(/<head>/,'<head>'+ogUrl);
      }
    }
    if(postsMeta.length && !/id="latest-posts"/.test(idxHtml)){
      const sorted = [...postsMeta].sort((a,b) => (a.date < b.date ? 1 : -1));
      const now = Date.now();
      const isNew = d => {
        try {
          return (now - new Date(d).getTime()) / 86400000 < 14;
        } catch {
          return false;
        }
      };
      const formatDate = d => {
        try {
          return new Date(d).toLocaleDateString('ru-RU',{ day: '2-digit', month: 'short' }).replace('.', '');
        } catch {
          return '';
        }
      };
      const allCats = Array.from(new Set(sorted.flatMap(p => (p.categories||[])))).slice(0,12);
      const catsToolbar = allCats.length ? `<div class="posts-cats" role="toolbar" aria-label="Фильтр по категориям">${['<button type=\"button\" class=\"cat-filter active\" data-cat=\"__all\" aria-pressed=\"true\">Все</button>', ...allCats.map(c => `<button type=\"button\" class=\"cat-filter\" data-cat=\"${c.replace(/"/g,'&quot;')}\" aria-pressed=\"false\">${c}</button>`)].join('')}</div>` : '';
      const cards = sorted.map((p,i) => {
        const cover = p.cover ? (p.cover.startsWith('http')?p.cover:`${site}/${p.cover.replace(/^\//,'')}`) : `${site}/og-image.png`;
        const relCover = cover.replace(site+'/', '');
        const badge = isNew(p.date) ? '<span class="post-card-badge">NEW</span>' : '';
        const cats = (p.categories||[]).map(c => `<span class=\"post-card-cat\">${c}</span>`).join('');
        const plc = p.placeholder ? p.placeholder : relCover;
        const accentStyle = p.accent ? ` style=\"--card-accent:${p.accent};\"` : '';
        return `<article class=\"post-card fx-fade-up\" data-index=\"${i}\" data-delay=\"${Math.min((i+1)*70,420)}\" data-title=\"${p.title.replace(/"/g,'&quot;')}\" data-keywords=\"${(p.keywords||'').replace(/"/g,'&quot;')}\" data-desc=\"${(p.description||'').replace(/"/g,'&quot;')}\" data-cats=\"${(p.categories||[]).map(c => c.replace(/"/g,'&quot;')).join(',')}\">\n  ${badge}<a class=\"post-card-link\"${accentStyle} href=\"${site}/blog/${p.slug}/\">\n    <div class=\"post-card-media\" data-bg=\"${relCover}\" data-plc=\"${plc}\" data-state=\"loading\" style=\"background-image:url('${plc}');\"></div>\n    <div class=\"post-card-content\">\n      <div class=\"post-card-meta\"><time datetime=\"${p.date}\" class=\"post-card-date\">${formatDate(p.date)}</time><span class=\"sep\">·</span><span class=\"read-time\">${p.readingTime}&nbsp;мин</span></div>\n      <h3 class=\"post-card-title\">${p.title}</h3>\n      <p class=\"post-card-desc\">${(p.description||'').slice(0,140)}</p>\n      ${cats?`<div class=\\"post-card-cats\\">${cats}</div>`:''}\n      <button type=\"button\" class=\"share-btn\" data-share=\"${site}/blog/${p.slug}/\" aria-label=\"Скопировать ссылку на статью\" title=\"Скопировать ссылку\">⤴</button>\n    </div>\n  </a>\n</article>`;
      }).join('\n');
      const snippet = `\n<section id="latest-posts" class="section latest-posts" aria-labelledby="latestPostsTitle"><div class="container"><div class="section-head fx-fade-up"><h2 id="latestPostsTitle">Последние статьи</h2><p>Новые материалы из блога: методика, JLPT, практика.</p></div><div class="posts-toolbar fx-fade-up" data-delay="40"><div class="search-bar"><input id="postSearch" type="search" placeholder="Поиск по статьям..." aria-label="Поиск по статьям" /><button type="button" id="postSearchReset" class="search-reset" aria-label="Сбросить поиск" hidden>&times;</button><span id="postResultsCount" class="results-count" aria-live="polite"></span></div>${catsToolbar}</div><div class="post-cards">${cards}</div><div class="view-all-link fx-fade-up" data-delay="300"><a href="${site}/blog/" class="view-all-anchor">Смотреть все статьи →</a></div><div class="feed-callout fx-fade-up" data-delay="360"><div class="feed-callout-inner"><p class="feed-text">Подпишитесь: <a href="${site}/rss.xml">RSS</a> · <a href="${site}/atom.xml">Atom</a></p></div></div></div></section>\n`;
      const galleryRegex = /(<section id="gallery"[\s\S]*?<\/section>)/;
      if(galleryRegex.test(idxHtml)){
        idxHtml = idxHtml.replace(galleryRegex, `$1${snippet}`);
      } else {
        idxHtml = idxHtml.replace(/<footer[\s\S]*?/, snippet + '$&');
      }
    }
    await fs.writeFile(path.join(dist,'index.html'), idxHtml, 'utf8');
  } catch{}
  try {
    const nowIso = new Date().toISOString();
    const latest = postsMeta.map(p => p.modified || p.date).sort().slice(-1)[0] || nowIso;
    const urls = [{ loc: `${site}/`, lastmod: latest }];
    if(postsMeta.length){
      urls.push({ loc: `${site}/blog/`, lastmod: latest });
      for(const p of postsMeta){
        urls.push({ loc: `${site}/blog/${p.slug}/`, lastmod: p.modified || p.date });
      }
    }
    function metaFor(loc){
      if(loc === `${site}/`) {
        return { changefreq: 'weekly', priority: '1.0' };
      }
      if(loc === `${site}/blog/`) {
        return { changefreq: 'daily', priority: '0.9' };
      }
      return { changefreq: 'monthly', priority: '0.7' };
    }
    const sitemap = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${urls.map(u => {
      const m=metaFor(u.loc); return `<url><loc>${u.loc}</loc>${u.lastmod?`<lastmod>${u.lastmod}</lastmod>`:''}<changefreq>${m.changefreq}</changefreq><priority>${m.priority}</priority></url>`;
    }).join('\n')}\n</urlset>`;
    await fs.writeFile(path.join(dist,'sitemap.xml'), sitemap, 'utf8');
    console.log('[sitemap] sitemap.xml generated');
    const robots = `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`;
    await fs.writeFile(path.join(dist,'robots.txt'), robots, 'utf8');
    console.log('[robots] robots.txt generated');
  } catch(e){
    console.warn('[sitemap] generation error', e.message);
  }
  try {
    if(postsMeta.length){
      const updated = postsMeta.map(p => p.modified || p.date).sort().slice(-1)[0] || new Date().toISOString();
      const rssItems = postsMeta.map(p => {
        const cats = (p.categories||[]).map(c => `<category><![CDATA[${c}]]></category>`).join('');
        return `<item><title><![CDATA[${p.title}]]></title><link>${site}/blog/${p.slug}/</link><guid>${site}/blog/${p.slug}/</guid><pubDate>${new Date(p.date || p.modified || Date.now()).toUTCString()}</pubDate><description><![CDATA[${p.description}]]></description>${cats}</item>`;
      }).join('\n');
      const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Блог — ${siteConfig.siteName}</title><link>${site}/blog/</link><description>Статьи ${siteConfig.siteName}</description><lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>${rssItems}</channel></rss>`;
      await fs.writeFile(path.join(dist,'rss.xml'), rss, 'utf8');
      const atomEntries = postsMeta.map(p => {
        const cats = (p.categories||[]).map(c => `<category term="${c.replace(/"/g,'&quot;')}"/>`).join('');
        return `<entry><id>${site}/blog/${p.slug}/</id><title><![CDATA[${p.title}]]></title><link href="${site}/blog/${p.slug}/"/><updated>${(p.modified || p.date)}</updated><published>${p.date}</published>${cats}<summary type="html"><![CDATA[${p.description}]]></summary></entry>`;
      }).join('\n');
      const atom = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${site}/blog/</id><title>Блог — ${siteConfig.siteName}</title><updated>${updated}</updated><link href="${site}/atom.xml" rel="self"/><link href="${site}/blog/"/>${atomEntries}</feed>`;
      await fs.writeFile(path.join(dist,'atom.xml'), atom, 'utf8');
      console.log('[feed] rss.xml & atom.xml generated');
    }
  } catch(e){
    console.warn('[feed] generation error', e.message);
  }
  await updateServiceWorker(cssName, jsName);
  try {
    const blogIndexPath = path.join(dist,'blog','index.html');
    let blogIdx = await fs.readFile(blogIndexPath,'utf8');
    blogIdx = blogIdx.replace('__CANONICAL__', `<link rel="canonical" href="${site}/blog/"/>`)
      .replace('/__RSS__', `${site}/rss.xml`).replace('/__ATOM__', `${site}/atom.xml`);
    await fs.writeFile(blogIndexPath, blogIdx, 'utf8');
    for(const p of postsMeta){
      const postPath = path.join(dist,'blog', p.slug, 'index.html');
      try {
        let html = await fs.readFile(postPath,'utf8');
        html = html.replace('__CANONICAL__', `<link rel="canonical" href="${site}/blog/${p.slug}/"/>`)
          .replace('/__RSS__', `${site}/rss.xml`).replace('/__ATOM__', `${site}/atom.xml`);
        await fs.writeFile(postPath, html, 'utf8');
      } catch {}
    }
  } catch(e){
    console.warn('[canonical] injection error', e.message);
  }
  try {
    await generateOgImage();
  } catch(e){
    console.warn('[og] generation skipped:', e.message);
  }
  console.log('[build] done:', cssName, jsName);
}

/**
 * EN: Entry point - clean dist, run build, optional watch mode
 * RU: Точка входа - очистка dist, запуск сборки, опциональный режим отслеживания
 */
async function main(){
  if(isClean){
    await rimraf(dist); console.log('dist cleaned'); return;
  }
  await rimraf(dist);
  await build();
  if(isWatch){
    console.log('[watch] watching for changes...');
    import('chokidar').then(({ default: chokidar }) => {
      chokidar.watch(['public/index.html','src/styles.css','src/scripts/main.js','public/service-worker.js','public/offline.html','public/manifest.json'], { ignoreInitial: true, cwd: root })
        .on('all', async () => {
          try {
            await build();
          } catch(e){
            console.error(e);
          }
        });
    });
  }
}

main().catch(e => {
  console.error(e); process.exit(1);
});
