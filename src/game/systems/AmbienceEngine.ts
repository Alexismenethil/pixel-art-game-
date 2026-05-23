import type { LocationId } from "../data/chapters";

export type AmbienceId =
  | "taxi"
  | "hospital"
  | "road"
  | "bosquete"
  | "valley"
  | "ravine"
  | "river"
  | "night"
  | "room"
  | "intimate";

type AmbienceVoice = {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  cleanup?: () => void;
};

type AmbienceLayer = {
  id: AmbienceId;
  voices: AmbienceVoice[];
  master: GainNode;
};

const ambienceByLocation: Record<LocationId, AmbienceId> = {
  taxi: "taxi",
  hospital: "hospital",
  road: "road",
  bosquete: "bosquete",
  valley: "valley",
  ravine: "ravine",
  river: "river",
  night: "night",
  room: "room"
};

const targetLayerVolume: Record<AmbienceId, number> = {
  taxi: 0.16,
  hospital: 0.08,
  road: 0.14,
  bosquete: 0.16,
  valley: 0.16,
  ravine: 0.14,
  river: 0.22,
  night: 0.12,
  room: 0.08,
  intimate: 0.1
};

export class AmbienceEngine {
  private context?: AudioContext;
  private bus?: GainNode;
  private currentLayer?: AmbienceLayer;
  private intimateLayer?: AmbienceLayer;
  private heartbeatIntensity = 0;
  private heartbeatTimer?: number;
  private nextHeartbeatAt = 0;
  private heartbeatRafId?: number;
  private heartbeatListener?: (intensity: number, time: number) => void;
  private masterMuted = false;

  ensureContext(): AudioContext | undefined {
    if (this.context) return this.context;
    const Ctor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return undefined;
    const ctx = new Ctor();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.connect(ctx.destination);
    this.context = ctx;
    this.bus = bus;
    // Soft fade-in of the master bus
    bus.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.6);
    return ctx;
  }

  setLocationAmbience(location: LocationId, immediate = false) {
    const id = ambienceByLocation[location];
    this.crossfadeTo(id, immediate);
  }

  setIntimate(active: boolean, immediate = false) {
    if (active && !this.intimateLayer) {
      const ctx = this.ensureContext();
      if (!ctx || !this.bus) return;
      const layer = this.buildLayer(ctx, this.bus, "intimate");
      this.fadeInLayer(ctx, layer, targetLayerVolume.intimate, immediate ? 0 : 1.4);
      this.intimateLayer = layer;
    } else if (!active && this.intimateLayer) {
      this.fadeOutAndStop(this.intimateLayer, immediate ? 0 : 1.2);
      this.intimateLayer = undefined;
    }
  }

  /** intensity: 0 = silent, 1 = pounding. */
  setHeartbeat(intensity: number) {
    const clamped = Math.max(0, Math.min(1, intensity));
    this.heartbeatIntensity = clamped;
    if (clamped <= 0.01) {
      this.stopHeartbeat();
      return;
    }
    if (!this.heartbeatTimer) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      this.nextHeartbeatAt = ctx.currentTime + 0.2;
      const tick = () => {
        if (this.heartbeatIntensity <= 0.01) {
          this.stopHeartbeat();
          return;
        }
        const c = this.context;
        if (c) {
          while (this.nextHeartbeatAt <= c.currentTime + 0.25) {
            this.scheduleHeartbeat(c, this.nextHeartbeatAt, this.heartbeatIntensity);
            const bpm = 64 + this.heartbeatIntensity * 60;
            this.nextHeartbeatAt += 60 / bpm;
          }
          this.heartbeatListener?.(this.heartbeatIntensity, c.currentTime);
        }
        this.heartbeatRafId = window.requestAnimationFrame(tick);
      };
      this.heartbeatRafId = window.requestAnimationFrame(tick);
      this.heartbeatTimer = 1;
    }
  }

  onHeartbeat(listener: (intensity: number, time: number) => void) {
    this.heartbeatListener = listener;
  }

  stopHeartbeat() {
    this.heartbeatIntensity = 0;
    this.heartbeatTimer = undefined;
    if (this.heartbeatRafId !== undefined) {
      window.cancelAnimationFrame(this.heartbeatRafId);
      this.heartbeatRafId = undefined;
    }
  }

  fadeOutAll(durationSec = 0.8) {
    if (!this.context || !this.bus) return;
    const now = this.context.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setValueAtTime(this.bus.gain.value, now);
    this.bus.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.1, durationSec));
    this.masterMuted = true;
    this.stopHeartbeat();
  }

  destroy() {
    this.stopHeartbeat();
    if (this.currentLayer) this.fadeOutAndStop(this.currentLayer, 0);
    if (this.intimateLayer) this.fadeOutAndStop(this.intimateLayer, 0);
    this.currentLayer = undefined;
    this.intimateLayer = undefined;
    if (this.context) {
      void this.context.close().catch(() => undefined);
      this.context = undefined;
    }
  }

  private crossfadeTo(id: AmbienceId, immediate: boolean) {
    if (this.masterMuted) return;
    if (this.currentLayer && this.currentLayer.id === id) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;
    const next = this.buildLayer(ctx, this.bus, id);
    const fade = immediate ? 0 : 1.6;
    this.fadeInLayer(ctx, next, targetLayerVolume[id] ?? 0.14, fade);
    if (this.currentLayer) this.fadeOutAndStop(this.currentLayer, fade);
    this.currentLayer = next;
  }

  private fadeInLayer(ctx: AudioContext, layer: AmbienceLayer, target: number, duration: number) {
    const now = ctx.currentTime;
    layer.master.gain.cancelScheduledValues(now);
    layer.master.gain.setValueAtTime(0.0001, now);
    if (duration <= 0) {
      layer.master.gain.setValueAtTime(target, now);
    } else {
      layer.master.gain.exponentialRampToValueAtTime(target, now + duration);
    }
  }

  private fadeOutAndStop(layer: AmbienceLayer, duration: number) {
    if (!this.context) return;
    const now = this.context.currentTime;
    layer.master.gain.cancelScheduledValues(now);
    layer.master.gain.setValueAtTime(layer.master.gain.value, now);
    const fade = Math.max(0.05, duration);
    layer.master.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    window.setTimeout(() => {
      layer.voices.forEach((voice) => {
        try {
          voice.source.stop();
        } catch {
          // already stopped
        }
        voice.cleanup?.();
      });
      try {
        layer.master.disconnect();
      } catch {
        // already disconnected
      }
    }, fade * 1000 + 80);
  }

  private buildLayer(ctx: AudioContext, bus: GainNode, id: AmbienceId): AmbienceLayer {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.connect(bus);
    const voices: AmbienceVoice[] = [];

    const addVoice = (voice: AmbienceVoice) => voices.push(voice);

    switch (id) {
      case "taxi":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 220, q: 0.9, gain: 0.55 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sawtooth", frequency: 58, gain: 0.18, lfoFreq: 1.6, lfoGain: 6 }));
        addVoice(this.createTickerVoice(ctx, master, { intervalMs: 860, frequency: 1900, gain: 0.06, durationMs: 40 }));
        break;
      case "hospital":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 96, gain: 0.22, lfoFreq: 0.18, lfoGain: 3 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 1100, q: 0.4, gain: 0.18 }));
        addVoice(this.createTickerVoice(ctx, master, { intervalMs: 4200, frequency: 2400, gain: 0.04, durationMs: 60 }));
        break;
      case "road":
        addVoice(this.createNoiseVoice(ctx, master, { type: "highpass", frequency: 760, q: 0.4, gain: 0.18 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 88, gain: 0.1, lfoFreq: 0.3, lfoGain: 4 }));
        addVoice(this.createBirdVoice(ctx, master, { intervalMs: 5200 }));
        break;
      case "bosquete":
        addVoice(this.createNoiseVoice(ctx, master, { type: "highpass", frequency: 880, q: 0.5, gain: 0.22 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 1800, q: 0.8, gain: 0.05 }));
        addVoice(this.createBirdVoice(ctx, master, { intervalMs: 3400 }));
        break;
      case "valley":
        addVoice(this.createNoiseVoice(ctx, master, { type: "highpass", frequency: 720, q: 0.45, gain: 0.24 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 132, gain: 0.08, lfoFreq: 0.16, lfoGain: 5 }));
        addVoice(this.createBirdVoice(ctx, master, { intervalMs: 6400 }));
        break;
      case "ravine":
        addVoice(this.createNoiseVoice(ctx, master, { type: "highpass", frequency: 820, q: 0.4, gain: 0.16 }));
        addVoice(this.createTickerVoice(ctx, master, { intervalMs: 1900, frequency: 320, gain: 0.04, durationMs: 90 }));
        break;
      case "river":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 900, q: 0.45, gain: 0.38 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 480, q: 0.3, gain: 0.16 }));
        addVoice(this.createBirdVoice(ctx, master, { intervalMs: 4800 }));
        break;
      case "night":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 72, gain: 0.16, lfoFreq: 0.12, lfoGain: 2 }));
        addVoice(this.createCricketVoice(ctx, master, { intervalMs: 1400 }));
        break;
      case "room":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 104, gain: 0.18, lfoFreq: 0.14, lfoGain: 2 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 600, q: 0.3, gain: 0.1 }));
        break;
      case "intimate":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 261.63, gain: 0.06, lfoFreq: 0.18, lfoGain: 2 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 329.63, gain: 0.05, lfoFreq: 0.21, lfoGain: 2 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 392, gain: 0.045, lfoFreq: 0.24, lfoGain: 2 }));
        break;
    }

    return { id, voices, master };
  }

  private createOscVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: { type: OscillatorType; frequency: number; gain: number; lfoFreq?: number; lfoGain?: number }
  ): AmbienceVoice {
    const osc = ctx.createOscillator();
    osc.type = options.type;
    osc.frequency.setValueAtTime(options.frequency, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(options.gain, ctx.currentTime);
    osc.connect(gain);
    gain.connect(destination);

    let lfo: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    if (options.lfoFreq && options.lfoGain) {
      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(options.lfoFreq, ctx.currentTime);
      lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(options.lfoGain, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
    }
    osc.start();

    return {
      source: osc,
      gain,
      cleanup: () => {
        try {
          lfo?.stop();
        } catch {
          // already stopped
        }
      }
    };
  }

  private createNoiseVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: { type: BiquadFilterType; frequency: number; q: number; gain: number }
  ): AmbienceVoice {
    const buffer = this.getNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = options.type;
    filter.frequency.setValueAtTime(options.frequency, ctx.currentTime);
    filter.Q.setValueAtTime(options.q, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(options.gain, ctx.currentTime);
    // Slow tremolo so it doesn't sound flat
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(options.gain * 0.3, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start();
    return {
      source,
      gain,
      cleanup: () => {
        try {
          lfo.stop();
        } catch {
          // already stopped
        }
      }
    };
  }

  private createTickerVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: { intervalMs: number; frequency: number; gain: number; durationMs: number }
  ): AmbienceVoice {
    const silentSource = ctx.createConstantSource();
    silentSource.offset.setValueAtTime(0, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    silentSource.connect(gain);
    gain.connect(destination);
    silentSource.start();
    const interval = window.setInterval(() => {
      const c = ctx;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(options.frequency * (0.94 + Math.random() * 0.12), now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(options.gain, now + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, now + options.durationMs / 1000);
      osc.connect(env);
      env.connect(destination);
      osc.start(now);
      osc.stop(now + options.durationMs / 1000 + 0.02);
    }, options.intervalMs);
    return {
      source: silentSource,
      gain,
      cleanup: () => window.clearInterval(interval)
    };
  }

  private createBirdVoice(ctx: AudioContext, destination: AudioNode, options: { intervalMs: number }): AmbienceVoice {
    const silentSource = ctx.createConstantSource();
    silentSource.offset.setValueAtTime(0, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    silentSource.connect(gain);
    gain.connect(destination);
    silentSource.start();
    const interval = window.setInterval(() => {
      if (Math.random() < 0.4) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const baseFreq = 1800 + Math.random() * 1400;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.18);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      osc.connect(env);
      env.connect(destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }, options.intervalMs);
    return {
      source: silentSource,
      gain,
      cleanup: () => window.clearInterval(interval)
    };
  }

  private createCricketVoice(ctx: AudioContext, destination: AudioNode, options: { intervalMs: number }): AmbienceVoice {
    const silentSource = ctx.createConstantSource();
    silentSource.offset.setValueAtTime(0, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    silentSource.connect(gain);
    gain.connect(destination);
    silentSource.start();
    const interval = window.setInterval(() => {
      const now = ctx.currentTime;
      for (let i = 0; i < 6; i += 1) {
        const t = now + i * 0.08;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(4400, t);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        osc.connect(env);
        env.connect(destination);
        osc.start(t);
        osc.stop(t + 0.06);
      }
    }, options.intervalMs);
    return {
      source: silentSource,
      gain,
      cleanup: () => window.clearInterval(interval)
    };
  }

  private scheduleHeartbeat(ctx: AudioContext, time: number, intensity: number) {
    const dest = this.bus ?? ctx.destination;
    const playThump = (offset: number, frequency: number, gainValue: number) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, time + offset);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, time + offset + 0.18);
      env.gain.setValueAtTime(0.0001, time + offset);
      env.gain.exponentialRampToValueAtTime(gainValue, time + offset + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.22);
      osc.connect(env);
      env.connect(dest);
      osc.start(time + offset);
      osc.stop(time + offset + 0.26);
    };
    const baseGain = 0.06 + intensity * 0.16;
    playThump(0, 70, baseGain);
    playThump(0.16, 58, baseGain * 0.85);
  }

  private noiseBuffer?: AudioBuffer;

  private getNoiseBuffer(ctx: AudioContext) {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) return this.noiseBuffer;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * 2, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }
}
