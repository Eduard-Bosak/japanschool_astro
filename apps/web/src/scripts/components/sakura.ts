/* =============================================
   Seasonal Particles Canvas Animation Component
   Компонент анимации сезонных частиц на канвасе

   Spring: Sakura petals (pink)
   Summer: Fireflies (yellow glow)
   Autumn: Falling leaves (orange/red)
   Winter: Snowflakes (white)
   ============================================= */

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type ParticleType = 'petal' | 'firefly' | 'leaf' | 'snowflake';

interface Particle {
  x: number;
  y: number;
  z: number; // depth
  r: number; // radius/size
  tilt: number;
  drift: number;
  vy: number; // vertical velocity
  vr: number; // rotation velocity
  type: ParticleType;
  // Type-specific
  opacity?: number; // for fireflies
  pulsePhase?: number; // for firefly glow
  color?: string; // for leaves
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let width = 0;
let height = 0;
let started = false;
let paused = false;
let frameSkip = 0;
let resizeRafId: number | null = null;
let prefersReducedMotion = false;
let currentSeason: Season = 'spring';

/* Particle count based on device capability */
function getParticleCount(): number {
  const isMobile = window.innerWidth < 640;
  const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  if (isMobile || isLowPower) return 15;
  return 30;
}

const PARTICLE_COUNT = getParticleCount();

/* Get current season from DOM attribute */
function getSeasonFromDOM(): Season {
  const season = document.documentElement.getAttribute('data-season');
  if (season === 'summer' || season === 'autumn' || season === 'winter' || season === 'spring') {
    return season;
  }
  // Auto-detect by month
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

/* Map season to particle type */
function getParticleType(season: Season): ParticleType {
  switch (season) {
    case 'spring':
      return 'petal';
    case 'summer':
      return 'firefly';
    case 'autumn':
      return 'leaf';
    case 'winter':
      return 'snowflake';
  }
}

/* Resize canvas */
function resize(): void {
  if (resizeRafId) return;
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null;
    if (!canvas) return;
    width = canvas.width = window.innerWidth * devicePixelRatio;
    height = canvas.height = window.innerHeight * devicePixelRatio;
  });
}

/* Create new particle based on type */
function newParticle(type: ParticleType): Particle {
  const base = {
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 0.5 + 0.3,
    tilt: Math.random() * Math.PI,
    drift: Math.random() * 0.3 + 0.1,
    vr: (Math.random() - 0.5) * 0.008,
    type
  };

  switch (type) {
    case 'petal':
      return {
        ...base,
        r: Math.random() * 10 + 5,
        vy: Math.random() * 0.35 + 0.3
      };
    case 'firefly':
      return {
        ...base,
        r: Math.random() * 3 + 2,
        vy: (Math.random() - 0.5) * 0.2, // float up and down
        opacity: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2
      };
    case 'leaf':
      return {
        ...base,
        r: Math.random() * 12 + 6,
        vy: Math.random() * 0.4 + 0.25,
        drift: Math.random() * 0.5 + 0.2, // more drift
        vr: (Math.random() - 0.5) * 0.015, // more rotation
        color: ['#ff6b35', '#f7931e', '#c73e1d', '#a62c2c'][Math.floor(Math.random() * 4)]
      };
    case 'snowflake':
      return {
        ...base,
        r: Math.random() * 4 + 2,
        vy: Math.random() * 0.3 + 0.15,
        drift: Math.random() * 0.15 + 0.05 // gentle drift
      };
  }
}

/* Initialize particles */
function initParticles(): void {
  const type = getParticleType(currentSeason);
  particles = Array.from({ length: PARTICLE_COUNT }, () => newParticle(type));
}

/* Draw petal (pink sakura) */
function drawPetal(p: Particle): void {
  if (!ctx) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.sin(p.tilt) * 0.6);
  ctx.scale(1, 0.7);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
  g.addColorStop(0, `rgba(255,255,255,${0.6 * p.z})`);
  g.addColorStop(0.5, `rgba(255,179,209,${0.35 * p.z})`);
  g.addColorStop(1, 'rgba(255,194,214,0)');

  ctx.beginPath();
  ctx.fillStyle = g;
  ctx.arc(0, 0, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* Draw firefly (glowing yellow dot) */
function drawFirefly(p: Particle): void {
  if (!ctx) return;

  // Pulse effect
  p.pulsePhase = (p.pulsePhase || 0) + 0.05;
  const glow = (Math.sin(p.pulsePhase) + 1) / 2;
  const alpha = 0.3 + glow * 0.7;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Outer glow
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 3);
  g.addColorStop(0, `rgba(255,255,150,${alpha * 0.8})`);
  g.addColorStop(0.3, `rgba(255,230,100,${alpha * 0.4})`);
  g.addColorStop(1, 'rgba(255,200,50,0)');

  ctx.beginPath();
  ctx.fillStyle = g;
  ctx.arc(0, 0, p.r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.fillStyle = `rgba(255,255,200,${alpha})`;
  ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* Draw leaf (orange/red falling leaf) */
function drawLeaf(p: Particle): void {
  if (!ctx) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.tilt);
  ctx.scale(1, 0.6);

  const color = p.color || '#ff6b35';
  const alpha = 0.7 * p.z;

  // Leaf shape (simple oval with point)
  ctx.beginPath();
  ctx.moveTo(0, -p.r);
  ctx.bezierCurveTo(p.r * 0.8, -p.r * 0.5, p.r * 0.8, p.r * 0.5, 0, p.r);
  ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.5, -p.r * 0.8, -p.r * 0.5, 0, -p.r);

  ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
  // Fallback for hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  }
  ctx.fill();

  // Leaf vein
  ctx.beginPath();
  ctx.moveTo(0, -p.r * 0.8);
  ctx.lineTo(0, p.r * 0.8);
  ctx.strokeStyle = `rgba(100,50,20,${alpha * 0.5})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/* Draw snowflake (white crystal) */
function drawSnowflake(p: Particle): void {
  if (!ctx) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.tilt);

  const alpha = 0.7 * p.z;
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
  ctx.lineWidth = 1;

  // Simple 6-point star
  const arms = 6;
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * p.r, Math.sin(angle) * p.r);
    ctx.stroke();

    // Small branches
    const branchLen = p.r * 0.4;
    const branchX = Math.cos(angle) * p.r * 0.6;
    const branchY = Math.sin(angle) * p.r * 0.6;
    ctx.beginPath();
    ctx.moveTo(branchX, branchY);
    ctx.lineTo(
      branchX + Math.cos(angle + 0.5) * branchLen,
      branchY + Math.sin(angle + 0.5) * branchLen
    );
    ctx.moveTo(branchX, branchY);
    ctx.lineTo(
      branchX + Math.cos(angle - 0.5) * branchLen,
      branchY + Math.sin(angle - 0.5) * branchLen
    );
    ctx.stroke();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, p.r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* Draw particle based on type */
function drawParticle(p: Particle): void {
  switch (p.type) {
    case 'petal':
      drawPetal(p);
      break;
    case 'firefly':
      drawFirefly(p);
      break;
    case 'leaf':
      drawLeaf(p);
      break;
    case 'snowflake':
      drawSnowflake(p);
      break;
  }
}

/* Update particle position */
function updateParticle(p: Particle): void {
  // Movement based on type
  if (p.type === 'firefly') {
    // Fireflies float randomly
    p.y += p.vy * p.z;
    p.x += Math.sin(p.tilt) * p.drift * 2;
    p.tilt += p.vr * 3;

    // Bounce off edges
    if (p.y < p.r || p.y > height - p.r) p.vy *= -1;
    if (p.x < p.r) p.x = p.r;
    if (p.x > width - p.r) p.x = width - p.r;
  } else {
    // Fall down
    p.y += p.vy * p.z * 1.8;
    p.x += Math.sin(p.tilt) * p.drift * 1.8;
    p.tilt += p.vr;

    // Reset when off-screen
    if (p.y - p.r > height) {
      const np = newParticle(p.type);
      Object.assign(p, { ...np, y: -np.r });
    }

    // Wrap horizontally
    if (p.x - p.r > width) p.x = -p.r;
    if (p.x + p.r < 0) p.x = width + p.r;
  }
}

/* Animation loop */
function loop(): void {
  if (!ctx) return;

  if (paused || prefersReducedMotion) {
    requestAnimationFrame(loop);
    return;
  }

  if (frameSkip > 0) {
    frameSkip--;
    requestAnimationFrame(loop);
    return;
  }

  // Check if season changed
  const newSeason = getSeasonFromDOM();
  if (newSeason !== currentSeason) {
    currentSeason = newSeason;
    initParticles();
  }

  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    updateParticle(particles[i]);
    drawParticle(particles[i]);
  }

  frameSkip = document.hidden ? 1 : 0;
  requestAnimationFrame(loop);
}

/* Start animation */
function start(): void {
  if (started || !canvas || !ctx) return;

  started = true;
  currentSeason = getSeasonFromDOM();
  resize();
  initParticles();
  loop();

  window.addEventListener('resize', resize);
}

export function pause(): void {
  paused = true;
}

export function resume(): void {
  paused = false;
}

/* Initialize */
export function init(): void {
  const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = motionMQ.matches;
  motionMQ.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
  });

  // Skip on very small screens
  if (window.innerWidth < 480) return;

  canvas = document.getElementById('sakura-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  ctx = canvas.getContext?.('2d');
  if (!ctx) return;

  const trigger = () => {
    start();
    window.removeEventListener('pointerdown', trigger);
    window.removeEventListener('keydown', trigger);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => start(), { timeout: 2500 });
  } else {
    setTimeout(start, 1200);
  }

  window.addEventListener('pointerdown', trigger, { once: true });
  window.addEventListener('keydown', trigger, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  });
}
