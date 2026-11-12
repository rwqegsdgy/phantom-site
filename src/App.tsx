import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientAudioEngine } from './audio/ambientEngine';
import { AtmosphereBar } from './components/AtmosphereBar';
import { AtmosphereCanvas, SnowLevel } from './components/AtmosphereCanvas';
import { ContactSection } from './components/ContactSection';
import { HeroSection } from './components/HeroSection';
import { IntroScene } from './components/IntroScene';
import { ZenOverlay } from './components/ZenOverlay';
import { PROFILE, TRACKS, VISUAL_SCENES } from './data/profile';

export default function App() {
  const engineRef = useRef<AmbientAudioEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new AmbientAudioEngine();
  }

  const audioEnergyRef = useRef(0);
  const freqBufferRef = useRef(new Uint8Array(512));
  const backdropWrapRef = useRef<HTMLDivElement | null>(null);

  const [introDone, setIntroDone] = useState(false);
  const [snowLevel, setSnowLevel] = useState<SnowLevel>('calm');
  const [activeSceneId, setActiveSceneId] = useState(VISUAL_SCENES[0].id);
  const [zenOpen, setZenOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);

  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mp3Duration, setMp3Duration] = useState(TRACKS[0].durationSec);
  const [volume, setVolume] = useState(35);
  const [audioEnergy, setAudioEnergy] = useState(0);

  const activeTrack = TRACKS[activeTrackIndex] ?? TRACKS[0];
  const activeScene = VISUAL_SCENES.find((s) => s.id === activeSceneId) ?? VISUAL_SCENES[0];
  const duration = activeTrack.audioUrl ? mp3Duration : activeTrack.durationSec;

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    const mp3Audio = engine?.getMp3Audio();

    const onLoadedMetadata = () => {
      if (mp3Audio && Number.isFinite(mp3Audio.duration) && mp3Audio.duration > 0) {
        setMp3Duration(mp3Audio.duration);
      }
    };

    if (mp3Audio) {
      mp3Audio.addEventListener('loadedmetadata', onLoadedMetadata);
      mp3Audio.addEventListener('durationchange', onLoadedMetadata);
      if (Number.isFinite(mp3Audio.duration) && mp3Audio.duration > 0) {
        setMp3Duration(mp3Audio.duration);
      }
    }

    return () => {
      mp3Audio?.removeEventListener('loadedmetadata', onLoadedMetadata);
      mp3Audio?.removeEventListener('durationchange', onLoadedMetadata);
      engine?.dispose();
    };
  }, []);

  // Zero-re-render smooth GPU parallax for the background layer
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (motion.matches || !fine.matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let rafId = 0;

    const step = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      if (backdropWrapRef.current) {
        backdropWrapRef.current.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(1.06)`;
      }
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        rafId = window.requestAnimationFrame(step);
      } else {
        rafId = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * -14;
      ty = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * -10;
      if (!rafId) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Smooth 60fps+ progress tracking (extrapolates smoothly between Chromium ~250ms audio quanta)
  useEffect(() => {
    if (!isPlaying) {
      audioEnergyRef.current = 0;
      setAudioEnergy(0);
      return;
    }

    const mp3Audio = engineRef.current?.getMp3Audio();
    let smoothTime =
      engineRef.current?.getMode() === 'mp3' && mp3Audio
        ? mp3Audio.currentTime || 0
        : elapsed;
    let lastRawAudioTime = smoothTime;
    let lastEnergyTime = 0;
    let lastFrameTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dtSec = Math.min(0.08, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const activeMp3 = engineRef.current?.getMp3Audio();
      if (engineRef.current?.getMode() === 'mp3' && activeMp3) {
        const rawTime = activeMp3.currentTime || 0;
        const dur =
          Number.isFinite(activeMp3.duration) && activeMp3.duration > 0
            ? activeMp3.duration
            : activeTrack.durationSec;
        if (Number.isFinite(activeMp3.duration) && activeMp3.duration > 0) {
          setMp3Duration(activeMp3.duration);
        }

        if (rawTime !== lastRawAudioTime) {
          // Track jumped (seek or loop) vs normal playback tick
          if (Math.abs(rawTime - smoothTime) > 0.14) {
            smoothTime = rawTime;
          } else {
            // Gently pull toward hardware clock while preserving steady 1.0x velocity
            smoothTime += dtSec + (rawTime - smoothTime) * 0.15;
          }
          lastRawAudioTime = rawTime;
        } else if (!activeMp3.paused) {
          smoothTime = Math.min(dur, smoothTime + dtSec);
        }
        setElapsed(smoothTime);
      } else {
        smoothTime = smoothTime + dtSec >= activeTrack.durationSec ? 0 : smoothTime + dtSec;
        setElapsed(smoothTime);
      }

      if (now - lastEnergyTime >= 50) {
        lastEnergyTime = now;
        const energy = engineRef.current?.getFrequencyData(freqBufferRef.current) ?? 0;
        audioEnergyRef.current = energy;
        setAudioEnergy(energy);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activeTrackIndex, activeTrack.durationSec]);

  const getFrequencyData = useCallback((target: Uint8Array<ArrayBuffer>) => {
    const energy = engineRef.current?.getFrequencyData(target) ?? 0;
    audioEnergyRef.current = energy;
    return energy;
  }, []);

  const getTimeDomainData = useCallback((target: Uint8Array<ArrayBuffer>) => {
    engineRef.current?.getTimeDomainData(target);
  }, []);

  const handleTogglePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isPlaying) {
      if (engine.getMode() === 'mp3') {
        engine.pauseMp3();
      } else {
        engine.pauseSynth();
      }
      setIsPlaying(false);
    } else {
      if (activeTrack.audioUrl) {
        await engine.playMp3(activeTrack.audioUrl);
      } else {
        engine.setPreset(activeTrack.preset);
        await engine.playSynth();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, activeTrack]);

  const handleSelectTrack = useCallback(async (index: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const track = TRACKS[index];
    if (!track) return;

    setActiveTrackIndex(index);
    setElapsed(0);
    setMp3Duration(track.durationSec);

    if (track.audioUrl) {
      const mp3Audio = engine.getMp3Audio();
      const targetUrl = new URL(track.audioUrl, window.location.href).href;
      if (mp3Audio && mp3Audio.src === targetUrl) {
        mp3Audio.currentTime = 0;
      }
      await engine.playMp3(track.audioUrl);
    } else {
      engine.setPreset(track.preset);
      await engine.playSynth();
    }
    setIsPlaying(true);
  }, []);

  const handlePrevTrack = useCallback(() => {
    const nextIdx = (activeTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    handleSelectTrack(nextIdx);
  }, [activeTrackIndex, handleSelectTrack]);

  const handleNextTrack = useCallback(() => {
    const nextIdx = (activeTrackIndex + 1) % TRACKS.length;
    handleSelectTrack(nextIdx);
  }, [activeTrackIndex, handleSelectTrack]);

  const handleSeek = useCallback((seconds: number) => {
    const engine = engineRef.current;
    const mp3Audio = engine?.getMp3Audio();
    if (engine?.getMode() === 'mp3' && mp3Audio) {
      mp3Audio.currentTime = seconds;
    }
    setElapsed(seconds);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    setVolume(val);
    engineRef.current?.setVolume(val / 100);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#070a0f] text-[#f2f6fb]">
      {/* Entry Intro Scene from phantom-site */}
      {!introDone && (
        <IntroScene
          backgroundUrl={activeScene.imageUrl}
          onComplete={handleIntroComplete}
        />
      )}

      {/* Fixed Parallax Backdrop Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          ref={backdropWrapRef}
          style={{ transform: 'scale(1.06)', willChange: 'transform' }}
          className="relative h-full w-full"
        >
          {VISUAL_SCENES.map((scene) => {
            const isCurrent = scene.id === activeSceneId;
            return (
              <img
                key={scene.id}
                src={scene.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'
                }`}
              />
            );
          })}
        </div>

        {/* Smooth uniform atmospheric shading from phantom-site without any middle seam */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            zenOpen ? 'opacity-45' : 'opacity-100'
          }`}
          style={{
            background:
              'linear-gradient(180deg, rgba(5, 7, 9, 0.34) 0%, rgba(5, 7, 9, 0.53) 100%)',
          }}
        />
      </div>

      {/* Interactive Snow, Mist & phantom-site Cursor Glow + Trail */}
      <AtmosphereCanvas
        snowLevel={snowLevel}
        audioEnergyRef={audioEnergyRef}
        zenOpen={zenOpen}
      />

      {/* Main Content */}
      <div
        className={`relative z-20 transition-[opacity,transform] duration-700 ease-out ${
          !introDone
            ? 'pointer-events-none opacity-0 translate-y-3'
            : zenOpen
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
        }`}
      >
        <main>
          <HeroSection
            key={introDone ? 'entered' : 'waiting'}
            tracks={TRACKS}
            activeTrackIndex={activeTrackIndex}
            isPlaying={isPlaying}
            musicOpen={musicOpen}
            elapsed={elapsed}
            duration={duration}
            volume={volume}
            audioEnergy={audioEnergy}
            getFrequencyData={getFrequencyData}
            getTimeDomainData={getTimeDomainData}
            onToggleMusicPanel={() => setMusicOpen((prev) => !prev)}
            onTogglePlay={handleTogglePlay}
            onSelectTrack={handleSelectTrack}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onEnterZen={() => setZenOpen(true)}
          />

          <AtmosphereBar
            snowLevel={snowLevel}
            onSnowLevelChange={setSnowLevel}
            scenes={VISUAL_SCENES}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
          />

          <ContactSection />
        </main>

        <footer className="relative z-20 border-t border-[#dceefa]/22 bg-[#0a0f18]/34 backdrop-blur-[2px]">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-[#9cb0c5] sm:flex-row sm:px-8">
            <p className="flex items-center gap-2">
              <span>Личная страница</span>
              <span className="text-[#5c738c]">·</span>
              <span className="font-semibold text-[#e6f1fc]">{PROFILE.nickname}</span>
            </p>
            <div className="flex items-center gap-5">
              <a
                href="#profile"
                className="transition-all duration-150 hover:-translate-y-0.5 hover:text-[#e6f1fc]"
              >
                Наверх
              </a>
              <a
                href="https://github.com/rwqegsdgy"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all duration-150 hover:-translate-y-0.5 hover:text-[#e6f1fc]"
              >
                GitHub
              </a>
              <a
                href="https://discord.gg/h8W4zxfbDd"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all duration-150 hover:-translate-y-0.5 hover:text-[#e6f1fc]"
              >
                LifeLine
              </a>
            </div>
          </div>
        </footer>
      </div>

      <ZenOverlay
        open={zenOpen}
        track={activeTrack}
        customTrackName={null}
        isPlaying={isPlaying}
        volume={volume}
        getFrequencyData={getFrequencyData}
        onTogglePlay={handleTogglePlay}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onExit={() => setZenOpen(false)}
      />
    </div>
  );
}
