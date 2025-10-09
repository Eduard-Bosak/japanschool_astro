/* Main Interaction & Animation Script */
(function () {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    root.setAttribute('data-theme', storedTheme);
  } else if (prefersDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }

  /* =====================================
     Analytics Layer (Step 6)
     Lightweight queue that can later be consumed by real analytics.
     Usage: track('event_name', {optional:data})
  ===================================== */
  window.analyticsQueue = window.analyticsQueue || [];
  function track(evt, data = {}) {
    const payload = { evt, ts: Date.now(), ...data };
    window.analyticsQueue.push(payload);
    // dev visibility (remove in production or controlled via flag)
    const isDev = !window.__PRODUCTION_BUILD;
    if (isDev && !window.__NO_ANALYTICS_LOG) {
      // eslint-disable-next-line no-console
      console.log(
        '%cANALYTICS',
        'background:#ff4f8b;color:#fff;padding:2px 6px;border-radius:4px',
        payload
      );
    }
    window.dispatchEvent(new CustomEvent('analytics', { detail: payload }));
  }

  const API_ENDPOINTS = window.__API_ENDPOINTS || {
    lead: '/api/lead',
    program: '/api/program-interest'
  };
  const API_TIMEOUT = 6500;
  const LOCAL_QUEUE_KEY = 'japanschool.pendingForms';

  function queuePending(type, payload) {
    try {
      const current = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]');
      current.push({ type, payload, ts: Date.now() });
      if (current.length > 20) current.shift();
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(current));
    } catch (_) {}
  }

  function simulateNetwork(delay = 900) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async function sendToBackend(type, payload) {
    const endpoint = API_ENDPOINTS?.[type];
    const enriched = {
      ...payload,
      page: window.location.pathname,
      utm: window.location.search,
      timestamp: new Date().toISOString()
    };
    const body = JSON.stringify(enriched);
    if (!endpoint) {
      queuePending(type, enriched);
      await simulateNetwork();
      return { ok: false, mock: true, error: 'endpoint_missing' };
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
        credentials: 'omit'
      });
      const isJSON = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJSON ? await res.json().catch(() => null) : null;
      if (res.ok) {
        return { ok: true, data, status: res.status };
      }
      throw new Error(`status_${res.status}`);
    } catch (err) {
      queuePending(type, enriched);
      return { ok: false, mock: true, error: err?.message || 'network_error' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Theme toggle (cycle through presets)
  const themeBtn = document.getElementById('themeToggle');
  const themeOrder = ['dark', 'light', 'spring', 'autumn', 'winter', 'sakura'];
  function cycleTheme() {
    const current = root.getAttribute('data-theme') || 'dark';
    let idx = themeOrder.indexOf(current);
    if (idx === -1) idx = 0;
    const next = themeOrder[(idx + 1) % themeOrder.length];
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    track('theme_toggle', { to: next, mode: 'cycle' });
  }
  themeBtn?.addEventListener('click', cycleTheme);
  // Add animation burst on theme toggle + overlay transition
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 950);
      themeBtn.classList.remove('animating');
      void themeBtn.offsetWidth; // force reflow
      themeBtn.classList.add('animating');
      const live =
        document.getElementById('themeStatus') ||
        (() => {
          const s = document.createElement('span');
          s.id = 'themeStatus';
          s.className = 'visually-hidden';
          s.setAttribute('aria-live', 'polite');
          document.body.appendChild(s);
          return s;
        })();
      live.textContent = 'Тема: ' + (root.getAttribute('data-theme') || 'dark');
    });
    themeBtn.addEventListener('animationend', () => themeBtn.classList.remove('animating'));
  }

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('navMenu');
  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu?.setAttribute('data-open', String(!expanded));
    document.body.classList.toggle('nav-open', !expanded);
  });
  navMenu?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      if (window.innerWidth < 860) {
        navToggle?.setAttribute('aria-expanded', 'false');
        navMenu?.setAttribute('data-open', 'false');
        document.body.classList.remove('nav-open');
      }
    })
  );

  // Smooth scroll offset fix for fixed header
  function offsetScroll(e) {
    if (this.hash) {
      const target = document.querySelector(this.hash);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }
  document
    .querySelectorAll('a[href^="#"]')
    .forEach((a) => a.addEventListener('click', offsetScroll));
  document
    .querySelectorAll('a[href^="#"]')
    .forEach((a) =>
      a.addEventListener('click', () =>
        track('nav_anchor_click', { target: a.getAttribute('href') })
      )
    );

  // Scroll spy for navigation
  (function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
    if (!links.length || typeof IntersectionObserver === 'undefined') return;
    const map = new Map();
    links.forEach((link) => {
      const hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const id = hash.slice(1);
      const section = document.getElementById(id);
      if (section) {
        map.set(section, link);
      }
    });
    if (!map.size) return;
    let activeId = null;
    const activate = (id) => {
      if (id === activeId) return;
      activeId = id;
      links.forEach((link) => {
        const linkId = link.getAttribute('href')?.slice(1);
        link.classList.toggle('active', linkId === id);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = map.get(entry.target);
          if (link) {
            activate(entry.target.id);
          }
        });
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );
    map.forEach((_link, section) => observer.observe(section));
    // fallback: set hero active on load
    const first = links[0];
    if (first) {
      activate(first.getAttribute('href')?.slice(1));
    }
  })();

  // Intersection animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('animate-in');
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('.fx-fade-up, .fx-scale-in').forEach((el) => observer.observe(el));
  // Refined stagger using data-index if present
  document.querySelectorAll('.post-card.fx-fade-up').forEach((el) => {
    const idx = parseInt(el.getAttribute('data-index') || '0', 10);
    if (!isNaN(idx)) el.style.transitionDelay = `calc(var(--stagger-step) * ${idx})`;
  });

  // Micro animation observer for newly added reveal elements
  const microObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          microObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll('.reveal-on-scroll').forEach((el) => microObserver.observe(el));

  // Responsive image enhancement using generated manifest (if exists)
  fetch('img-manifest.json')
    .then((r) => (r && r.ok ? r.json() : null))
    .then((manifest) => {
      if (!manifest) return;
      function buildSrcSet(arr) {
        return arr
          .map((p) => {
            const m = p.match(/-w(\d+)\./);
            return m ? `${p} ${m[1]}w` : p;
          })
          .join(', ');
      }
      // Enhance gallery images
      document.querySelectorAll('#galleryGrid img').forEach((img) => {
        const orig = img.getAttribute('src');
        if (!manifest[orig]) return;
        const picture = document.createElement('picture');
        const avif = document.createElement('source');
        avif.type = 'image/avif';
        avif.srcset = buildSrcSet(manifest[orig].avif);
        const webp = document.createElement('source');
        webp.type = 'image/webp';
        webp.srcset = buildSrcSet(manifest[orig].webp);
        const sizes = '(max-width: 640px) 50vw, 240px';
        img.setAttribute('sizes', sizes);
        picture.appendChild(avif);
        picture.appendChild(webp);
        picture.appendChild(img.cloneNode(true));
        img.replaceWith(picture);
      });
    })
    .catch(() => {});

  // Preloader & scroll progress
  const preloader = document.getElementById('preloader');
  const progressBar = document.querySelector('.scroll-progress span');
  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progressBar.style.width = (ratio * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('load', () => {
    updateScrollProgress();
    setTimeout(() => preloader?.classList.add('fade-out'), 350);
    // restore scroll position (session scoped)
    try {
      const saved = sessionStorage.getItem('scroll:restore');
      if (saved) {
        const { path, y } = JSON.parse(saved);
        if (path === window.location.pathname) {
          window.scrollTo(0, y);
        }
      }
    } catch (_) {
      /* ignore */
    }
  });
  window.addEventListener('beforeunload', () => {
    try {
      sessionStorage.setItem(
        'scroll:restore',
        JSON.stringify({ path: window.location.pathname, y: window.scrollY })
      );
    } catch (_) {}
  });

  // Count-up metrics
  const metricObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const numEl = entry.target;
          const targetVal = parseInt(numEl.dataset.count, 10) || 0;
          const duration = 1400;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            numEl.textContent = Math.round(targetVal * eased).toString();
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          metricObserver.unobserve(numEl);
        }
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll('.metric .num').forEach((el) => metricObserver.observe(el));

  // Sakura Petals Canvas Animation (deferred) + visibility / reduced-motion оптимизация
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas.getContext?.('2d');
  let petals = [];
  let width = 0,
    height = 0;
  const basePetalCount = window.innerWidth < 640 ? 40 : 70;
  let PETAL_COUNT = basePetalCount;
  let petalsStarted = false;
  let petalsPaused = false; // pause when tab hidden / blur
  let frameSkip = 0; // simple frame throttling
  function resize() {
    width = canvas.width = window.innerWidth * devicePixelRatio;
    height = canvas.height = window.innerHeight * devicePixelRatio;
  }
  function newPetal() {
    const size = Math.random() * 14 + 6;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.6 + 0.4,
      r: size,
      tilt: Math.random() * Math.PI,
      drift: Math.random() * 0.4 + 0.1,
      vy: Math.random() * 0.4 + 0.35,
      vr: (Math.random() - 0.5) * 0.01
    };
  }
  function initPetals() {
    petals = Array.from({ length: PETAL_COUNT }, () => newPetal());
  }
  function drawPetal(p) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * p.z})`);
    g.addColorStop(0.5, `rgba(255,182,193,${0.45 * p.z})`);
    g.addColorStop(1, `rgba(240,107,147,0)`);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(p.tilt) * 0.8);
    ctx.scale(1, 0.75);
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function updatePetal(p) {
    p.y += p.vy * p.z * 2.15;
    p.x += Math.sin(p.tilt) * p.drift * 2.15;
    p.tilt += p.vr;
    if (p.y - p.r > height) {
      const np = newPetal();
      Object.assign(p, {
        x: np.x,
        y: -np.r,
        r: np.r,
        z: np.z,
        drift: np.drift,
        vy: np.vy,
        vr: np.vr,
        tilt: np.tilt
      });
    }
    if (p.x - p.r > width) p.x = -p.r;
    if (p.x + p.r < 0) p.x = width + p.r;
  }
  function loop() {
    if (!ctx) return;
    if (petalsPaused) {
      requestAnimationFrame(loop);
      return;
    }
    if (frameSkip > 0) {
      frameSkip--;
      requestAnimationFrame(loop);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    petals.forEach((p) => {
      updatePetal(p);
      drawPetal(p);
    });
    // throttle if hidden или reduce-motion
    frameSkip =
      document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
    requestAnimationFrame(loop);
  }
  function startPetals() {
    if (petalsStarted || !canvas || !ctx) return;
    petalsStarted = true;
    resize();
    initPetals();
    loop();
    window.addEventListener('resize', resize);
  }
  // Start after idle or first interaction
  const triggerPetals = () => {
    startPetals();
    window.removeEventListener('pointerdown', triggerPetals);
    window.removeEventListener('keydown', triggerPetals);
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => startPetals(), { timeout: 2500 });
  } else {
    setTimeout(startPetals, 1200);
  }
  window.addEventListener('pointerdown', triggerPetals, { once: true });
  window.addEventListener('keydown', triggerPetals, { once: true });

  /* =====================================
     Hero Subtle Parallax (scroll-based)
     ===================================== */
  (function initHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const layer = hero.querySelector('.hero-bg-layer');
    if (!layer) return;
    let raf = null;
    let lastY = -1;
    const maxShift = 120; // px
    function onScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 2) {
        return;
      }
      lastY = y;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = null;
          apply(y);
        });
      }
    }
    function apply(scrollY) {
      const rect = hero.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const progress = Math.min(1, Math.max(0, (0 - rect.top) / (rect.height || viewportH)));
      // translate upward slower than scroll; slight scale for depth
      const shift = -scrollY * 0.15; // base shift
      const clampShift = Math.max(-maxShift, Math.min(maxShift, shift));
      layer.style.transform = `translate3d(0, ${clampShift.toFixed(2)}px, 0) scale(${1 + progress * 0.04})`;
      layer.style.willChange = 'transform';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => apply(window.scrollY));
    apply(window.scrollY);
  })();

  /* =====================================
     Page Fade Transitions
     ===================================== */
  (function initPageTransitions() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Only apply for same-origin internal links (no hash-only links)
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);
    function isInternal(a) {
      if (!a || a.target === '_blank') return false;
      const href = a.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('#')) return false;
      if (/^https?:/i.test(href) && !href.startsWith(location.origin)) return false;
      if (/\.(?:jpg|png|webp|avif|gif|svg|pdf|zip)$/i.test(href)) return false;
      return true;
    }
    let navigating = false;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (!isInternal(a)) return;
      // allow modified clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (navigating) return;
      navigating = true;
      const url = a.href.startsWith('http')
        ? a.href
        : new URL(a.getAttribute('href'), location.href).href;
      overlay.classList.add('active');
      track('nav_page_transition_start', { to: url });
      setTimeout(() => {
        window.location.href = url;
      }, 420); // delay for animation
    });
    window.addEventListener('pageshow', (e) => {
      // On back/forward cache restore
      if (e.persisted) {
        overlay.classList.remove('active');
        overlay.classList.add('exit');
        requestAnimationFrame(() => overlay.classList.remove('exit'));
      }
    });
    window.addEventListener('load', () => {
      // Enter animation (fade out overlay quickly if coming from a transition)
      if (document.referrer && document.referrer.startsWith(location.origin)) {
        overlay.classList.add('active');
        requestAnimationFrame(() => {
          overlay.classList.add('exit');
          setTimeout(() => overlay.classList.remove('active', 'exit'), 900);
        });
      }
    });
  })();

  /* =====================================
     SVG Blob Morph (Hero)
     ===================================== */
  (function initBlobMorph() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const path = document.getElementById('blobPath');
    if (!path) return;
    // A small set of organic shapes (same points count for smooth morph)
    const shapes = [
      'M421 308Q406 366 362.5 412.5Q319 459 255.5 456.5Q192 454 148 409.5Q104 365 84 302.5Q64 240 96 182Q128 124 187 89Q246 54 307.5 82.5Q369 111 406.5 155.5Q444 200 436 250Q428 300 421 308Z',
      'M438 318Q421 396 355.5 438Q290 480 226 447.5Q162 415 110 366.5Q58 318 79.5 247.5Q101 177 151 129Q201 81 272 65.5Q343 50 382 110Q421 170 438 235Q455 300 438 318Z',
      'M436 311Q409 362 366 409Q323 456 255.5 454.5Q188 453 142 407.5Q96 362 70 301Q44 240 76 177.5Q108 115 167.5 87.5Q227 60 291 64Q355 68 396 116.5Q437 165 451 232.5Q465 300 436 311Z'
    ];
    let idx = 0;
    function morph() {
      idx = (idx + 1) % shapes.length;
      const next = shapes[idx];
      path.animate([{ d: path.getAttribute('d') }, { d: next }], {
        duration: 6500,
        fill: 'forwards',
        easing: 'ease-in-out'
      }).onfinish = () => {
        path.setAttribute('d', next);
        setTimeout(morph, 1200);
      };
    }
    setTimeout(morph, 2000);
  })();

  // Form handling (mock)
  const leadForm = document.getElementById('leadForm');
  const statusEl = leadForm?.querySelector('.form-status');
  function showFieldError(field, msgId) {
    const err = document.getElementById(msgId);
    if (err) {
      err.hidden = false;
    }
    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
  }
  function clearFieldError(field, msgId) {
    const err = document.getElementById(msgId);
    if (err) {
      err.hidden = true;
    }
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
  }
  function validateLead() {
    if (!leadForm) return false;
    let ok = true;
    const name = leadForm.querySelector('#leadName');
    if (name) {
      if (name.value.trim().length < 2) {
        showFieldError(name, 'errName');
        ok = false;
      } else clearFieldError(name, 'errName');
    }
    const email = leadForm.querySelector('#leadEmail');
    if (email) {
      const v = email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        showFieldError(email, 'errEmail');
        ok = false;
      } else clearFieldError(email, 'errEmail');
    }
    const goal = leadForm.querySelector('#leadGoal');
    if (goal) {
      if (!goal.value) {
        showFieldError(goal, 'errGoal');
        ok = false;
      } else clearFieldError(goal, 'errGoal');
    }
    const level = leadForm.querySelector('#leadLevel');
    if (level) {
      if (!level.value) {
        showFieldError(level, 'errLevel');
        ok = false;
      } else clearFieldError(level, 'errLevel');
    }
    return ok;
  }
  ['input', 'change', 'blur'].forEach((ev) =>
    leadForm?.addEventListener(ev, (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.id === 'leadName') validateLead();
      if (t.id === 'leadEmail') validateLead();
      if (t.id === 'leadGoal') validateLead();
      if (t.id === 'leadLevel') validateLead();
    })
  );
  leadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLead()) {
      statusEl.textContent = 'Исправьте ошибки формы';
      statusEl.style.color = 'var(--danger)';
      return;
    }
    const payload = {
      name: leadForm.leadName?.value?.trim(),
      email: leadForm.leadEmail?.value?.trim(),
      goal: leadForm.leadGoal?.value || '',
      level: leadForm.leadLevel?.value || '',
      message: leadForm.leadMsg?.value?.trim() || ''
    };
    statusEl.textContent = 'Отправка...';
    statusEl.style.color = 'var(--ink-dim)';
    track('lead_form_submit', { goal: payload.goal, level: payload.level });
    const result = await sendToBackend('lead', payload);
    if (result.ok) {
      statusEl.textContent = 'Заявка отправлена! Мы свяжемся.';
      statusEl.style.color = 'var(--accent)';
      leadForm.reset();
      track('lead_form_success', { mode: 'live' });
    } else if (result.mock) {
      statusEl.textContent =
        'Заявка сохранена (демо-режим). Подключите backend для реальной отправки.';
      statusEl.style.color = 'var(--accent)';
      leadForm.reset();
      track('lead_form_success', { mode: 'mock', reason: result.error });
    } else {
      statusEl.textContent = 'Не удалось отправить. Попробуйте позже.';
      statusEl.style.color = 'var(--danger)';
      track('lead_form_error', { error: result.error });
    }
  });

  // Program modal logic
  const modal = document.getElementById('programModal');
  const programButtons = document.querySelectorAll('[data-program]');
  const programForm = document.getElementById('programForm');
  const programStatus = programForm?.querySelector('.mini-status');
  const hiddenProgramInput = programForm?.querySelector('input[name="program"]');

  function openModal(prog) {
    modal?.removeAttribute('hidden');
    hiddenProgramInput.value = prog;
    document.body.style.overflow = 'hidden';
    track('program_modal_open', { program: prog });
    // focus trap start
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first && first.focus();
    function trap(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === 'Escape') {
        closeModal();
      }
    }
    modal.__trapHandler = trap;
    window.addEventListener('keydown', trap);
  }
  function closeModal() {
    modal?.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (modal?.__trapHandler) {
      window.removeEventListener('keydown', modal.__trapHandler);
      delete modal.__trapHandler;
    }
  }
  programButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      openModal(btn.getAttribute('data-program'));
    })
  );
  modal?.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  modal?.querySelector('.modal-close')?.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal?.hasAttribute('hidden')) closeModal();
  });
  programForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!programForm.checkValidity()) {
      programStatus.textContent = 'Введите корректный email';
      programStatus.style.color = 'var(--danger)';
      return;
    }
    programStatus.textContent = 'Отправляем...';
    programStatus.style.color = 'var(--ink-dim)';
    const payload = {
      email: programForm.elements.email?.value?.trim(),
      program: hiddenProgramInput?.value || 'unknown'
    };
    track('program_form_submit', { program: payload.program });
    const result = await sendToBackend('program', payload);
    if (result.ok) {
      programStatus.textContent = 'Готово! Мы свяжемся.';
      programStatus.style.color = 'var(--accent)';
      programForm.reset();
      track('program_form_success', { mode: 'live' });
    } else if (result.mock) {
      programStatus.textContent = 'Заявка сохранена (демо-режим). Подключите backend.';
      programStatus.style.color = 'var(--accent)';
      programForm.reset();
      track('program_form_success', { mode: 'mock', reason: result.error });
    } else {
      programStatus.textContent = 'Не удалось отправить. Попробуйте позже.';
      programStatus.style.color = 'var(--danger)';
      track('program_form_error', { error: result.error });
    }
  });

  // Current year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* =====================================
     Testimonials Carousel (Reviews)
  ===================================== */
  const carouselTrack = document.getElementById('reviewsTrack');
  const prevBtn = document.querySelector('.reviews-controls [data-dir="prev"]');
  const nextBtn = document.querySelector('.reviews-controls [data-dir="next"]');
  const dotsWrap = document.getElementById('revDots');
  if (carouselTrack && prevBtn && nextBtn && dotsWrap) {
    const baseSlides = Array.from(carouselTrack.children);
    const totalSlides = baseSlides.length;
    if (totalSlides === 0) return;

    const live = document.getElementById('reviewsStatus');
    carouselTrack.setAttribute('role', 'group');
    carouselTrack.setAttribute('aria-live', 'off');
    carouselTrack.setAttribute('aria-roledescription', 'track');

    // Clone edges for seamless looping
    const firstClone = baseSlides[0].cloneNode(true);
    const lastClone = baseSlides[totalSlides - 1].cloneNode(true);
    firstClone.classList.add('is-clone');
    lastClone.classList.add('is-clone');
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    carouselTrack.appendChild(firstClone);
    carouselTrack.insertBefore(lastClone, baseSlides[0]);

    const slidesWithClones = Array.from(carouselTrack.children);
    slidesWithClones.forEach((slide, idx) => {
      if (slide.classList.contains('is-clone')) return;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-label', `Слайд ${baseSlides.indexOf(slide) + 1} из ${totalSlides}`);
    });

    // Build dots for actual slides
    baseSlides.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Отзыв ${i + 1}`);
      if (i === 0) d.setAttribute('aria-selected', 'true');
      d.setAttribute('tabindex', i === 0 ? '0' : '-1');
      d.addEventListener('click', () => goToActual(i, true));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    const INTERVAL = 6500;
    let autoTimer = null;
    let index = 1; // start at first real slide (after leading clone)
    let isTransitioning = false;

    function gap() {
      return parseFloat(getComputedStyle(carouselTrack).gap) || 32;
    }
    function slideWidth() {
      return baseSlides[0].getBoundingClientRect().width;
    }

    function translate(withTransition = true) {
      if (!withTransition) carouselTrack.style.transition = 'none';
      const offset = -(slideWidth() + gap()) * index;
      carouselTrack.style.transform = `translateX(${offset}px)`;
      if (!withTransition) {
        // force reflow to apply immediate position without transition
        carouselTrack.getBoundingClientRect();
        carouselTrack.style.transition = '';
      }
    }

    function currentRealIndex() {
      const normalized = (index - 1 + totalSlides) % totalSlides;
      return normalized;
    }

    function updateDots() {
      const realIndex = currentRealIndex();
      dots.forEach((d, i) => {
        const isActive = i === realIndex;
        d.setAttribute('aria-selected', isActive);
        d.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      if (live) {
        live.textContent = `Слайд ${realIndex + 1} из ${totalSlides}`;
      }
    }

    function goToActual(realIndex, userTriggered = false) {
      index = realIndex + 1; // account for leading clone
      translate();
      updateDots();
      if (userTriggered) {
        restartAuto();
        track('reviews_carousel_goTo', { index: realIndex });
      }
    }

    function shift(delta) {
      if (isTransitioning) return;
      index += delta;
      isTransitioning = true;
      translate();
      updateDots();
    }

    function handleTransitionEnd() {
      isTransitioning = false;
      if (index === 0) {
        // jumped before first real slide
        index = totalSlides;
        translate(false);
        updateDots();
      } else if (index === slidesWithClones.length - 1) {
        index = 1;
        translate(false);
        updateDots();
      }
    }

    function next() {
      shift(1);
      restartAuto();
      track('reviews_carousel_next');
    }
    function prev() {
      shift(-1);
      restartAuto();
      track('reviews_carousel_prev');
    }

    prevBtn.addEventListener('click', () => prev());
    nextBtn.addEventListener('click', () => next());

    carouselTrack.addEventListener('transitionend', handleTransitionEnd);

    // drag / swipe (pointer)
    carouselTrack.addEventListener('pointerdown', (e) => {
      let startX = e.clientX;
      let moved = false;
      const move = (ev) => {
        if (Math.abs(ev.clientX - startX) > 10) moved = true;
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!moved) return;
        const diff = ev.clientX - startX;
        if (diff < -40) next();
        else if (diff > 40) prev();
      };
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up, { passive: true });
    });

    // keyboard
    carouselTrack.setAttribute('tabindex', '0');
    carouselTrack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        next();
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') {
        prev();
        e.preventDefault();
      }
      if (e.key === 'Home') {
        goToActual(0, true);
        e.preventDefault();
      }
      if (e.key === 'End') {
        goToActual(totalSlides - 1, true);
        e.preventDefault();
      }
    });

    function startAuto() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stopAuto();
      autoTimer = setInterval(() => shift(1), INTERVAL);
    }
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
    }
    function restartAuto() {
      stopAuto();
      startAuto();
    }
    window.startCarouselAuto = startAuto;
    window.stopCarouselAuto = stopAuto;

    const region = document.getElementById('reviews');
    region?.addEventListener('mouseenter', stopAuto);
    region?.addEventListener('mouseleave', startAuto);
    region?.addEventListener('focusin', stopAuto);
    region?.addEventListener('focusout', startAuto);

    window.addEventListener('resize', () => {
      translate(false);
    });

    translate(false);
    updateDots();
    startAuto();
  }

  /* =====================================
     Gallery Lightbox
  ===================================== */
  const gallery = document.querySelector('.gallery-grid');
  if (gallery) {
    const figures = Array.from(gallery.querySelectorAll('figure'));
    const images = figures.map((f) => f.querySelector('img')).filter(Boolean);
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `\n      <div class="lightbox-inner" role="dialog" aria-modal="true" aria-label="Просмотр изображения">\n        <div class="lightbox-figure">\n          <button class="lightbox-nav prev" aria-label="Предыдущее изображение">‹</button>\n          <img alt="" />\n          <button class="lightbox-nav next" aria-label="Следующее изображение">›</button>\n          <button class="lightbox-close" aria-label="Закрыть">✕</button>\n        </div>\n        <p class="lightbox-caption" aria-live="polite"></p>\n      </div>`;
    document.body.appendChild(lightbox);
    const imgEl = lightbox.querySelector('img');
    const caption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevNav = lightbox.querySelector('.lightbox-nav.prev');
    const nextNav = lightbox.querySelector('.lightbox-nav.next');
    let current = 0;
    let lastFocus = null;
    function open(i) {
      current = (i + images.length) % images.length;
      const fig = images[current].closest('figure');
      imgEl.src = images[current].src;
      imgEl.alt = images[current].alt || '';
      caption.textContent = fig?.querySelector('figcaption')?.textContent || '';
      lightbox.classList.add('open');
      lastFocus = document.activeElement;
      setTimeout(() => closeBtn.focus(), 40);
      track('lightbox_open', { index: current, src: imgEl.src });
    }
    function close() {
      lightbox.classList.remove('open');
      lastFocus && lastFocus.focus();
    }
    function show(dir) {
      open(current + dir);
    }
    images.forEach((im, i) => {
      im.style.cursor = 'zoom-in';
      im.setAttribute('tabindex', '0');
      im.addEventListener('click', () => open(i));
      im.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i);
        }
      });
    });
    closeBtn.addEventListener('click', close);
    prevNav.addEventListener('click', () => show(-1));
    nextNav.addEventListener('click', () => show(1));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(1);
      if (e.key === 'ArrowLeft') show(-1);
    });
  }

  /* =====================================
     Reduced Motion Adjustments
  ===================================== */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (canvas) {
      PETAL_COUNT = Math.min(18, Math.round(PETAL_COUNT * 0.35));
      petals = petals.slice(0, PETAL_COUNT);
    }
  }

  // Visibility lifecycle (пауза анимаций и авто‑карусели)
  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    petalsPaused = hidden;
    if (typeof window.stopCarouselAuto === 'function') {
      if (hidden) window.stopCarouselAuto();
      else if (typeof window.startCarouselAuto === 'function') window.startCarouselAuto();
    }
  });
  window.addEventListener('blur', () => {
    petalsPaused = true;
    if (typeof window.stopCarouselAuto === 'function') window.stopCarouselAuto();
  });
  window.addEventListener('focus', () => {
    petalsPaused = false;
    if (typeof window.startCarouselAuto === 'function') window.startCarouselAuto();
  });

  /* =====================================
     FAQ Accordion (accessible)
  ===================================== */
  (function initFAQ() {
    const list = document.getElementById('faqList');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('.faq-item'));
    const triggers = items.map((i) => i.querySelector('.faq-trigger')).filter(Boolean);
    if (!triggers.length) return;
    const expandAllBtn = document.getElementById('faqExpandAll');
    const collapseAllBtn = document.getElementById('faqCollapseAll');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const searchInput = document.getElementById('faqSearch');
    const resetBtn = document.getElementById('faqSearchReset');
    const resultsEl = document.getElementById('faqResults');
    const filterBar = document.querySelector('.faq-filters');
    const progOpenedEl = document.getElementById('faqProgressOpened');
    const progTotalEl = document.getElementById('faqProgressTotal');
    const progVisibleEl = document.getElementById('faqProgressVisible');
    const progBarFill = document.querySelector('.faq-progress-bar span');
    let activeCat = '__all';
    let lastQuery = '';
    const STORAGE_KEY = 'faqState.v1';

    function measure(panel) {
      const wasHidden = panel.hasAttribute('hidden');
      if (wasHidden) panel.removeAttribute('hidden');
      panel.style.maxHeight = 'none';
      const inner = panel.querySelector('.faq-panel-inner');
      const h = (inner ? inner.getBoundingClientRect().height : panel.scrollHeight) + 24; // padding slack
      panel.style.maxHeight = '';
      if (wasHidden) panel.setAttribute('hidden', '');
      return h;
    }
    function open(trigger, silent = false) {
      const id = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(id);
      const item = trigger.closest('.faq-item');
      if (!panel || !item || item.classList.contains('open')) return;
      panel.removeAttribute('hidden');
      const h = measure(panel);
      panel.style.setProperty('--panel-max', h + 'px');
      requestAnimationFrame(() => {
        item.classList.add('open');
      });
      trigger.setAttribute('aria-expanded', 'true');
      if (!silent) track('faq_open', { id });
      updateProgress();
      persist();
    }
    function close(trigger, silent = false) {
      const id = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(id);
      const item = trigger.closest('.faq-item');
      if (!panel || !item || !item.classList.contains('open')) return;
      const h = panel.getBoundingClientRect().height;
      panel.style.setProperty('--panel-max', h + 'px');
      requestAnimationFrame(() => {
        item.classList.remove('open');
        panel.style.setProperty('--panel-max', '0px');
      });
      trigger.setAttribute('aria-expanded', 'false');
      if (!silent) track('faq_close', { id });
      updateProgress();
      persist();
      if (!reduced) {
        panel.addEventListener(
          'transitionend',
          function te(ev) {
            if (ev.propertyName === 'max-height' && !item.classList.contains('open')) {
              panel.setAttribute('hidden', '');
              panel.removeEventListener('transitionend', te);
            }
          },
          { once: true }
        );
      } else {
        panel.setAttribute('hidden', '');
      }
    }
    function toggle(trigger) {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      expanded ? close(trigger) : open(trigger);
    }
    function expandAll() {
      triggers.forEach((t) => open(t, true));
      track('faq_expand_all');
    }
    function collapseAll() {
      triggers.forEach((t) => close(t, true));
      track('faq_collapse_all');
    }

    triggers.forEach((btn) => {
      btn.addEventListener('click', () => toggle(btn));
      btn.addEventListener('keydown', (e) => {
        const idx = triggers.indexOf(btn);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          triggers[(idx + 1) % triggers.length].focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          triggers[(idx - 1 + triggers.length) % triggers.length].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          triggers[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          triggers[triggers.length - 1].focus();
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(btn);
        }
      });
    });

    expandAllBtn?.addEventListener('click', expandAll);
    collapseAllBtn?.addEventListener('click', collapseAll);

    // Pre-measure intrinsic heights for smoother first open
    items.forEach((item) => {
      const panel = item.querySelector('.faq-panel');
      if (!panel) return;
      const h = measure(panel);
      panel.style.setProperty('--panel-max', '0px');
      panel.setAttribute('hidden', '');
    });

    /* Filtering & Search */
    function norm(s) {
      return (s || '').toLowerCase();
    }
    function highlight(text, q) {
      if (!q) return text;
      try {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('(' + esc + ')', 'ig');
        return text.replace(re, '<mark>$1</mark>');
      } catch {
        return text;
      }
    }
    function applyFilter() {
      const q = norm(searchInput?.value.trim());
      if (q === lastQuery && applyFilter.__lastCat === activeCat) return;
      lastQuery = q;
      applyFilter.__lastCat = activeCat;
      let visible = 0;
      items.forEach((item) => {
        const cat = item.getAttribute('data-cat');
        const triggerTextEl = item.querySelector('.faq-trigger-text');
        if (!triggerTextEl) return;
        if (!triggerTextEl.__orig) {
          triggerTextEl.__orig = triggerTextEl.innerHTML;
        }
        const base = triggerTextEl.__orig;
        const text = norm(triggerTextEl.textContent);
        const catOk = activeCat === '__all' || cat === activeCat;
        const qOk = !q || text.includes(q);
        const show = catOk && qOk;
        item.classList.toggle('filter-hide', !show);
        if (show) {
          visible++;
          triggerTextEl.innerHTML = q ? highlight(base, q) : base;
        } else {
          triggerTextEl.innerHTML = base;
        }
      });
      if (resultsEl) {
        resultsEl.textContent = visible ? `Найдено: ${visible}` : 'Нет результатов';
      }
      if (resetBtn) {
        resetBtn.hidden = !q;
      }
      track('faq_filter_apply', { q, category: activeCat, visible });
      updateProgress();
      persist();
    }
    searchInput?.addEventListener('input', () => {
      applyFilter();
    });
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilter();
      }
    });
    resetBtn?.addEventListener('click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      searchInput.focus();
      applyFilter();
    });
    filterBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-filter');
      if (!btn) return;
      const cat = btn.getAttribute('data-cat');
      if (!cat || cat === activeCat) return;
      activeCat = cat;
      Array.from(filterBar.querySelectorAll('.faq-filter')).forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      applyFilter();
    });
    applyFilter();

    function updateProgress() {
      const total = items.length;
      const visibleItems = items.filter((i) => !i.classList.contains('filter-hide'));
      const openedVisible = visibleItems.filter((i) => i.classList.contains('open')).length;
      if (progTotalEl) progTotalEl.textContent = total.toString();
      if (progVisibleEl) progVisibleEl.textContent = visibleItems.length.toString();
      if (progOpenedEl) progOpenedEl.textContent = openedVisible.toString();
      if (progBarFill) {
        const ratio = visibleItems.length ? openedVisible / visibleItems.length : 0;
        progBarFill.style.width = (ratio * 100).toFixed(1) + '%';
      }
    }

    function persist() {
      try {
        const openIds = triggers
          .filter((t) => t.getAttribute('aria-expanded') === 'true')
          .map((t) => t.id);
        const state = {
          q: searchInput?.value || '',
          cat: activeCat,
          open: openIds
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
    }
    function restore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        if (state.q && searchInput) {
          searchInput.value = state.q;
        }
        if (state.cat && filterBar) {
          activeCat = state.cat;
          Array.from(filterBar.querySelectorAll('.faq-filter')).forEach((b) => {
            const on = b.getAttribute('data-cat') === activeCat;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', String(on));
          });
        }
        applyFilter();
        if (Array.isArray(state.open)) {
          state.open.forEach((id) => {
            const trig = document.getElementById(id);
            if (trig) open(trig, true);
          });
        }
        updateProgress();
      } catch (_) {}
    }
    restore();
    updateProgress();

    // Deep link: #faq-panel-3 -> open & scroll
    if (location.hash.startsWith('#faq-panel-')) {
      const panel = document.querySelector(location.hash);
      if (panel) {
        const trigId = panel.getAttribute('aria-labelledby');
        const trig = document.getElementById(trigId);
        if (trig) {
          open(trig, true);
          setTimeout(() => trig.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
      }
    }
  })();

  /* =====================================
     Blog Search Filter (Latest Posts)
  ===================================== */
  (function initPostSearch() {
    const input = document.getElementById('postSearch');
    const wrap = document.querySelector('.post-cards');
    const catBar = document.querySelector('.posts-cats');
    const resetBtn = document.getElementById('postSearchReset');
    const resultsEl = document.getElementById('postResultsCount');
    if (!input || !wrap) return;
    const cards = Array.from(wrap.querySelectorAll('.post-card'));
    function norm(s) {
      return (s || '').toLowerCase();
    }
    let lastQuery = '';
    let activeCat = '__all';
    let t = null;
    function highlight(text, q) {
      if (!q) return text;
      try {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('(' + esc + ')', 'ig');
        return text.replace(re, '<mark>$1</mark>');
      } catch {
        return text;
      }
    }
    function apply(q) {
      const query = norm(q);
      if (query === lastQuery && activeCat === apply.__lastCat) return;
      lastQuery = query;
      apply.__lastCat = activeCat;
      wrap.classList.add('is-filtering');
      const catAll = activeCat === '__all';
      let visibleCount = 0;
      cards.forEach((card) => {
        const title = norm(card.dataset.title);
        const kw = norm(card.dataset.keywords);
        const desc = norm(card.dataset.desc);
        const cats = (card.dataset.cats || '').split(',').map(norm);
        const hay = title + ' ' + kw + ' ' + desc;
        const textMatch = !query || hay.includes(query);
        const catMatch = catAll || cats.includes(norm(activeCat));
        const show = textMatch && catMatch;
        card.classList.toggle('filter-hide', !show);
        if (show) visibleCount++;
        const titleEl = card.querySelector('.post-card-title');
        const descEl = card.querySelector('.post-card-desc');
        if (titleEl) {
          if (!titleEl.__orig) titleEl.__orig = titleEl.innerHTML;
          titleEl.innerHTML = query ? highlight(titleEl.__orig, query) : titleEl.__orig;
        }
        if (descEl) {
          if (!descEl.__orig) descEl.__orig = descEl.innerHTML;
          descEl.innerHTML = query ? highlight(descEl.__orig, query) : descEl.__orig;
        }
        if (!show) {
          // не мешаем layout — оставляем как есть, скрытие через класс
        }
      });
      if (resultsEl) {
        resultsEl.textContent = visibleCount ? `Найдено: ${visibleCount}` : 'Нет результатов';
      }
      if (resetBtn) {
        resetBtn.hidden = !query && activeCat === '__all';
      }
      // Persist state
      try {
        localStorage.setItem('postSearchState', JSON.stringify({ q: query, cat: activeCat }));
      } catch (_) {}
      clearTimeout(wrap.__fltTO);
      wrap.__fltTO = setTimeout(() => wrap.classList.remove('is-filtering'), 500);
    }
    function debounced() {
      clearTimeout(t);
      t = setTimeout(() => apply(input.value.trim()), 160);
    }
    input.addEventListener('input', debounced);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        debounced();
      }
    });
    resetBtn?.addEventListener('click', () => {
      input.value = '';
      activeCat = '__all';
      // reset category buttons
      if (catBar) {
        Array.from(catBar.querySelectorAll('.cat-filter')).forEach((b) => {
          const isAll = b.getAttribute('data-cat') === '__all';
          b.classList.toggle('active', isAll);
          b.setAttribute('aria-pressed', String(isAll));
        });
      }
      apply('');
      input.focus();
    });
    // Category buttons
    if (catBar) {
      catBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-filter');
        if (!btn) return;
        const cat = btn.getAttribute('data-cat');
        if (!cat) return;
        if (activeCat === cat) return; // уже выбрана
        activeCat = cat;
        Array.from(catBar.querySelectorAll('.cat-filter')).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        apply(input.value.trim());
      });
    }
    // Restore persisted state
    try {
      const saved = JSON.parse(localStorage.getItem('postSearchState') || 'null');
      if (saved) {
        if (saved.q) {
          input.value = saved.q;
        }
        if (saved.cat && saved.cat !== '__all' && catBar) {
          activeCat = saved.cat;
          Array.from(catBar.querySelectorAll('.cat-filter')).forEach((b) => {
            const on = b.getAttribute('data-cat') === activeCat;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', String(on));
          });
        }
        apply(input.value.trim());
      } else {
        apply(input.value.trim());
      }
    } catch {
      apply(input.value.trim());
    }
  })();

  /* =====================================
     Share button & LQIP progressive load
  ===================================== */
  (function initShareAndLqip() {
    const supportsClipboard = !!(navigator.clipboard && navigator.clipboard.writeText);
    // Share buttons
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.share-btn');
      if (!btn) return;
      const url = btn.getAttribute('data-share');
      if (!url) return;
      try {
        if (supportsClipboard) {
          await navigator.clipboard.writeText(url);
        } else {
          const ta = document.createElement('textarea');
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        btn.classList.add('copied');
        btn.textContent = '✓';
        track('share_copy', { url });
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '⤴';
        }, 2000);
      } catch (err) {
        track('share_copy_error', { url, error: err?.message });
      }
    });
    // Progressive background image replacement
    const medias = Array.from(document.querySelectorAll('.post-card-media[data-state="loading"]'));
    if (!medias.length) return;
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(onEntries, { rootMargin: '200px' })
        : null;
    function onEntries(entries) {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          load(en.target);
          io.unobserve(en.target);
        }
      });
    }
    function load(el) {
      const finalBg = el.getAttribute('data-bg');
      if (!finalBg) {
        el.setAttribute('data-state', 'loaded');
        return;
      }
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url('${finalBg}')`;
        el.setAttribute('data-state', 'loaded');
      };
      img.onerror = () => {
        el.setAttribute('data-state', 'loaded');
      };
      img.src = finalBg;
    }
    medias.forEach((m) => (io ? io.observe(m) : load(m)));
  })();

  /* =====================================
     Pointer Parallax / Tilt
  ===================================== */
  (function initTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const supportsPointer = matchMedia('(pointer:fine)').matches;
    if (!supportsPointer) return;
    const candidates = Array.from(document.querySelectorAll('.post-card, .program-card'));
    const MAX_ROT_X = 10;
    const MAX_ROT_Y = 10;
    const LERP = 0.12; // smoothing factor
    candidates.forEach((el) => {
      el.classList.add('tilt-active');
      let rect = null;
      let targetX = 0,
        targetY = 0; // desired rotation
      let curX = 0,
        curY = 0; // current rotation
      let hovering = false;
      function loop() {
        if (!hovering) return; // stop anim loop when not hovering for perf
        const dx = targetX - curX;
        const dy = targetY - curY;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
          curX = targetX;
          curY = targetY;
        } else {
          curX += dx * LERP;
          curY += dy * LERP;
        }
        el.style.transform = `translateY(-4px) rotateX(${curY.toFixed(2)}deg) rotateY(${curX.toFixed(2)}deg)`;
        requestAnimationFrame(loop);
      }
      function onMove(e) {
        if (!rect) {
          rect = el.getBoundingClientRect();
        }
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPerc = Math.min(1, Math.max(0, x / rect.width));
        const yPerc = Math.min(1, Math.max(0, y / rect.height));
        // compute target rotations (note: invert X axis for natural feel if needed)
        const rx = (yPerc - 0.5) * -2 * MAX_ROT_X; // rotateX
        const ry = (xPerc - 0.5) * 2 * MAX_ROT_Y; // rotateY
        targetX = ry;
        targetY = rx;
        if (!hovering) {
          hovering = true;
          requestAnimationFrame(loop);
        }
      }
      function reset() {
        rect = null;
        hovering = false;
        targetX = targetY = 0; // animate return
        function settle() {
          curX *= 0.85;
          curY *= 0.85;
          if (Math.abs(curX) < 0.05 && Math.abs(curY) < 0.05) {
            el.style.transform = '';
            curX = curY = 0;
            return;
          }
          el.style.transform = `translateY(-2px) rotateX(${curY.toFixed(2)}deg) rotateY(${curX.toFixed(2)}deg)`;
          requestAnimationFrame(settle);
        }
        requestAnimationFrame(settle);
      }
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', reset);
      el.addEventListener('pointerdown', () => {
        rect = el.getBoundingClientRect();
      });
    });
  })();

  /* =====================================
     Cursor Spotlight Layer
  ===================================== */
  (function initSpotlight() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!matchMedia('(pointer:fine)').matches) return;
    let raf = null;
    let x = 50,
      y = 50;
    function paint() {
      document.body.style.setProperty('--spot-x', x + '%');
      document.body.style.setProperty('--spot-y', y + '%');
      raf = null;
    }
    function onMove(e) {
      x = (e.clientX / window.innerWidth) * 100;
      y = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(paint);
    }
    document.body.classList.add('has-spotlight');
    window.addEventListener('pointermove', onMove, { passive: true });
  })();

  /* =====================================
     Scroll Spy (active nav link)
  ===================================== */
  (function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!sections.length) return;
    const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
    const map = new Map();
    navLinks.forEach((a) => {
      const hash = a.getAttribute('href');
      if (hash && hash.length > 1) {
        map.set(hash.slice(1), a);
      }
    });
    let activeId = null;
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && map.has(id)) {
              if (activeId !== id) {
                activeId = id;
                navLinks.forEach((l) => l.classList.remove('active'));
                map.get(id).classList.add('active');
              }
            }
          }
        });
      },
      { rootMargin: '-50% 0px -40% 0px', threshold: [0, 0.2, 0.4] }
    );
    sections.forEach((sec) => spyObserver.observe(sec));
  })();
})();
