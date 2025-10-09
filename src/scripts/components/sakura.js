/* =============================================
   Sakura Petals Canvas Animation Component
   Компонент анимации лепестков сакуры на канвасе
   ============================================= */

/**
 * EN: Sakura animation state
 * RU: Состояние анимации сакуры
 */
let canvas, ctx;
let petals = [];
let width = 0,
  height = 0;
let petalsStarted = false;
let petalsPaused = false;
let frameSkip = 0;

/* EN: Petal count based on screen size
   RU: Количество лепестков в зависимости от размера экрана */
const basePetalCount = window.innerWidth < 640 ? 15 : 30;
const PETAL_COUNT = basePetalCount;

/**
 * EN: Resize canvas to match window dimensions
 * RU: Изменение размера канваса под размеры окна
 */
function resize() {
  if (!canvas) {
    return;
  }
  width = canvas.width = window.innerWidth * devicePixelRatio;
  height = canvas.height = window.innerHeight * devicePixelRatio;
}

/**
 * EN: Create new petal with random properties
 * RU: Создание нового лепестка со случайными свойствами
 *
 * @returns {Object} - Petal object | Объект лепестка
 */
function newPetal() {
  const size = Math.random() * 10 + 5;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 0.5 + 0.3, // EN: Depth factor | RU: Фактор глубины
    r: size, // EN: Radius | RU: Радиус
    tilt: Math.random() * Math.PI, // EN: Rotation angle | RU: Угол поворота
    drift: Math.random() * 0.3 + 0.1, // EN: Horizontal drift | RU: Горизонтальный снос
    vy: Math.random() * 0.35 + 0.3, // EN: Vertical velocity | RU: Вертикальная скорость
    vr: (Math.random() - 0.5) * 0.008 // EN: Rotation velocity | RU: Скорость вращения
  };
}

/**
 * EN: Initialize petals array
 * RU: Инициализация массива лепестков
 */
function initPetals() {
  petals = Array.from({ length: PETAL_COUNT }, () => newPetal());
}

/**
 * EN: Draw petal on canvas with gradient
 * RU: Отрисовка лепестка на канвасе с градиентом
 *
 * @param {Object} p - Petal object | Объект лепестка
 */
function drawPetal(p) {
  /* EN: Create radial gradient for petal
     RU: Создание радиального градиента для лепестка */
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
  g.addColorStop(0, `rgba(255,255,255,${0.6 * p.z})`);
  g.addColorStop(0.5, `rgba(255,179,209,${0.35 * p.z})`);
  g.addColorStop(1, `rgba(255,194,214,0)`);

  /* EN: Apply transformations and draw
     RU: Применение трансформаций и отрисовка */
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.sin(p.tilt) * 0.6);
  ctx.scale(1, 0.7); // EN: Flatten petal | RU: Сплющивание лепестка
  ctx.beginPath();
  ctx.fillStyle = g;
  ctx.arc(0, 0, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * EN: Update petal position and rotation
 * RU: Обновление позиции и вращения лепестка
 *
 * @param {Object} p - Petal object | Объект лепестка
 */
function updatePetal(p) {
  /* EN: Update position with depth-based speed
     RU: Обновление позиции со скоростью, зависящей от глубины */
  p.y += p.vy * p.z * 1.8;
  p.x += Math.sin(p.tilt) * p.drift * 1.8;
  p.tilt += p.vr;

  /* EN: Reset petal when it goes off-screen
     RU: Сброс лепестка когда он выходит за экран */
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

  /* EN: Wrap horizontally
     RU: Обёртка по горизонтали */
  if (p.x - p.r > width) {
    p.x = -p.r;
  }
  if (p.x + p.r < 0) {
    p.x = width + p.r;
  }
}

/**
 * EN: Animation loop
 * RU: Цикл анимации
 */
function loop() {
  if (!ctx) {
    return;
  }

  /* EN: Pause animation if tab is hidden
     RU: Пауза анимации если вкладка скрыта */
  if (petalsPaused) {
    requestAnimationFrame(loop);
    return;
  }

  /* EN: Skip frames for performance
     RU: Пропуск кадров для производительности */
  if (frameSkip > 0) {
    frameSkip--;
    requestAnimationFrame(loop);
    return;
  }

  /* EN: Clear canvas and draw all petals
     RU: Очистка канваса и отрисовка всех лепестков */
  ctx.clearRect(0, 0, width, height);
  petals.forEach((p) => {
    updatePetal(p);
    drawPetal(p);
  });

  /* EN: Throttle if hidden or reduced motion
     RU: Троттлинг если скрыто или уменьшенное движение */
  const shouldThrottle =
    document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  frameSkip = shouldThrottle ? 1 : 0;

  requestAnimationFrame(loop);
}

/**
 * EN: Start sakura animation
 * RU: Запуск анимации сакуры
 */
function startPetals() {
  if (petalsStarted || !canvas || !ctx) {
    return;
  }

  petalsStarted = true;
  resize();
  initPetals();
  loop();

  /* EN: Add resize listener
     RU: Добавление обработчика изменения размера */
  window.addEventListener('resize', resize);
}

/**
 * EN: Pause animation (for tab visibility changes)
 * RU: Пауза анимации (для изменений видимости вкладки)
 */
export function pause() {
  petalsPaused = true;
}

/**
 * EN: Resume animation
 * RU: Возобновление анимации
 */
export function resume() {
  petalsPaused = false;
}

/**
 * EN: Initialize sakura canvas animation
 * RU: Инициализация анимации канваса сакуры
 */
export function init() {
  canvas = document.getElementById('sakura-canvas');
  if (!canvas) {
    return;
  }

  ctx = canvas.getContext?.('2d');
  if (!ctx) {
    return;
  }

  /* EN: Trigger function to remove event listeners after first call
     RU: Функция триггера для удаления обработчиков после первого вызова */
  const triggerPetals = () => {
    startPetals();
    window.removeEventListener('pointerdown', triggerPetals);
    window.removeEventListener('keydown', triggerPetals);
  };

  /* EN: Start after idle callback or timeout
     RU: Запуск после idle callback или таймаута */
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => startPetals(), { timeout: 2500 });
  } else {
    setTimeout(startPetals, 1200);
  }

  /* EN: Also start on first interaction
     RU: Также запуск при первом взаимодействии */
  window.addEventListener('pointerdown', triggerPetals, { once: true });
  window.addEventListener('keydown', triggerPetals, { once: true });

  /* EN: Pause when tab becomes hidden
     RU: Пауза когда вкладка становится скрытой */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  });
}
