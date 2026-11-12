import { useCallback, useEffect, useMemo, useState } from 'react';
import { PROFILE } from '../data/profile';

interface IntroSceneProps {
  backgroundUrl: string;
  onComplete: () => void;
}

interface IntroFlake {
  id: number;
  left: string;
  size: string;
  opacity: number;
  duration: string;
  delay: string;
  drift: string;
}

export function IntroScene({ backgroundUrl, onComplete }: IntroSceneProps) {
  const [leaving, setLeaving] = useState(false);

  const flakes = useMemo<IntroFlake[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${(Math.random() * 100).toFixed(1)}%`,
      size: `${(1.2 + Math.random() * 3).toFixed(1)}px`,
      opacity: Number((0.22 + Math.random() * 0.55).toFixed(2)),
      duration: `${(8.5 + Math.random() * 12).toFixed(1)}s`,
      delay: `${(-Math.random() * 16).toFixed(1)}s`,
      drift: `${(16 + Math.random() * 68).toFixed(1)}px`,
    }));
  }, []);

  const dismiss = useCallback(() => {
    setLeaving((prev) => (prev ? prev : true));
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    const autoTimer = window.setTimeout(() => {
      dismiss();
    }, 3600);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(autoTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dismiss, onComplete]);

  useEffect(() => {
    if (!leaving) return;
    const finishTimer = window.setTimeout(() => {
      onComplete();
    }, 820);
    return () => window.clearTimeout(finishTimer);
  }, [leaving, onComplete]);

  return (
    <div
      role="presentation"
      onClick={dismiss}
      className={`fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#06090e] text-[#f4fbff] select-none transition-all duration-700 ease-out ${
        leaving ? 'pointer-events-none opacity-0 scale-[1.03] blur-[4px]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Atmospheric Backdrop + Drifting Mist */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center scale-105 opacity-75"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(5, 7, 9, 0.42) 0%, rgba(5, 7, 9, 0.62) 100%), url(${backgroundUrl})`,
        }}
      />
      <div aria-hidden="true" className="intro-mist-layer pointer-events-none absolute -inset-[20%]" />

      {/* Falling Intro Snow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {flakes.map((f) => (
          <span
            key={f.id}
            className="intro-flake"
            style={{
              left: f.left,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDuration: f.duration,
              animationDelay: f.delay,
              ['--intro-drift' as string]: f.drift,
            }}
          />
        ))}
      </div>

      {/* Centered Lockup (inspired by phantom-site, refined with eyebrow, frost line & skip hint) */}
      <div className="intro-lockup relative z-10 flex flex-col items-center px-6 text-center">
        <span className="mb-3 text-[11px] font-semibold tracking-[0.28em] text-[#cbe4fa]/75 uppercase">
          {PROFILE.eyebrow}
        </span>

        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -inset-y-5 rounded-full bg-[radial-gradient(circle,rgba(163,212,255,0.22)_0%,rgba(163,212,255,0)_72%)] blur-xl"
          />
          <h1 className="relative font-display text-4xl font-bold tracking-[0.04em] text-[#f4fbff] drop-shadow-[0_0_28px_rgba(163,212,255,0.38)] sm:text-5xl md:text-6xl">
            {PROFILE.nickname}
          </h1>
        </div>

        <div className="intro-divider mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[#cfe8ff]/70 to-transparent" />
      </div>

      {/* Subtle Skip Hint */}
      <p className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.14em] text-[#cfe4f7]/45 uppercase">
        Нажмите в любое место, чтобы пропустить
      </p>
    </div>
  );
}
