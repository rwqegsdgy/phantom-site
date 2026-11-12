import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Maximize2,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PROFILE, SOCIAL_LINKS, TrackItem } from '../data/profile';
import { useFrostTilt } from '../hooks/useFrostTilt';
import { DiscordIcon, GitHubIcon, ServerIcon, SteamIcon } from './BrandIcons';

interface HeroSectionProps {
  tracks: TrackItem[];
  activeTrackIndex: number;
  isPlaying: boolean;
  musicOpen: boolean;
  elapsed: number;
  duration: number;
  volume: number;
  audioEnergy: number;
  getFrequencyData: (target: Uint8Array<ArrayBuffer>) => number;
  getTimeDomainData: (target: Uint8Array<ArrayBuffer>) => void;
  onToggleMusicPanel: () => void;
  onTogglePlay: () => void;
  onSelectTrack: (index: number) => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onEnterZen: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function renderSocialIcon(id: string) {
  switch (id) {
    case 'steam':
    case 'steam2':
      return <SteamIcon className="h-[22px] w-[22px]" />;
    case 'discord':
      return <DiscordIcon className="h-[22px] w-[22px]" />;
    case 'server':
      return <ServerIcon className="h-[22px] w-[22px]" />;
    case 'github':
      return <GitHubIcon className="h-[22px] w-[22px]" />;
    default:
      return null;
  }
}

export function HeroSection({
  tracks,
  activeTrackIndex,
  isPlaying,
  musicOpen,
  elapsed,
  duration,
  volume,
  audioEnergy,
  getFrequencyData,
  getTimeDomainData,
  onToggleMusicPanel,
  onTogglePlay,
  onSelectTrack,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onEnterZen,
}: HeroSectionProps) {
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const mainTilt = useFrostTilt<HTMLDivElement>({ maxDeg: 6.5, enabled: true });
  const musicTilt = useFrostTilt<HTMLDivElement>({ maxDeg: 6.5, enabled: musicOpen });

  // Persistent visualizer state across pause/resume so bars freeze on pause and resume smoothly
  const visStateRef = useRef({
    smoothed: new Float32Array(34),
    peaks: new Float32Array(34),
    wave: new Float32Array(64),
    hasPlayed: false,
  });

  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [drawerSettled, setDrawerSettled] = useState(musicOpen);

  const currentTrack = tracks[activeTrackIndex] ?? tracks[0];
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  useEffect(() => {
    setCoverError(false);
  }, [currentTrack.coverUrl]);

  useEffect(() => {
    if (!musicOpen) {
      setDrawerSettled(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setDrawerSettled(true);
    }, 410);
    return () => window.clearTimeout(timer);
  }, [musicOpen]);

  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const getFreqRef = useRef(getFrequencyData);
  const getTimeRef = useRef(getTimeDomainData);
  const paintSnapshotRef = useRef<() => void>(() => {});

  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;
  getFreqRef.current = getFrequencyData;
  getTimeRef.current = getTimeDomainData;

  // Paint helper: draws current live OR frozen visualizer state onto the canvas
  useEffect(() => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 34;

    const paintSnapshot = () => {
      const w = canvas.clientWidth;
      const h = 84;
      if (w <= 0) return;

      const { smoothed, peaks, wave, hasPlayed } = visStateRef.current;
      const playing = isPlayingRef.current;
      const vol = volumeRef.current;
      const frozen = !playing && hasPlayed;

      ctx.clearRect(0, 0, w, h);

      const gap = 4;
      const barWidth = Math.max(3, (w - gap * (barCount - 1)) / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = hasPlayed ? smoothed[i] : 0.02;
        const barH = Math.max(3, val * (h - 10));
        const x = i * (barWidth + gap);
        const y = h - barH;

        const grad = ctx.createLinearGradient(0, y, 0, h);
        if (playing && vol > 0) {
          grad.addColorStop(0, 'rgba(225, 244, 255, 0.94)');
          grad.addColorStop(0.55, 'rgba(155, 212, 255, 0.6)');
          grad.addColorStop(1, 'rgba(95, 162, 224, 0.14)');
        } else if (frozen) {
          grad.addColorStop(0, 'rgba(215, 238, 255, 0.82)');
          grad.addColorStop(0.55, 'rgba(148, 206, 250, 0.52)');
          grad.addColorStop(1, 'rgba(95, 162, 224, 0.14)');
        } else {
          grad.addColorStop(0, 'rgba(175, 214, 245, 0.28)');
          grad.addColorStop(1, 'rgba(110, 168, 224, 0.08)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();

        if (hasPlayed && peaks[i] > 0.06) {
          const capY = Math.max(2, h - peaks[i] * (h - 10) - 4);
          ctx.fillStyle = frozen
            ? 'rgba(232, 244, 255, 0.72)'
            : 'rgba(240, 249, 255, 0.86)';
          ctx.fillRect(x, capY, barWidth, 2);
        }
      }

      if (hasPlayed && (vol > 0 || frozen)) {
        ctx.beginPath();
        for (let i = 0; i < 64; i++) {
          const px = (i / 63) * w;
          const py = h * 0.42 + wave[i] * 22;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = frozen
          ? 'rgba(215, 238, 255, 0.36)'
          : 'rgba(226, 245, 255, 0.45)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
    };

    paintSnapshotRef.current = paintSnapshot;

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      if (w <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const h = 84;
      const nextW = Math.floor(w * dpr);
      const nextH = Math.floor(h * dpr);

      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      paintSnapshot();
    };

    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    return () => {
      ro.disconnect();
    };
  }, [musicOpen]);

  // Animation loop: runs only while playing; pauses without clearing canvas
  useEffect(() => {
    if (!isPlaying) {
      paintSnapshotRef.current();
      return;
    }

    const fftBins = new Uint8Array(512);
    const waveBins = new Uint8Array(1024);
    const barCount = 34;
    const rawBands = new Float32Array(barCount);
    const { smoothed, peaks, wave } = visStateRef.current;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const dt60 = dtSec * 60;

      visStateRef.current.hasPlayed = true;
      getFreqRef.current(fftBins);
      getTimeRef.current(waveBins);

      const minBin = 1;
      const maxBin = 115;

      for (let i = 0; i < barCount; i++) {
        const t0 = i / barCount;
        const t1 = (i + 1) / barCount;
        const b0 = Math.floor(minBin * Math.pow(maxBin / minBin, t0));
        const b1 = Math.max(b0 + 1, Math.floor(minBin * Math.pow(maxBin / minBin, t1)));

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
      const peakDrop = 0.011 * dt60;
      const vol = volumeRef.current;

      for (let i = 0; i < barCount; i++) {
        const left = rawBands[Math.max(0, i - 1)];
        const curr = rawBands[i];
        const right = rawBands[Math.min(barCount - 1, i + 1)];
        const blended = left * 0.16 + curr * 0.68 + right * 0.16;

        const target = vol > 0 ? Math.max(0.03, blended) : 0.02;
        const factor = target > smoothed[i] ? lerpUp : lerpDown;
        smoothed[i] += (target - smoothed[i]) * factor;

        if (smoothed[i] > peaks[i]) {
          peaks[i] = smoothed[i];
        } else {
          peaks[i] = Math.max(smoothed[i], peaks[i] - peakDrop);
        }
      }

      const slice = Math.floor(waveBins.length / 64);
      for (let i = 0; i < 64; i++) {
        wave[i] = vol > 0 ? (waveBins[i * slice] - 128) / 128 : 0;
      }

      paintSnapshotRef.current();
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isPlaying, musicOpen]);

  return (
    <section
      id="profile"
      className="relative z-20 mx-auto flex min-h-[100svh] max-w-[1220px] items-center justify-center px-4 py-10 sm:px-8"
    >
      <div
        className={`flex w-full flex-col items-center justify-center transition-[gap] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex-row lg:items-stretch ${
          musicOpen ? 'gap-6' : 'gap-0'
        }`}
      >
        {/* Main Menu Card (outer div handles frost-rise entrance so inner card's 3D tilt transform works freely) */}
        <div className="animate-frost-rise w-full max-w-[540px] shrink-0">
          <div
            ref={mainTilt.ref}
            onPointerMove={mainTilt.onPointerMove}
            onPointerLeave={mainTilt.onPointerLeave}
            style={{ willChange: 'transform' }}
            className="w-full rounded-[28px] border border-[#dceefa]/22 bg-[#0a0f18]/34 p-7 sm:p-9 text-center backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_14px_32px_rgba(0,0,0,0.22)]"
          >
          {/* Avatar + Title */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                aria-hidden="true"
                className="animate-frost-breathe pointer-events-none absolute -inset-3 rounded-full transition-opacity duration-300"
                style={{
                  background:
                    'radial-gradient(circle, rgba(178, 224, 255, 0.38) 0%, rgba(178, 224, 255, 0) 70%)',
                  opacity: isPlaying ? 0.55 + audioEnergy * 0.45 : undefined,
                }}
              />
              {avatarError ? (
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#eaf6ff]/65 bg-gradient-to-br from-[#162131] to-[#0a0f17] font-display text-2xl font-bold text-[#d8ecff]">
                  TP
                </div>
              ) : (
                <img
                  src={PROFILE.avatarUrl}
                  alt={`Аватар ${PROFILE.nickname}`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  draggable={false}
                  className="relative h-28 w-28 rounded-full border-2 border-[#eaf6ff]/60 object-cover shadow-[0_0_0_6px_rgba(255,255,255,0.07)] transition-all duration-300 hover:scale-[1.03] hover:border-[#eef7ff] hover:shadow-[0_0_24px_rgba(179,221,255,0.45)] hover:brightness-110"
                />
              )}
            </div>

            <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-[#d6d6d8] uppercase">
              {PROFILE.eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#f5f9fe] drop-shadow-[0_0_20px_rgba(182,222,255,0.22)] sm:text-4xl">
              {PROFILE.nickname}
            </h1>
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#ffffff]/25 to-transparent" />

          {/* 5-Column Social Grid */}
          <div>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-[1.28fr_0.82fr_1fr_0.95fr_1fr] sm:gap-2">
              {SOCIAL_LINKS.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ animationDelay: `${110 + idx * 55}ms` }}
                  className="animate-frost-pop flex min-w-0 flex-col items-center"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.label}: ${item.handle}`}
                    title={`${item.label}: ${item.handle}`}
                    className="group flex h-[54px] w-[54px] items-center justify-center rounded-xl border border-[#ffffff]/28 bg-[#ffffff]/[0.09] text-[#ffffff] transition-all duration-200 hover:-translate-y-1 hover:border-[#cfe6ff]/50 hover:bg-[#ffffff]/[0.2] hover:shadow-[0_0_18px_rgba(174,223,255,0.34)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                  >
                    <span className="transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(190,228,255,0.5)]">
                      {renderSocialIcon(item.id)}
                    </span>
                  </a>
                  <span className="mt-2 block w-full text-[11.5px] font-semibold text-[#eef4fa] drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
                    {item.label}
                  </span>
                  {item.id === 'steam' ? (
                    <span className="mt-0.5 block w-full whitespace-nowrap text-[10.5px] font-medium leading-snug text-[#dde6f0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      The_Phantom-_-
                    </span>
                  ) : item.id === 'steam2' ? (
                    <span className="mt-0.5 block w-full text-xs font-bold tracking-[0.22em] leading-snug text-[#f2f7fd] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      ...
                    </span>
                  ) : (
                    <span className="mt-0.5 block w-full truncate text-[10.5px] leading-snug text-[#dde6f0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {item.handle}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#ffffff]/25 to-transparent" />

          {/* Slide-Out Music Trigger + Compact Subtle Cinema Mode Button */}
          <div className="flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onToggleMusicPanel}
              aria-expanded={musicOpen}
              aria-controls="music"
              className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                musicOpen
                  ? 'bg-[#d4ebff] text-[#070a0f] shadow-[0_0_22px_rgba(174,223,255,0.45)] hover:bg-[#e8f5ff]'
                  : 'border border-[#ffffff]/24 bg-[#ffffff]/[0.1] text-[#f4f8fd] hover:-translate-y-0.5 hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.18] hover:shadow-[0_0_18px_rgba(174,223,255,0.28)] active:shadow-[0_0_24px_rgba(195,235,255,0.55)]'
              }`}
            >
              <Music2 className={`h-4 w-4 transition-transform duration-300 ${isPlaying ? 'animate-pulse' : ''}`} />
              {musicOpen ? 'Скрыть музыку' : isPlaying ? 'Музыка играет' : 'Открыть музыку'}
            </button>

            <button
              type="button"
              onClick={onEnterZen}
              title="Кинорежим"
              className="inline-flex h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#ffffff]/14 bg-[#ffffff]/[0.05] px-3 text-[11.5px] font-medium text-[#c5d6e8]/80 whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfe6ff]/30 hover:bg-[#ffffff]/[0.12] hover:text-[#f2f8ff] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Кинорежим</span>
            </button>
          </div>
          </div>
        </div>

        {/* Smooth Slide-Out Drawer Wrapper: drops clipping & transform once settled so backdrop-blur matches the main card 1:1 */}
        <div
          aria-hidden={!musicOpen}
          className={`transition-[width,max-height,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            musicOpen && drawerSettled ? 'overflow-visible' : 'overflow-clip'
          } ${
            musicOpen
              ? 'w-full max-w-[540px] max-h-[600px] opacity-100 lg:w-[460px] lg:max-h-none'
              : 'w-full max-w-[540px] max-h-0 opacity-0 pointer-events-none lg:w-0 lg:max-h-none'
          }`}
        >
          <div
            className={`h-full w-full lg:w-[460px] transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              musicOpen
                ? 'transform-none opacity-100'
                : '-translate-x-5 scale-[0.96] opacity-0'
            }`}
          >
            <div
              id="music"
              ref={musicTilt.ref}
              onPointerMove={musicTilt.onPointerMove}
              onPointerLeave={musicTilt.onPointerLeave}
              style={{ willChange: 'transform' }}
              className="flex h-full w-full flex-col justify-between rounded-[28px] border border-[#dceefa]/22 bg-[#0a0f18]/34 p-6 sm:p-8 backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_14px_32px_rgba(0,0,0,0.22)]"
            >
          {/* Track Cover & Real-Time Audio Spectrum Canvas with integrated collapse button */}
          <div className="rounded-2xl border border-[#ffffff]/14 bg-transparent p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  key={currentTrack.id}
                  className={`animate-cover-swap relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-[#0d131c] transition-all duration-500 ${
                    isPlaying
                      ? 'border-[#cfe8ff]/45 shadow-[0_0_18px_rgba(174,223,255,0.28)]'
                      : 'border-[#ffffff]/20'
                  }`}
                >
                  {coverError ? (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#182334] to-[#0a0e15] text-xs text-[#9cb4cb]">
                      Трек
                    </div>
                  ) : (
                    <img
                      src={currentTrack.coverUrl}
                      alt={`Обложка трека ${currentTrack.title}`}
                      referrerPolicy="no-referrer"
                      onError={() => setCoverError(true)}
                      draggable={false}
                      className={`h-full w-full object-cover transition-transform duration-700 ${
                        isPlaying ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  )}
                </div>

                <div key={`${currentTrack.id}-meta`} className="animate-track-swap min-w-0 flex-1">
                  <h2 className="truncate font-display text-xl font-bold text-[#ffffff]">
                    {currentTrack.title}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[#d1d9e2]">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleMusicPanel}
                aria-label="Свернуть панель музыки"
                title="Свернуть"
                className="flex h-[38px] w-[38px] shrink-0 self-start items-center justify-center rounded-lg border border-[#ffffff]/20 bg-[#ffffff]/[0.08] text-[#e3effa] transition-all duration-150 hover:border-[#ffffff]/38 hover:bg-[#ffffff]/[0.18] hover:shadow-[0_0_14px_rgba(174,223,255,0.28)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 border-t border-[#ffffff]/12 pt-3">
              <canvas
                ref={specCanvasRef}
                aria-label="Визуализатор звукового спектра"
                className="block w-full"
              />
            </div>
          </div>

          {/* Track Switcher with Sliding Pill + GPU Sub-Pixel Seek & Volume Sliders */}
          <div className="mt-5 space-y-4">
            <div
              role="tablist"
              aria-label="Выбор трека"
              className="relative grid grid-cols-3 rounded-xl border border-[#ffffff]/18 bg-[#ffffff]/[0.07] p-1"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-[#d4ebff] shadow-[0_0_14px_rgba(174,223,255,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  width: `calc((100% - 8px) / ${Math.max(1, tracks.length)})`,
                  transform: `translate3d(${activeTrackIndex * 100}%, 0, 0)`,
                }}
              />
              {tracks.map((track, idx) => {
                const active = idx === activeTrackIndex;
                return (
                  <button
                    key={track.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onSelectTrack(idx)}
                    className={`relative z-10 min-h-[38px] truncate rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                      active
                        ? 'text-[#070a0f] font-semibold'
                        : 'text-[#cad8e6] hover:text-white'
                    }`}
                  >
                    {track.title}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {/* Seek row: custom GPU sub-pixel glowing bar + non-glowing white dot over accessible invisible range */}
              <div className="flex items-center gap-3 text-xs text-[#cbd7e1] font-mono tabular-nums">
                <span className="w-10 text-left">{formatTime(elapsed)}</span>
                <div className="group relative flex flex-1 min-w-0 items-center">
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#d5e8f5]/24" />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 rounded-full bg-[#dff3ff]"
                    style={{
                      transform: `translate3d(0, -50%, 0) scaleX(${Math.max(0, Math.min(1, progressPct / 100))})`,
                      opacity: progressPct > 0.05 ? 1 : 0,
                      willChange: 'transform',
                      boxShadow:
                        '0 0 6px 2px rgba(174, 223, 255, 0.78), 0 0 16px 4px rgba(114, 188, 244, 0.48), 0 0 26px 6px rgba(130, 198, 255, 0.22)',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      transform: `translate3d(${Math.max(0, Math.min(100, progressPct))}%, 0, 0)`,
                      willChange: 'transform',
                    }}
                  >
                    <div className="absolute left-0 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4f9ff] transition-transform duration-150 group-hover:scale-[1.2]" />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step="any"
                    value={Math.min(elapsed, duration)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    aria-label="Перемотка трека"
                    className="relative z-10 h-7 w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="w-10 text-right">{formatTime(duration)}</span>
              </div>

              {/* Playback + Volume row (flex-nowrap keeps volume cleanly aligned, zero wrapping/teleporting) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={onPrevTrack}
                    aria-label="Предыдущий трек"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#ffffff]/20 bg-[#ffffff]/[0.08] text-[#e9f5ff] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ffffff]/[0.18] hover:shadow-[0_0_14px_rgba(174,223,255,0.28)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    className={`flex h-9 sm:h-10 min-w-[104px] sm:min-w-[116px] items-center justify-center gap-2 rounded-xl bg-[#d4ebff] px-3.5 sm:px-4 text-xs font-semibold text-[#070a0f] whitespace-nowrap shrink-0 transition-all duration-200 hover:bg-[#edf6ff] hover:shadow-[0_0_22px_rgba(174,223,255,0.55)] active:scale-95 active:shadow-[0_0_28px_rgba(195,235,255,0.72)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                      isPlaying ? 'shadow-[0_0_18px_rgba(174,223,255,0.42)]' : ''
                    }`}
                  >
                    {isPlaying ? (
                      <span key="pause" className="animate-icon-pop inline-flex items-center gap-2">
                        <Pause className="h-4 w-4" />
                        Пауза
                      </span>
                    ) : (
                      <span key="play" className="animate-icon-pop inline-flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Слушать
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onNextTrack}
                    aria-label="Следующий трек"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#ffffff]/20 bg-[#ffffff]/[0.08] text-[#e9f5ff] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ffffff]/[0.18] hover:shadow-[0_0_14px_rgba(174,223,255,0.28)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onVolumeChange(volume > 0 ? 0 : 35)}
                    aria-label={volume === 0 ? 'Включить звук' : 'Выключить звук'}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-[#ffffff]/18 bg-[#ffffff]/[0.07] text-[#e3effa] transition-all duration-150 hover:bg-[#ffffff]/[0.16] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                  >
                    {volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>

                  <div className="group relative flex w-20 items-center sm:w-24">
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#d5e8f5]/24" />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 rounded-full bg-[#dff3ff]"
                      style={{
                        transform: `translate3d(0, -50%, 0) scaleX(${Math.max(0, Math.min(1, volume / 100))})`,
                        opacity: volume > 0 ? 1 : 0,
                        willChange: 'transform',
                        boxShadow:
                          '0 0 6px 2px rgba(174, 223, 255, 0.78), 0 0 16px 4px rgba(114, 188, 244, 0.48), 0 0 26px 6px rgba(130, 198, 255, 0.22)',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        transform: `translate3d(${Math.max(0, Math.min(100, volume))}%, 0, 0)`,
                        willChange: 'transform',
                      }}
                    >
                      <div className="absolute left-0 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4f9ff] transition-transform duration-150 group-hover:scale-[1.2]" />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step="any"
                      value={volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      aria-label="Громкость звука"
                      className="relative z-10 h-7 w-full cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
