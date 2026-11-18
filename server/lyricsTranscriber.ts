import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

function detectAudioMimeType(urlOrPath: string, headerMime?: string | null): string {
  if (headerMime && headerMime.startsWith('audio/')) {
    return headerMime.split(';')[0].trim();
  }
  const clean = urlOrPath.split('?')[0].toLowerCase();
  if (clean.endsWith('.wav')) return 'audio/wav';
  if (clean.endsWith('.ogg')) return 'audio/ogg';
  if (clean.endsWith('.m4a') || clean.endsWith('.mp4')) return 'audio/mp4';
  if (clean.endsWith('.flac')) return 'audio/flac';
  if (clean.endsWith('.aac')) return 'audio/aac';
  if (clean.endsWith('.webm')) return 'audio/webm';
  return 'audio/mp3';
}

async function loadAudioBytes(
  audioUrl: string
): Promise<{ base64: string; mimeType: string } | null> {
  const trimmed = audioUrl.trim();
  if (!trimmed) return null;

  // Local uploaded file under /uploads/...
  if (trimmed.startsWith('/uploads/')) {
    const rel = trimmed.replace(/^\/+/, '');
    const fullPath = path.resolve(process.cwd(), 'public', rel);
    if (!fs.existsSync(fullPath)) return null;
    const buf = await fs.promises.readFile(fullPath);
    if (buf.length === 0 || buf.length > 25 * 1024 * 1024) return null;
    return {
      base64: buf.toString('base64'),
      mimeType: detectAudioMimeType(fullPath),
    };
  }

  // Remote URL (e.g. Supabase Storage public URL)
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length === 0 || buf.length > 25 * 1024 * 1024) return null;
    return {
      base64: buf.toString('base64'),
      mimeType: detectAudioMimeType(trimmed, res.headers.get('content-type')),
    };
  }

  return null;
}

export async function transcribeTrackLyricsFromAudio(params: {
  title: string;
  audioUrl?: string;
  durationSec?: number;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !params.audioUrl) {
    return null;
  }

  const loaded = await loadAudioBytes(params.audioUrl);
  if (!loaded) {
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const audioPart = {
    inlineData: {
      mimeType: loaded.mimeType,
      data: loaded.base64,
    },
  };

  const promptText =
    `Transkripsikan seluruh lirik vokal yang dinyanyikan di dalam file audio lagu "${params.title}" ini secara akurat baris demi baris seperti lirik sinkronisasi Spotify.\n` +
    `Aturan format output:\n` +
    `1. Awali setiap baris dengan timestamp format [mm:ss] sesuai waktu vokal mulai dinyanyikan (contoh: [00:14] Baris lirik...).\n` +
    `2. Hanya tuliskan baris lirik dengan [mm:ss] tanpa komentar pembuka atau penutup.\n` +
    `3. Jika ada bagian musik instrumental yang panjang di awal/tengah, tambahkan baris seperti [00:00] ♪ Intro Musik ♪ atau [mm:ss] ♪ Instrumental ♪.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [audioPart, { text: promptText }],
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) return null;
  return text.slice(0, 4000);
}
