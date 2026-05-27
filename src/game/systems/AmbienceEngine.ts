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

type LocationMusicColor = {
  highpass: number;
  lowShelfGain: number;
  presenceFreq: number;
  presenceGain: number;
  airGain: number;
  pan: number;
  reverbSend: number;
};

type ExternalMusicRouting = {
  source: MediaElementAudioSourceNode;
  input: GainNode;
  highpass: BiquadFilterNode;
  body: BiquadFilterNode;
  presence: BiquadFilterNode;
  air: BiquadFilterNode;
  panner?: StereoPannerNode;
  reverbSend: GainNode;
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

// Relaxed immersive mix: ambient beds stay present enough to place the reader
// inside the scene, while music remains behind the dialogue.
const targetLayerVolume: Record<AmbienceId, number> = {
  taxi: 0.062,
  hospital: 0.048,
  road: 0.07,
  bosquete: 0.078,
  valley: 0.074,
  ravine: 0.054,
  river: 0.11,
  night: 0.058,
  room: 0.04,
  intimate: 0.045
};

const musicColorByLocation: Record<LocationId, LocationMusicColor> = {
  taxi: { highpass: 48, lowShelfGain: 2.6, presenceFreq: 720, presenceGain: -1.2, airGain: -2.4, pan: -0.04, reverbSend: 0.055 },
  hospital: { highpass: 62, lowShelfGain: 0.4, presenceFreq: 1180, presenceGain: -2.2, airGain: -1.8, pan: 0.02, reverbSend: 0.12 },
  road: { highpass: 42, lowShelfGain: 1.4, presenceFreq: 1500, presenceGain: -0.8, airGain: -0.7, pan: -0.02, reverbSend: 0.09 },
  bosquete: { highpass: 44, lowShelfGain: 1.7, presenceFreq: 1420, presenceGain: -0.9, airGain: -0.9, pan: 0.04, reverbSend: 0.11 },
  valley: { highpass: 38, lowShelfGain: 2.0, presenceFreq: 980, presenceGain: -1.0, airGain: -1.2, pan: 0, reverbSend: 0.13 },
  ravine: { highpass: 55, lowShelfGain: 1.1, presenceFreq: 680, presenceGain: -1.8, airGain: -2.8, pan: -0.03, reverbSend: 0.16 },
  river: { highpass: 40, lowShelfGain: 1.5, presenceFreq: 1320, presenceGain: -0.7, airGain: -0.8, pan: 0.03, reverbSend: 0.10 },
  night: { highpass: 50, lowShelfGain: 1.8, presenceFreq: 760, presenceGain: -1.4, airGain: -2.6, pan: -0.02, reverbSend: 0.15 },
  room: { highpass: 56, lowShelfGain: 0.8, presenceFreq: 900, presenceGain: -1.8, airGain: -2.2, pan: 0.01, reverbSend: 0.14 }
};

// Chord progressions (frequencies in Hz)
const chordThemes: Record<LocationId, number[][]> = {
  taxi: [
    [110.00, 130.81, 164.81, 196.00, 246.94, 329.63], // Am9
    [87.31, 130.81, 164.81, 220.00, 261.63, 329.63],  // Fmaj7
    [65.41, 98.00, 164.81, 246.94, 293.66, 392.00],   // Cmaj7
    [82.41, 123.47, 164.81, 196.00, 293.66, 329.63]    // Em7
  ],
  hospital: [
    [98.00, 130.81, 164.81, 196.00, 261.63, 329.63],   // Cmaj7/G
    [110.00, 130.81, 164.81, 220.00, 261.63, 329.63],  // Am7
    [87.31, 130.81, 174.61, 220.00, 261.63, 349.23],   // Fmaj7
    [98.00, 146.83, 196.00, 246.94, 293.66, 392.00]    // G6
  ],
  road: [
    [130.81, 164.81, 196.00, 246.94, 329.63, 392.00],  // Cmaj9
    [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],  // Fmaj9
    [146.83, 174.61, 220.00, 261.63, 293.66, 349.23],  // Dm7
    [196.00, 246.94, 293.66, 392.00, 440.00, 587.33]   // G9
  ],
  bosquete: [
    [130.81, 164.81, 196.00, 246.94, 329.63, 392.00],  // Cmaj9
    [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],  // Fmaj9
    [146.83, 174.61, 220.00, 261.63, 293.66, 349.23],  // Dm7
    [196.00, 246.94, 293.66, 392.00, 440.00, 587.33]   // G9
  ],
  valley: [
    [130.81, 164.81, 196.00, 261.63, 329.63, 392.00],  // Cmaj7
    [146.83, 196.00, 220.00, 293.66, 392.00, 440.00],  // Gadd9/D
    [110.00, 164.81, 196.00, 220.00, 329.63, 392.00],  // Am7
    [87.31, 130.81, 174.61, 220.00, 261.63, 349.23]    // Fmaj7
  ],
  ravine: [
    [110.00, 130.81, 164.81, 196.00, 246.94, 329.63],  // Am9
    [73.42, 110.00, 146.83, 174.61, 220.00, 293.66],   // Dm7/D
    [87.31, 130.81, 164.81, 220.00, 261.63, 329.63],   // Fmaj7
    [82.41, 123.47, 164.81, 196.00, 293.66, 329.63]    // Em7
  ],
  river: [
    [130.81, 164.81, 196.00, 246.94, 329.63, 392.00],  // Cmaj9
    [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],  // Fmaj9
    [130.81, 164.81, 196.00, 246.94, 329.63, 392.00],  // Cmaj9
    [196.00, 246.94, 293.66, 392.00, 440.00, 587.33]   // G9
  ],
  night: [
    [110.00, 130.81, 164.81, 196.00, 246.94, 329.63],  // Am9
    [87.31, 130.81, 164.81, 220.00, 261.63, 329.63],   // Fmaj7
    [110.00, 130.81, 164.81, 196.00, 246.94, 329.63],  // Am9
    [82.41, 123.47, 164.81, 196.00, 293.66, 329.63]    // Em7
  ],
  room: [
    [130.81, 164.81, 196.00, 246.94, 329.63, 392.00],  // Cmaj9
    [110.00, 130.81, 164.81, 220.00, 261.63, 329.63],  // Am7
    [87.31, 130.81, 174.61, 220.00, 261.63, 349.23],   // Fmaj7
    [98.00, 146.83, 196.00, 246.94, 293.66, 392.00]    // G6
  ]
};

export class AmbienceEngine {
  private context?: AudioContext;
  private bus?: GainNode;
  private masterHighpass?: BiquadFilterNode;
  private masterAir?: BiquadFilterNode;
  private masterCompressor?: DynamicsCompressorNode;
  private currentLayer?: AmbienceLayer;
  private intimateLayer?: AmbienceLayer;
  private heartbeatIntensity = 0;
  private heartbeatTimer?: number;
  private nextHeartbeatAt = 0;
  private heartbeatRafId?: number;
  private heartbeatListener?: (intensity: number, time: number) => void;
  private masterMuted = false;

  // Reverb Node
  private reverbNode?: ConvolverNode;
  private reverbGain?: GainNode;

  // Music & SFX properties
  private musicBus?: GainNode;
  private musicEqLow?: BiquadFilterNode;
  private musicEqPresence?: BiquadFilterNode;
  private musicEqHigh?: BiquadFilterNode;
  private chordInterval?: number;
  private melodyInterval?: number;
  private musicActive = false;
  private targetMusicVolume = 0.12;
  private currentChordIndex = 0;
  private activeChordOscillators: { osc: OscillatorNode; gain: GainNode; filter?: BiquadFilterNode; lfo?: OscillatorNode }[] = [];
  private currentLoc: LocationId = "taxi";
  private externalMusicRoutings = new WeakMap<HTMLMediaElement, ExternalMusicRouting>();
  private routedExternalMusic = new Set<HTMLMediaElement>();
  private activeExternalMusic?: HTMLMediaElement;

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
    const masterHighpass = ctx.createBiquadFilter();
    const masterAir = ctx.createBiquadFilter();
    const masterCompressor = ctx.createDynamicsCompressor();

    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterHighpass.type = "highpass";
    masterHighpass.frequency.setValueAtTime(24, ctx.currentTime);
    masterHighpass.Q.setValueAtTime(0.65, ctx.currentTime);
    masterAir.type = "highshelf";
    masterAir.frequency.setValueAtTime(9500, ctx.currentTime);
    masterAir.gain.setValueAtTime(-0.8, ctx.currentTime);
    masterCompressor.threshold.setValueAtTime(-18, ctx.currentTime);
    masterCompressor.knee.setValueAtTime(24, ctx.currentTime);
    masterCompressor.ratio.setValueAtTime(2.2, ctx.currentTime);
    masterCompressor.attack.setValueAtTime(0.018, ctx.currentTime);
    masterCompressor.release.setValueAtTime(0.28, ctx.currentTime);

    bus.connect(masterHighpass);
    masterHighpass.connect(masterAir);
    masterAir.connect(masterCompressor);
    masterCompressor.connect(ctx.destination);
    
    this.context = ctx;
    this.bus = bus;
    this.masterHighpass = masterHighpass;
    this.masterAir = masterAir;
    this.masterCompressor = masterCompressor;

    // Create Synthetic Reverb Node for warm, retro-cinematic room depth
    try {
      const rate = ctx.sampleRate;
      const len = rate * 2.8; // 2.8 seconds reverb decay tail
      const irBuffer = ctx.createBuffer(2, len, rate);
      const leftIR = irBuffer.getChannelData(0);
      const rightIR = irBuffer.getChannelData(1);
      
      for (let i = 0; i < len; i++) {
        // Steep exponential decay for a smooth acoustic space without echo flutter
        const decay = Math.exp(-i / (rate * 0.65));
        leftIR[i] = (Math.random() * 2 - 1) * decay * 0.32;
        rightIR[i] = (Math.random() * 2 - 1) * decay * 0.32;
      }
      
      const reverb = ctx.createConvolver();
      reverb.buffer = irBuffer;
      
      const revGain = ctx.createGain();
      revGain.gain.setValueAtTime(0.20, ctx.currentTime); // Sweet spot wet signal
      
      reverb.connect(revGain);
      revGain.connect(bus);
      
      this.reverbNode = reverb;
      this.reverbGain = revGain;
    } catch (e) {
      console.warn("Could not create Web Audio Convolver Reverb:", e);
    }

    // Soft fade-in of the master bus
    bus.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.6);
    return ctx;
  }

  setLocationAmbience(location: LocationId, immediate = false) {
    this.currentLoc = location;
    const id = ambienceByLocation[location];
    this.crossfadeTo(id, immediate);
    
    if (this.musicActive) {
      this.adaptMusicToLocation(location);
    }
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
    this.stopMusic(true);
    [...this.routedExternalMusic].forEach((element) => this.releaseExternalMusic(element));
    
    // Immediate cleanup of layers to prevent intervals running on closed context
    const cleanLayerImmediate = (layer: AmbienceLayer) => {
      layer.voices.forEach((voice) => {
        try {
          voice.source.stop();
        } catch {}
        voice.cleanup?.();
      });
      try {
        layer.master.disconnect();
      } catch {}
    };

    if (this.currentLayer) cleanLayerImmediate(this.currentLayer);
    if (this.intimateLayer) cleanLayerImmediate(this.intimateLayer);
    this.currentLayer = undefined;
    this.intimateLayer = undefined;

    if (this.context) {
      void this.context.close().catch(() => undefined);
      this.context = undefined;
    }
  }

  connectExternalMusic(element: HTMLMediaElement, location: LocationId) {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return false;

    let routing = this.externalMusicRoutings.get(element);
    if (!routing) {
      try {
        const source = ctx.createMediaElementSource(element);
        const input = ctx.createGain();
        const highpass = ctx.createBiquadFilter();
        const body = ctx.createBiquadFilter();
        const presence = ctx.createBiquadFilter();
        const air = ctx.createBiquadFilter();
        const reverbSend = ctx.createGain();
        const panner =
          typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : undefined;

        input.gain.setValueAtTime(1, ctx.currentTime);
        highpass.type = "highpass";
        highpass.Q.setValueAtTime(0.7, ctx.currentTime);
        body.type = "lowshelf";
        body.frequency.setValueAtTime(180, ctx.currentTime);
        presence.type = "peaking";
        presence.Q.setValueAtTime(0.9, ctx.currentTime);
        air.type = "highshelf";
        air.frequency.setValueAtTime(7600, ctx.currentTime);
        reverbSend.gain.setValueAtTime(0.08, ctx.currentTime);

        source.connect(input);
        input.connect(highpass);
        highpass.connect(body);
        body.connect(presence);
        presence.connect(air);

        const output: AudioNode = panner ?? air;
        if (panner) air.connect(panner);
        output.connect(this.bus);

        if (this.reverbNode) {
          output.connect(reverbSend);
          reverbSend.connect(this.reverbNode);
        }

        routing = { source, input, highpass, body, presence, air, panner, reverbSend };
        this.externalMusicRoutings.set(element, routing);
        this.routedExternalMusic.add(element);
      } catch (error) {
        console.warn("Could not route background music through Web Audio:", error);
        return false;
      }
    }

    this.applyExternalMusicColor(routing, location);
    this.activeExternalMusic = element;
    return true;
  }

  releaseExternalMusic(element: HTMLMediaElement) {
    const routing = this.externalMusicRoutings.get(element);
    if (!routing) return;

    try {
      routing.source.disconnect();
      routing.input.disconnect();
      routing.highpass.disconnect();
      routing.body.disconnect();
      routing.presence.disconnect();
      routing.air.disconnect();
      routing.panner?.disconnect();
      routing.reverbSend.disconnect();
    } catch {}

    if (this.activeExternalMusic === element) {
      this.activeExternalMusic = undefined;
    }
    this.externalMusicRoutings.delete(element);
    this.routedExternalMusic.delete(element);
  }

  private applyExternalMusicColor(routing: ExternalMusicRouting, location: LocationId) {
    const ctx = this.context;
    if (!ctx) return;
    const color = musicColorByLocation[location] ?? musicColorByLocation.taxi;
    const now = ctx.currentTime;
    const glide = 0.45;

    routing.highpass.frequency.setTargetAtTime(color.highpass, now, glide);
    routing.body.gain.setTargetAtTime(color.lowShelfGain, now, glide);
    routing.presence.frequency.setTargetAtTime(color.presenceFreq, now, glide);
    routing.presence.gain.setTargetAtTime(color.presenceGain, now, glide);
    routing.air.gain.setTargetAtTime(color.airGain, now, glide);
    routing.reverbSend.gain.setTargetAtTime(color.reverbSend, now, glide);
    routing.panner?.pan.setTargetAtTime(color.pan, now, glide);
  }

  private ensureMusicBus(ctx: AudioContext) {
    if (this.musicBus) return this.musicBus;

    this.musicBus = ctx.createGain();
    this.musicEqLow = ctx.createBiquadFilter();
    this.musicEqPresence = ctx.createBiquadFilter();
    this.musicEqHigh = ctx.createBiquadFilter();

    this.musicEqLow.type = "lowshelf";
    this.musicEqLow.frequency.setValueAtTime(190, ctx.currentTime);
    this.musicEqLow.gain.setValueAtTime(1.5, ctx.currentTime);

    this.musicEqPresence.type = "peaking";
    this.musicEqPresence.frequency.setValueAtTime(1100, ctx.currentTime);
    this.musicEqPresence.Q.setValueAtTime(0.95, ctx.currentTime);
    this.musicEqPresence.gain.setValueAtTime(-1.0, ctx.currentTime);

    this.musicEqHigh.type = "highshelf";
    this.musicEqHigh.frequency.setValueAtTime(7800, ctx.currentTime);
    this.musicEqHigh.gain.setValueAtTime(-2.2, ctx.currentTime);

    this.musicBus.connect(this.musicEqLow);
    this.musicEqLow.connect(this.musicEqPresence);
    this.musicEqPresence.connect(this.musicEqHigh);
    this.musicEqHigh.connect(this.bus ?? ctx.destination);
    this.applyProceduralMusicColor(this.currentLoc);

    return this.musicBus;
  }

  private applyProceduralMusicColor(location: LocationId) {
    const ctx = this.context;
    if (!ctx || !this.musicEqLow || !this.musicEqPresence || !this.musicEqHigh) return;
    const color = musicColorByLocation[location] ?? musicColorByLocation.taxi;
    const now = ctx.currentTime;
    const glide = 0.8;

    this.musicEqLow.gain.setTargetAtTime(color.lowShelfGain, now, glide);
    this.musicEqPresence.frequency.setTargetAtTime(color.presenceFreq, now, glide);
    this.musicEqPresence.gain.setTargetAtTime(color.presenceGain, now, glide);
    this.musicEqHigh.gain.setTargetAtTime(color.airGain, now, glide);
  }

  private crossfadeTo(id: AmbienceId, immediate: boolean) {
    if (this.masterMuted) return;
    if (this.currentLayer && this.currentLayer.id === id) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;
    const next = this.buildLayer(ctx, this.bus, id);
    const fade = immediate ? 0 : 2.0; // Slower crossfade for transitions
    this.fadeInLayer(ctx, next, targetLayerVolume[id] ?? 0.1, fade);
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
        } catch {}
        voice.cleanup?.();
      });
      try {
        layer.master.disconnect();
      } catch {}
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
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 145, q: 0.8, gain: 0.24, lfoFreq: 0.035, lfoRange: 42, pan: -0.12, panDrift: 0.018, reverbSend: 0.08 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 380, q: 0.2, gain: 0.055, lfoFreq: 0.025, lfoRange: 80, pan: 0.22, panDrift: 0.012, reverbSend: 0.12 }));
        addVoice(this.createOscVoice(ctx, master, { type: "triangle", frequency: 46, gain: 0.12, lfoFreq: 0.55, lfoGain: 1.7 }));
        addVoice(this.createTickerVoice(ctx, master, { intervalMs: 4400, frequency: 760, gain: 0.006, durationMs: 26, wave: "sine" }));
        break;
      case "hospital":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 85, gain: 0.055, lfoFreq: 0.075, lfoGain: 0.9 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 520, q: 0.18, gain: 0.095, lfoFreq: 0.018, lfoRange: 70, pan: 0.06, panDrift: 0.014, reverbSend: 0.18 }));
        addVoice(this.createGentleDingVoice(ctx, master, { intervalMs: 11200, frequency: 784, gain: 0.008, pan: 0.08 }));
        break;
      case "road":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 310, q: 0.22, gain: 0.13, lfoFreq: 0.022, lfoRange: 80, pan: -0.12, panDrift: 0.01, reverbSend: 0.18 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 170, q: 0.12, gain: 0.065, lfoFreq: 0.015, lfoRange: 34, pan: 0.2, panDrift: 0.007, reverbSend: 0.12 }));
        break;
      case "bosquete":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 920, q: 0.62, gain: 0.095, lfoFreq: 0.065, lfoRange: 280, pan: -0.32, panDrift: 0.03, reverbSend: 0.24 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 540, q: 0.38, gain: 0.07, lfoFreq: 0.04, lfoRange: 130, pan: 0.28, panDrift: 0.022, reverbSend: 0.2 }));
        addVoice(this.createBirdVoice(ctx, master, { intervalMs: 26000 }));
        addVoice(this.createGentleDingVoice(ctx, master, { intervalMs: 18000, frequency: 1046.5, gain: 0.0045, pan: -0.18, probability: 0.45 }));
        break;
      case "valley":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 390, q: 0.18, gain: 0.105, lfoFreq: 0.014, lfoRange: 170, pan: -0.24, panDrift: 0.008, reverbSend: 0.34 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 210, q: 0.12, gain: 0.075, lfoFreq: 0.011, lfoRange: 56, pan: 0.26, panDrift: 0.006, reverbSend: 0.26 }));
        addVoice(this.createGentleDingVoice(ctx, master, { intervalMs: 26000, frequency: 659.25, gain: 0.005, pan: 0.16, probability: 0.55 }));
        break;
      case "ravine":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 430, q: 0.28, gain: 0.09, lfoFreq: 0.03, lfoRange: 130, pan: -0.08, panDrift: 0.018, reverbSend: 0.32 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 260, q: 0.18, gain: 0.036, lfoFreq: 0.02, lfoRange: 50, pan: 0.18, panDrift: 0.01, reverbSend: 0.22 }));
        addVoice(this.createTickerVoice(ctx, master, { intervalMs: 6800, frequency: 640, gain: 0.004, durationMs: 150, wave: "sine" }));
        break;
      case "river":
        addVoice(this.createNoiseVoice(ctx, master, { type: "bandpass", frequency: 430, q: 0.34, gain: 0.25, lfoFreq: 0.1, lfoRange: 100, pan: -0.12, panDrift: 0.022, reverbSend: 0.14 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 270, q: 0.16, gain: 0.14, lfoFreq: 0.065, lfoRange: 52, pan: 0.16, panDrift: 0.014, reverbSend: 0.12 }));
        addVoice(this.createWaterRippleVoice(ctx, master, { intervalMs: 7200 }));
        break;
      case "night":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 60, gain: 0.045, lfoFreq: 0.05, lfoGain: 0.6 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 260, q: 0.18, gain: 0.034, lfoFreq: 0.018, lfoRange: 50, pan: -0.12, panDrift: 0.008, reverbSend: 0.2 }));
        addVoice(this.createCricketVoice(ctx, master, { intervalMs: 4200 }));
        break;
      case "room":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 90, gain: 0.045, lfoFreq: 0.06, lfoGain: 0.7 }));
        addVoice(this.createNoiseVoice(ctx, master, { type: "lowpass", frequency: 340, q: 0.16, gain: 0.065, lfoFreq: 0.016, lfoRange: 45, pan: 0.04, panDrift: 0.01, reverbSend: 0.22 }));
        break;
      case "intimate":
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 220.00, gain: 0.016 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 277.18, gain: 0.013 }));
        addVoice(this.createOscVoice(ctx, master, { type: "sine", frequency: 329.63, gain: 0.011 }));
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

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(options.gain * 0.15, ctx.currentTime);
      gain.connect(send);
      send.connect(this.reverbNode);
    }

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
        } catch {}
      }
    };
  }

  private createNoiseVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: {
      type: BiquadFilterType;
      frequency: number;
      q: number;
      gain: number;
      lfoFreq?: number;
      lfoRange?: number;
      pan?: number;
      panDrift?: number;
      reverbSend?: number;
    }
  ): AmbienceVoice {
    const buffer = this.getNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // Chained Filters (24dB/octave slope) to remove digital high frequencies entirely!
    const filter1 = ctx.createBiquadFilter();
    filter1.type = options.type;
    filter1.frequency.setValueAtTime(options.frequency, ctx.currentTime);
    filter1.Q.setValueAtTime(options.q, ctx.currentTime);
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = "lowpass";
    filter2.frequency.setValueAtTime(Math.max(options.frequency * 1.45, options.frequency + 90), ctx.currentTime);
    filter2.Q.setValueAtTime(0.5, ctx.currentTime); // Softer slope rounding
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(options.gain, ctx.currentTime);
    
    // Gentle amplitude tremolo
    const ampLfo = ctx.createOscillator();
    ampLfo.type = "sine";
    ampLfo.frequency.setValueAtTime(0.08, ctx.currentTime); // Slower, deeper swelling
    const ampLfoGain = ctx.createGain();
    ampLfoGain.gain.setValueAtTime(options.gain * 0.2, ctx.currentTime);
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(gain.gain);
    ampLfo.start();

    let filterLfo: OscillatorNode | undefined;
    let filterLfoGain: GainNode | undefined;
    if (options.lfoFreq && options.lfoRange) {
      filterLfo = ctx.createOscillator();
      filterLfoGain = ctx.createGain();
      filterLfo.type = "sine";
      filterLfo.frequency.setValueAtTime(options.lfoFreq, ctx.currentTime);
      filterLfoGain.gain.setValueAtTime(options.lfoRange, ctx.currentTime);
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter1.frequency);
      filterLfo.start();
    }

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : undefined;
    let panLfo: OscillatorNode | undefined;
    let panLfoGain: GainNode | undefined;
    if (panner) {
      panner.pan.setValueAtTime(options.pan ?? 0, ctx.currentTime);
      if (options.panDrift) {
        panLfo = ctx.createOscillator();
        panLfo.type = "sine";
        panLfo.frequency.setValueAtTime(options.panDrift, ctx.currentTime);
        panLfoGain = ctx.createGain();
        panLfoGain.gain.setValueAtTime(0.22, ctx.currentTime);
        panLfo.connect(panLfoGain);
        panLfoGain.connect(panner.pan);
        panLfo.start();
      }
      gain.connect(panner);
      panner.connect(destination);
    } else {
      gain.connect(destination);
    }

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(options.reverbSend ?? 0.20, ctx.currentTime);
      (panner ?? gain).connect(send);
      send.connect(this.reverbNode);
    }

    source.start();
    
    return {
      source,
      gain,
      cleanup: () => {
        try {
          ampLfo.stop();
          filterLfo?.stop();
          panLfo?.stop();
        } catch {}
      }
    };
  }

  private createTickerVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: { intervalMs: number; frequency: number; gain: number; durationMs: number; wave?: OscillatorType }
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
      
      osc.type = options.wave ?? "triangle";
      osc.frequency.setValueAtTime(options.frequency * (0.97 + Math.random() * 0.06), now);
      
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(options.gain, now + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, now + options.durationMs / 1000);
      
      osc.connect(env);
      env.connect(destination);
      
      if (this.reverbNode) {
        env.connect(this.reverbNode);
      }
      
      osc.start(now);
      osc.stop(now + options.durationMs / 1000 + 0.05);
    }, options.intervalMs);
    
    return {
      source: silentSource,
      gain,
      cleanup: () => window.clearInterval(interval)
    };
  }

  private createGentleDingVoice(
    ctx: AudioContext,
    destination: AudioNode,
    options: { intervalMs: number; frequency: number; gain: number; pan?: number; probability?: number }
  ): AmbienceVoice {
    const silentSource = ctx.createConstantSource();
    silentSource.offset.setValueAtTime(0, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    silentSource.connect(gain);
    gain.connect(destination);
    silentSource.start();

    const interval = window.setInterval(() => {
      if (Math.random() > (options.probability ?? 0.82)) return;
      const now = ctx.currentTime;
      const output = this.createEchoBus(ctx, destination, 0.72, 0.34, 0.18, 0.24);
      [
        { ratio: 1, delay: 0, volume: options.gain, duration: 1.8 },
        { ratio: 1.25, delay: 0.08, volume: options.gain * 0.58, duration: 1.45 },
        { ratio: 1.5, delay: 0.18, volume: options.gain * 0.32, duration: 1.2 }
      ].forEach(({ ratio, delay, volume, duration }) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : undefined;
        const start = now + delay;

        osc.type = "sine";
        osc.frequency.setValueAtTime(options.frequency * ratio * (0.997 + Math.random() * 0.006), start);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2400, start);
        filter.Q.setValueAtTime(0.45, start);
        env.gain.setValueAtTime(0.0001, start);
        env.gain.exponentialRampToValueAtTime(volume, start + 0.035);
        env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(filter);
        filter.connect(env);
        if (panner) {
          panner.pan.setValueAtTime(options.pan ?? 0, start);
          env.connect(panner);
          panner.connect(output);
          if (this.reverbNode) panner.connect(this.reverbNode);
        } else {
          env.connect(output);
          if (this.reverbNode) env.connect(this.reverbNode);
        }

        osc.start(start);
        osc.stop(start + duration + 0.06);
      });
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
      if (Math.random() < 0.5) return; // lower density
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      
      // Softer, lower bird call frequencies (1200 - 2000Hz instead of 3000Hz)
      const baseFreq = 1200 + Math.random() * 800;
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.18);
      
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.025, now + 0.02); // quieter bird chirps
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      
      osc.connect(env);
      env.connect(destination);
      
      if (this.reverbNode) {
        env.connect(this.reverbNode);
      }
      
      osc.start(now);
      osc.stop(now + 0.28);
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
      for (let i = 0; i < 4; i += 1) { // fewer chirps per cluster
        const t = now + i * 0.10;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(3600 + Math.random() * 200, t);
        
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.012, t + 0.006); // quieter crickets
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
        
        osc.connect(env);
        env.connect(destination);
        
        if (this.reverbNode) {
          env.connect(this.reverbNode);
        }
        
        osc.start(t);
        osc.stop(t + 0.04);
      }
    }, options.intervalMs);
    
    return {
      source: silentSource,
      gain,
      cleanup: () => window.clearInterval(interval)
    };
  }

  private createWaterRippleVoice(ctx: AudioContext, destination: AudioNode, options: { intervalMs: number }): AmbienceVoice {
    const silentSource = ctx.createConstantSource();
    silentSource.offset.setValueAtTime(0, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    silentSource.connect(gain);
    gain.connect(destination);
    silentSource.start();

    const interval = window.setInterval(() => {
      if (Math.random() < 0.45) return;
      const now = ctx.currentTime;
      const baseTime = now + Math.random() * 0.9;
      for (let i = 0; i < 2; i += 1) {
        const t = baseTime + i * (0.22 + Math.random() * 0.1);
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : undefined;

        osc.type = "sine";
        osc.frequency.setValueAtTime(360 + Math.random() * 100, t);
        osc.frequency.exponentialRampToValueAtTime(190 + Math.random() * 60, t + 0.34);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, t);
        filter.Q.setValueAtTime(0.4, t);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.0048, t + 0.025);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

        osc.connect(filter);
        filter.connect(env);
        if (panner) {
          panner.pan.setValueAtTime(-0.5 + Math.random(), t);
          env.connect(panner);
          panner.connect(destination);
          if (this.reverbNode) panner.connect(this.reverbNode);
        } else {
          env.connect(destination);
          if (this.reverbNode) env.connect(this.reverbNode);
        }

        osc.start(t);
        osc.stop(t + 0.46);
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
      // 1. Fundamental sub-bass frequency for deep headphones rumble
      const osc1 = ctx.createOscillator();
      const env1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(frequency, time + offset);
      osc1.frequency.exponentialRampToValueAtTime(frequency * 0.48, time + offset + 0.18);
      
      env1.gain.setValueAtTime(0.0001, time + offset);
      env1.gain.exponentialRampToValueAtTime(gainValue, time + offset + 0.02);
      env1.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.20);
      
      osc1.connect(env1);
      env1.connect(dest);

      // 2. Secondary harmonic (2x frequency) to ensure audibility on laptop and mobile speakers
      const osc2 = ctx.createOscillator();
      const env2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(frequency * 2.0, time + offset);
      osc2.frequency.exponentialRampToValueAtTime(frequency * 0.96, time + offset + 0.18);
      
      env2.gain.setValueAtTime(0.0001, time + offset);
      env2.gain.exponentialRampToValueAtTime(gainValue * 0.35, time + offset + 0.025); // 35% volume of fundamental
      env2.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.16);
      
      osc2.connect(env2);
      env2.connect(dest);
      
      if (this.reverbNode) {
        const send1 = ctx.createGain();
        send1.gain.setValueAtTime(gainValue * 0.22, time + offset);
        env1.connect(send1);
        send1.connect(this.reverbNode);
        
        const send2 = ctx.createGain();
        send2.gain.setValueAtTime(gainValue * 0.10, time + offset);
        env2.connect(send2);
        send2.connect(this.reverbNode);
      }
      
      osc1.start(time + offset);
      osc1.stop(time + offset + 0.25);
      osc2.start(time + offset);
      osc2.stop(time + offset + 0.25);
    };
    
    // Softer but more present gain scale
    const baseGain = 0.05 + intensity * 0.16;
    // Frequencies: 92Hz and 74Hz (harmonics: 184Hz and 148Hz)
    // which are perfectly audible on small speaker drivers
    playThump(0, 92, baseGain);
    playThump(0.18, 74, baseGain * 0.82);
  }

  startMusic(immediate = false) {
    if (this.musicActive) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const musicBus = this.ensureMusicBus(ctx);
    this.applyProceduralMusicColor(this.currentLoc);

    this.musicActive = true;
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(0.0001, now);
    musicBus.gain.exponentialRampToValueAtTime(this.targetMusicVolume, now + (immediate ? 0.05 : 2.5));

    this.currentChordIndex = 0;
    this.playCurrentChord();

    // Schedule chords every 8 seconds
    this.chordInterval = window.setInterval(() => {
      this.currentChordIndex = (this.currentChordIndex + 1) % 4;
      this.playCurrentChord();
    }, 8000);

    // Schedule random melodies
    this.scheduleNextMelody();
  }

  adaptMusicToLocation(location: LocationId) {
    this.applyProceduralMusicColor(location);
    this.currentChordIndex = 0;
    this.playCurrentChord();
  }

  stopMusic(immediate = false) {
    if (!this.musicActive) return;
    this.musicActive = false;

    if (this.chordInterval !== undefined) {
      window.clearInterval(this.chordInterval);
      this.chordInterval = undefined;
    }
    if (this.melodyInterval !== undefined) {
      window.clearTimeout(this.melodyInterval);
      this.melodyInterval = undefined;
    }

    const ctx = this.context;
    const dest = this.musicBus;
    if (ctx && dest) {
      if (immediate) {
        try {
          dest.gain.setValueAtTime(0.0001, ctx.currentTime);
        } catch {}
        this.activeChordOscillators.forEach(({ osc, lfo }) => {
          try { osc.stop(); lfo?.stop(); } catch {}
        });
        this.activeChordOscillators = [];
      } else {
        const now = ctx.currentTime;
        dest.gain.cancelScheduledValues(now);
        dest.gain.setValueAtTime(dest.gain.value, now);
        const fadeDuration = 2.0;
        dest.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
        
        window.setTimeout(() => {
          if (!this.musicActive) {
            this.activeChordOscillators.forEach(({ osc, lfo }) => {
              try { osc.stop(); lfo?.stop(); } catch {}
            });
            this.activeChordOscillators = [];
          }
        }, fadeDuration * 1000 + 100);
      }
    }
  }

  setMusicVolume(volume: number) {
    this.targetMusicVolume = volume;
    const ctx = this.context;
    const dest = this.musicBus;
    if (ctx && dest && this.musicActive) {
      const now = ctx.currentTime;
      dest.gain.cancelScheduledValues(now);
      dest.gain.setValueAtTime(dest.gain.value, now);
      dest.gain.exponentialRampToValueAtTime(volume, now + 1.2);
    }
  }

  private playCurrentChord() {
    const ctx = this.context;
    const dest = this.musicBus;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Fade out previous chord oscillators
    this.activeChordOscillators.forEach(({ osc, gain, lfo }) => {
      const releaseTime = 3.2;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
      try {
        osc.stop(now + releaseTime + 0.1);
        lfo?.stop(now + releaseTime + 0.1);
      } catch {}
    });
    this.activeChordOscillators = [];

    const theme = chordThemes[this.currentLoc] ?? chordThemes.taxi;
    const notes = theme[this.currentChordIndex] ?? theme[0];
    if (!notes) return;

    // Bass voices (Softer low triangle)
    const playBass = (freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(150, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 2.0); // reduced bass gain

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      
      if (this.reverbNode) {
        const send = ctx.createGain();
        send.gain.setValueAtTime(0.012, now);
        gain.connect(send);
        send.connect(this.reverbNode);
      }

      osc.start(now);
      this.activeChordOscillators.push({ osc, gain, filter });
    };

    // Pad voices (Sweeping resonant filters)
    const playPad = (freq: number, index: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(550, now);
      filter.Q.setValueAtTime(2.8, now);

      const filterLfo = ctx.createOscillator();
      const filterLfoGain = ctx.createGain();
      filterLfo.type = "sine";
      filterLfo.frequency.setValueAtTime(0.05 + index * 0.01, now);
      filterLfoGain.gain.setValueAtTime(180, now); // slightly narrower sweep
      
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter.frequency);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.030, now + 2.8); // quieter pads

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      
      if (this.reverbNode) {
        const send = ctx.createGain();
        send.gain.setValueAtTime(0.020, now);
        gain.connect(send);
        send.connect(this.reverbNode);
      }

      filterLfo.start(now);
      osc.start(now);
      this.activeChordOscillators.push({ osc, gain, filter, lfo: filterLfo });
    };

    playBass(notes[0]);
    if (notes[1]) playBass(notes[1]);
    
    for (let i = 2; i < notes.length; i++) {
      playPad(notes[i], i);
    }
  }

  private scheduleNextMelody() {
    if (!this.musicActive) return;

    // Slower melody spacing (2.5s to 6.5s) to feel calm and cozy
    const delayMs = 2500 + Math.random() * 4000;
    this.melodyInterval = window.setTimeout(() => {
      this.playMelodyNote();
      this.scheduleNextMelody();
    }, delayMs);
  }

  private playMelodyNote() {
    const ctx = this.context;
    const dest = this.musicBus;
    if (!ctx || !dest) return;

    if (Math.random() < 0.25) return;

    const now = ctx.currentTime;
    
    // Cross-feedback stereo delay bus
    const melodyEcho = this.createEchoBus(ctx, dest, 0.42, 0.45, 0.30, 0.38);

    const playTone = (freq: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Chained filters to remove high end click completely
      const filter2 = ctx.createBiquadFilter();

      osc.type = this.currentLoc === "hospital" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq * (0.998 + Math.random() * 0.004), now + delay);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now + delay);
      filter.frequency.exponentialRampToValueAtTime(250, now + delay + 0.40);

      filter2.type = "lowpass";
      filter2.frequency.setValueAtTime(1800, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.linearRampToValueAtTime(0.030, now + delay + 0.020); // soft envelope attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

      osc.connect(filter);
      filter.connect(filter2);
      filter2.connect(gain);
      gain.connect(melodyEcho);
      
      if (this.reverbNode) {
        const send = ctx.createGain();
        send.gain.setValueAtTime(0.024, now + delay);
        gain.connect(send);
        send.connect(this.reverbNode);
      }

      osc.start(now + delay);
      osc.stop(now + delay + 2.0);
    };

    const theme = chordThemes[this.currentLoc] ?? chordThemes.taxi;
    const chordNotes = theme[this.currentChordIndex] ?? theme[0];
    
    const notes = [
      chordNotes[2] * 2, 
      chordNotes[3] * 2, 
      chordNotes[4] * (chordNotes[4] > 300 ? 1 : 2),
      523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
    ];
    
    const pickRandomNote = () => notes[Math.floor(Math.random() * notes.length)];

    const note1 = pickRandomNote();
    playTone(note1, 0);

    if (Math.random() < 0.20) {
      const note2 = pickRandomNote();
      if (note2 !== note1) {
        playTone(note2, 0.09);
      }
    }
  }

  // A soft, music-box-like note played once per spoken word as dialogue types
  // in. Each speaker draws from a pentatonic register, so their voice "sings"
  // in a recognizable range. Warm sine + lowpass + a touch of reverb; never a
  // mechanical click.
  private typingScales: Record<string, number[]> = {
    Kiara: [659.25, 783.99, 880.0, 1046.5, 1174.66], // bright, higher
    Alexis: [329.63, 392.0, 440.0, 523.25, 587.33], // warm, lower
    Chofer: [261.63, 293.66, 329.63, 392.0], // low, sparse
    Narrador: [392.0, 440.0, 523.25, 587.33, 659.25], // soft mid
    Ambos: [523.25, 587.33, 659.25, 783.99, 880.0]
  };

  playTypingTone(speaker: string) {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;
    const now = ctx.currentTime;

    const scale = this.typingScales[speaker] ?? this.typingScales.Narrador;
    const freq = scale[Math.floor(Math.random() * scale.length)] * (0.999 + Math.random() * 0.002);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1900, now);

    // Gentle bell envelope: quick swell, soft tail.
    const peak = speaker === "Narrador" ? 0.009 : 0.013;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bus);

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(peak * 0.5, now);
      gain.connect(send);
      send.connect(this.reverbNode);
    }

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // SFX Synthesis
  playSmsNotificationSound() {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;
    
    const output = this.createEchoBus(ctx, this.bus, 0.65, 0.12, 0.12, 0.18);
    const now = ctx.currentTime;
    
    // Cozy glass chimes
    this.scheduleTone(ctx, output, 987.77, now, 0.18, 0.035, "sine");
    this.scheduleTone(ctx, output, 1318.51, now + 0.08, 0.20, 0.028, "sine");
    this.scheduleTone(ctx, output, 1567.98, now + 0.16, 0.22, 0.024, "sine");
  }

  playScoreChime(statId: string) {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const output = this.createEchoBus(ctx, this.bus, 0.75, 0.18, 0.18, 0.26);
    const now = ctx.currentTime;

    if (statId === "ternura") {
      [
        { frequency: 523.25, delay: 0, volume: 0.030 },
        { frequency: 659.25, delay: 0.07, volume: 0.026 },
        { frequency: 783.99, delay: 0.14, volume: 0.022 },
        { frequency: 1046.50, delay: 0.22, volume: 0.018 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(ctx, output, frequency, now + delay, 0.65, volume, "sine");
      });
    } else if (statId === "nervios") {
      [
        { frequency: 493.88, delay: 0, volume: 0.024 },
        { frequency: 466.16, delay: 0.06, volume: 0.020 },
        { frequency: 440.00, delay: 0.13, volume: 0.016 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(ctx, output, frequency, now + delay, 0.35, volume, "triangle");
      });
      this.scheduleNoise(ctx, output, now, 0.18, 0.003, 1000, "highpass");
    } else {
      [
        { frequency: 440.00, delay: 0, volume: 0.022 },
        { frequency: 554.37, delay: 0.08, volume: 0.026 },
        { frequency: 659.25, delay: 0.18, volume: 0.022 },
        { frequency: 880.00, delay: 0.28, volume: 0.018 },
        { frequency: 1109.73, delay: 0.40, volume: 0.014 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(ctx, output, frequency, now + delay, 0.72, volume, "sine");
      });
    }
  }

  playMemoryRevealChime() {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const output = this.createEchoBus(ctx, this.bus, 0.68, 0.15, 0.15, 0.22);
    const now = ctx.currentTime;

    this.scheduleTone(ctx, output, 587.33, now, 0.42, 0.018, "triangle");
    this.scheduleTone(ctx, output, 783.99, now + 0.06, 0.45, 0.024, "sine");
    this.scheduleTone(ctx, output, 1174.66, now + 0.14, 0.48, 0.020, "sine");
    this.scheduleTone(ctx, output, 1567.98, now + 0.24, 0.35, 0.012, "triangle");
  }

  playMemoryChime() {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const output = this.createEchoBus(ctx, this.bus, 0.78, 0.20, 0.20, 0.28);
    const now = ctx.currentTime;

    [
      { frequency: 392.00, delay: 0, volume: 0.018, duration: 1.0, type: "triangle" as OscillatorType },
      { frequency: 523.25, delay: 0.03, volume: 0.032, duration: 0.8, type: "sine" as OscillatorType },
      { frequency: 659.25, delay: 0.09, volume: 0.035, duration: 0.8, type: "sine" as OscillatorType },
      { frequency: 783.99, delay: 0.18, volume: 0.038, duration: 0.7, type: "sine" as OscillatorType },
      { frequency: 1046.50, delay: 0.30, volume: 0.028, duration: 0.6, type: "triangle" as OscillatorType },
      { frequency: 1318.51, delay: 0.42, volume: 0.020, duration: 0.5, type: "sine" as OscillatorType },
      { frequency: 1567.98, delay: 0.52, volume: 0.014, duration: 0.4, type: "sine" as OscillatorType }
    ].forEach(({ frequency, delay, volume, duration, type }) => {
      this.scheduleTone(ctx, output, frequency, now + delay, duration, volume, type);
    });

    [
      { frequency: 1760.00, delay: 0.22 },
      { frequency: 2093.00, delay: 0.38 },
      { frequency: 2637.02, delay: 0.58 }
    ].forEach(({ frequency, delay }) => {
      this.scheduleTone(ctx, output, frequency, now + delay, 0.24, 0.010, "sine");
    });
  }

  playMagicShiftSound() {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const output = this.createEchoBus(ctx, this.bus, 0.68, 0.22, 0.25, 0.32);
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, i) => {
      const delay = i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(14, now + delay);
      lfoGain.gain.setValueAtTime(freq * 0.012, now + delay);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.032, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.38);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(output);
      
      if (this.reverbNode) {
        gain.connect(this.reverbNode);
      }

      lfo.start(now + delay);
      osc.start(now + delay);
      lfo.stop(now + delay + 0.42);
      osc.stop(now + delay + 0.42);
    });

    const sweepDuration = 0.85;
    const oscSweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscSweep.type = "triangle";
    oscSweep.frequency.setValueAtTime(140, now);
    oscSweep.frequency.exponentialRampToValueAtTime(1100, now + sweepDuration);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + sweepDuration);
    filter.Q.setValueAtTime(2.0, now);

    sweepGain.gain.setValueAtTime(0.0001, now);
    sweepGain.gain.linearRampToValueAtTime(0.025, now + 0.1);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + sweepDuration);

    oscSweep.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(output);
    
    if (this.reverbNode) {
      sweepGain.connect(this.reverbNode);
    }

    oscSweep.start(now);
    oscSweep.stop(now + sweepDuration + 0.05);

    this.scheduleNoise(ctx, output, now, sweepDuration, 0.008, 1800, "highpass");
  }

  playKissMomentSound() {
    const ctx = this.ensureContext();
    if (!ctx || !this.bus) return;

    const output = this.createEchoBus(ctx, this.bus, 0.92, 0.42, 0.22, 0.34);
    const now = ctx.currentTime;
    const bloom = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    bloom.gain.setValueAtTime(0.0001, now);
    bloom.gain.exponentialRampToValueAtTime(0.095, now + 0.8);
    bloom.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + 1.7);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 4.2);
    filter.Q.setValueAtTime(0.55, now);

    bloom.connect(filter);
    filter.connect(output);

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(0.16, now);
      filter.connect(send);
      send.connect(this.reverbNode);
    }

    [
      { frequency: 261.63, pan: 0.48, type: "triangle" as OscillatorType },
      { frequency: 329.63, pan: 0.28, type: "sine" as OscillatorType },
      { frequency: 392.0, pan: 0.68, type: "sine" as OscillatorType },
      { frequency: 523.25, pan: 0.36, type: "sine" as OscillatorType },
      { frequency: 659.25, pan: 0.74, type: "sine" as OscillatorType }
    ].forEach(({ frequency, pan, type }, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : undefined;
      const start = now + index * 0.045;

      osc.type = type;
      osc.frequency.setValueAtTime(frequency * 0.995, start);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.005, start + 1.8);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(1, start + 0.62);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 4.3);

      osc.connect(gain);
      if (panner) {
        panner.pan.setValueAtTime((pan - 0.5) * 1.2, start);
        gain.connect(panner);
        panner.connect(bloom);
      } else {
        gain.connect(bloom);
      }

      osc.start(start);
      osc.stop(start + 4.45);
    });

    [
      { frequency: 783.99, delay: 0.16, volume: 0.022 },
      { frequency: 1046.5, delay: 0.36, volume: 0.02 },
      { frequency: 1318.51, delay: 0.62, volume: 0.017 },
      { frequency: 1567.98, delay: 0.96, volume: 0.013 },
      { frequency: 2093.0, delay: 1.32, volume: 0.009 }
    ].forEach(({ frequency, delay, volume }) => {
      this.scheduleTone(ctx, output, frequency, now + delay, 2.2, volume, "sine");
    });

    this.scheduleNoise(ctx, output, now + 0.15, 2.6, 0.006, 1700, "bandpass");
  }

  private createEchoBus(
    ctx: AudioContext,
    destination: AudioNode,
    outputVolume: number,
    delayTime: number,
    feedbackAmount: number,
    wetAmount: number
  ) {
    const output = ctx.createGain();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();
    const wet = ctx.createGain();

    output.gain.setValueAtTime(outputVolume, ctx.currentTime);
    delay.delayTime.setValueAtTime(delayTime, ctx.currentTime);
    feedback.gain.setValueAtTime(feedbackAmount, ctx.currentTime);
    wet.gain.setValueAtTime(wetAmount, ctx.currentTime);

    output.connect(destination);
    output.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(destination);

    return output;
  }

  private scheduleTone(
    ctx: AudioContext,
    destination: AudioNode,
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(destination);

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(volume * 0.35, start);
      gain.connect(send);
      send.connect(this.reverbNode);
    }

    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private scheduleNoise(
    ctx: AudioContext,
    destination: AudioNode,
    start: number,
    duration: number,
    volume: number,
    filterFrequency: number,
    filterType: BiquadFilterType
  ) {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      const fadeOut = 1 - index / sampleCount;
      data[index] = (Math.random() * 2 - 1) * fadeOut;
    }

    const source = ctx.createBufferSource();
    
    // Chained filters for noise scheduling
    const filter1 = ctx.createBiquadFilter();
    filter1.type = filterType;
    filter1.frequency.setValueAtTime(filterFrequency, start);
    filter1.Q.setValueAtTime(filterType === "bandpass" ? 1.4 : 0.7, start);
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = "lowpass";
    filter2.frequency.setValueAtTime(filterFrequency * 1.2, start);

    const gain = ctx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(destination);

    if (this.reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(0.25, start);
      gain.connect(send);
      send.connect(this.reverbNode);
    }

    source.start(start);
    source.stop(start + duration + 0.03);
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
