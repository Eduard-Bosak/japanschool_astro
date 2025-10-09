/* =============================================
   Enhanced Service Worker with runtime strategies
   Улучшенный Service Worker с runtime стратегиями
   ============================================= */

/* EN: Cache version and names | RU: Версия кеша и имена */
const VERSION = 'v2';
const STATIC_CACHE = `japanschool-static-${VERSION}`;
const RUNTIME_IMG_CACHE = `japanschool-img-${VERSION}`;

/* EN: Core assets to cache on install | RU: Основные ресурсы для кеширования при установке */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  '/favicon.svg'
];

/* EN: Install event - cache core assets | RU: Событие установки - кеширование основных ресурсов */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(()=> self.skipWaiting())
  );
});

/* EN: Activate event - clean old caches | RU: Событие активации - очистка старых кешей */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![STATIC_CACHE, RUNTIME_IMG_CACHE].includes(k))
          .map(k => caches.delete(k))
    )).then(()=> self.clients.claim())
  );
});

/* EN: Fetch event - handle requests with caching strategies | RU: Событие fetch - обработка запросов со стратегиями кеширования */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  
  /* EN: HTML navigations: network-first | RU: HTML навигация: сначала сеть */
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put('/', copy));
        return res;
      }).catch(()=> caches.match('/offline.html') || caches.match('/index.html'))
    );
    return;
  }

  const url = new URL(req.url);
  const isImage = /\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname);

  /* EN: Images: stale-while-revalidate strategy | RU: Изображения: stale-while-revalidate стратегия */
  if(isImage){
    e.respondWith(
      caches.open(RUNTIME_IMG_CACHE).then(cache => cache.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkRes => {
          cache.put(req, networkRes.clone());
          return networkRes;
        }).catch(()=> cached);
        return cached || fetchPromise;
      }))
    );
    return;
  }

  /* EN: Default: cache-first then network | RU: По умолчанию: сначала кеш, затем сеть */
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if(res.ok){
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, clone));
      }
      return res;
    }).catch(()=> cached))
  );
});
