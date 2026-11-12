export type TrackPreset = 'moon' | 'frost' | 'lifeline';

interface ProgressionSpec {
  bpm: number;
  chords: number[][];
  melody: number[];
  cutoff: number;
}

const PRESETS: Record<TrackPreset, ProgressionSpec> = {
  moon: {
    bpm: 66,
    chords: [
      [185.0, 220.0, 277.18, 329.63, 415.3],
      [146.83, 220.0, 277.18, 369.99],
      [123.47, 185.0, 220.0, 293.66],
      [138.59, 207.65, 246.94, 329.63],
    ],
    melody: [554.37, 659.25, 739.99, 659.25, 493.88, 554.37, 440.0, 493.88],
    cutoff: 2900,
  },
  frost: {
    bpm: 72,
    chords: [
      [146.83, 220.0, 261.63, 329.63],
      [116.54, 174.61, 220.0, 293.66],
      [196.0, 233.08, 293.66, 349.23],
      [110.0, 164.81, 220.0, 293.66],
    ],
    melody: [587.33, 659.25, 698.46, 523.25, 587.33, 440.0, 392.0, 440.0],
    cutoff: 3200,
  },
  lifeline: {
    bpm: 70,
    chords: [
      [110.0, 164.81, 246.94, 261.63, 329.63],
      [174.61, 220.0, 261.63, 329.63],
      [146.83, 220.0, 261.63, 329.63],
      [164.81, 246.94, 293.66, 392.0],
    ],
    melody: [659.25, 587.33, 523.25, 493.88, 440.0, 523.25, 587.33, 493.88],
    cutoff: 3000,
  },
};

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private preFaderBus: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  private stepTimer: number | null = null;
  private stepIndex = 0;
  private currentPreset: TrackPreset = 'moon';
  private volume = 0.35;
  private isSynthPlaying = false;

  // Real MP3 track element
  private mp3Audio: HTMLAudioElement | null = null;
  private mp3Source: MediaElementAudioSourceNode | null = null;
  private mode: 'mp3' | 'synth' = 'mp3';

  constructor() {
    if (typeof window !== 'undefined') {
      this.mp3Audio = new Audio(`${import.meta.env.BASE_URL}music.mp3`);
      this.mp3Audio.loop = true;
      this.mp3Audio.preload = 'metadata';
      this.mp3Audio.crossOrigin = 'anonymous';
    }
  }

  private ensureContext() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.preFaderBus = this.ctx.createGain();
    this.preFaderBus.gain.value = 1.0;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.minDecibels = -82;
    this.analyser.maxDecibels = -3;
    this.analyser.smoothingTimeConstant = 0.72;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = PRESETS[this.currentPreset].cutoff;
    this.filterNode.Q.value = 1.1;

    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.41;

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.36;

    this.filterNode.connect(this.preFaderBus);
    this.filterNode.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.preFaderBus);

    this.preFaderBus.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    if (this.mp3Audio && !this.mp3Source) {
      this.mp3Source = this.ctx.createMediaElementSource(this.mp3Audio);
      this.mp3Source.connect(this.preFaderBus);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setPreset(preset: TrackPreset) {
    this.currentPreset = preset;
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setTargetAtTime(
        PRESETS[preset].cutoff,
        this.ctx.currentTime,
        0.25
      );
    }
    if (this.mode === 'synth' && this.isSynthPlaying) {
      this.stopStepLoop();
      this.stepIndex = 0;
      this.startStepLoop();
    }
  }

  public async playMp3(src = `${import.meta.env.BASE_URL}music.mp3`) {
    this.pauseSynth();
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (this.mp3Audio) {
      const targetUrl = new URL(src, window.location.href).href;
      if (this.mp3Audio.src !== targetUrl) {
        this.mp3Audio.src = targetUrl;
        this.mp3Audio.currentTime = 0;
      }
      this.mode = 'mp3';
      await this.mp3Audio.play();
    }
  }

  public pauseMp3() {
    if (this.mp3Audio) {
      this.mp3Audio.pause();
    }
  }

  public getMp3Audio(): HTMLAudioElement | null {
    return this.mp3Audio;
  }

  public async playSynth() {
    this.mode = 'synth';
    this.pauseMp3();
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.stopStepLoop();
    this.stepIndex = 0;
    this.isSynthPlaying = true;
    this.startStepLoop();
  }

  public pauseSynth() {
    this.isSynthPlaying = false;
    this.stopStepLoop();
  }

  public getMode(): 'mp3' | 'synth' {
    return this.mode;
  }

  public getFrequencyData(target: Uint8Array<ArrayBuffer>): number {
    if (!this.analyser || this.volume <= 0.001) {
      target.fill(0);
      return 0;
    }
    this.analyser.getByteFrequencyData(target);
    let bassSum = 0;
    const bassBins = Math.min(18, target.length);
    for (let i = 0; i < bassBins; i++) {
      bassSum += target[i];
    }
    const rawEnergy = bassBins > 0 ? bassSum / (bassBins * 255) : 0;
    return rawEnergy * (0.45 + 0.55 * this.volume);
  }

  public getTimeDomainData(target: Uint8Array<ArrayBuffer>) {
    if (!this.analyser || this.volume <= 0.001) {
      target.fill(128);
      return;
    }
    this.analyser.getByteTimeDomainData(target);
  }

  private startStepLoop() {
    if (this.stepTimer !== null) return;
    const spec = PRESETS[this.currentPreset];
    const stepMs = (60 / spec.bpm / 2) * 1000;

    const tick = () => {
      if (!this.isSynthPlaying || !this.ctx || !this.filterNode) return;
      const currentSpec = PRESETS[this.currentPreset];
      const barStep = this.stepIndex % 8;
      const chordIdx = Math.floor(this.stepIndex / 8) % currentSpec.chords.length;
      const chord = currentSpec.chords[chordIdx];

      if (barStep === 0) {
        chord.forEach((freq, idx) => {
          this.triggerPadNote(freq, 4.4, idx === 0 ? 0.22 : 0.11);
        });
        this.triggerSubPulse(chord[0] * 0.5, 2.2, 0.26);
      }

      if (barStep === 4) {
        this.triggerSubPulse(chord[0] * 0.5, 1.8, 0.2);
      }

      if (barStep % 2 === 0 || barStep === 7) {
        const melodyFreq = currentSpec.melody[this.stepIndex % currentSpec.melody.length];
        this.triggerBellNote(melodyFreq, 1.9, 0.11);
        if (barStep === 0 || barStep === 4) {
          this.triggerBellNote(melodyFreq * 2, 1.1, 0.04);
        }
      }

      this.stepIndex += 1;
    };

    tick();
    this.stepTimer = window.setInterval(tick, stepMs);
  }

  private stopStepLoop() {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  private triggerPadNote(freq: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscShimmer = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    oscShimmer.type = 'triangle';
    oscShimmer.frequency.setValueAtTime(freq * 1.004, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + 0.65);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    oscShimmer.connect(env);
    env.connect(this.filterNode);

    osc.start(now);
    oscShimmer.start(now);
    osc.stop(now + duration + 0.1);
    oscShimmer.stop(now + duration + 0.1);
  }

  private triggerSubPulse(freq: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    env.connect(this.filterNode);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  private triggerBellNote(freq: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    env.connect(this.filterNode);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public dispose() {
    this.pauseSynth();
    this.pauseMp3();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
  }
}
