// Pure TypeScript reggae dub WAV synthesizer for built-in streaming tracks.
// Generates a rich 16-bit PCM WAV buffer with warm sub-bass, off-beat skank chords,
// one-drop drum pattern, and tape-delay ambience so every track plays real audio.

const SAMPLE_RATE = 22050;
const audioCache = new Map<string, Buffer>();

const KEY_FREQS: Record<string, number> = {
  'Am': 110.0,
  'Bm': 123.47,
  'Cm': 130.81,
  'Dm': 146.83,
  'Em': 82.41,
  'Fm': 87.31,
  'Gm': 98.0,
  'C': 130.81,
  'D': 146.83,
  'F': 87.31,
  'G': 98.0,
};

function getRootFreq(musicalKey: string): number {
  const clean = musicalKey.trim();
  return KEY_FREQS[clean] ?? 110.0;
}

function deterministicNoise(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function generateReggaeTrackWav(
  trackId: string,
  bpm: number,
  musicalKey: string,
  synthSeed: number,
  targetDurationSec: number
): Buffer {
  const safeBpm = Math.max(64, Math.min(115, bpm || 76));
  const safeDuration = Math.max(16, Math.min(36, targetDurationSec || 24));
  const cacheKey = `${trackId}:${safeBpm}:${musicalKey}:${synthSeed}:${safeDuration}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const numSamples = Math.floor(SAMPLE_RATE * safeDuration);
  const floatBuffer = new Float32Array(numSamples);

  const beatDuration = 60 / safeBpm;
  const barDuration = beatDuration * 4;
  const rootFreq = getRootFreq(musicalKey);

  // 4-bar chord progression ratios (Roots minor/major feel)
  const isMinor = musicalKey.toLowerCase().includes('m');
  const progression = isMinor
    ? [1.0, 0.8909, 0.7492, 0.8909] // i - VII - VI - VII
    : [1.0, 1.3348, 1.4983, 1.3348]; // I - IV - V - IV

  // Delay buffer (~3/8 beat dub tape echo)
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

    // 1. Warm Dub Sub-Bass (syncopated roots reggae groove)
    // Plays on beat 1 (long), syncopated 2.5, and beat 3.5 pickup
    let bassEnv = 0;
    let bassFreq = bassRoot;
    if (beatIndex === 0 && beatTime < beatDuration * 0.78) {
      bassEnv = Math.exp(-beatTime * 3.2) * Math.min(1, beatTime * 45);
    } else if (beatIndex === 1 && beatTime > beatDuration * 0.45) {
      const localT = beatTime - beatDuration * 0.45;
      bassEnv = Math.exp(-localT * 4.5) * Math.min(1, localT * 50);
      bassFreq = bassRoot * (synthSeed % 2 === 0 ? 1.5 : 1.1892);
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

    // 2. Classic Off-Beat Reggae Skank Chords (beats 2 and 4)
    if ((beatIndex === 1 || beatIndex === 3) && beatTime < 0.14) {
      const skankEnv = Math.exp(-beatTime * 26) * Math.min(1, beatTime * 140);
      const chordRoot = bassRoot * 4; // mid-range guitar/organ register
      const thirdRatio = isMinor ? 1.1892 : 1.2599;
      const fifthRatio = 1.4983;
      const chordWave =
        0.4 * Math.sin(2 * Math.PI * chordRoot * t) +
        0.3 * Math.sin(2 * Math.PI * chordRoot * thirdRatio * t) +
        0.3 * Math.sin(2 * Math.PI * chordRoot * fifthRatio * t) +
        0.15 * Math.sin(2 * Math.PI * chordRoot * 2 * t);
      sample += chordWave * skankEnv * 0.28;
    }

    // 3. Organ Bubble (subtle 16th/8th syncopation)
    const bubblePhase = (barTime / (beatDuration * 0.5)) % 2;
    if (bubblePhase > 0.5 && bubblePhase < 0.85) {
      const bLocal = (bubblePhase - 0.5) * (beatDuration * 0.5);
      const bEnv = Math.exp(-bLocal * 18) * Math.min(1, bLocal * 100);
      const orgFreq = bassRoot * 2;
      sample += Math.sin(2 * Math.PI * orgFreq * t) * bEnv * 0.12;
    }

    // 4. One-Drop Reggae Drums (Kick + Rimshot Snare on beat 3, light kick on beat 1)
    if (beatIndex === 2 && beatTime < 0.22) {
      // Deep One-Drop Kick
      const kickPitch = 52 + 95 * Math.exp(-beatTime * 38);
      const kickEnv = Math.exp(-beatTime * 12) * Math.min(1, beatTime * 220);
      sample += Math.sin(2 * Math.PI * kickPitch * beatTime) * kickEnv * 0.45;

      // Cross-stick Rimshot Snare
      if (beatTime < 0.08) {
        const rimEnv = Math.exp(-beatTime * 55);
        const rimTone =
          Math.sin(2 * Math.PI * (420 + (synthSeed % 5) * 20) * beatTime) * 0.5 +
          deterministicNoise(i) * 0.5;
        sample += rimTone * rimEnv * 0.26;
      }
    }

    // Subtle hi-hat 8th notes
    if (eighthTime < 0.045) {
      const hatEnv = Math.exp(-eighthTime * 85);
      const accent = beatIndex === 1 || beatIndex === 3 ? 0.08 : 0.04;
      sample += deterministicNoise(i + synthSeed * 997) * hatEnv * accent;
    }

    // Smooth fade-in and fade-out at track boundaries
    let masterEnv = 1;
    if (t < 0.4) {
      masterEnv = t / 0.4;
    } else if (t > safeDuration - 1.2) {
      masterEnv = Math.max(0, (safeDuration - t) / 1.2);
    }

    floatBuffer[i] = sample * masterEnv;
  }

  // Apply warm analog dub tape echo (single feedback pass)
  for (let i = delaySamples; i < numSamples; i++) {
    floatBuffer[i] += floatBuffer[i - delaySamples] * 0.28;
  }

  // Encode 16-bit PCM WAV
  const dataByteLength = numSamples * 2;
  const wavBuffer = Buffer.alloc(44 + dataByteLength);

  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataByteLength, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // PCM chunk size
  wavBuffer.writeUInt16LE(1, 20); // PCM format
  wavBuffer.writeUInt16LE(1, 22); // Mono
  wavBuffer.writeUInt32LE(SAMPLE_RATE, 24);
  wavBuffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  wavBuffer.writeUInt16LE(2, 32);
  wavBuffer.writeUInt16LE(16, 34);
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataByteLength, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-0.95, Math.min(0.95, floatBuffer[i]));
    wavBuffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  if (audioCache.size > 24) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(cacheKey, wavBuffer);
  return wavBuffer;
}
