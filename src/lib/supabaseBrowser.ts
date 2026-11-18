import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_STATE } from '../shared/defaultState';
import { normalizeTourStatus } from '../shared/tourUtils';
import type {
  BandMember,
  BandProfile,
  BandState,
  GalleryPhoto,
  SiteSection,
  SocialChannel,
  SocialPost,
  TourDate,
  Track,
} from '../shared/types';

const MEDIA_BUCKET = 'rasmalas-media';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let browserClient: SupabaseClient | null = null;

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (!isBrowserSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

function hydrateBandStateFromRaw(raw: {
  profile: Record<string, unknown>;
  siteSections?: Array<Record<string, unknown>>;
  members?: Array<Record<string, unknown>>;
  tracks?: Array<Record<string, unknown>>;
  tours?: Array<Record<string, unknown>>;
  gallery?: Array<Record<string, unknown>>;
  socialChannels?: Array<Record<string, unknown>>;
  socialPosts?: Array<Record<string, unknown>>;
  shoutouts?: Array<Record<string, unknown>>;
}): BandState {
  const p = raw.profile;
  const rawSections = Array.isArray(raw.siteSections) ? raw.siteSections : [];
  const hydratedSections: SiteSection[] =
    rawSections.length > 0
      ? rawSections.map((s) => ({
          id: String(s.id ?? ''),
          slug: String(s.slug ?? ''),
          navLabel: String(s.nav_label ?? ''),
          kicker: String(s.kicker ?? ''),
          title: String(s.title ?? ''),
          subtitle: s.subtitle ? String(s.subtitle) : undefined,
          body: s.body ? String(s.body) : undefined,
          imageUrl: s.image_url ? String(s.image_url) : undefined,
          mediaType: s.media_type === 'video' ? 'video' : 'image',
          ctaLabel: s.cta_label ? String(s.cta_label) : undefined,
          ctaUrl: s.cta_url ? String(s.cta_url) : undefined,
          builtinKey: (s.builtin_key as SiteSection['builtinKey']) ?? undefined,
          visible: Boolean(s.visible),
          showInNav: Boolean(s.show_in_nav),
          sortOrder: Number(s.sort_order ?? 0),
        }))
      : DEFAULT_STATE.siteSections;

  const profilSection = hydratedSections.find((s) => s.builtinKey === 'profil');

  return {
    profile: {
      name: String(p.name ?? DEFAULT_STATE.profile.name),
      logoUrl: p.logo_url ? String(p.logo_url) : undefined,
      kicker: String(p.kicker ?? ''),
      headline: String(p.headline ?? ''),
      subheadline: String(p.subheadline ?? ''),
      profileSectionTitle:
        (p.profile_section_title as string | undefined) ??
        profilSection?.title ??
        DEFAULT_STATE.profile.profileSectionTitle,
      profileSectionSubtitle:
        (p.profile_section_subtitle as string | undefined) ??
        profilSection?.subtitle ??
        DEFAULT_STATE.profile.profileSectionSubtitle,
      bio: String(p.bio ?? ''),
      studioQuote: String(p.studio_quote ?? ''),
      originCity: String(p.origin_city ?? ''),
      bookingEmail: String(p.booking_email ?? ''),
      heroImage: String(p.hero_image ?? ''),
      studioImage: String(p.studio_image ?? ''),
      heroCtaPrimary:
        (p.hero_cta_primary as string | undefined) ?? DEFAULT_STATE.profile.heroCtaPrimary,
      heroCtaSecondary:
        (p.hero_cta_secondary as string | undefined) ??
        DEFAULT_STATE.profile.heroCtaSecondary,
      heroCardKicker:
        (p.hero_card_kicker as string | undefined) ?? DEFAULT_STATE.profile.heroCardKicker,
      heroCardTitle:
        (p.hero_card_title as string | undefined) ?? DEFAULT_STATE.profile.heroCardTitle,
      footerNote:
        (p.footer_note as string | undefined) ?? DEFAULT_STATE.profile.footerNote,
      footerDescription: p.footer_description ? String(p.footer_description) : undefined,
      footerCopyright: p.footer_copyright ? String(p.footer_copyright) : undefined,
      footerLinks: Array.isArray(p.footer_links)
        ? (p.footer_links as BandProfile['footerLinks'])
        : [],
      stats: Array.isArray(p.stats)
        ? (p.stats as BandProfile['stats'])
        : DEFAULT_STATE.profile.stats,
      members: (Array.isArray(raw.members) ? raw.members : []).map((m) => ({
        id: String(m.id ?? ''),
        name: String(m.name ?? ''),
        role: String(m.role ?? ''),
        instrument: String(m.instrument ?? ''),
        origin: String(m.origin ?? ''),
        instagramUrl: m.instagram_url ? String(m.instagram_url) : undefined,
      })),
    },
    siteSections: hydratedSections,
    tracks: (Array.isArray(raw.tracks) ? raw.tracks : []).map((t) => ({
      id: String(t.id ?? ''),
      title: String(t.title ?? ''),
      album: String(t.album ?? ''),
      year: String(t.year ?? ''),
      durationSec: Number(t.duration_sec ?? 26),
      bpm: Number(t.bpm ?? 76),
      musicalKey: String(t.musical_key ?? 'Am'),
      synthSeed: Number(t.synth_seed ?? 1),
      coverUrl: String(t.cover_url ?? ''),
      audioUrl: t.audio_url ? String(t.audio_url) : undefined,
      plays: Number(t.plays ?? 0),
      lyrics: String(t.lyrics ?? ''),
      credits: String(t.credits ?? ''),
    })),
    tours: (Array.isArray(raw.tours) ? raw.tours : []).map((t) => ({
      id: String(t.id ?? ''),
      date: String(t.date ?? ''),
      city: String(t.city ?? ''),
      country: String(t.country ?? 'Indonesia'),
      venue: String(t.venue ?? ''),
      stageTime: String(t.stage_time ?? ''),
      priceLabel: String(t.price_label ?? ''),
      status: normalizeTourStatus(
        String(t.date ?? ''),
        (t.status as TourDate['status']) || 'Tersedia'
      ),
      ticketUrl: String(t.ticket_url ?? '#jadwal'),
      rsvpCount: Number(t.rsvp_count ?? 0),
      notes: t.notes ? String(t.notes) : undefined,
    })),
    gallery: (Array.isArray(raw.gallery) ? raw.gallery : []).map((g) => ({
      id: String(g.id ?? ''),
      title: String(g.title ?? ''),
      category: (g.category as GalleryPhoto['category']) ?? 'Panggung',
      imageUrl: String(g.image_url ?? ''),
      mediaType: g.media_type === 'video' ? 'video' : 'image',
      location: String(g.location ?? ''),
      dateLabel: String(g.date_label ?? ''),
      photographer: String(g.photographer ?? ''),
      featured: Boolean(g.featured),
    })),
    socialChannels: (Array.isArray(raw.socialChannels) ? raw.socialChannels : []).map(
      (c) => ({
        platform: String(c.platform ?? ''),
        handle: String(c.handle ?? ''),
        url: String(c.url ?? ''),
        followersLabel: String(c.followers_label ?? ''),
        connected: Boolean(c.connected),
      })
    ),
    socialPosts: (Array.isArray(raw.socialPosts) ? raw.socialPosts : []).map((sp) => ({
      id: String(sp.id ?? ''),
      platform: String(sp.platform ?? ''),
      authorHandle: String(sp.author_handle ?? ''),
      content: String(sp.content ?? ''),
      mediaUrl: sp.media_url ? String(sp.media_url) : undefined,
      mediaType: sp.media_type === 'video' ? 'video' : 'image',
      externalUrl: sp.external_url ? String(sp.external_url) : undefined,
      likes: Number(sp.likes ?? 0),
      createdAt: String(sp.created_at ?? ''),
    })),
    shoutouts: (Array.isArray(raw.shoutouts) ? raw.shoutouts : []).map((s) => ({
      id: String(s.id ?? ''),
      senderName: String(s.sender_name ?? ''),
      city: String(s.city ?? ''),
      message: String(s.message ?? ''),
      createdAt: String(s.created_at ?? ''),
    })),
    updatedAt: String(p.updated_at || new Date().toISOString()),
  };
}

export async function fetchBandStateFromSupabase(): Promise<BandState> {
  const client = getBrowserSupabaseClient();
  if (!client) {
    return DEFAULT_STATE;
  }

  // Prefer single bundled RPC so individual table endpoints are not exposed in DevTools Network
  const { data: rpcPayload, error: rpcErr } = await client.rpc('get_public_band_state');
  if (!rpcErr && rpcPayload && typeof rpcPayload === 'object' && 'profile' in rpcPayload) {
    const bundle = rpcPayload as {
      profile: Record<string, unknown> | null;
      siteSections?: Array<Record<string, unknown>>;
      members?: Array<Record<string, unknown>>;
      tracks?: Array<Record<string, unknown>>;
      tours?: Array<Record<string, unknown>>;
      gallery?: Array<Record<string, unknown>>;
      socialChannels?: Array<Record<string, unknown>>;
      socialPosts?: Array<Record<string, unknown>>;
      shoutouts?: Array<Record<string, unknown>>;
    };
    if (bundle.profile) {
      return hydrateBandStateFromRaw({
        profile: bundle.profile,
        siteSections: bundle.siteSections,
        members: bundle.members,
        tracks: bundle.tracks,
        tours: bundle.tours,
        gallery: bundle.gallery,
        socialChannels: bundle.socialChannels,
        socialPosts: bundle.socialPosts,
        shoutouts: bundle.shoutouts,
      });
    }
  }

  const [
    profileRes,
    sectionsRes,
    membersRes,
    tracksRes,
    toursRes,
    galleryRes,
    channelsRes,
    postsRes,
    shoutoutsRes,
  ] = await Promise.all([
    client.from('band_profile').select('*').eq('id', 'rasmalas').maybeSingle(),
    client
      .from('site_sections')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    client.from('band_members').select('*').order('sort_order', { ascending: true }),
    client
      .from('tracks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    client.from('tours').select('*').order('date', { ascending: true }),
    client
      .from('gallery_photos')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
    client.from('social_channels').select('*').order('sort_order', { ascending: true }),
    client.from('social_posts').select('*').order('created_at', { ascending: false }),
    client
      .from('fan_shoutouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (profileRes.error || !profileRes.data) {
    return DEFAULT_STATE;
  }

  return hydrateBandStateFromRaw({
    profile: profileRes.data as Record<string, unknown>,
    siteSections: !sectionsRes.error && Array.isArray(sectionsRes.data)
      ? (sectionsRes.data as Array<Record<string, unknown>>)
      : undefined,
    members: (membersRes.data ?? []) as Array<Record<string, unknown>>,
    tracks: (tracksRes.data ?? []) as Array<Record<string, unknown>>,
    tours: (toursRes.data ?? []) as Array<Record<string, unknown>>,
    gallery: (galleryRes.data ?? []) as Array<Record<string, unknown>>,
    socialChannels: (channelsRes.data ?? []) as Array<Record<string, unknown>>,
    socialPosts: (postsRes.data ?? []) as Array<Record<string, unknown>>,
    shoutouts: (shoutoutsRes.data ?? []) as Array<Record<string, unknown>>,
  });
}

// Public interactions
export async function sbIncrementTrackPlay(trackId: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) return;
  await client.rpc('increment_track_play', { track_id: trackId });
}

export async function sbIncrementTourRsvp(tourId: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) return;
  await client.rpc('increment_tour_rsvp', { tour_id: tourId });
}

export async function sbIncrementPostLike(
  postId: string,
  deviceId?: string
): Promise<boolean> {
  const client = getBrowserSupabaseClient();
  if (!client) return true;
  if (deviceId) {
    const { data, error } = await client.rpc('like_social_post_once', {
      p_post_id: postId,
      p_device_id: deviceId,
    });
    if (!error) {
      return data !== false;
    }
  }
  await client.rpc('increment_post_like', { post_id: postId });
  return true;
}

export async function sbDecrementPostLike(
  postId: string,
  deviceId?: string
): Promise<boolean> {
  const client = getBrowserSupabaseClient();
  if (!client) return true;
  if (deviceId) {
    const { data, error } = await client.rpc('unlike_social_post_once', {
      p_post_id: postId,
      p_device_id: deviceId,
    });
    if (!error) {
      return data !== false;
    }
  }
  await client.rpc('decrement_post_like', { post_id: postId });
  return true;
}

export async function sbInsertShoutout(
  senderName: string,
  city: string,
  message: string
): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('fan_shoutouts').insert({
    id: `sh-${Date.now().toString(36)}`,
    sender_name: senderName.trim(),
    city: city.trim(),
    message: message.trim(),
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

function isLikelySecretApiKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { role?: string };
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  }
  return false;
}

// Admin Auth (Zero direct table queries to admin_users; verified strictly via authenticated RPC)
export async function sbAdminLogin(
  loginInput: string,
  password: string
): Promise<{ email: string; username: string; fullName: string; token: string }> {
  if (isLikelySecretApiKey(SUPABASE_ANON_KEY)) {
    throw new Error(
      'Konfigurasi kunci API publik masih menggunakan Secret key. Ganti dengan Publishable / anon public key pada Environment Variables, lalu Redeploy.'
    );
  }
  const client = getBrowserSupabaseClient();
  if (!client) {
    throw new Error('Koneksi database belum dikonfigurasi.');
  }

  const resolvedEmail = loginInput.trim();
  if (!resolvedEmail.includes('@')) {
    throw new Error('Masukkan alamat email admin Anda untuk login aman.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });
  if (error || !data.session || !data.user?.email) {
    const rawMsg = error?.message || '';
    if (rawMsg.toLowerCase().includes('secret api key')) {
      throw new Error(
        'Konfigurasi kunci API publik masih menggunakan Secret key. Ganti dengan Publishable / anon public key, lalu Redeploy.'
      );
    }
    throw new Error(rawMsg || 'Email atau kata sandi admin tidak sesuai.');
  }

  const { data: rpcAdmin, error: adminErr } = await client.rpc('get_my_admin_profile');
  const adminRow = (Array.isArray(rpcAdmin) ? rpcAdmin[0] : rpcAdmin) as
    | { is_admin?: boolean; username?: string | null; full_name?: string | null }
    | null
    | undefined;

  if (adminErr || !adminRow?.is_admin) {
    await client.auth.signOut();
    throw new Error('Akun ini belum terdaftar sebagai admin yang memiliki akses.');
  }

  return {
    email: data.user.email,
    username: adminRow.username ?? data.user.email.split('@')[0],
    fullName: adminRow.full_name ?? 'Admin Rasmalas',
    token: data.session.access_token,
  };
}

export async function sbAdminSessionCheck(): Promise<{
  authenticated: boolean;
  email: string | null;
  username: string | null;
  fullName: string | null;
  token: string | null;
}> {
  const client = getBrowserSupabaseClient();
  if (!client) {
    return { authenticated: false, email: null, username: null, fullName: null, token: null };
  }
  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session?.user?.email) {
    return { authenticated: false, email: null, username: null, fullName: null, token: null };
  }

  const { data: rpcAdmin, error } = await client.rpc('get_my_admin_profile');
  const adminRow = (Array.isArray(rpcAdmin) ? rpcAdmin[0] : rpcAdmin) as
    | { is_admin?: boolean; username?: string | null; full_name?: string | null }
    | null
    | undefined;

  if (error || !adminRow?.is_admin) {
    return { authenticated: false, email: null, username: null, fullName: null, token: null };
  }
  return {
    authenticated: true,
    email: session.user.email,
    username: adminRow.username ?? session.user.email.split('@')[0],
    fullName: adminRow.full_name ?? 'Admin Rasmalas',
    token: session.access_token,
  };
}

export async function sbAdminLogout(): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function sbGetOwnAdminProfile(): Promise<{
  email: string;
  username: string;
  fullName: string;
}> {
  const session = await sbAdminSessionCheck();
  if (!session.authenticated || !session.email) {
    throw new Error('Sesi admin tidak aktif.');
  }
  return {
    email: session.email,
    username: session.username || session.email.split('@')[0],
    fullName: session.fullName || 'Admin Rasmalas',
  };
}

export async function sbUpdateOwnAdminProfile(payload: {
  username: string;
  fullName: string;
  email?: string;
}): Promise<{
  email: string;
  username: string;
  fullName: string;
  emailConfirmationSent?: boolean;
}> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');

  const { data: sessionData } = await client.auth.getSession();
  const currentEmail = sessionData.session?.user?.email || '';
  if (!currentEmail) throw new Error('Sesi admin tidak aktif.');

  const cleanUsername = payload.username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  const cleanFullName = payload.fullName.trim();
  if (!cleanUsername) {
    throw new Error('Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.');
  }

  const { data, error } = await client.rpc('update_own_admin_profile', {
    p_username: cleanUsername,
    p_full_name: cleanFullName || 'Admin Rasmalas',
    p_email: null,
  });

  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;

  let emailConfirmationSent = false;
  const requestedEmail = payload.email?.trim().toLowerCase();
  if (requestedEmail && requestedEmail !== currentEmail.toLowerCase()) {
    const { error: emailErr } = await client.auth.updateUser({
      email: requestedEmail,
    });
    if (emailErr) throw new Error(emailErr.message);
    emailConfirmationSent = true;
  }

  return {
    email: (row?.email as string | undefined) || currentEmail,
    username: (row?.username as string | undefined) || cleanUsername,
    fullName: (row?.full_name as string | undefined) || cleanFullName,
    emailConfirmationSent,
  };
}

export async function sbUpdateAdminPassword(newPassword: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  if (newPassword.length < 6) {
    throw new Error('Kata sandi baru minimal 6 karakter.');
  }
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function sbSendPasswordResetEmail(
  loginOrEmail: string
): Promise<{ email: string }> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');

  const targetEmail = loginOrEmail.trim();
  if (!targetEmail || !targetEmail.includes('@')) {
    throw new Error('Masukkan alamat email admin yang valid terlebih dahulu.');
  }

  const { error } = await client.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
  return { email: targetEmail };
}

const TUS_CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB chunk size required by Supabase TUS

function getSupabaseTusEndpoint(): string {
  const clean = SUPABASE_URL.replace(/\/+$/, '');
  try {
    const parsed = new URL(clean);
    if (parsed.hostname.endsWith('.supabase.co')) {
      const storageHost = parsed.hostname.replace('.supabase.co', '.storage.supabase.co');
      return `${parsed.protocol}//${storageHost}/storage/v1/upload/resumable`;
    }
  } catch {
    // fallback below
  }
  return `${clean}/storage/v1/upload/resumable`;
}

function encodeTusMetadata(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatSupabaseUploadSizeError(fileSizeBytes: number, rawMessage: string): string {
  const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
  if (/maximum allowed size|payload too large|entity too large|413/i.test(rawMessage)) {
    return `Gagal upload (${sizeMb} MB): Server penyimpanan menolak ukuran file ini. Periksa batas ukuran bucket & pengaturan global file size limit di server penyimpanan media (paket gratis umumnya dibatasi maksimal 50 MB per file; untuk >50 MB naikkan limit server atau kompres WAV ke MP3/M4A).`;
  }
  return `Gagal upload ke penyimpanan media: ${rawMessage}`;
}

async function uploadMediaViaTus(
  file: File,
  objectPath: string,
  contentType: string,
  accessToken: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const tusEndpoint = getSupabaseTusEndpoint();
  const metadata = [
    `bucketName ${encodeTusMetadata(MEDIA_BUCKET)}`,
    `objectName ${encodeTusMetadata(objectPath)}`,
    `contentType ${encodeTusMetadata(contentType)}`,
    `cacheControl ${encodeTusMetadata('3600')}`,
  ].join(',');

  const createRes = await fetch(tusEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'x-upsert': 'false',
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': metadata,
    },
  });

  if (!createRes.ok) {
    const errBody = await createRes.text();
    let message = errBody;
    try {
      const parsed = JSON.parse(errBody) as { message?: string; error?: string };
      message = parsed.message || parsed.error || errBody;
    } catch {
      // use raw text
    }
    throw new Error(formatSupabaseUploadSizeError(file.size, message || `HTTP ${createRes.status}`));
  }

  const location = createRes.headers.get('location') || createRes.headers.get('Location');
  if (!location) {
    throw new Error('Server upload tidak mengembalikan URL lokasi TUS.');
  }

  const uploadUrl = new URL(location, tusEndpoint).toString();
  let offset = 0;
  onProgress?.(0);

  while (offset < file.size) {
    const nextEnd = Math.min(offset + TUS_CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, nextEnd);

    let patchRes: Response | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        patchRes = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY,
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream',
          },
          body: chunk,
        });

        if (patchRes.ok) {
          lastError = null;
          break;
        }

        const errText = await patchRes.text();
        if (
          patchRes.status === 413 ||
          /maximum allowed size|payload too large|entity too large/i.test(errText)
        ) {
          throw new Error(formatSupabaseUploadSizeError(file.size, errText || 'The object exceeded the maximum allowed size'));
        }
        lastError = new Error(errText || `HTTP ${patchRes.status}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Koneksi chunk upload terputus.');
        if (/Server penyimpanan menolak/i.test(lastError.message)) {
          throw lastError;
        }
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }

    if (!patchRes || !patchRes.ok || lastError) {
      throw new Error(
        formatSupabaseUploadSizeError(file.size, lastError?.message || 'Gagal mengirim potongan file.')
      );
    }

    const serverOffsetRaw = patchRes.headers.get('upload-offset') || patchRes.headers.get('Upload-Offset');
    const serverOffset = serverOffsetRaw !== null ? Number(serverOffsetRaw) : NaN;
    offset = Number.isFinite(serverOffset) && serverOffset > offset ? serverOffset : nextEnd;
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)));
  }
}

// Media Upload directly to Supabase Storage (standard for <=6MB, TUS resumable for larger files)
export async function sbUploadMedia(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; mediaType: 'image' | 'video' | 'audio' }> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'misc';
  const extMatch = file.name.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const uniqueName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const objectPath = `${safeFolder}/${uniqueName}`;
  const contentType = file.type || 'application/octet-stream';

  if (file.size > TUS_CHUNK_SIZE) {
    const { data: sessionData } = await client.auth.getSession();
    const accessToken = sessionData.session?.access_token || SUPABASE_ANON_KEY;
    await uploadMediaViaTus(file, objectPath, contentType, accessToken, onProgress);
  } else {
    onProgress?.(10);
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(objectPath, file, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(formatSupabaseUploadSizeError(file.size, error.message));
    }
    onProgress?.(100);
  }

  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  const lowerExt = ext.toLowerCase();
  const mediaType: 'image' | 'video' | 'audio' =
    file.type.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'].includes(lowerExt)
      ? 'video'
      : file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(lowerExt)
        ? 'audio'
        : 'image';

  return { url: data.publicUrl, mediaType };
}

// Admin CRUD
export async function sbSaveProfileAndMembers(profile: BandProfile): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');

  const sectionTitle =
    profile.profileSectionTitle?.trim() || 'Rekaman Pita Analog, Akar Reggae Pesisir.';
  const sectionSubtitle =
    profile.profileSectionSubtitle?.trim() || 'Instrumen live tanpa backing track digital';

  const baseProfilePayload = {
    id: 'rasmalas',
    name: profile.name,
    logo_url: profile.logoUrl ?? null,
    kicker: profile.kicker,
    headline: profile.headline,
    subheadline: profile.subheadline,
    bio: profile.bio,
    studio_quote: profile.studioQuote,
    origin_city: profile.originCity,
    booking_email: profile.bookingEmail,
    hero_image: profile.heroImage,
    studio_image: profile.studioImage,
    hero_cta_primary: profile.heroCtaPrimary ?? 'Putar Album Terbaru',
    hero_cta_secondary: profile.heroCtaSecondary ?? 'Lihat Jadwal',
    hero_card_kicker: profile.heroCardKicker ?? 'Jadwal Panggung Nusantara',
    hero_card_title:
      profile.heroCardTitle ?? 'Sesi Panggung Terbuka & 12-Stack Sound System',
    footer_note: profile.footerNote ?? 'Roots Reggae & Analog Dub',
    footer_description: profile.footerDescription ?? null,
    footer_copyright: profile.footerCopyright ?? null,
    footer_links: profile.footerLinks ?? [],
    stats: profile.stats,
    updated_at: new Date().toISOString(),
  };

  const { error: profErr } = await client.from('band_profile').upsert(
    {
      ...baseProfilePayload,
      profile_section_title: sectionTitle,
      profile_section_subtitle: sectionSubtitle,
    },
    { onConflict: 'id' }
  );

  if (profErr) {
    // Fallback if optional profile_section_title column has not been added via SQL yet
    const { error: fallbackErr } = await client
      .from('band_profile')
      .upsert(baseProfilePayload, { onConflict: 'id' });
    if (fallbackErr) throw new Error(fallbackErr.message);
  }

  // Also synchronize the 'profil' row in site_sections so it always stays in sync
  await client
    .from('site_sections')
    .update({
      title: sectionTitle,
      subtitle: sectionSubtitle,
    })
    .eq('builtin_key', 'profil');

  const { data: existingMembers, error: fetchErr } = await client
    .from('band_members')
    .select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(profile.members.map((m) => m.id));
  const toDelete = (existingMembers ?? [])
    .map((m) => m.id as string)
    .filter((id) => !keepIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await client.from('band_members').delete().in('id', toDelete);
    if (delErr) throw new Error(delErr.message);
  }

  if (profile.members.length > 0) {
    const { error: upErr } = await client.from('band_members').upsert(
      profile.members.map((m: BandMember, idx: number) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        instrument: m.instrument,
        origin: m.origin,
        instagram_url: m.instagramUrl ?? null,
        sort_order: idx,
      })),
      { onConflict: 'id' }
    );
    if (upErr) throw new Error(upErr.message);
  }
}

export async function sbUpsertSiteSection(sec: SiteSection): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('site_sections').upsert(
    {
      id: sec.id,
      slug: sec.slug,
      nav_label: sec.navLabel,
      kicker: sec.kicker,
      title: sec.title,
      subtitle: sec.subtitle ?? null,
      body: sec.body ?? null,
      image_url: sec.imageUrl ?? null,
      media_type: sec.mediaType ?? 'image',
      cta_label: sec.ctaLabel ?? null,
      cta_url: sec.ctaUrl ?? null,
      builtin_key: sec.builtinKey ?? null,
      visible: sec.visible,
      show_in_nav: sec.showInNav,
      sort_order: sec.sortOrder,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbReorderSiteSections(sections: SiteSection[]): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('site_sections').upsert(
    sections.map((s, idx) => ({
      id: s.id,
      slug: s.slug,
      nav_label: s.navLabel,
      kicker: s.kicker,
      title: s.title,
      subtitle: s.subtitle ?? null,
      body: s.body ?? null,
      image_url: s.imageUrl ?? null,
      media_type: s.mediaType ?? 'image',
      cta_label: s.ctaLabel ?? null,
      cta_url: s.ctaUrl ?? null,
      builtin_key: s.builtinKey ?? null,
      visible: s.visible,
      show_in_nav: s.showInNav,
      sort_order: idx,
    })),
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbDeleteSiteSection(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('site_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertTrack(track: Track): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('tracks').upsert(
    {
      id: track.id,
      title: track.title,
      album: track.album,
      year: track.year,
      duration_sec: track.durationSec,
      bpm: track.bpm,
      musical_key: track.musicalKey,
      synth_seed: track.synthSeed,
      cover_url: track.coverUrl,
      audio_url: track.audioUrl ?? null,
      plays: track.plays,
      lyrics: track.lyrics,
      credits: track.credits,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbDeleteTrack(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('tracks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertTour(tour: TourDate): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('tours').upsert(
    {
      id: tour.id,
      date: tour.date,
      city: tour.city,
      country: tour.country,
      venue: tour.venue,
      stage_time: tour.stageTime,
      price_label: tour.priceLabel,
      status: normalizeTourStatus(tour.date, tour.status),
      ticket_url: tour.ticketUrl,
      rsvp_count: tour.rsvpCount,
      notes: tour.notes ?? null,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbDeleteTour(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('tours').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertGalleryPhoto(
  photo: GalleryPhoto,
  clearFeaturedFirst: boolean
): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  if (clearFeaturedFirst) {
    const { error: resetErr } = await client
      .from('gallery_photos')
      .update({ featured: false })
      .neq('id', photo.id);
    if (resetErr) throw new Error(resetErr.message);
  }
  const { error } = await client.from('gallery_photos').upsert(
    {
      id: photo.id,
      title: photo.title,
      category: photo.category,
      image_url: photo.imageUrl,
      media_type: photo.mediaType ?? 'image',
      location: photo.location,
      date_label: photo.dateLabel,
      photographer: photo.photographer,
      featured: Boolean(photo.featured),
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbDeleteGalleryPhoto(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('gallery_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbSaveSocialChannels(channels: SocialChannel[]): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');

  const { data: existing, error: fetchErr } = await client
    .from('social_channels')
    .select('platform');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepPlatforms = new Set(channels.map((c) => c.platform));
  const toDelete = (existing ?? [])
    .map((r) => r.platform as string)
    .filter((p) => !keepPlatforms.has(p));

  if (toDelete.length > 0) {
    const { error: delErr } = await client
      .from('social_channels')
      .delete()
      .in('platform', toDelete);
    if (delErr) throw new Error(delErr.message);
  }

  if (channels.length > 0) {
    const { error } = await client.from('social_channels').upsert(
      channels.map((c, idx) => ({
        platform: c.platform,
        handle: c.handle,
        url: c.url,
        followers_label: c.followersLabel,
        connected: c.connected,
        sort_order: idx,
      })),
      { onConflict: 'platform' }
    );
    if (error) throw new Error(error.message);
  }
}

export async function sbInsertSocialPost(post: SocialPost): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('social_posts').upsert(
    {
      id: post.id,
      platform: post.platform,
      author_handle: post.authorHandle,
      content: post.content,
      media_url: post.mediaUrl ?? null,
      media_type: post.mediaType ?? 'image',
      external_url: post.externalUrl ?? null,
      likes: post.likes,
      created_at: post.createdAt,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function sbDeleteSocialPost(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('social_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbDeleteShoutout(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Koneksi database belum dikonfigurasi.');
  const { error } = await client.from('fan_shoutouts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
