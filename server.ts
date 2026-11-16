import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { generateReggaeTrackWav } from './server/audioSynth.ts';
import {
  dbDeleteGalleryPhoto,
  dbDeleteShoutout,
  dbDeleteSiteSection,
  dbDeleteSocialPost,
  dbDeleteTour,
  dbDeleteTrack,
  dbIncrementPostLike,
  dbIncrementTourRsvp,
  dbIncrementTrackPlay,
  dbInsertShoutout,
  dbInsertSocialPost,
  dbReorderSiteSections,
  dbSaveProfileAndMembers,
  dbSaveSocialChannels,
  dbUpsertGalleryPhoto,
  dbUpsertSiteSection,
  dbUpsertTour,
  dbUpsertTrack,
  getState,
  initStore,
  updateState,
} from './server/store.ts';
import {
  authenticateSupabaseAdmin,
  isSupabaseConfigured,
  uploadMediaToSupabaseStorage,
} from './server/supabase.ts';
import type {
  BandProfile,
  GalleryCategory,
  GalleryPhoto,
  SiteSection,
  SocialChannel,
  SocialPlatform,
  SocialPost,
  TourDate,
  TourStatus,
  Track,
  WsServerMessage,
} from './src/shared/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rasmalas.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'reggae2026';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'rasmalas-analog-dub-session-key-2026';

const COOKIE_NAME = 'senja_admin_token';

// Maps session ID -> Supabase access_token (when signed in via Supabase Auth)
const sbTokenStore = new Map<string, string>();

interface AdminRequest extends Request {
  adminEmail?: string;
  sbToken?: string;
}

function signToken(email: string, sbToken?: string): string {
  const sid = crypto.randomBytes(12).toString('hex');
  if (sbToken) {
    sbTokenStore.set(sid, sbToken);
  }
  const payload = Buffer.from(
    JSON.stringify({ email, sid, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(
  token: string | undefined
): { email: string; sid?: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email: string;
      sid?: string;
      exp: number;
    };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return { email: parsed.email, sid: parsed.sid };
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((part) => part.trim());
    for (const c of cookies) {
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        return decodeURIComponent(c.slice(COOKIE_NAME.length + 1));
      }
    }
  }
  return undefined;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const verified = verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Sesi admin tidak valid atau sudah berakhir.' });
    return;
  }
  const adminReq = req as AdminRequest;
  adminReq.adminEmail = verified.email;
  adminReq.sbToken = verified.sid ? sbTokenStore.get(verified.sid) : undefined;
  next();
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

async function startServer(): Promise<void> {
  await initStore();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Real file upload endpoint for photos, videos, and audio (Supabase Storage + local fallback)
  app.post(
    '/api/admin/upload',
    requireAdmin,
    express.raw({
      type: ['image/*', 'video/*', 'audio/*', 'application/octet-stream'],
      limit: '50mb',
    }),
    async (req, res) => {
      const adminReq = req as AdminRequest;
      const body = req.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: 'File upload kosong atau tidak valid.' });
        return;
      }

      const rawMime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const isImage = rawMime.startsWith('image/');
      const isVideo = rawMime.startsWith('video/');
      const isAudio = rawMime.startsWith('audio/');
      if (!isImage && !isVideo && !isAudio) {
        res.status(400).json({
          error: 'Format file harus berupa foto (JPG/PNG/WebP/GIF), video (MP4/WebM/MOV), atau audio (MP3/WAV).',
        });
        return;
      }

      const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'media'));
      const extFromMime = rawMime.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin';
      const extMatch = /\.([a-zA-Z0-9]{2,5})$/.exec(rawName);
      const ext = extMatch ? extMatch[1].toLowerCase() : extFromMime === 'quicktime' ? 'mov' : extFromMime;
      const safeFolder = String(req.headers['x-folder'] || 'media').replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'media';
      const fileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const storagePath = `${safeFolder}/${fileName}`;
      const mediaType: 'image' | 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      try {
        if (isSupabaseConfigured()) {
          const publicUrl = await uploadMediaToSupabaseStorage(
            body,
            storagePath,
            rawMime,
            adminReq.sbToken
          );
          if (publicUrl) {
            res.status(201).json({ url: publicUrl, mediaType, storage: 'supabase' });
            return;
          }
        }

        const folderPath = path.join(uploadsDir, safeFolder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        fs.writeFileSync(path.join(folderPath, fileName), body);
        res.status(201).json({
          url: `/uploads/${safeFolder}/${fileName}`,
          mediaType,
          storage: 'local',
        });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Gagal mengunggah file media.',
        });
      }
    }
  );

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcast(message: WsServerMessage): void {
    const raw = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  function broadcastPresence(): void {
    let activeCount = 0;
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        activeCount++;
      }
    }
    broadcast({ type: 'presence:count', payload: { count: activeCount } });
  }

  wss.on('connection', (ws) => {
    const state = getState();
    ws.send(JSON.stringify({ type: 'state:init', payload: state }));
    broadcastPresence();

    ws.on('close', () => {
      broadcastPresence();
    });
  });

  // Public state endpoint
  app.get('/api/state', (_req, res) => {
    res.json({
      state: getState(),
      onlineCount: wss.clients.size,
    });
  });

  // Real synthesized reggae audio endpoint with HTTP Range support for seeking
  app.get('/api/audio/:trackId.wav', (req, res) => {
    const trackId = req.params.trackId;
    const track = getState().tracks.find((t) => t.id === trackId);
    if (!track) {
      res.status(404).json({ error: 'Track tidak ditemukan.' });
      return;
    }

    const wavBuffer = generateReggaeTrackWav(
      track.id,
      track.bpm,
      track.musicalKey,
      track.synthSeed,
      track.durationSec
    );

    const total = wavBuffer.length;
    const range = req.headers.range;
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        if (start >= total || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
          return;
        }
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', String(end - start + 1));
        res.end(wavBuffer.subarray(start, end + 1));
        return;
      }
    }

    res.setHeader('Content-Length', String(total));
    res.end(wavBuffer);
  });

  // Public real-time interactions
  app.post('/api/tracks/:id/play', async (req, res) => {
    const { id } = req.params;
    const exists = getState().tracks.some((t) => t.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Lagu tidak ditemukan.' });
      return;
    }
    await dbIncrementTrackPlay(id);
    const next = updateState((draft) => {
      const target = draft.tracks.find((t) => t.id === id);
      if (target) target.plays += 1;
    });
    broadcast({ type: 'tracks:updated', payload: next.tracks });
    res.json({ tracks: next.tracks });
  });

  app.post('/api/tours/:id/rsvp', async (req, res) => {
    const { id } = req.params;
    const exists = getState().tours.some((t) => t.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
      return;
    }
    await dbIncrementTourRsvp(id);
    const next = updateState((draft) => {
      const target = draft.tours.find((t) => t.id === id);
      if (target) target.rsvpCount += 1;
    });
    broadcast({ type: 'tours:updated', payload: next.tours });
    res.json({ tours: next.tours });
  });

  app.post('/api/social/posts/:id/like', async (req, res) => {
    const { id } = req.params;
    const exists = getState().socialPosts.some((p) => p.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Postingan sosial tidak ditemukan.' });
      return;
    }
    await dbIncrementPostLike(id);
    const next = updateState((draft) => {
      const target = draft.socialPosts.find((p) => p.id === id);
      if (target) target.likes += 1;
    });
    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.json({ socialPosts: next.socialPosts });
  });

  app.post('/api/social/shoutouts', async (req, res) => {
    const senderName = String(req.body?.senderName ?? '').trim().slice(0, 50);
    const city = String(req.body?.city ?? '').trim().slice(0, 40) || 'Nusantara';
    const message = String(req.body?.message ?? '').trim().slice(0, 240);

    if (!senderName || !message) {
      res.status(400).json({ error: 'Nama dan pesan wajib diisi.' });
      return;
    }

    const newShoutout = {
      id: makeId('sh'),
      senderName,
      city,
      message,
      createdAt: new Date().toISOString(),
    };

    await dbInsertShoutout(newShoutout);

    const next = updateState((draft) => {
      draft.shoutouts.unshift(newShoutout);
      if (draft.shoutouts.length > 30) {
        draft.shoutouts = draft.shoutouts.slice(0, 30);
      }
    });

    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.status(201).json({ shoutouts: next.shoutouts });
  });

  // Admin authentication endpoints (Supabase Auth + admin_users, with fallback env admin)
  app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    let sbAccessToken: string | undefined;
    let authenticatedEmail = email;

    if (isSupabaseConfigured()) {
      const sbAuth = await authenticateSupabaseAdmin(email, password);
      if (sbAuth.ok && sbAuth.email) {
        sbAccessToken = sbAuth.accessToken;
        authenticatedEmail = sbAuth.email;
      } else if (
        email === ADMIN_EMAIL.toLowerCase() &&
        password === ADMIN_PASSWORD
      ) {
        authenticatedEmail = ADMIN_EMAIL.toLowerCase();
      } else {
        res.status(401).json({
          error: sbAuth.error || 'Email atau kata sandi admin tidak sesuai.',
        });
        return;
      }
    } else if (
      email !== ADMIN_EMAIL.toLowerCase() ||
      password !== ADMIN_PASSWORD
    ) {
      res.status(401).json({ error: 'Email atau kata sandi admin tidak sesuai.' });
      return;
    }

    const token = signToken(authenticatedEmail, sbAccessToken);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );
    res.json({
      authenticated: true,
      email: authenticatedEmail,
      token,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const verified = verifyToken(extractToken(req));
    if (verified?.sid) {
      sbTokenStore.delete(verified.sid);
    }
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    res.json({ authenticated: false });
  });

  app.get('/api/auth/me', (req, res) => {
    const verified = verifyToken(extractToken(req));
    if (!verified) {
      res.json({ authenticated: false, email: null });
      return;
    }
    res.json({ authenticated: true, email: verified.email });
  });

  // Admin protected CRUD endpoints
  app.put('/api/admin/profile', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<BandProfile>;
    const current = structuredClone(getState().profile);

    if (typeof body.name === 'string' && body.name.trim())
      current.name = body.name.trim().slice(0, 60);
    if (typeof body.logoUrl === 'string')
      current.logoUrl = body.logoUrl.trim() || undefined;
    if (typeof body.kicker === 'string')
      current.kicker = body.kicker.trim().slice(0, 120);
    if (typeof body.headline === 'string' && body.headline.trim())
      current.headline = body.headline.trim().slice(0, 160);
    if (typeof body.subheadline === 'string')
      current.subheadline = body.subheadline.trim().slice(0, 320);
    if (typeof body.bio === 'string') current.bio = body.bio.trim().slice(0, 800);
    if (typeof body.studioQuote === 'string')
      current.studioQuote = body.studioQuote.trim().slice(0, 300);
    if (typeof body.originCity === 'string')
      current.originCity = body.originCity.trim().slice(0, 80);
    if (typeof body.bookingEmail === 'string')
      current.bookingEmail = body.bookingEmail.trim().slice(0, 120);
    if (typeof body.heroImage === 'string' && body.heroImage.trim())
      current.heroImage = body.heroImage.trim().slice(0, 500);
    if (typeof body.studioImage === 'string' && body.studioImage.trim())
      current.studioImage = body.studioImage.trim().slice(0, 500);
    if (typeof body.heroCtaPrimary === 'string')
      current.heroCtaPrimary = body.heroCtaPrimary.trim().slice(0, 60) || 'Putar Album Terbaru';
    if (typeof body.heroCtaSecondary === 'string')
      current.heroCtaSecondary = body.heroCtaSecondary.trim().slice(0, 60) || 'Lihat Jadwal';
    if (typeof body.heroCardKicker === 'string')
      current.heroCardKicker = body.heroCardKicker.trim().slice(0, 80);
    if (typeof body.heroCardTitle === 'string')
      current.heroCardTitle = body.heroCardTitle.trim().slice(0, 120);
    if (typeof body.footerNote === 'string')
      current.footerNote = body.footerNote.trim().slice(0, 140);
    if (Array.isArray(body.stats)) {
      current.stats = body.stats.slice(0, 4).map((s) => ({
        label: String(s.label ?? '').slice(0, 40),
        value: String(s.value ?? '').slice(0, 30),
      }));
    }
    if (Array.isArray(body.members)) {
      current.members = body.members.slice(0, 20).map((m, idx) => ({
        id: m.id || `m-${idx + 1}`,
        name: String(m.name ?? '').slice(0, 60),
        role: String(m.role ?? '').slice(0, 60),
        instrument: String(m.instrument ?? '').slice(0, 80),
        origin: String(m.origin ?? '').slice(0, 40),
        instagramUrl: m.instagramUrl ? String(m.instagramUrl).trim().slice(0, 300) : undefined,
      }));
    }

    try {
      await dbSaveProfileAndMembers(current, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menyimpan profil ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.profile = current;
    });
    broadcast({ type: 'profile:updated', payload: next.profile });
    res.json({ profile: next.profile });
  });

  // Website sections & page layout management (Add, Edit, Reorder, Delete)
  function slugifySection(raw: string, fallback: string): string {
    const cleaned = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return cleaned || fallback;
  }

  app.post('/api/admin/sections', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<SiteSection>;
    const navLabel = String(body.navLabel ?? '').trim().slice(0, 40);
    const title = String(body.title ?? '').trim().slice(0, 140);
    if (!navLabel || !title) {
      res.status(400).json({ error: 'Nama menu navigasi dan judul bagian wajib diisi.' });
      return;
    }

    const existingSections = getState().siteSections;
    const baseSlug = slugifySection(String(body.slug ?? navLabel), makeId('bagian'));
    let slug = baseSlug;
    let counter = 2;
    while (existingSections.some((s) => s.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const maxOrder = existingSections.reduce(
      (max, s) => Math.max(max, s.sortOrder),
      -1
    );

    const newSection: SiteSection = {
      id: makeId('sec'),
      slug,
      navLabel,
      kicker: String(body.kicker ?? '').trim().slice(0, 100),
      title,
      subtitle: body.subtitle ? String(body.subtitle).trim().slice(0, 240) : undefined,
      body: body.body ? String(body.body).trim().slice(0, 3000) : undefined,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim().slice(0, 500) : undefined,
      mediaType: body.imageUrl
        ? body.mediaType === 'video'
          ? 'video'
          : 'image'
        : undefined,
      ctaLabel: body.ctaLabel ? String(body.ctaLabel).trim().slice(0, 60) : undefined,
      ctaUrl: body.ctaUrl ? String(body.ctaUrl).trim().slice(0, 300) : undefined,
      visible: body.visible !== false,
      showInNav: body.showInNav !== false,
      sortOrder: maxOrder + 1,
    };

    try {
      await dbUpsertSiteSection(newSection, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan bagian halaman ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.siteSections.push(newSection);
      draft.siteSections.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    broadcast({ type: 'sections:updated', payload: next.siteSections });
    res.status(201).json({ siteSections: next.siteSections, section: newSection });
  });

  app.put('/api/admin/sections/reorder', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const orderedIds = req.body?.orderedIds as string[] | undefined;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400).json({ error: 'Daftar urutan bagian tidak valid.' });
      return;
    }

    const current = getState().siteSections;
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => orderMap.set(id, idx));

    const updatedList: SiteSection[] = current
      .map((s, idx) => ({
        ...s,
        sortOrder: orderMap.has(s.id) ? (orderMap.get(s.id) as number) : orderedIds.length + idx,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s, idx) => ({ ...s, sortOrder: idx }));

    try {
      await dbReorderSiteSections(updatedList, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal memperbarui urutan halaman di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.siteSections = updatedList;
    });
    broadcast({ type: 'sections:updated', payload: next.siteSections });
    res.json({ siteSections: next.siteSections });
  });

  app.put('/api/admin/sections/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;
    const body = req.body as Partial<SiteSection>;
    const existing = getState().siteSections.find((s) => s.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Bagian halaman tidak ditemukan.' });
      return;
    }

    const updated: SiteSection = structuredClone(existing);
    if (typeof body.navLabel === 'string' && body.navLabel.trim())
      updated.navLabel = body.navLabel.trim().slice(0, 40);
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const candidate = slugifySection(body.slug, existing.slug);
      const conflict = getState().siteSections.some(
        (s) => s.id !== id && s.slug === candidate
      );
      if (!conflict) updated.slug = candidate;
    }
    if (typeof body.kicker === 'string')
      updated.kicker = body.kicker.trim().slice(0, 100);
    if (typeof body.title === 'string' && body.title.trim())
      updated.title = body.title.trim().slice(0, 140);
    if (typeof body.subtitle === 'string')
      updated.subtitle = body.subtitle.trim().slice(0, 240) || undefined;
    if (typeof body.body === 'string')
      updated.body = body.body.trim().slice(0, 3000) || undefined;
    if (typeof body.imageUrl === 'string') {
      updated.imageUrl = body.imageUrl.trim().slice(0, 500) || undefined;
      updated.mediaType = updated.imageUrl
        ? body.mediaType === 'video'
          ? 'video'
          : 'image'
        : undefined;
    }
    if (typeof body.ctaLabel === 'string')
      updated.ctaLabel = body.ctaLabel.trim().slice(0, 60) || undefined;
    if (typeof body.ctaUrl === 'string')
      updated.ctaUrl = body.ctaUrl.trim().slice(0, 300) || undefined;
    if (typeof body.visible === 'boolean') updated.visible = body.visible;
    if (typeof body.showInNav === 'boolean') updated.showInNav = body.showInNav;
    if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder))
      updated.sortOrder = body.sortOrder;

    try {
      await dbUpsertSiteSection(updated, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal memperbarui bagian halaman di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      const idx = draft.siteSections.findIndex((s) => s.id === id);
      if (idx !== -1) draft.siteSections[idx] = updated;
      draft.siteSections.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    broadcast({ type: 'sections:updated', payload: next.siteSections });
    res.json({ siteSections: next.siteSections, section: updated });
  });

  app.delete('/api/admin/sections/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteSiteSection(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal menghapus bagian halaman di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.siteSections = draft.siteSections
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, sortOrder: idx }));
    });
    broadcast({ type: 'sections:updated', payload: next.siteSections });
    res.json({ siteSections: next.siteSections });
  });

  app.post('/api/admin/tracks', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<Track>;
    const title = String(body.title ?? '').trim().slice(0, 100);
    if (!title) {
      res.status(400).json({ error: 'Judul lagu wajib diisi.' });
      return;
    }
    const newTrack: Track = {
      id: makeId('trk'),
      title,
      album: String(body.album ?? 'Single Terbaru').trim().slice(0, 80),
      year: String(body.year ?? '2026').trim().slice(0, 10),
      durationSec: Math.max(16, Math.min(600, Number(body.durationSec) || 26)),
      bpm: Math.max(64, Math.min(120, Number(body.bpm) || 76)),
      musicalKey: String(body.musicalKey ?? 'Am').trim().slice(0, 6),
      synthSeed: Math.floor(Math.random() * 100) + 1,
      coverUrl:
        String(body.coverUrl ?? '').trim() ||
        '/src/assets/images/album_cover_senja_1794832345337.jpg',
      audioUrl: body.audioUrl ? String(body.audioUrl).trim() : undefined,
      plays: 0,
      lyrics: String(body.lyrics ?? 'Lirik belum ditambahkan.').trim().slice(0, 2000),
      credits: String(body.credits ?? 'Rasmalas Collective').trim().slice(0, 200),
    };

    try {
      await dbUpsertTrack(newTrack, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menyimpan lagu ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.tracks.unshift(newTrack);
    });
    broadcast({ type: 'tracks:updated', payload: next.tracks });
    res.status(201).json({ tracks: next.tracks, track: newTrack });
  });

  app.put('/api/admin/tracks/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;
    const body = req.body as Partial<Track>;
    const existing = getState().tracks.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Lagu tidak ditemukan.' });
      return;
    }

    const updated: Track = structuredClone(existing);
    if (typeof body.title === 'string' && body.title.trim())
      updated.title = body.title.trim().slice(0, 100);
    if (typeof body.album === 'string') updated.album = body.album.trim().slice(0, 80);
    if (typeof body.year === 'string') updated.year = body.year.trim().slice(0, 10);
    if (typeof body.bpm === 'number')
      updated.bpm = Math.max(64, Math.min(120, body.bpm));
    if (typeof body.durationSec === 'number' && Number.isFinite(body.durationSec))
      updated.durationSec = Math.max(10, Math.min(1800, Math.round(body.durationSec)));
    if (typeof body.musicalKey === 'string')
      updated.musicalKey = body.musicalKey.trim().slice(0, 6);
    if (typeof body.coverUrl === 'string' && body.coverUrl.trim())
      updated.coverUrl = body.coverUrl.trim();
    if (typeof body.audioUrl === 'string')
      updated.audioUrl = body.audioUrl.trim() || undefined;
    if (typeof body.lyrics === 'string')
      updated.lyrics = body.lyrics.trim().slice(0, 2000);
    if (typeof body.credits === 'string')
      updated.credits = body.credits.trim().slice(0, 200);

    try {
      await dbUpsertTrack(updated, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal memperbarui lagu di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      const idx = draft.tracks.findIndex((t) => t.id === id);
      if (idx !== -1) draft.tracks[idx] = updated;
    });
    broadcast({ type: 'tracks:updated', payload: next.tracks });
    res.json({ tracks: next.tracks });
  });

  app.delete('/api/admin/tracks/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteTrack(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menghapus lagu di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.tracks = draft.tracks.filter((t) => t.id !== id);
    });
    broadcast({ type: 'tracks:updated', payload: next.tracks });
    res.json({ tracks: next.tracks });
  });

  app.post('/api/admin/tours', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<TourDate>;
    const city = String(body.city ?? '').trim().slice(0, 60);
    const venue = String(body.venue ?? '').trim().slice(0, 100);
    const date = String(body.date ?? '').trim().slice(0, 20);
    if (!city || !venue || !date) {
      res.status(400).json({ error: 'Tanggal, kota, dan venue wajib diisi.' });
      return;
    }
    const allowedStatuses: TourStatus[] = ['Tersedia', 'Terbatas', 'Habis', 'Selesai'];
    const status = allowedStatuses.includes(body.status as TourStatus)
      ? (body.status as TourStatus)
      : 'Tersedia';

    const newTour: TourDate = {
      id: makeId('tour'),
      date,
      city,
      country: String(body.country ?? 'Indonesia').trim().slice(0, 40),
      venue,
      stageTime: String(body.stageTime ?? '20:00 WIB').trim().slice(0, 25),
      priceLabel: String(body.priceLabel ?? 'Rp 150.000').trim().slice(0, 30),
      status,
      ticketUrl: String(body.ticketUrl ?? '#jadwal').trim().slice(0, 300),
      rsvpCount: 0,
      notes: body.notes ? String(body.notes).trim().slice(0, 200) : undefined,
    };

    try {
      await dbUpsertTour(newTour, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menyimpan jadwal ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.tours.unshift(newTour);
      draft.tours.sort((a, b) => a.date.localeCompare(b.date));
    });
    broadcast({ type: 'tours:updated', payload: next.tours });
    res.status(201).json({ tours: next.tours, tour: newTour });
  });

  app.put('/api/admin/tours/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;
    const body = req.body as Partial<TourDate>;
    const existing = getState().tours.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
      return;
    }
    const allowedStatuses: TourStatus[] = ['Tersedia', 'Terbatas', 'Habis', 'Selesai'];
    const updated: TourDate = structuredClone(existing);
    if (typeof body.date === 'string' && body.date.trim())
      updated.date = body.date.trim().slice(0, 20);
    if (typeof body.city === 'string' && body.city.trim())
      updated.city = body.city.trim().slice(0, 60);
    if (typeof body.country === 'string')
      updated.country = body.country.trim().slice(0, 40);
    if (typeof body.venue === 'string' && body.venue.trim())
      updated.venue = body.venue.trim().slice(0, 100);
    if (typeof body.stageTime === 'string')
      updated.stageTime = body.stageTime.trim().slice(0, 25);
    if (typeof body.priceLabel === 'string')
      updated.priceLabel = body.priceLabel.trim().slice(0, 30);
    if (body.status && allowedStatuses.includes(body.status))
      updated.status = body.status;
    if (typeof body.ticketUrl === 'string')
      updated.ticketUrl = body.ticketUrl.trim().slice(0, 300);
    if (typeof body.notes === 'string') updated.notes = body.notes.trim().slice(0, 200);

    try {
      await dbUpsertTour(updated, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal memperbarui jadwal di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      const idx = draft.tours.findIndex((t) => t.id === id);
      if (idx !== -1) draft.tours[idx] = updated;
      draft.tours.sort((a, b) => a.date.localeCompare(b.date));
    });
    broadcast({ type: 'tours:updated', payload: next.tours });
    res.json({ tours: next.tours });
  });

  app.delete('/api/admin/tours/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteTour(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menghapus jadwal di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.tours = draft.tours.filter((t) => t.id !== id);
    });
    broadcast({ type: 'tours:updated', payload: next.tours });
    res.json({ tours: next.tours });
  });

  app.post('/api/admin/gallery', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<GalleryPhoto>;
    const title = String(body.title ?? '').trim().slice(0, 100);
    const imageUrl = String(body.imageUrl ?? '').trim();
    if (!title || !imageUrl) {
      res.status(400).json({ error: 'Judul foto dan gambar wajib diisi.' });
      return;
    }
    const allowedCats: GalleryCategory[] = ['Panggung', 'Studio', 'Backstage'];
    const category = allowedCats.includes(body.category as GalleryCategory)
      ? (body.category as GalleryCategory)
      : 'Panggung';

    const newPhoto: GalleryPhoto = {
      id: makeId('gal'),
      title,
      category,
      imageUrl,
      mediaType: body.mediaType === 'video' ? 'video' : 'image',
      location: String(body.location ?? 'Indonesia').trim().slice(0, 80),
      dateLabel: String(body.dateLabel ?? 'November 2026').trim().slice(0, 40),
      photographer: String(body.photographer ?? 'Tim Rasmalas').trim().slice(0, 60),
      featured: Boolean(body.featured),
    };

    try {
      await dbUpsertGalleryPhoto(newPhoto, Boolean(newPhoto.featured), adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menyimpan media ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      if (newPhoto.featured) {
        draft.gallery.forEach((g) => {
          g.featured = false;
        });
      }
      draft.gallery.unshift(newPhoto);
    });
    broadcast({ type: 'gallery:updated', payload: next.gallery });
    res.status(201).json({ gallery: next.gallery, photo: newPhoto });
  });

  app.put('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;
    const body = req.body as Partial<GalleryPhoto>;
    const existing = getState().gallery.find((g) => g.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Media tidak ditemukan.' });
      return;
    }
    const allowedCats: GalleryCategory[] = ['Panggung', 'Studio', 'Backstage'];
    const updated: GalleryPhoto = structuredClone(existing);
    if (typeof body.title === 'string' && body.title.trim())
      updated.title = body.title.trim().slice(0, 100);
    if (body.category && allowedCats.includes(body.category))
      updated.category = body.category;
    if (typeof body.location === 'string')
      updated.location = body.location.trim().slice(0, 80);
    if (typeof body.dateLabel === 'string')
      updated.dateLabel = body.dateLabel.trim().slice(0, 40);
    if (typeof body.photographer === 'string')
      updated.photographer = body.photographer.trim().slice(0, 60);
    if (typeof body.imageUrl === 'string' && body.imageUrl.trim())
      updated.imageUrl = body.imageUrl.trim();
    if (body.mediaType === 'video' || body.mediaType === 'image')
      updated.mediaType = body.mediaType;
    if (typeof body.featured === 'boolean') updated.featured = body.featured;

    try {
      await dbUpsertGalleryPhoto(
        updated,
        Boolean(body.featured === true),
        adminReq.sbToken
      );
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal memperbarui foto di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      if (body.featured === true) {
        draft.gallery.forEach((g) => {
          g.featured = false;
        });
      }
      const idx = draft.gallery.findIndex((g) => g.id === id);
      if (idx !== -1) draft.gallery[idx] = updated;
    });
    broadcast({ type: 'gallery:updated', payload: next.gallery });
    res.json({ gallery: next.gallery });
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteGalleryPhoto(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Gagal menghapus foto di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.gallery = draft.gallery.filter((g) => g.id !== id);
    });
    broadcast({ type: 'gallery:updated', payload: next.gallery });
    res.json({ gallery: next.gallery });
  });

  app.get('/api/admin/export', requireAdmin, (_req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="rasmalas-backup.json"');
    res.json(getState());
  });

  app.put('/api/admin/social/channels', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const channels = req.body?.channels as SocialChannel[] | undefined;
    if (!Array.isArray(channels)) {
      res.status(400).json({ error: 'Format kanal media sosial tidak valid.' });
      return;
    }
    const allowedPlatforms: SocialPlatform[] = [
      'Instagram',
      'YouTube',
      'Spotify',
      'TikTok',
    ];
    const sanitized: SocialChannel[] = channels
      .filter((c) => allowedPlatforms.includes(c.platform))
      .map((c) => ({
        platform: c.platform,
        handle: String(c.handle ?? '').trim().slice(0, 60),
        url: String(c.url ?? '').trim().slice(0, 300),
        followersLabel: String(c.followersLabel ?? '').trim().slice(0, 40),
        connected: Boolean(c.connected),
      }));

    try {
      await dbSaveSocialChannels(sanitized, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan kanal sosial ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.socialChannels = sanitized;
    });
    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.json({ socialChannels: next.socialChannels });
  });

  app.post('/api/admin/social/posts', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const body = req.body as Partial<SocialPost>;
    const content = String(body.content ?? '').trim().slice(0, 500);
    if (!content) {
      res.status(400).json({ error: 'Konten pembaruan sosial wajib diisi.' });
      return;
    }
    const allowedPlatforms: SocialPlatform[] = [
      'Instagram',
      'YouTube',
      'Spotify',
      'TikTok',
    ];
    const platform = allowedPlatforms.includes(body.platform as SocialPlatform)
      ? (body.platform as SocialPlatform)
      : 'Instagram';

    const channel = getState().socialChannels.find((c) => c.platform === platform);
    const newPost: SocialPost = {
      id: makeId('soc'),
      platform,
      authorHandle: String(
        body.authorHandle ?? channel?.handle ?? '@rasmalas.official'
      ).slice(0, 60),
      content,
      mediaUrl: body.mediaUrl ? String(body.mediaUrl).trim() : undefined,
      mediaType: body.mediaUrl
        ? body.mediaType === 'video'
          ? 'video'
          : 'image'
        : undefined,
      externalUrl: body.externalUrl ? String(body.externalUrl).trim() : channel?.url,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await dbInsertSocialPost(newPost, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mempublikasikan postingan ke Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.socialPosts.unshift(newPost);
    });
    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.status(201).json({ socialPosts: next.socialPosts, post: newPost });
  });

  app.delete('/api/admin/social/posts/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteSocialPost(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error ? err.message : 'Gagal menghapus postingan di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.socialPosts = draft.socialPosts.filter((p) => p.id !== id);
    });
    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.json({ socialPosts: next.socialPosts });
  });

  app.delete('/api/admin/social/shoutouts/:id', requireAdmin, async (req, res) => {
    const adminReq = req as AdminRequest;
    const { id } = req.params;

    try {
      await dbDeleteShoutout(id, adminReq.sbToken);
    } catch (err) {
      res.status(403).json({
        error:
          err instanceof Error ? err.message : 'Gagal menghapus sapaan di Supabase.',
      });
      return;
    }

    const next = updateState((draft) => {
      draft.shoutouts = draft.shoutouts.filter((s) => s.id !== id);
    });
    broadcast({
      type: 'social:updated',
      payload: {
        socialChannels: next.socialChannels,
        socialPosts: next.socialPosts,
        shoutouts: next.shoutouts,
      },
    });
    res.json({ shoutouts: next.shoutouts });
  });

  // Frontend serving: Vite middleware in development, static dist in production
  if (!IS_PROD && fs.existsSync(path.resolve(process.cwd(), 'index.html'))) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Rasmalas server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
