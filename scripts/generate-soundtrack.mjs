import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;
let randomSeed = 0x5f3759df;

function random() {
  randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
  return randomSeed / 0x100000000;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function softLimit(sample, drive = 1.18) {
  return Math.tanh(sample * drive) / Math.tanh(drive);
}

// Chord progressions (frequencies in Hz)
const CHORDS_THEMES = {
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
  ]
};

const PENTATONIC = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51];

// High-fidelity Karplus-Strong string synthesis with sine-dominated excitation burst
// to make plucks warm, rounded, and sweet (eliminates harsh metallic noise buzz)
function synthesizeGuitarPluck(freq, duration, volume, pan, outL, outR, triggerSample, totalSamples) {
  const period = Math.floor(SAMPLE_RATE / freq);
  if (period <= 0) return;
  
  const ringBuffer = new Float32Array(period);
  let lp = 0;
  // Excitation: 80% sine wave, 20% filtered noise for nylon-string acoustic realism
  for (let i = 0; i < period; i++) {
    const rawNoise = random() * 2 - 1;
    const sineExc = Math.sin(2 * Math.PI * i / period);
    lp = lp + 0.35 * ((rawNoise * 0.2 + sineExc * 0.8) - lp);
    ringBuffer[i] = lp;
  }
  
  let ringIndex = 0;
  const decay = 0.996 - (freq / 35000); 
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  
  for (let i = 0; i < durationSamples; i++) {
    const idx = triggerSample + i;
    if (idx >= totalSamples) break;
    
    const val = ringBuffer[ringIndex];
    const nextVal = ringBuffer[(ringIndex + 1) % period];
    
    const filtered = (val + nextVal) * 0.5 * decay;
    ringBuffer[ringIndex] = filtered;
    ringIndex = (ringIndex + 1) % period;
    
    const pluckEnv = Math.exp(-i / (SAMPLE_RATE * 1.6));
    const sample = filtered * pluckEnv * volume * 1.25;
    
    outL[idx] += sample * (1 - pan);
    outR[idx] += sample * pan;
  }
}

// Additive Piano synthesis
function synthesizePianoTone(freq, duration, volume, pan, outL, outR, triggerSample, totalSamples) {
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  
  const overtones = [
    { ratio: 1.0, amp: 1.0, decay: 1.0 },
    { ratio: 2.0, amp: 0.45, decay: 1.8 },
    { ratio: 3.0, amp: 0.22, decay: 2.5 },
    { ratio: 4.0, amp: 0.12, decay: 3.4 },
    { ratio: 5.0, amp: 0.05, decay: 4.2 },
    { ratio: 6.0, amp: 0.02, decay: 5.5 }
  ];
  
  for (let i = 0; i < durationSamples; i++) {
    const idx = triggerSample + i;
    if (idx >= totalSamples) break;
    
    const progress = i / SAMPLE_RATE;
    
    let env = 1.0;
    if (progress < 0.015) {
      env = progress / 0.015;
    } else {
      env = Math.exp(-(progress - 0.015) * 1.3);
    }
    
    let sample = 0;
    for (const ot of overtones) {
      const otFreq = freq * ot.ratio;
      if (otFreq > 16000) continue;
      const otEnv = env * Math.exp(-progress * ot.decay * 1.4);
      sample += Math.sin(2 * Math.PI * otFreq * progress) * ot.amp * otEnv;
    }
    
    if (progress < 0.018) {
      const strikeNoise = (random() * 2 - 1) * Math.exp(-progress * 220) * 0.08;
      sample += strikeNoise;
    }
    
    const mixSample = sample * volume * 0.14;
    outL[idx] += mixSample * (1 - pan);
    outR[idx] += mixSample * pan;
  }
}

// Additive Celesta/Music Box bell synthesis
function synthesizeMusicBoxTone(freq, duration, volume, pan, outL, outR, triggerSample, totalSamples) {
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  const overtones = [
    { ratio: 1.0, amp: 1.0, decay: 1.2 },
    { ratio: 2.76, amp: 0.38, decay: 2.0 },
    { ratio: 5.40, amp: 0.18, decay: 3.0 },
    { ratio: 8.93, amp: 0.08, decay: 4.2 }
  ];
  
  for (let i = 0; i < durationSamples; i++) {
    const idx = triggerSample + i;
    if (idx >= totalSamples) break;
    
    const progress = i / SAMPLE_RATE;
    const env = Math.exp(-progress * 1.1);
    
    let sample = 0;
    for (const ot of overtones) {
      const otFreq = freq * ot.ratio;
      if (otFreq > 18000) continue;
      const otEnv = env * Math.exp(-progress * ot.decay * 1.6);
      sample += Math.sin(2 * Math.PI * otFreq * progress) * ot.amp * otEnv;
    }
    
    if (progress < 0.004) {
      sample += (random() * 2 - 1) * 0.12;
    }
    
    const mixSample = sample * volume * 0.16;
    outL[idx] += mixSample * (1 - pan);
    outR[idx] += mixSample * pan;
  }
}

// Distant Church Bell synthesis
function synthesizeChurchBell(volume, pan, outL, outR, triggerSample, totalSamples) {
  const durationSamples = Math.floor(6.0 * SAMPLE_RATE);
  const frequencies = [329.63, 659.25, 987.77, 1318.51, 1648.14]; 
  const amplitudes = [1.0, 0.45, 0.28, 0.15, 0.08];
  
  for (let i = 0; i < durationSamples; i++) {
    const idx = triggerSample + i;
    if (idx >= totalSamples) break;
    
    const progress = i / SAMPLE_RATE;
    const env = Math.exp(-progress * 0.85);
    
    let sample = 0;
    for (let f = 0; f < frequencies.length; f++) {
      const fFreq = frequencies[f];
      const fEnv = env * Math.exp(-progress * f * 0.8);
      sample += Math.sin(2 * Math.PI * fFreq * progress) * amplitudes[f] * fEnv;
    }
    
    const bellSample = sample * volume * 0.08;
    outL[idx] += bellSample * (1 - pan);
    outR[idx] += bellSample * pan;
  }
}

function synthesizeShimmerCluster(freq, duration, volume, pan, outL, outR, triggerSample, totalSamples) {
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  const partials = [
    { ratio: 2.0, amp: 0.9 },
    { ratio: 2.5, amp: 0.48 },
    { ratio: 3.0, amp: 0.32 },
    { ratio: 4.0, amp: 0.18 },
    { ratio: 5.0, amp: 0.1 }
  ];
  const phases = partials.map(() => random() * Math.PI * 2);

  for (let i = 0; i < durationSamples; i++) {
    const idx = triggerSample + i;
    if (idx >= totalSamples) break;

    const progress = i / SAMPLE_RATE;
    const attack = clamp(progress / 0.45, 0, 1);
    const env = attack * attack * Math.exp(-progress * 0.38);
    const tremolo = 0.75 + Math.sin(2 * Math.PI * progress * 0.19) * 0.12;
    let sample = 0;

    for (let p = 0; p < partials.length; p++) {
      const partial = partials[p];
      const partialFreq = freq * partial.ratio;
      if (partialFreq > 14500) continue;
      sample += Math.sin(2 * Math.PI * partialFreq * progress + phases[p]) * partial.amp;
    }

    const shimmer = sample * env * tremolo * volume * 0.32;
    outL[idx] += shimmer * (1 - pan);
    outR[idx] += shimmer * pan;
  }
}

function synthesizeRomanticBloom(chord, duration, volume, outL, outR, triggerSample, totalSamples) {
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  const notes = [
    chord[0] * 0.5,
    chord[2],
    chord[3],
    chord[4] ?? chord[3] * 1.25,
    (chord[5] ?? chord[4]) * 1.5
  ];

  for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
    const freq = notes[noteIndex];
    const phaseOffset = random() * Math.PI * 2;
    const pan = clamp(0.5 + Math.sin(noteIndex * 1.9) * 0.36, 0.08, 0.92);
    const noteVolume = volume * (noteIndex === 0 ? 0.8 : 1.0) / Math.sqrt(notes.length);

    for (let i = 0; i < durationSamples; i++) {
      const idx = triggerSample + i;
      if (idx >= totalSamples) break;

      const progress = i / SAMPLE_RATE;
      const attack = clamp(progress / 2.4, 0, 1);
      const releaseStart = duration * 0.62;
      const release = progress > releaseStart ? clamp(1 - (progress - releaseStart) / (duration - releaseStart), 0, 1) : 1;
      const env = attack * attack * (3 - 2 * attack) * release * release;
      const vibrato = 1 + Math.sin(2 * Math.PI * progress * (0.11 + noteIndex * 0.015)) * 0.0025;
      const fundamental = Math.sin(2 * Math.PI * freq * vibrato * progress + phaseOffset);
      const octave = Math.sin(2 * Math.PI * freq * 2.0 * progress + phaseOffset * 0.7) * 0.18;
      const breath = Math.sin(2 * Math.PI * freq * 0.5 * progress + phaseOffset * 1.3) * 0.12;
      const sample = (fundamental + octave + breath) * env * noteVolume;

      outL[idx] += sample * (1 - pan);
      outR[idx] += sample * pan;
    }
  }
}

function applyStereoMaster(outL, outR, loopSamples, options = {}) {
  const {
    stereoWidth = 1.08,
    warmth = 0.11,
    drive = 1.16,
    airTame = 0.68
  } = options;

  let lowL = 0;
  let lowR = 0;
  let smoothL = 0;
  let smoothR = 0;
  let dcL = 0;
  let dcR = 0;

  for (let i = 0; i < loopSamples; i++) {
    let left = outL[i];
    let right = outR[i];

    dcL = dcL * 0.995 + left * 0.005;
    dcR = dcR * 0.995 + right * 0.005;
    left -= dcL;
    right -= dcR;

    lowL += warmth * (left - lowL);
    lowR += warmth * (right - lowR);
    left += lowL * 0.08;
    right += lowR * 0.08;

    smoothL += 0.38 * (left - smoothL);
    smoothR += 0.38 * (right - smoothR);
    left = smoothL + (left - smoothL) * airTame;
    right = smoothR + (right - smoothR) * airTame;

    const mid = (left + right) * 0.5;
    const side = (left - right) * 0.5 * stereoWidth;
    outL[i] = softLimit(mid + side, drive);
    outR[i] = softLimit(mid - side, drive);
  }
}

const outputDir = path.join(process.cwd(), 'public', 'assets', 'audio');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeWavFile(outputPath, outL, outR, loopSamples, masterOptions = {}) {
  const { targetPeak = 0.88 } = masterOptions;
  applyStereoMaster(outL, outR, loopSamples, masterOptions);

  let maxVal = 0.001;
  let rms = 0;
  for (let i = 0; i < loopSamples; i++) {
    const absL = Math.abs(outL[i]);
    const absR = Math.abs(outR[i]);
    if (absL > maxVal) maxVal = absL;
    if (absR > maxVal) maxVal = absR;
    rms += (outL[i] * outL[i] + outR[i] * outR[i]) * 0.5;
  }
  
  const normFactor = targetPeak / maxVal;
  const pcmBuffer = Buffer.alloc(loopSamples * 2 * 2);
  let offset = 0;

  for (let i = 0; i < loopSamples; i++) {
    let sampleL = softLimit(outL[i] * normFactor, 1.08) * 0.96;
    let sampleR = softLimit(outR[i] * normFactor, 1.08) * 0.96;
    sampleL = clamp(sampleL + (random() - random()) / 65536, -1.0, 1.0);
    sampleR = clamp(sampleR + (random() - random()) / 65536, -1.0, 1.0);
    
    const intL = Math.floor(sampleL === 1.0 ? 32767 : sampleL * 32768);
    const intR = Math.floor(sampleR === 1.0 ? 32767 : sampleR * 32768);
    
    pcmBuffer.writeInt16LE(intL, offset);
    pcmBuffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  const wavDataLength = pcmBuffer.length;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(wavDataLength + 36, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(2, 22);
  wavHeader.writeUInt32LE(SAMPLE_RATE, 24);
  wavHeader.writeUInt32LE(SAMPLE_RATE * 2 * 2, 28);
  wavHeader.writeUInt16LE(2 * 2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(wavDataLength, 40);

  const writeStream = fs.createWriteStream(outputPath);
  writeStream.write(wavHeader);
  writeStream.write(pcmBuffer);
  writeStream.end();

  const rmsDb = 20 * Math.log10(Math.sqrt(rms / loopSamples) * normFactor + 0.000001);
  console.log(`  master: peak ${maxVal.toFixed(4)} -> ${(maxVal * normFactor).toFixed(3)}, rms ${rmsDb.toFixed(1)} dBFS`);
}

function synthesizeSoundtrack(filename, options) {
  const {
    duration = 48,
    chords,
    instrument = 'piano',
    windGain = 0.0,
    riverGain = 0.0,
    cricketsGain = 0.0,
    birdsGain = 0.0,
    taxiCabin = false,
    hospitalBeep = false,
    waterDrop = false,
    gravelSteps = false,      
    whistlingWind = false,    
    detunedCello = false,
    churchBellTime = null,    
    wireWindEffect = false,
    shimmerGain = 0.0,
    bloomGain = 0.0,
    padGainScale = 1.0,
    melodyGainScale = 1.0,
    melodyDensity = 1.0,
    delayWet = 0.30,
    delayFeedback = 0.38,
    stereoWidth = 1.08,
    masterDrive = 1.16,
    airTame = 0.68,
    targetPeak = 0.88
  } = options;

  const loopSamples = Math.floor(duration * SAMPLE_RATE);
  const renderDuration = duration + 8;
  const totalSamples = Math.floor(renderDuration * SAMPLE_RATE);
  
  const outL = new Float32Array(totalSamples);
  const outR = new Float32Array(totalSamples);

  console.log(`> Sintetizando: ${filename} (dur: ${duration}s, inst: ${instrument})...`);

  // 1. Synthesize Chord Pads
  for (let tSec = 0; tSec < renderDuration; tSec += 8) {
    const barIndex = Math.floor(tSec / 8);
    const chord = chords[barIndex % chords.length];
    
    for (let noteIndex = 0; noteIndex < chord.length; noteIndex++) {
      const freq = chord[noteIndex];
      const isBass = noteIndex < 2;
      
      const volume = (isBass ? (detunedCello ? 0.05 : 0.038) : 0.022) * padGainScale;
      
      const attack = detunedCello ? 2.5 : 2.0;
      const release = detunedCello ? 3.0 : 2.8;
      const triggerSample = Math.floor(tSec * SAMPLE_RATE);
      const durationSamples = Math.floor(8.0 * SAMPLE_RATE);
      const attackSamples = Math.floor(attack * SAMPLE_RATE);
      const releaseSamples = Math.floor(release * SAMPLE_RATE);
      
      const detuneRatios = detunedCello ? [0.994, 1.0, 1.006] : [0.9985, 1.0015];
      const voiceCount = detuneRatios.length;
      
      for (let v = 0; v < voiceCount; v++) {
        const detuneRatio = detuneRatios[v];
        const noteFreq = freq * detuneRatio;
        
        let phase = 0;
        let lpY1 = 0, lpY2 = 0;
        
        for (let i = 0; i < durationSamples + releaseSamples; i++) {
          const idx = triggerSample + i;
          if (idx >= totalSamples) break;
          
          let env = 0;
          if (i < attackSamples) {
            env = i / attackSamples;
          } else if (i < durationSamples) {
            env = 1.0;
          } else {
            const releaseIndex = i - durationSamples;
            env = 1.0 - (releaseIndex / releaseSamples);
          }
          
          env = env * env * (3 - 2 * env);
          
          phase += (2 * Math.PI * noteFreq) / SAMPLE_RATE;
          let sample = (detunedCello || isBass) ? Math.asin(Math.sin(phase)) * (2 / Math.PI) : Math.sin(phase);
          
          const lpCutoff = detunedCello ? 0.008 : 0.015;
          lpY1 = lpY1 + lpCutoff * (sample - lpY1);
          lpY2 = lpY2 + lpCutoff * (lpY1 - lpY2);
          
          const mixSample = lpY2 * env * volume * (1.0 / Math.sqrt(voiceCount));
          
          const pan = clamp(0.5 + 0.28 * Math.sin(noteIndex * 1.7 + v * 1.1) + (v - (voiceCount - 1) / 2) * 0.08, 0.08, 0.92);
          outL[idx] += mixSample * (1 - pan);
          outR[idx] += mixSample * pan;
        }
      }
    }
  }

  // 2. Synthesize Melody
  if (instrument !== 'synth') {
    const stepSec = 0.5;
    const totalSteps = Math.floor(renderDuration / stepSec);
    let lastFreq = -1;

    for (let step = 0; step < totalSteps; step++) {
      const tSec = step * stepSec;
      const bar = Math.floor(tSec / 8);
      const barProgression = (tSec % 8) / 8;
      
      let playChance = 0;
      if (step % 16 === 0) playChance = 0.70;
      else if (step % 16 === 8) playChance = 0.40;
      else if (step % 4 === 0) playChance = 0.15;
      
      if (barProgression > 0.75) playChance = 0;
      
      playChance *= melodyDensity;

      if (playChance > 0 && random() < playChance) {
        const chord = chords[bar % chords.length];
        
        let noteFreq = PENTATONIC[Math.floor(random() * PENTATONIC.length)];
        while (noteFreq === lastFreq) {
          noteFreq = PENTATONIC[Math.floor(random() * PENTATONIC.length)];
        }
        lastFreq = noteFreq;
        
        const triggerSample = Math.floor(tSec * SAMPLE_RATE);
        const pan = 0.35 + 0.3 * Math.sin(step * 2.3);
        
        if (instrument === 'guitar') {
          synthesizeGuitarPluck(noteFreq, 2.5, 0.038 * melodyGainScale, pan, outL, outR, triggerSample, totalSamples);
        } else if (instrument === 'piano') {
          synthesizePianoTone(noteFreq, 2.4, 0.035 * melodyGainScale, pan, outL, outR, triggerSample, totalSamples);
        } else if (instrument === 'musicbox') {
          synthesizeMusicBoxTone(noteFreq * 2.0, 3.2, 0.024 * melodyGainScale, pan, outL, outR, triggerSample, totalSamples);
        }
      }
    }
  }

  if (shimmerGain > 0) {
    for (let tSec = 4; tSec < renderDuration; tSec += 16) {
      if (random() < 0.18) continue;
      const bar = Math.floor(tSec / 8);
      const chord = chords[bar % chords.length];
      const shimmerRoot = chord[2] ?? chord[0];
      const triggerSample = Math.floor((tSec + random() * 1.1) * SAMPLE_RATE);
      const pan = 0.3 + 0.4 * random();
      synthesizeShimmerCluster(shimmerRoot, 7.5, shimmerGain, pan, outL, outR, triggerSample, totalSamples);
    }
  }

  if (bloomGain > 0) {
    for (let tSec = 0; tSec < renderDuration; tSec += 16) {
      const bar = Math.floor(tSec / 8);
      const chord = chords[bar % chords.length];
      const triggerSample = Math.floor((tSec + 0.35) * SAMPLE_RATE);
      synthesizeRomanticBloom(chord, 13.5, bloomGain, outL, outR, triggerSample, totalSamples);
    }
  }

  // 3. Synthesize Scheduled Church Bells
  if (churchBellTime) {
    for (const bellSec of churchBellTime) {
      const bellSample = Math.floor(bellSec * SAMPLE_RATE);
      synthesizeChurchBell(0.015, 0.32, outL, outR, bellSample, totalSamples);
    }
  }

  // 4. Stereo Cross-Feedback Tape Delay Effect
  const delayTimeSec = (waterDrop || hospitalBeep) ? 0.55 : 0.44;
  const delayLength = Math.floor(SAMPLE_RATE * delayTimeSec);
  const delayBufL = new Float32Array(delayLength);
  const delayBufR = new Float32Array(delayLength);
  let delayIdx = 0;

  for (let i = 0; i < totalSamples; i++) {
    const dL = delayBufL[delayIdx];
    const dR = delayBufR[delayIdx];
    
    const dryL = outL[i];
    const dryR = outR[i];
    
    outL[i] = dryL + dL * delayWet;
    outR[i] = dryR + dR * delayWet;
    
    delayBufL[delayIdx] = dryL + dR * delayFeedback;
    delayBufR[delayIdx] = dryR + dL * delayFeedback;
    
    delayIdx = (delayIdx + 1) % delayLength;
  }

  // 5. Synthesize Environmental Landscape Sounds
  let windY1 = 0, windY2 = 0;
  let riverY1 = 0, riverY2 = 0;
  let footstepY = 0;
  let whistleY1 = 0, whistleY2 = 0;
  let taxiY = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const whiteNoise = random() * 2 - 1;
    
    // Whistling wind (Road)
    if (wireWindEffect) {
      const wireLfo1 = Math.sin(2 * Math.PI * t * 0.11) * 0.5 + 0.5;
      const wireLfo2 = Math.sin(2 * Math.PI * t * 0.07 + 1.2) * 0.5 + 0.5;
      const wireFreq1 = 660.0 + 12.0 * Math.sin(2 * Math.PI * t * 1.6); 
      const wireFreq2 = 988.0 + 16.0 * Math.sin(2 * Math.PI * t * 1.3); 
      
      const wireWind = (Math.sin(2 * Math.PI * t * wireFreq1) * wireLfo1 * 0.0006 + 
                        Math.sin(2 * Math.PI * t * wireFreq2) * wireLfo2 * 0.0004);
      outL[i] += wireWind * 0.65;
      outR[i] += wireWind * 0.35;
    }

    // Gravel Footsteps
    if (gravelSteps) {
      const stepPeriod = 0.85;
      const stepT = t % stepPeriod;
      if (stepT < 0.09) {
        const isLeftStep = Math.floor(t / stepPeriod) % 2 === 0;
        const crunchCutoff = 0.04;
        footstepY = footstepY + crunchCutoff * (whiteNoise - footstepY);
        const crunchEnv = Math.sin(2 * Math.PI * stepT * (1 / 0.09)) * Math.exp(-stepT * 26.0);
        const crunchSample = footstepY * 0.0070 * crunchEnv;
        
        outL[i] += crunchSample * (isLeftStep ? 0.75 : 0.25);
        outR[i] += crunchSample * (isLeftStep ? 0.25 : 0.75);
      }
    }

    // Whistling wind through ravine rock canyon
    if (whistlingWind) {
      const whistleLfo = Math.sin(2 * Math.PI * t * 0.08) * 0.5 + 0.5;
      const whistleCutoff = 0.008 + 0.012 * whistleLfo;
      whistleY1 = whistleY1 + whistleCutoff * (whiteNoise - whistleY1);
      whistleY2 = whistleY2 + whistleCutoff * (whistleY1 - whistleY2);
      
      const whistlePeakFreq = 950 + 600 * Math.sin(2 * Math.PI * t * 0.04);
      const peakCutoff = (2 * Math.PI * whistlePeakFreq) / SAMPLE_RATE;
      let pkY = 0;
      pkY = pkY + peakCutoff * (whiteNoise - pkY);
      
      const canyonWind = whistleY2 * 0.004 + pkY * whistleLfo * 0.0018;
      outL[i] += canyonWind;
      outR[i] += canyonWind;
    }

    // Wind (regular swell gusts - Valley/Campo)
    if (windGain > 0 && !whistlingWind) {
      const windLfo = Math.sin(2 * Math.PI * t * 0.055) * 0.5 + 0.5;
      const windCutoff = 0.0018 + 0.0028 * windLfo;
      windY1 = windY1 + windCutoff * (whiteNoise - windY1);
      windY2 = windY2 + windCutoff * (windY1 - windY2);
      const windSample = windY2 * windGain;
      outL[i] += windSample;
      outR[i] += windSample;
    }

    // River (deep water flow murmur)
    if (riverGain > 0) {
      const riverLfo = Math.sin(2 * Math.PI * t * 0.22) * 0.5 + 0.5;
      const riverCutoff = 0.005 + 0.003 * riverLfo;
      riverY1 = riverY1 + riverCutoff * (whiteNoise - riverY1);
      riverY2 = riverY2 + riverCutoff * (riverY1 - riverY2);
      const riverSample = riverY2 * riverGain;
      outL[i] += riverSample * 0.75;
      outR[i] += riverSample * 0.40;
    }

    // Crickets / Cicadas
    if (cricketsGain > 0) {
      const cricketPeriod = 2.4;
      const cricketT = t % cricketPeriod;
      if (cricketT < 0.20) {
        const pulse = Math.sin(2 * Math.PI * cricketT * 50) * 0.5 + 0.5;
        const cricketSample = Math.sin(2 * Math.PI * cricketT * 3600) * pulse * cricketsGain * Math.exp(-cricketT * 9.0);
        outL[i] += cricketSample * 0.2;
        outR[i] += cricketSample * 0.8;
      }
    }

    // Aves Esporádicas (Interactive Call & Response)
    if (birdsGain > 0) {
      const birdPeriod = 12.0;
      const birdT = t % birdPeriod;
      
      if (birdT < 0.22) {
        const sweep = 1500 + 800 * Math.sin(2 * Math.PI * birdT * 4.5);
        const env = Math.sin(2 * Math.PI * birdT * (1 / 0.22)) * Math.exp(-birdT * 6.5);
        const birdSample = Math.sin(2 * Math.PI * birdT * sweep) * env * birdsGain;
        outL[i] += birdSample * 0.8;
        outR[i] += birdSample * 0.2;
      }
      
      if (birdT > 1.2 && birdT < 1.42) {
        const respT = birdT - 1.2;
        const sweep = 1750 + 700 * Math.sin(2 * Math.PI * respT * 5.0);
        const env = Math.sin(2 * Math.PI * respT * (1 / 0.22)) * Math.exp(-respT * 7.5);
        const birdSample = Math.sin(2 * Math.PI * respT * sweep) * env * birdsGain * 0.8;
        outL[i] += birdSample * 0.25;
        outR[i] += birdSample * 0.75;
      }
    }

    // Taxi Cabin Engine Hum
    if (taxiCabin) {
      taxiY = taxiY + 0.003 * (whiteNoise - taxiY);
      const rumble = Math.sin(2 * Math.PI * t * 44) * 0.003 + taxiY * 0.06;
      outL[i] += rumble;
      outR[i] += rumble;
    }

    // Hospital Beep
    if (hospitalBeep) {
      const beepPeriod = 8.0;
      const beepT = t % beepPeriod;
      if (beepT < 0.22) {
        const beepFreq = 659.25;
        const beepSample = Math.sin(2 * Math.PI * beepT * beepFreq) * 0.0012 * Math.exp(-beepT * 5.5);
        outL[i] += beepSample;
        outR[i] += beepSample;
      }
    }

    // Echoing water drops in ravine
    if (waterDrop) {
      const dropPeriod = 3.6;
      const dropT = t % dropPeriod;
      if (dropT < 0.12) {
        const isLeft = Math.floor(t / dropPeriod) % 2 === 0;
        const dropFreq = 900 - dropT * 1500;
        const dropSample = Math.sin(2 * Math.PI * dropT * dropFreq) * 0.0016 * Math.exp(-dropT * 16.0);
        outL[i] += dropSample * (isLeft ? 0.8 : 0.2);
        outR[i] += dropSample * (isLeft ? 0.2 : 0.8);
      }
    }
  }

  // 6. Wrap Reverb/Echo Tail for Perfect Loop
  const tailSamples = totalSamples - loopSamples;
  for (let i = 0; i < tailSamples; i++) {
    outL[i] += outL[loopSamples + i];
    outR[i] += outR[loopSamples + i];
  }

  // 7. Write WAV File
  const outputPath = path.join(outputDir, filename);
  writeWavFile(outputPath, outL, outR, loopSamples, { stereoWidth, drive: masterDrive, airTame, targetPeak });
}

// Remaster and render separate tracks for each location!
console.log(`Iniciando generador de banda sonora espacial por locaciones (Edicion de Coleccionista)...`);

// 1. TAXI (dark electric piano, cabin engine rumble, clock ticking)
synthesizeSoundtrack('chapter-1-taxi.wav', {
  duration: 32,
  chords: CHORDS_THEMES.taxi,
  instrument: 'piano',
  windGain: 0.0,
  taxiCabin: true,
  shimmerGain: 0.0035,
  bloomGain: 0.0045,
  stereoWidth: 1.04,
  masterDrive: 1.2,
  airTame: 0.64,
  targetPeak: 0.86
});

// 2. HOSPITAL (celesta music box, soft ambient pager beep, roomy)
synthesizeSoundtrack('chapter-1-hospital.wav', {
  duration: 32,
  chords: CHORDS_THEMES.hospital,
  instrument: 'musicbox',
  windGain: 0.0,
  hospitalBeep: true,
  shimmerGain: 0.0048,
  bloomGain: 0.0052,
  stereoWidth: 1.1,
  masterDrive: 1.12,
  airTame: 0.68,
  targetPeak: 0.86
});

// 3. ROAD (Karplus-Strong guitar plucks, quiet breeze, birds, distant soft bell)
// Remastered: Footsteps and wire whistling removed for a beautiful, pure musical backdrop
synthesizeSoundtrack('chapter-1-road.wav', {
  duration: 48,
  chords: CHORDS_THEMES.road,
  instrument: 'guitar',
  windGain: 0.0018,
  birdsGain: 0.0,
  gravelSteps: false,
  wireWindEffect: false,
  shimmerGain: 0.0016,
  bloomGain: 0.0,
  padGainScale: 0.38,
  melodyGainScale: 0.68,
  melodyDensity: 0.5,
  delayWet: 0.18,
  delayFeedback: 0.22,
  stereoWidth: 1.06,
  masterDrive: 1.08,
  airTame: 0.62,
  targetPeak: 0.78
});

// 4. BOSQUETE (leaf bed, tiny bells, sparse birds)
synthesizeSoundtrack('chapter-1-bosquete.wav', {
  duration: 48,
  chords: CHORDS_THEMES.bosquete,
  instrument: 'musicbox',
  windGain: 0.0032,
  birdsGain: 0.0012,
  churchBellTime: null,
  shimmerGain: 0.0046,
  bloomGain: 0.0018,
  padGainScale: 0.32,
  melodyGainScale: 0.42,
  melodyDensity: 0.36,
  delayWet: 0.24,
  delayFeedback: 0.24,
  stereoWidth: 1.14,
  masterDrive: 1.08,
  airTame: 0.68,
  targetPeak: 0.8
});

// 5. VALLEY (wide open air, low warm horizon, rare distant bell)
synthesizeSoundtrack('chapter-1-valley.wav', {
  duration: 48,
  chords: CHORDS_THEMES.valley,
  instrument: 'synth',
  windGain: 0.0045,
  birdsGain: 0.0,
  churchBellTime: [28.0],
  shimmerGain: 0.0018,
  bloomGain: 0.0,
  padGainScale: 0.62,
  delayWet: 0.2,
  delayFeedback: 0.18,
  stereoWidth: 1.18,
  masterDrive: 1.1,
  airTame: 0.58,
  targetPeak: 0.8
});

// 6. RAVINE (cello detuned pads, canyon rock whistling, water drops)
synthesizeSoundtrack('chapter-1-ravine.wav', {
  duration: 32,
  chords: CHORDS_THEMES.ravine,
  instrument: 'synth',
  windGain: 0.0,
  waterDrop: true,
  whistlingWind: true,
  detunedCello: true,
  shimmerGain: 0.003,
  bloomGain: 0.004,
  stereoWidth: 1.06,
  masterDrive: 1.22,
  airTame: 0.6,
  targetPeak: 0.85
});

// 7. RIVER (gorgeous grand piano, rushing water flow, call-response birds)
synthesizeSoundtrack('chapter-1-river.wav', {
  duration: 48,
  chords: CHORDS_THEMES.river,
  instrument: 'piano',
  riverGain: 0.007,
  birdsGain: 0.0,
  shimmerGain: 0.0012,
  bloomGain: 0.0,
  padGainScale: 0.26,
  melodyGainScale: 0.28,
  melodyDensity: 0.32,
  delayWet: 0.14,
  delayFeedback: 0.16,
  stereoWidth: 1.1,
  masterDrive: 1.06,
  airTame: 0.64,
  targetPeak: 0.78
});

// 8. GENERAL (Full soundtrack as backup / main theme)
synthesizeSoundtrack('chapter-1.wav', {
  duration: 48,
  chords: CHORDS_THEMES.river,
  instrument: 'piano',
  windGain: 0.004,
  birdsGain: 0.0015,
  shimmerGain: 0.008,
  bloomGain: 0.0085,
  stereoWidth: 1.14,
  masterDrive: 1.13,
  airTame: 0.73,
  targetPeak: 0.88
});

console.log(`\n¡Todas las pistas remasterizadas sintetizadas con exito!`);
