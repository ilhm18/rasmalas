import type { Track } from './types';

export interface SyncedLyricLine {
  index: number;
  timeSec: number;
  timeLabel: string;
  text: string;
}

const PLACEHOLDER_PATTERNS = [
  /^lirik\s+(lagu\s+)?belum\s+ditambahkan\.?$/i,
  /^belum\s+ada\s+lirik\.?$/i,
  /^-$|^—$/,
];

export function hasMeaningfulLyrics(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERNS.some((re) => re.test(trimmed));
}

export function formatLyricTimestamp(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const BUILTIN_TRACK_LYRICS: Record<string, string[]> = {
  uyee: [
    ' ♪ Intro Reggae & Bassline Rasmalas ♪ ',
    'Angin sore berhembus pelan di tepi panggung terbuka',
    'Suara bass bergetar hangat menyapa semua kawan lama',
    'Satu ritem one-drop mengalir lepas tanpa beban di dada',
    'Uyee... mari merapat ikuti ketukan irama kita',
    'Di bawah langit senja semua langkah terasa ringan',
    'Petikan gitar skank mengajak hati tuk bergoyang pelan',
    'Lepaskan penat hari ini di dalam hangatnya persaudaraan',
    'Uyee... nyanyikan bersama sampai bintang bermunculan',
    ' ♪ Interlude Brass & Dub Echo Session ♪ ',
    'Gema sound system menyatukan cerita dari tiap sudut kota',
    'Tak ada jarak di antara kita saat musik mulai bicara',
    'Biarkan getaran bas dan melodi menjaga damai di jiwa',
    'Uyee... Rasmalas hadir membawa hangatnya suasana',
    'Tangan di udara menyambut malam yang penuh warna',
    'Setiap senyum dan tawa menjadi energi yang nyata',
    'Terima kasih kawan sudah bernyanyi bersama irama kita',
    'Uyee... sampai jumpa di panggung berikutnya',
  ],
};

function generateFallbackLinesForTrack(track: Track): string[] {
  const titleLower = track.title.toLowerCase();
  if (titleLower.includes('uyee')) {
    return BUILTIN_TRACK_LYRICS.uyee;
  }
  const cleanTitle = track.title.replace(/^rasmalas\s*[-–—]\s*/i, '').trim() || track.title;
  return [
    ` ♪ Intro — ${track.title} ♪ `,
    `Alunan ritem reggae membuka kisah ${cleanTitle}`,
    'Ketukan drum dan sub-bass mengalir hangat di udara',
    'Petikan gitar skank menyatu dalam harmoni pesisir',
    `Bernyanyi bersama mengikuti irama ${cleanTitle}`,
    ' ♪ Instrumental & Dub Groove ♪ ',
    'Getaran analog membawa suasana santai penuh makna',
    'Setiap nada direkam hangat bersama Rasmalas Collective',
    `Biarkan melodi ${cleanTitle} menemani langkahmu hari ini`,
    ' ♪ Outro Dub Fade ♪ ',
  ];
}

/**
 * Parses raw lyrics (either LRC `[mm:ss] text` or plain multi-line text)
 * into timestamped Spotify-style synced lyric lines across `durationSec`.
 * If the track has no manual lyrics, automatically generates synced lines
 * so lyrics are always available without manual admin input.
 */
export function buildSyncedLyrics(
  track: Track,
  effectiveDurationSec: number
): SyncedLyricLine[] {
  const totalSec = Math.max(20, effectiveDurationSec || track.durationSec || 180);
  const raw = hasMeaningfulLyrics(track.lyrics) ? track.lyrics.trim() : '';

  const rawLines = raw
    ? raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : generateFallbackLinesForTrack(track);

  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.\d{1,3})?\]\s*(.*)$/;
  const parsedLrc: { timeSec: number; text: string }[] = [];
  let lrcMatchCount = 0;

  for (const line of rawLines) {
    const match = lrcRegex.exec(line);
    if (match) {
      lrcMatchCount++;
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const text = match[3].trim() || '♪';
      parsedLrc.push({
        timeSec: mins * 60 + secs,
        text,
      });
    } else {
      parsedLrc.push({
        timeSec: -1,
        text: line,
      });
    }
  }

  // If the majority of lines already have LRC [mm:ss] timestamps, use them directly
  if (lrcMatchCount > 0 && lrcMatchCount >= Math.ceil(rawLines.length / 2)) {
    let lastSec = 0;
    return parsedLrc.map((item, idx) => {
      const t = item.timeSec >= 0 ? item.timeSec : lastSec + 4;
      lastSec = t;
      return {
        index: idx,
        timeSec: t,
        timeLabel: formatLyricTimestamp(t),
        text: item.text,
      };
    });
  }

  // Otherwise distribute lines naturally across the song duration (from ~3s to ~90% of duration)
  const count = rawLines.length;
  const startOffset = Math.min(4, Math.max(1, Math.floor(totalSec * 0.03)));
  const usableSpan = Math.max(10, totalSec * 0.88 - startOffset);
  const step = count > 1 ? usableSpan / count : usableSpan;

  return rawLines.map((text, idx) => {
    const cleanText = text.replace(lrcRegex, '$3').trim() || text;
    const timeSec = idx === 0 ? 0 : Math.round(startOffset + idx * step);
    return {
      index: idx,
      timeSec,
      timeLabel: formatLyricTimestamp(timeSec),
      text: cleanText,
    };
  });
}

export function findActiveLyricIndex(
  lines: SyncedLyricLine[],
  currentTimeSec: number
): number {
  if (lines.length === 0) return -1;
  let activeIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (currentTimeSec + 0.35 >= lines[i].timeSec) {
      activeIdx = i;
    } else {
      break;
    }
  }
  return activeIdx;
}
