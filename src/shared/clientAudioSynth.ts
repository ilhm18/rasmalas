import type { Track } from './types';

const SAMPLE_RATE = 22050;
const clientAudioCache = new Map<string, string>();

const KEY_FREQS: Record<string, number> = {
  Am: 110.0,
  Bm: 123.47,
  Cm: 130.81,
  Dm: 146.83,
  Em: 82.41,
  Fm: 87.31,
  Gm: 98.0,
  C: 130.81,
  D: 146.83,
  F: 87.31,
  G: 98.0,
};

function getRootFreq(musicalKey: string): number {
  return KEY_FREQS[musicalKey.trim()] ?? 110.0;
}

function deterministicNoise(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

export function getClientReggaeTrackUrl(track: Track): string {
  const safeBpm = Math.max(64, Math.min(115, track.bpm || 76));
  const safeDuration = Math.max(16, Math.min(36, track.durationSec || 24));
  const cacheKey = `${track.id}:${safeBpm}:${track.musicalKey}:${track.synthSeed}:${safeDuration}`;

  const cached = clientAudioCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const numSamples = Math.floor(SAMPLE_RATE * safeDuration);
  const floatBuffer = new Float32Array(numSamples);
  const beatDuration = 60 / safeBpm;
  const barDuration = beatDuration * 4;
  const rootFreq = getRootFreq(track.musicalKey);

  const isMinor = track.musicalKey.toLowerCase().includes('m');
  const progression = isMinor
    ? [1.0, 0.8909, 0.7492, 0.8909]
    : [1.0, 1.3348, 1.4983, 1.3348];

  const delaySamples = Math.floor(beatDuration * 0.75 * SAMPLE_RATE);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const barIndex = Math.floor(t / barDuration) % 4;
    const barTime = t % barDuration;
    const beatIndex = Math.floor(barTime / beatDuration);
    const beatTime = barTime % beatDuration;
    const eighthTime = barTime % (beatDuration * 0.5);

    const chordRatio = progression[barIndex];
    const bassRoot = rootFreq * chordRatio;
    let sample = 0;

    let bassEnv = 0;
    let bassFreq = bassRoot;
    if (beatIndex === 0 && beatTime < beatDuration * 0.78) {
      bassEnv = Math.exp(-beatTime * 3.2) * Math.min(1, beatTime * 45);
    } else if (beatIndex === 1 && beatTime > beatDuration * 0.45) {
      const localT = beatTime - beatDuration * 0.45;
      bassEnv = Math.exp(-localT * 4.5) * Math.min(1, localT * 50);
      bassFreq = bassRoot * (track.synthSeed % 2 === 0 ? 1.5 : 1.1892);
    } else if (beatIndex === 2 && beatTime < beatDuration * 0.65) {
      bassEnv = Math.exp(-beatTime * 3.8) * Math.min(1, beatTime * 45);
    } else if (beatIndex === 3 && beatTime > beatDuration * 0.5) {
      const localT = beatTime - beatDuration * 0.5;
      bassEnv = Math.exp(-localT * 5.0) * Math.min(1, localT * 50);
      bassFreq = bassRoot * 1.1225;
    }

    if (bassEnv > 0.001) {
      const fundamental = Math.sin(2 * Math.PI * bassFreq * t);
      const warmHarmonic = 0.28 * Math.sin(4 * Math.PI * bassFreq * t);
      sample += (fundamental + warmHarmonic) * bassEnv * 0.46;
    }

    if ((beatIndex === 1 || beatIndex === 3) && beatTime < 0.14) {
      const skankEnv = Math.exp(-beatTime * 26) * Math.min(1, beatTime * 140);
      const chordRoot = bassRoot * 4;
      const thirdRatio = isMinor ? 1.1892 : 1.2599;
      const fifthRatio = 1.4983;
      const chordWave =
        0.4 * Math.sin(2 * Math.PI * chordRoot * t) +
        0.3 * Math.sin(2 * Math.PI * chordRoot * thirdRatio * t) +
        0.3 * Math.sin(2 * Math.PI * chordRoot * fifthRatio * t) +
        0.15 * Math.sin(2 * Math.PI * chordRoot * 2 * t);
      sample += chordWave * skankEnv * 0.28;
    }

    const bubblePhase = (barTime / (beatDuration * 0.5)) % 2;
    if (bubblePhase > 0.5 && bubblePhase < 0.85) {
      const bLocal = (bubblePhase - 0.5) * (beatDuration * 0.5);
      const bEnv = Math.exp(-bLocal * 18) * Math.min(1, bLocal * 100);
      const orgFreq = bassRoot * 2;
      sample += Math.sin(2 * Math.PI * orgFreq * t) * bEnv * 0.12;
    }

    if (beatIndex === 2 && beatTime < 0.22) {
      const kickPitch = 52 + 95 * Math.exp(-beatTime * 38);
      const kickEnv = Math.exp(-beatTime * 12) * Math.min(1, beatTime * 220);
      sample += Math.sin(2 * Math.PI * kickPitch * beatTime) * kickEnv * 0.45;

      if (beatTime < 0.08) {
        const rimEnv = Math.exp(-beatTime * 55);
        const rimTone =
          Math.sin(2 * Math.PI * (420 + (track.synthSeed % 5) * 20) * beatTime) * 0.5 +
          deterministicNoise(i) * 0.5;
        sample += rimTone * rimEnv * 0.26;
      }
    }

    if (eighthTime < 0.045) {
      const hatEnv = Math.exp(-eighthTime * 85);
      const accent = beatIndex === 1 || beatIndex === 3 ? 0.08 : 0.04;
      sample += deterministicNoise(i + track.synthSeed * 997) * hatEnv * accent;
    }

    let masterEnv = 1;
    if (t < 0.4) {
      masterEnv = t / 0.4;
    } else if (t > safeDuration - 1.2) {
      masterEnv = Math.max(0, (safeDuration - t) / 1.2);
    }

    floatBuffer[i] = sample * masterEnv;
  }

  for (let i = delaySamples; i < numSamples; i++) {
    floatBuffer[i] += floatBuffer[i - delaySamples] * 0.28;
  }

  const dataByteLength = numSamples * 2;
  const arrayBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(arrayBuffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-0.95, Math.min(0.95, floatBuffer[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  const objectUrl = URL.createObjectURL(blob);
  clientAudioCache.set(cacheKey, objectUrl);
  return objectUrl;
}
