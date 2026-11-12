import { useEffect, useRef } from 'react';

export type SnowLevel = 'light' | 'calm' | 'blizzard';

interface AtmosphereCanvasProps {
  snowLevel: SnowLevel;
  audioEnergyRef: React.MutableRefObject<number>;
  zenOpen?: boolean;
}

interface Flake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  phase: number;
  depth: number;
}

interface TrailMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
}

export function AtmosphereCanvas({
  snowLevel,
  audioEnergyRef,
  zenOpen = false,
}: AtmosphereCanvasProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snowLevelRef = useRef(snowLevel);
  const zenOpenRef = useRef(zenOpen);

  useEffect(() => {
    snowLevelRef.current = snowLevel;
  }, [snowLevel]);

  useEffect(() => {
    zenOpenRef.current = zenOpen;
  }, [zenOpen]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !fgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d', { alpha: true });
    const fgCtx = fgCanvas.getContext('2d', { alpha: true });
    if (!bgCtx || !fgCtx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextW = Math.floor(width * dpr);
      const nextH = Math.floor(height * dpr);

      bgCanvas.width = nextW;
      bgCanvas.height = nextH;
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fgCanvas.width = nextW;
      fgCanvas.height = nextH;
      fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Pre-rendered offscreen soft-glow particle sprite (eliminates expensive per-frame shadowBlur)
    const glowSprite = document.createElement('canvas');
    glowSprite.width = 64;
    glowSprite.height = 64;
    const gctx = glowSprite.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(245, 250, 255, 1)');
      grad.addColorStop(0.18, 'rgba(225, 239, 255, 0.72)');
      grad.addColorStop(0.45, 'rgba(186, 218, 255, 0.24)');
      grad.addColorStop(1, 'rgba(165, 194, 255, 0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);
    }

    const maxFlakes = 165;
    const flakes: Flake[] = Array.from({ length: maxFlakes }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.9 + depth * 2.6,
        speedY: 0.4 + depth * 1.15,
        speedX: -0.18 + Math.random() * 0.5,
        opacity: 0.18 + depth * 0.54,
        phase: Math.random() * Math.PI * 2,
        depth,
      };
    });

    const trails: TrailMote[] = [];
    const bursts: BurstParticle[] = [];

    let mouseX = -100;
    let mouseY = -100;
    let targetMouseX = -100;
    let targetMouseY = -100;
    let lastTrailX = -100;
    let lastTrailY = -100;
    let lastTrailAt = 0;
    let lastMoveAt = performance.now();
    let cursorOpacity = 1;
    let pointerActive = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!finePointer || e.pointerType === 'touch') return;
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      lastMoveAt = performance.now();
      if (!pointerActive) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        pointerActive = true;
      }

      const now = performance.now();
      if (
        now - lastTrailAt < 55 ||
        Math.hypot(e.clientX - lastTrailX, e.clientY - lastTrailY) < 7
      ) {
        return;
      }
      lastTrailAt = now;
      lastTrailX = e.clientX;
      lastTrailY = e.clientY;

      trails.push({
        x: e.clientX,
        y: e.clientY,
        vx: (-10 + Math.random() * 20) / 56,
        vy: (10 + Math.random() * 20) / 56,
        radius: 1.4 + Math.random() * 1.4,
        life: 0,
        maxLife: 0.9,
      });
      if (trails.length > 55) trails.shift();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const count = 16;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 1.5 + Math.random() * 2.5;
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.4 + Math.random() * 1.8,
          life: 0,
          maxLife: 0.72 + Math.random() * 0.3,
        });
      }
    };

    const onPointerLeave = () => {
      pointerActive = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    let rafId = 0;
    let lastTime = performance.now();
    let elapsedTotal = 0;
    let currentFlakeTarget = 85;
    let currentSpeedMul = 1.05;
    let currentGust = 0.15;

    const render = (now: number) => {
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const dt60 = dtSec * 60;
      elapsedTotal += dtSec;

      bgCtx.clearRect(0, 0, width, height);
      fgCtx.clearRect(0, 0, width, height);

      const energy = audioEnergyRef.current || 0;

      // 1) Background layer: atmospheric moonlight mist + snowfall (behind cards)
      const mistOpacity = 0.09 + energy * 0.12;
      const mistGrad = bgCtx.createRadialGradient(
        width * 0.5 + Math.sin(elapsedTotal * 0.2) * width * 0.08,
        height * 0.98,
        20,
        width * 0.5,
        height * 0.98,
        Math.max(width, height) * 0.52
      );
      mistGrad.addColorStop(0, `rgba(155, 208, 255, ${mistOpacity.toFixed(3)})`);
      mistGrad.addColorStop(0.55, `rgba(110, 168, 224, ${(mistOpacity * 0.28).toFixed(3)})`);
      mistGrad.addColorStop(1, 'rgba(7, 10, 15, 0)');
      bgCtx.fillStyle = mistGrad;
      bgCtx.fillRect(0, 0, width, height);

      const level = snowLevelRef.current;
      const targetFlakes =
        level === 'blizzard' ? maxFlakes : level === 'calm' ? 88 : 34;
      const targetSpeed =
        level === 'blizzard' ? 1.95 : level === 'calm' ? 1.05 : 0.68;
      const targetGust =
        level === 'blizzard' ? 0.65 : level === 'calm' ? 0.16 : 0.06;

      const morph = 1 - Math.pow(1 - 0.06, dt60);
      currentFlakeTarget += (targetFlakes - currentFlakeTarget) * morph;
      currentSpeedMul += (targetSpeed - currentSpeedMul) * morph;
      currentGust += (targetGust - currentGust) * morph;

      const windBias =
        (pointerActive ? (mouseX / Math.max(width, 1) - 0.5) * 0.85 : 0) +
        currentGust;
      const activeCeil = Math.min(maxFlakes, Math.ceil(currentFlakeTarget));

      for (let i = 0; i < activeCeil; i++) {
        const f = flakes[i];
        const fadeWeight =
          i >= currentFlakeTarget - 1
            ? Math.max(0, Math.min(1, currentFlakeTarget - i))
            : 1;
        if (fadeWeight <= 0.01) continue;

        f.phase += 0.02 * dt60;
        f.y += f.speedY * currentSpeedMul * (1 + energy * 0.32) * dt60;
        f.x +=
          (f.speedX + windBias * (0.4 + f.depth) + Math.sin(f.phase) * 0.35) *
          currentSpeedMul *
          dt60;

        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;

        bgCtx.beginPath();
        bgCtx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        const alpha = Math.min(0.88, f.opacity + energy * 0.12) * fadeWeight;
        bgCtx.fillStyle = `rgba(232, 244, 255, ${alpha.toFixed(2)})`;
        bgCtx.fill();
      }

      // 2) Foreground layer: cursor orb, snow trail, and click ice bursts (in FRONT of all cards)
      const shouldHideZenCursor = zenOpenRef.current && now - lastMoveAt > 2200;
      const targetCursorOpacity = pointerActive && finePointer && !shouldHideZenCursor ? 1 : 0;
      cursorOpacity += (targetCursorOpacity - cursorOpacity) * (1 - Math.pow(1 - 0.14, dt60));

      if (pointerActive && finePointer && cursorOpacity > 0.01) {
        const lerpAlpha = 1 - Math.pow(1 - 0.24, dt60);
        mouseX += (targetMouseX - mouseX) * lerpAlpha;
        mouseY += (targetMouseY - mouseY) * lerpAlpha;

        fgCtx.globalAlpha = 0.85 * cursorOpacity;
        fgCtx.drawImage(glowSprite, mouseX - 38, mouseY - 38, 76, 76);

        fgCtx.globalAlpha = cursorOpacity;
        fgCtx.fillStyle = 'rgba(245, 249, 255, 0.96)';
        fgCtx.beginPath();
        fgCtx.arc(mouseX, mouseY, 3.5, 0, Math.PI * 2);
        fgCtx.fill();
        fgCtx.globalAlpha = 1;
      }

      for (let i = trails.length - 1; i >= 0; i--) {
        const m = trails[i];
        m.life += dtSec;
        m.x += m.vx * dt60;
        m.y += m.vy * dt60;
        if (m.life >= m.maxLife) {
          trails.splice(i, 1);
          continue;
        }
        const progress = m.life / m.maxLife;
        const alpha = (1 - progress) * 0.75;
        const size = m.radius * 4.5 * (1 - progress * 0.75);
        fgCtx.globalAlpha = alpha;
        fgCtx.drawImage(glowSprite, m.x - size * 0.5, m.y - size * 0.5, size, size);
      }

      const drag = Math.pow(0.94, dt60);
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life += dtSec;
        b.vx *= drag;
        b.vy = b.vy * drag + 0.03 * dt60;
        b.x += b.vx * dt60;
        b.y += b.vy * dt60;
        if (b.life >= b.maxLife) {
          bursts.splice(i, 1);
          continue;
        }
        const progress = b.life / b.maxLife;
        const alpha = (1 - progress) * 0.85;
        const size = b.radius * 4.2 * (1 - progress * 0.45);
        fgCtx.globalAlpha = alpha;
        fgCtx.drawImage(glowSprite, b.x - size * 0.5, b.y - size * 0.5, size, size);
      }

      fgCtx.globalAlpha = 1;
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [audioEnergyRef]);

  return (
    <>
      <canvas
        ref={bgCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 h-full w-full"
      />
      <canvas
        ref={fgCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[45] h-full w-full"
      />
    </>
  );
}
