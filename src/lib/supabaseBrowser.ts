import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_STATE } from '../shared/defaultState';
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

export async function fetchBandStateFromSupabase(): Promise<BandState> {
  const client = getBrowserSupabaseClient();
  if (!client) {
    return DEFAULT_STATE;
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

  const p = profileRes.data;
  const hydratedSections: SiteSection[] =
    !sectionsRes.error && Array.isArray(sectionsRes.data) && sectionsRes.data.length > 0
      ? sectionsRes.data.map((s) => ({
          id: s.id,
          slug: s.slug,
          navLabel: s.nav_label,
          kicker: s.kicker ?? '',
          title: s.title,
          subtitle: s.subtitle ?? undefined,
          body: s.body ?? undefined,
          imageUrl: s.image_url ?? undefined,
          mediaType: s.media_type === 'video' ? 'video' : 'image',
          ctaLabel: s.cta_label ?? undefined,
          ctaUrl: s.cta_url ?? undefined,
          builtinKey: s.builtin_key ?? undefined,
          visible: Boolean(s.visible),
          showInNav: Boolean(s.show_in_nav),
          sortOrder: Number(s.sort_order ?? 0),
        }))
      : DEFAULT_STATE.siteSections;

  return {
    profile: {
      name: p.name,
      logoUrl: p.logo_url ?? undefined,
      kicker: p.kicker,
      headline: p.headline,
      subheadline: p.subheadline,
      bio: p.bio,
      studioQuote: p.studio_quote,
      originCity: p.origin_city,
      bookingEmail: p.booking_email,
      heroImage: p.hero_image,
      studioImage: p.studio_image,
      heroCtaPrimary: p.hero_cta_primary ?? DEFAULT_STATE.profile.heroCtaPrimary,
      heroCtaSecondary: p.hero_cta_secondary ?? DEFAULT_STATE.profile.heroCtaSecondary,
      heroCardKicker: p.hero_card_kicker ?? DEFAULT_STATE.profile.heroCardKicker,
      heroCardTitle: p.hero_card_title ?? DEFAULT_STATE.profile.heroCardTitle,
      footerNote: p.footer_note ?? DEFAULT_STATE.profile.footerNote,
      stats: Array.isArray(p.stats) ? p.stats : DEFAULT_STATE.profile.stats,
      members: (membersRes.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        instrument: m.instrument,
        origin: m.origin,
      })),
    },
    siteSections: hydratedSections,
    tracks: (tracksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      album: t.album,
      year: t.year,
      durationSec: t.duration_sec,
      bpm: t.bpm,
      musicalKey: t.musical_key,
      synthSeed: t.synth_seed,
      coverUrl: t.cover_url,
      audioUrl: t.audio_url ?? undefined,
      plays: t.plays,
      lyrics: t.lyrics,
      credits: t.credits,
    })),
    tours: (toursRes.data ?? []).map((t) => ({
      id: t.id,
      date: t.date,
      city: t.city,
      country: t.country,
      venue: t.venue,
      stageTime: t.stage_time,
      priceLabel: t.price_label,
      status: t.status,
      ticketUrl: t.ticket_url,
      rsvpCount: t.rsvp_count,
      notes: t.notes ?? undefined,
    })),
    gallery: (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      imageUrl: g.image_url,
      mediaType: g.media_type === 'video' ? 'video' : 'image',
      location: g.location,
      dateLabel: g.date_label,
      photographer: g.photographer,
      featured: Boolean(g.featured),
    })),
    socialChannels: (channelsRes.data ?? []).map((c) => ({
      platform: c.platform,
      handle: c.handle,
      url: c.url,
      followersLabel: c.followers_label,
      connected: Boolean(c.connected),
    })),
    socialPosts: (postsRes.data ?? []).map((sp) => ({
      id: sp.id,
      platform: sp.platform,
      authorHandle: sp.author_handle,
      content: sp.content,
      mediaUrl: sp.media_url ?? undefined,
      mediaType: sp.media_type === 'video' ? 'video' : 'image',
      externalUrl: sp.external_url ?? undefined,
      likes: sp.likes,
      createdAt: sp.created_at,
    })),
    shoutouts: (shoutoutsRes.data ?? []).map((s) => ({
      id: s.id,
      senderName: s.sender_name,
      city: s.city,
      message: s.message,
      createdAt: s.created_at,
    })),
    updatedAt: p.updated_at || new Date().toISOString(),
  };
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

export async function sbIncrementPostLike(postId: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) return;
  await client.rpc('increment_post_like', { post_id: postId });
}

export async function sbInsertShoutout(
  senderName: string,
  city: string,
  message: string
): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('fan_shoutouts').insert({
    id: `sh-${Date.now().toString(36)}`,
    sender_name: senderName.trim(),
    city: city.trim() || 'Nusantara',
    message: message.trim(),
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

// Admin Auth
export async function sbAdminLogin(
  email: string,
  password: string
): Promise<{ email: string; token: string }> {
  const client = getBrowserSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi untuk mode statis.');
  }
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.session || !data.user?.email) {
    throw new Error(error?.message || 'Email atau kata sandi admin Supabase tidak sesuai.');
  }

  const { data: adminRow, error: adminErr } = await client
    .from('admin_users')
    .select('email, can_edit')
    .ilike('email', data.user.email)
    .maybeSingle();

  if (adminErr || !adminRow) {
    await client.auth.signOut();
    throw new Error('Akun ini belum terdaftar di tabel admin_users Supabase.');
  }

  return {
    email: data.user.email,
    token: data.session.access_token,
  };
}

export async function sbAdminSessionCheck(): Promise<{
  authenticated: boolean;
  email: string | null;
  token: string | null;
}> {
  const client = getBrowserSupabaseClient();
  if (!client) {
    return { authenticated: false, email: null, token: null };
  }
  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session?.user?.email) {
    return { authenticated: false, email: null, token: null };
  }
  const { data: adminRow } = await client
    .from('admin_users')
    .select('email')
    .ilike('email', session.user.email)
    .maybeSingle();

  if (!adminRow) {
    return { authenticated: false, email: null, token: null };
  }
  return {
    authenticated: true,
    email: session.user.email,
    token: session.access_token,
  };
}

export async function sbAdminLogout(): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

// Media Upload directly to Supabase Storage
export async function sbUploadMedia(
  file: File,
  folder: string
): Promise<{ url: string; mediaType: 'image' | 'video' | 'audio' }> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'misc';
  const extMatch = file.name.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const uniqueName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const objectPath = `${safeFolder}/${uniqueName}`;

  const { error } = await client.storage.from(MEDIA_BUCKET).upload(objectPath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    throw new Error(`Gagal upload ke Supabase Storage: ${error.message}`);
  }

  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  const mediaType: 'image' | 'video' | 'audio' = file.type.startsWith('video/')
    ? 'video'
    : file.type.startsWith('audio/')
      ? 'audio'
      : 'image';

  return { url: data.publicUrl, mediaType };
}

// Admin CRUD
export async function sbSaveProfileAndMembers(profile: BandProfile): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');

  const { error: profErr } = await client.from('band_profile').upsert(
    {
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
      stats: profile.stats,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (profErr) throw new Error(profErr.message);

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
        sort_order: idx,
      })),
      { onConflict: 'id' }
    );
    if (upErr) throw new Error(upErr.message);
  }
}

export async function sbUpsertSiteSection(sec: SiteSection): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('site_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertTrack(track: Track): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('tracks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertTour(tour: TourDate): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('tours').upsert(
    {
      id: tour.id,
      date: tour.date,
      city: tour.city,
      country: tour.country,
      venue: tour.venue,
      stage_time: tour.stageTime,
      price_label: tour.priceLabel,
      status: tour.status,
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('tours').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbUpsertGalleryPhoto(
  photo: GalleryPhoto,
  clearFeaturedFirst: boolean
): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('gallery_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbSaveSocialChannels(channels: SocialChannel[]): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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

export async function sbInsertSocialPost(post: SocialPost): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
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
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('social_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbDeleteShoutout(id: string): Promise<void> {
  const client = getBrowserSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await client.from('fan_shoutouts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
