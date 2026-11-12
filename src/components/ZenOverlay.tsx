import { useEffect, useRef, useState } from 'react';
import { Minimize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { PROFILE, TrackItem } from '../data/profile';
import { useFrostTilt } from '../hooks/useFrostTilt';

interface ZenOverlayProps {
  open: boolean;
  track: TrackItem;
  customTrackName: string | null;
  isPlaying: boolean;
  volume: number;
  getFrequencyData: (target: Uint8Array<ArrayBuffer>) => number;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onExit: () => void;
}

export function ZenOverlay({
  open,
  track,
  customTrackName,
  isPlaying,
  volume,
  getFrequencyData,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onExit,
}: ZenOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const barTilt = useFrostTilt<HTMLDivElement>({ maxDeg: 6.5, enabled: open });
  const visStateRef = useRef({
    smoothed: new Float32Array(48),
    hasPlayed: false,
  });

  const [uiVisible, setUiVisible] = useState(true);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    if (!open) return;

    setUiVisible(true);
    const scheduleHide = () => {
      setUiVisible(true);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        setUiVisible(false);
      }, 2200);
    };

    scheduleHide();

    const update = () => {
      setClock(
        new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const clockTimer = window.setInterval(update, 15000);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      } else {
        scheduleHide();
      }
    };

    window.addEventListener('pointermove', scheduleHide, { passive: true });
    window.addEventListener('pointerdown', scheduleHide, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearInterval(clockTimer);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      window.removeEventListener('pointermove', scheduleHide);
      window.removeEventListener('pointerdown', scheduleHide);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onExit]);

  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const getFreqRef = useRef(getFrequencyData);
  const paintBarsRef = useRef<() => void>(() => {});

  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;
  getFreqRef.current = getFrequencyData;

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 48;

    const paintBars = () => {
      const w = canvas.clientWidth;
      const h = 64;
      if (w <= 0) return;

      const { smoothed, hasPlayed } = visStateRef.current;
      const playing = isPlayingRef.current;
      const vol = volumeRef.current;
      const frozen = !playing && hasPlayed;

      ctx.clearRect(0, 0, w, h);
      const gap = 5;
      const barWidth = Math.max(2, (w - gap * (barCount - 1)) / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = hasPlayed ? smoothed[i] : 0.02;
        const barH = Math.max(3, val * (h - 6));
        const x = i * (barWidth + gap);
        const y = h - barH;

        ctx.fillStyle =
          playing && vol > 0
            ? 'rgba(218, 240, 255, 0.8)'
            : frozen
              ? 'rgba(210, 236, 255, 0.65)'
              : 'rgba(180, 214, 245, 0.24)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }
    };

    paintBarsRef.current = paintBars;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      if (w <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const h = 64;
      const nextW = Math.floor(w * dpr);
      const nextH = Math.floor(h * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      paintBars();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!isPlaying) {
      paintBarsRef.current();
      return;
    }

    const fftBins = new Uint8Array(512);
    const barCount = 48;
    const rawBands = new Float32Array(barCount);
    const { smoothed } = visStateRef.current;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const dt60 = dtSec * 60;

      visStateRef.current.hasPlayed = true;
      getFreqRef.current(fftBins);

      for (let i = 0; i < barCount; i++) {
        const t0 = i / barCount;
        const t1 = (i + 1) / barCount;
        const b0 = Math.floor(1 * Math.pow(115, t0));
        const b1 = Math.max(b0 + 1, Math.floor(1 * Math.pow(115, t1)));

        let sumBin = 0;
        let peakBin = 0;
        let count = 0;
        for (let b = b0; b < b1 && b < fftBins.length; b++) {
          const v = fftBins[b];
          sumBin += v;
          if (v > peakBin) peakBin = v;
          count++;
        }

        const avgBin = count > 0 ? sumBin / count : 0;
        const blendedBin = (avgBin * 0.55 + peakBin * 0.45) / 255;
        const trebleWeight = 0.72 + t0 * 0.62;
        rawBands[i] = Math.min(1, Math.pow(blendedBin, 1.32) * trebleWeight);
      }

      const lerpUp = 1 - Math.pow(1 - 0.38, dt60);
      const lerpDown = 1 - Math.pow(1 - 0.18, dt60);
      const vol = volumeRef.current;

      for (let i = 0; i < barCount; i++) {
        const left = rawBands[Math.max(0, i - 1)];
        const curr = rawBands[i];
        const right = rawBands[Math.min(barCount - 1, i + 1)];
        const blended = left * 0.16 + curr * 0.68 + right * 0.16;

        const target = vol > 0 ? Math.max(0.03, blended) : 0.02;
        const factor = target > smoothed[i] ? lerpUp : lerpDown;
        smoothed[i] += (target - smoothed[i]) * factor;
      }

      paintBarsRef.current();
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [open, isPlaying]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Кинорежим"
      className={`animate-zen-enter fixed inset-0 z-40 flex flex-col items-center justify-between px-6 py-10 text-center ${
        uiVisible ? '' : 'cursor-none'
      }`}
    >
      {/* Top Bar */}
      <div
        className={`flex w-full max-w-4xl items-center justify-between transition-opacity duration-500 ${
          uiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="font-display text-sm font-semibold text-[#eef6ff]/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {PROFILE.nickname}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#dceefa]/22 bg-[#0a0f18]/34 px-4 py-2 text-xs font-medium text-[#eef6ff] backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_10px_24px_rgba(0,0,0,0.22)] whitespace-nowrap transition-all duration-150 hover:border-[#dceefa]/40 hover:bg-[#ffffff]/[0.12] hover:shadow-[0_0_18px_rgba(174,223,255,0.25)] active:scale-95"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Выйти (Esc)
        </button>
      </div>

      {/* Center Clock */}
      <div className="pointer-events-none select-none">
        <p className="font-mono text-6xl font-medium tracking-tight text-[#f2f7fd]/90 tabular-nums drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-7xl">
          {clock}
        </p>
        <p
          key={track.id}
          className="animate-track-swap mt-3 text-sm text-[#dce9f6]/88 drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]"
        >
          {customTrackName || `${track.title} — ${track.artist}`}
        </p>
      </div>

      {/* Spectrum + Playback Bar */}
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div className="w-full px-2">
          <canvas
            ref={canvasRef}
            aria-label="Спектр музыки в кинорежиме"
            className="block w-full"
          />
        </div>

        <div
          ref={barTilt.ref}
          onPointerMove={barTilt.onPointerMove}
          onPointerLeave={barTilt.onPointerLeave}
          style={{ willChange: 'transform' }}
          className={`flex items-center gap-3 rounded-[22px] border border-[#dceefa]/22 bg-[#0a0f18]/34 px-5 py-3 backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_14px_32px_rgba(0,0,0,0.22)] transition-opacity duration-500 ${
            uiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={onPrevTrack}
            aria-label="Предыдущий трек"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffffff]/20 bg-[#ffffff]/[0.08] text-[#e9f5ff] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ffffff]/[0.18] hover:text-white active:scale-90"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4ebff] text-[#070a0f] transition-all duration-150 hover:bg-[#edf6ff] hover:shadow-[0_0_18px_rgba(174,223,255,0.45)] active:scale-90"
          >
            {isPlaying ? (
              <span key="zen-pause" className="animate-icon-pop inline-flex">
                <Pause className="h-4 w-4" />
              </span>
            ) : (
              <span key="zen-play" className="animate-icon-pop inline-flex">
                <Play className="h-4 w-4" />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onNextTrack}
            aria-label="Следующий трек"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffffff]/20 bg-[#ffffff]/[0.08] text-[#e9f5ff] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ffffff]/[0.18] hover:text-white active:scale-90"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
