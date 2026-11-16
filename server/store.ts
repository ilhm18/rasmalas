import fs from 'fs';
import path from 'path';
import type {
  BandMember,
  BandProfile,
  BandState,
  FanShoutout,
  GalleryPhoto,
  SiteSection,
  SocialChannel,
  SocialPost,
  TourDate,
  Track,
} from '../src/shared/types.ts';
import {
  getSupabaseAdminClient,
  getSupabasePublicClient,
  hasServiceRoleKey,
  isSupabaseConfigured,
} from './supabase.ts';

import { DEFAULT_STATE } from '../src/shared/defaultState.ts';
export { DEFAULT_STATE };

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'band-data.json');

let currentState: BandState = loadLocalState();

function loadLocalState(): BandState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as BandState;
      if (parsed && parsed.profile && Array.isArray(parsed.tracks)) {
        if (!Array.isArray(parsed.siteSections) || parsed.siteSections.length === 0) {
          parsed.siteSections = structuredClone(DEFAULT_STATE.siteSections);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read band-data.json, falling back to defaults:', err);
  }
  saveStateToDisk(DEFAULT_STATE);
  return structuredClone(DEFAULT_STATE);
}

function saveStateToDisk(state: BandState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist band-data.json:', err);
  }
}

export function getState(): BandState {
  return currentState;
}

export function updateState(mutator: (draft: BandState) => void): BandState {
  const draft = structuredClone(currentState);
  mutator(draft);
  draft.updatedAt = new Date().toISOString();
  currentState = draft;
  saveStateToDisk(currentState);
  return currentState;
}

// ============================================================================
// SUPABASE HYDRATION & PERSISTENCE
// ============================================================================

async function seedSupabaseFromState(state: BandState): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client || !hasServiceRoleKey()) return;

  await client.from('band_profile').upsert(
    {
      id: 'rasmalas',
      name: state.profile.name,
      logo_url: state.profile.logoUrl ?? null,
      kicker: state.profile.kicker,
      headline: state.profile.headline,
      subheadline: state.profile.subheadline,
      bio: state.profile.bio,
      studio_quote: state.profile.studioQuote,
      origin_city: state.profile.originCity,
      booking_email: state.profile.bookingEmail,
      hero_image: state.profile.heroImage,
      studio_image: state.profile.studioImage,
      hero_cta_primary: state.profile.heroCtaPrimary ?? 'Putar Album Terbaru',
      hero_cta_secondary: state.profile.heroCtaSecondary ?? 'Lihat Jadwal',
      hero_card_kicker: state.profile.heroCardKicker ?? 'Jadwal Panggung Nusantara',
      hero_card_title:
        state.profile.heroCardTitle ?? 'Sesi Panggung Terbuka & 12-Stack Sound System',
      footer_note: state.profile.footerNote ?? 'Roots Reggae & Analog Dub',
      stats: state.profile.stats,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (state.siteSections.length > 0) {
    await client.from('site_sections').upsert(
      state.siteSections.map((s) => ({
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
        sort_order: s.sortOrder,
      })),
      { onConflict: 'id' }
    );
  }

  if (state.profile.members.length > 0) {
    await client.from('band_members').upsert(
      state.profile.members.map((m, i) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        instrument: m.instrument,
        origin: m.origin,
        sort_order: i,
      })),
      { onConflict: 'id' }
    );
  }

  if (state.tracks.length > 0) {
    await client.from('tracks').upsert(
      state.tracks.map((t, i) => ({
        id: t.id,
        title: t.title,
        album: t.album,
        year: t.year,
        duration_sec: t.durationSec,
        bpm: t.bpm,
        musical_key: t.musicalKey,
        synth_seed: t.synthSeed,
        cover_url: t.coverUrl,
        audio_url: t.audioUrl ?? null,
        plays: t.plays,
        lyrics: t.lyrics,
        credits: t.credits,
        sort_order: i,
      })),
      { onConflict: 'id' }
    );
  }

  if (state.tours.length > 0) {
    await client.from('tours').upsert(
      state.tours.map((t) => ({
        id: t.id,
        date: t.date,
        city: t.city,
        country: t.country,
        venue: t.venue,
        stage_time: t.stageTime,
        price_label: t.priceLabel,
        status: t.status,
        ticket_url: t.ticketUrl,
        rsvp_count: t.rsvpCount,
        notes: t.notes ?? null,
      })),
      { onConflict: 'id' }
    );
  }

  if (state.gallery.length > 0) {
    await client.from('gallery_photos').upsert(
      state.gallery.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        image_url: g.imageUrl,
        media_type: g.mediaType ?? 'image',
        location: g.location,
        date_label: g.dateLabel,
        photographer: g.photographer,
        featured: Boolean(g.featured),
      })),
      { onConflict: 'id' }
    );
  }

  if (state.socialChannels.length > 0) {
    await client.from('social_channels').upsert(
      state.socialChannels.map((c, i) => ({
        platform: c.platform,
        handle: c.handle,
        url: c.url,
        followers_label: c.followersLabel,
        connected: c.connected,
        sort_order: i,
      })),
      { onConflict: 'platform' }
    );
  }

  if (state.socialPosts.length > 0) {
    await client.from('social_posts').upsert(
      state.socialPosts.map((p) => ({
        id: p.id,
        platform: p.platform,
        author_handle: p.authorHandle,
        content: p.content,
        media_url: p.mediaUrl ?? null,
        media_type: p.mediaType ?? 'image',
        external_url: p.externalUrl ?? null,
        likes: p.likes,
        created_at: p.createdAt,
      })),
      { onConflict: 'id' }
    );
  }

  if (state.shoutouts.length > 0) {
    await client.from('fan_shoutouts').upsert(
      state.shoutouts.map((s) => ({
        id: s.id,
        sender_name: s.senderName,
        city: s.city,
        message: s.message,
        created_at: s.createdAt,
      })),
      { onConflict: 'id' }
    );
  }
}

export async function initStore(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const client = getSupabasePublicClient();
  if (!client) return;

  try {
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
      client.from('site_sections').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      client.from('band_members').select('*').order('sort_order', { ascending: true }),
      client.from('tracks').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      client.from('tours').select('*').order('date', { ascending: true }),
      client.from('gallery_photos').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false }),
      client.from('social_channels').select('*').order('sort_order', { ascending: true }),
      client.from('social_posts').select('*').order('created_at', { ascending: false }),
      client.from('fan_shoutouts').select('*').order('created_at', { ascending: false }).limit(30),
    ]);

    if (profileRes.error) {
      console.warn('Supabase tables not ready yet, using local state fallback:', profileRes.error.message);
      return;
    }

    if (!profileRes.data) {
      await seedSupabaseFromState(currentState);
      return;
    }

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
        : currentState.siteSections;

    const p = profileRes.data;
    const hydrated: BandState = {
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

    currentState = hydrated;
    saveStateToDisk(currentState);
    console.log('Hydrated Rasmalas state from Supabase PostgreSQL.');
  } catch (err) {
    console.error('Supabase hydration error, keeping local store:', err);
  }
}

export async function dbSaveProfileAndMembers(
  profile: BandProfile,
  sbToken?: string
): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;

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

  // Sync members: delete removed ones and upsert current list
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

export async function dbUpsertTrack(track: Track, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbDeleteTrack(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('tracks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbUpsertTour(tour: TourDate, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbDeleteTour(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('tours').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbUpsertGalleryPhoto(
  photo: GalleryPhoto,
  clearFeaturedFirst: boolean,
  sbToken?: string
): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbDeleteGalleryPhoto(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('gallery_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbSaveSocialChannels(
  channels: SocialChannel[],
  sbToken?: string
): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbInsertSocialPost(post: SocialPost, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbDeleteSocialPost(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('social_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbInsertShoutout(shoutout: FanShoutout): Promise<void> {
  const client = getSupabasePublicClient();
  if (!client) return;
  const { error } = await client.from('fan_shoutouts').insert({
    id: shoutout.id,
    sender_name: shoutout.senderName,
    city: shoutout.city,
    message: shoutout.message,
    created_at: shoutout.createdAt,
  });
  if (error) console.error('Supabase shoutout insert warning:', error.message);
}

export async function dbDeleteShoutout(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('fan_shoutouts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbIncrementTrackPlay(id: string): Promise<void> {
  const client = getSupabasePublicClient();
  if (!client) return;
  const { error } = await client.rpc('increment_track_play', { track_id: id });
  if (error) console.error('Supabase track play RPC warning:', error.message);
}

export async function dbIncrementTourRsvp(id: string): Promise<void> {
  const client = getSupabasePublicClient();
  if (!client) return;
  const { error } = await client.rpc('increment_tour_rsvp', { tour_id: id });
  if (error) console.error('Supabase tour rsvp RPC warning:', error.message);
}

export async function dbIncrementPostLike(id: string): Promise<void> {
  const client = getSupabasePublicClient();
  if (!client) return;
  const { error } = await client.rpc('increment_post_like', { post_id: id });
  if (error) console.error('Supabase post like RPC warning:', error.message);
}

export async function dbUpsertSiteSection(
  sec: SiteSection,
  sbToken?: string
): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
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

export async function dbDeleteSiteSection(id: string, sbToken?: string): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('site_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbReorderSiteSections(
  sections: SiteSection[],
  sbToken?: string
): Promise<void> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return;
  const { error } = await client.from('site_sections').upsert(
    sections.map((s) => ({
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
      sort_order: s.sortOrder,
    })),
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}
