import { useCallback, useEffect, useRef } from 'react';

interface UseFrostTiltOptions {
  maxDeg?: number;
  enabled?: boolean;
}

export function useFrostTilt<T extends HTMLElement = HTMLDivElement>({
  maxDeg = 6.5,
  enabled = true,
}: UseFrostTiltOptions = {}) {
  const ref = useRef<T | null>(null);
  const stateRef = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    raf: 0,
    lastTime: 0,
  });

  const step = useCallback(
    (now: number) => {
      const s = stateRef.current;
      const el = ref.current;
      if (!el || !enabled) {
        s.raf = 0;
        return;
      }

      const dtSec =
        s.lastTime > 0 ? Math.min(0.05, Math.max(0.001, (now - s.lastTime) / 1000)) : 1 / 60;
      s.lastTime = now;
      const alpha = 1 - Math.pow(1 - 0.18, dtSec * 60);

      s.rx += (s.targetRx - s.rx) * alpha;
      s.ry += (s.targetRy - s.ry) * alpha;

      el.style.transform = `perspective(1100px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;

      if (Math.abs(s.targetRx - s.rx) > 0.02 || Math.abs(s.targetRy - s.ry) > 0.02) {
        s.raf = window.requestAnimationFrame(step);
      } else {
        s.rx = s.targetRx;
        s.ry = s.targetRy;
        el.style.transform =
          s.rx === 0 && s.ry === 0
            ? ''
            : `perspective(1100px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
        s.lastTime = 0;
        s.raf = 0;
      }
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (!enabled || e.pointerType === 'touch') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const s = stateRef.current;
      s.targetRx = -ny * maxDeg;
      s.targetRy = nx * maxDeg;
      if (!s.raf) {
        s.lastTime = performance.now();
        s.raf = window.requestAnimationFrame(step);
      }
    },
    [enabled, maxDeg, step]
  );

  const onPointerLeave = useCallback(() => {
    const s = stateRef.current;
    s.targetRx = 0;
    s.targetRy = 0;
    if (!s.raf && ref.current) {
      s.lastTime = performance.now();
      s.raf = window.requestAnimationFrame(step);
    }
  }, [step]);

  const reset = useCallback(() => {
    const s = stateRef.current;
    if (s.raf) {
      window.cancelAnimationFrame(s.raf);
      s.raf = 0;
    }
    s.rx = 0;
    s.ry = 0;
    s.targetRx = 0;
    s.targetRy = 0;
    s.lastTime = 0;
    if (ref.current) {
      ref.current.style.transform = '';
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  useEffect(() => {
    return () => {
      if (stateRef.current.raf) {
        window.cancelAnimationFrame(stateRef.current.raf);
      }
    };
  }, []);

  return { ref, onPointerMove, onPointerLeave, reset };
}
