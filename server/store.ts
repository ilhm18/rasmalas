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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'band-data.json');

export const DEFAULT_STATE: BandState = {
  profile: {
    name: 'Rasmalas',
    logoUrl:
      '/assets/aistudio/172078516_945511602919683_1850007273041871948_n-removebg-preview_ff5e76fa.png',
    kicker: 'Roots Reggae & Analog Dub · Rasmalas Official',
    headline: 'Harmoni Pesisir, Bas Hangat, dan Denyut Reggae Rasmalas.',
    subheadline:
      'Kolektif roots reggae dan dub analog yang memadukan ritem one-drop Jamaika dengan kisah tropis Nusantara, instrumen tiup langsung, serta rekaman pita reel-to-reel.',
    bio: 'Dibentuk pada tahun 2012, Rasmalas membangun reputasi lewat pertunjukan sound system terbuka dan aransemen brass yang hangat. Setiap lagu direkam secara live-tracking menggunakan konsol analog dan efek spring reverb autentik untuk menjaga napas organik di setiap ketukan.',
    studioQuote:
      'Kami tidak mengejar kesempurnaan steril; kami mengejar getaran ruang yang membuat kaki bergerak sebelum pikiran sempat bertanya.',
    originCity: 'Denpasar & Yogyakarta',
    bookingEmail: 'booking@rasmalas.id',
    heroImage: '/src/assets/images/hero_reggae_concert_1794832343358.jpg',
    studioImage: '/src/assets/images/band_studio_session_1794832343312.jpg',
    heroCtaPrimary: 'Putar Album Terbaru',
    heroCtaSecondary: 'Lihat Jadwal',
    heroCardKicker: 'Jadwal Panggung Nusantara',
    heroCardTitle: 'Sesi Panggung Terbuka & 12-Stack Sound System',
    footerNote: 'Roots Reggae & Analog Dub',
    stats: [
      { label: 'Tahun Berkarya', value: '14 Tahun' },
      { label: 'Album Studio', value: '4 Rilisan' },
      { label: 'Kota Panggung', value: '38 Kota' },
      { label: 'Pendengar Bulanan', value: '128.400+' },
    ],
    members: [
      {
        id: 'm1',
        name: 'Raka Mahendra',
        role: 'Vokal Utama & Gitar Skank',
        instrument: 'Hollow-Body Guitar · Mic',
        origin: 'Yogyakarta',
      },
      {
        id: 'm2',
        name: 'Bima Pratama',
        role: 'Sub-Bass & Dub Director',
        instrument: '4-String Jazz Bass · Tape Delay',
        origin: 'Denpasar',
      },
      {
        id: 'm3',
        name: 'Surya & Kawan Brass',
        role: 'Drum One-Drop, Organ & Brass',
        instrument: 'Hammond Organ · Terompet · Saksofon',
        origin: 'Bandung & Lombok',
      },
    ],
  },
  siteSections: [
    {
      id: 'sec-profil',
      slug: 'profil',
      navLabel: 'Profil',
      kicker: '01. Profil Kolektif & Filosofi Suara',
      title: 'Rekaman Pita Analog, Akar Reggae Pesisir.',
      subtitle: 'Instrumen live tanpa backing track digital',
      builtinKey: 'profil',
      visible: true,
      showInNav: true,
      sortOrder: 0,
    },
    {
      id: 'sec-musik',
      slug: 'musik',
      navLabel: 'Musik',
      kicker: '02. Pemutar Musik Streaming',
      title: 'Katalog Rilisan & Studio Dub Stream',
      subtitle:
        'Putar langsung rekaman reggae one-drop dan sesi dub analog dengan kontrol pemutar penuh.',
      builtinKey: 'musik',
      visible: true,
      showInNav: true,
      sortOrder: 1,
    },
    {
      id: 'sec-jadwal',
      slug: 'jadwal',
      navLabel: 'Jadwal',
      kicker: '03. Jadwal Panggung & Acara',
      title: 'Jadwal Penampilan Rasmalas',
      subtitle:
        'Cek kota terdekat, ketersediaan tiket, dan konfirmasi kehadiran Anda.',
      builtinKey: 'jadwal',
      visible: true,
      showInNav: true,
      sortOrder: 2,
    },
    {
      id: 'sec-galeri',
      slug: 'galeri',
      navLabel: 'Galeri',
      kicker: '04. Galeri Foto & Video Dokumentasi',
      title: 'Arsip Panggung, Studio & Backstage',
      builtinKey: 'galeri',
      visible: true,
      showInNav: true,
      sortOrder: 3,
    },
    {
      id: 'sec-sosial',
      slug: 'sosial',
      navLabel: 'Sosial',
      kicker: '05. Integrasi Media Sosial Real-Time',
      title: 'Kanal Resmi & Siaran Langsung Komunitas',
      builtinKey: 'sosial',
      visible: true,
      showInNav: true,
      sortOrder: 4,
    },
  ],
  tracks: [
    {
      id: 'trk-ombak-senja',
      title: 'Ombak Senja di Uluwatu',
      album: 'Pesisir Selatan (LP)',
      year: '2026',
      durationSec: 26,
      bpm: 74,
      musicalKey: 'Am',
      synthSeed: 1,
      coverUrl: '/src/assets/images/album_cover_senja_1794832345337.jpg',
      plays: 48210,
      credits:
        'Musik oleh Bima Pratama · Lirik oleh Raka Mahendra · Direkam oleh Rasmalas Studio',
      lyrics:
        'Langit tembaga turun perlahan di garis karang,\nAngin selatan membawa gema bas dari kejauhan.\nLepas penat di bahu, biarkan ritem berjalan pelan,\nDi tepi senja, semua langkah menemukan pulang.',
    },
    {
      id: 'trk-kopi-pagi',
      title: 'Kopi Pagi & Piringan Hitam',
      album: 'Pesisir Selatan (LP)',
      year: '2026',
      durationSec: 24,
      bpm: 78,
      musicalKey: 'Em',
      synthSeed: 2,
      coverUrl: '/src/assets/images/gallery_backstage_vinyl_1794832344503.jpg',
      plays: 36940,
      credits:
        'Aransemen Brass oleh Surya · Mixing analog tape oleh Rasmalas Collective',
      lyrics:
        'Jarum piringan hitam berputar di atas meja kayu,\nAroma seduhan pagi menyapa jendela berdebu.\nSatu ketukan drum menenangkan detak yang terburu,\nHari ini milik kita, hangat tanpa ragu.',
    },
    {
      id: 'trk-gema-sound-system',
      title: 'Gema Sound System (Dub Version)',
      album: 'Rasmalas Dub Sessions',
      year: '2025',
      durationSec: 28,
      bpm: 70,
      musicalKey: 'Dm',
      synthSeed: 3,
      coverUrl: '/src/assets/images/gallery_sound_system_1794832343676.jpg',
      plays: 29450,
      credits: 'Live Dub Mix oleh Bima Pratama · Spring Reverb & Space Echo',
      lyrics:
        '[Instrumental Dub Mix]\nGetaran kotak speaker kayu setinggi tiga meter,\nGema tape echo memantul di dinding malam pesisir.',
    },
    {
      id: 'trk-jalan-pulang',
      title: 'Jalan Pulang Tanpa Arah',
      album: 'Langit Tropis',
      year: '2024',
      durationSec: 24,
      bpm: 82,
      musicalKey: 'G',
      synthSeed: 4,
      coverUrl: '/src/assets/images/band_studio_session_1794832343312.jpg',
      plays: 61820,
      credits: 'Rasmalas Collective · Live Studio Take #3',
      lyrics:
        'Tak perlu peta bila suara hati masih jernih,\nSetiap persimpangan menyimpan cerita yang bersih.\nBernyanyilah bersama angin laut yang tak pernah letih,\nHingga fajar menyalakan harapan yang lebih gigih.',
    },
    {
      id: 'trk-api-unggun',
      title: 'Api Unggun Pantai Timur',
      album: 'Langit Tropis',
      year: '2024',
      durationSec: 25,
      bpm: 76,
      musicalKey: 'Cm',
      synthSeed: 5,
      coverUrl: '/src/assets/images/hero_reggae_concert_1794832343358.jpg',
      plays: 53110,
      credits: 'Vokal & Gitar Akustik oleh Raka Mahendra · Perkusi Nyoman',
      lyrics:
        'Percik bara menari mengikuti petikan gitar tua,\nKawan lama duduk melingkar berbagi tawa dan doa.\nDi bawah bintang timur, jarak tak lagi bermakna,\nMusik menyatukan jiwa yang sempat terpisah.',
    },
  ],
  tours: [
    {
      id: 'tour-bali-2026',
      date: '2026-12-05',
      city: 'Canggu, Bali',
      country: 'Indonesia',
      venue: 'Pantai Batu Bolong Sound Garden',
      stageTime: '19:30 WITA',
      priceLabel: 'Rp 175.000',
      status: 'Terbatas',
      ticketUrl: '#jadwal',
      rsvpCount: 312,
      notes:
        'Panggung terbuka matahari terbenam dengan 12-stack sound system kayu.',
    },
    {
      id: 'tour-jogja-2026',
      date: '2026-12-19',
      city: 'Yogyakarta',
      country: 'Indonesia',
      venue: 'Taman Budaya Embung Giwangan',
      stageTime: '20:00 WIB',
      priceLabel: 'Rp 150.000',
      status: 'Tersedia',
      ticketUrl: '#jadwal',
      rsvpCount: 248,
      notes: 'Pertunjukan pulang kampung bersama kolaborasi brass lengkap.',
    },
    {
      id: 'tour-jakarta-2027',
      date: '2027-01-16',
      city: 'Jakarta Selatan',
      country: 'Indonesia',
      venue: 'M Bloc Live House',
      stageTime: '20:30 WIB',
      priceLabel: 'Rp 220.000',
      status: 'Tersedia',
      ticketUrl: '#jadwal',
      rsvpCount: 405,
      notes: 'Peluncuran vinyl edisi terbatas Pesisir Selatan LP.',
    },
    {
      id: 'tour-bandung-2027',
      date: '2027-01-30',
      city: 'Bandung',
      country: 'Indonesia',
      venue: 'Gudang Selatan Creative Yard',
      stageTime: '19:45 WIB',
      priceLabel: 'Rp 165.000',
      status: 'Habis',
      ticketUrl: '#jadwal',
      rsvpCount: 520,
      notes: 'Tiket presale dan reguler telah habis terjual.',
    },
    {
      id: 'tour-lombok-2026',
      date: '2026-10-12',
      city: 'Kuta, Lombok',
      country: 'Indonesia',
      venue: 'Bukit Merese Sunset Stage',
      stageTime: '18:00 WITA',
      priceLabel: 'Rp 140.000',
      status: 'Selesai',
      ticketUrl: '#jadwal',
      rsvpCount: 480,
      notes: 'Rekaman live akustik tersedia pada rilisan arsip.',
    },
  ],
  gallery: [
    {
      id: 'gal-1',
      title: 'Matahari Terbenam di Panggung Pesisir',
      category: 'Panggung',
      imageUrl: '/src/assets/images/hero_reggae_concert_1794832343358.jpg',
      location: 'Pantai Uluwatu, Bali',
      dateLabel: 'Oktober 2026',
      photographer: 'Damar Kusuma',
      featured: true,
    },
    {
      id: 'gal-2',
      title: 'Sesi Live-Tracking Pita Analog',
      category: 'Studio',
      imageUrl: '/src/assets/images/band_studio_session_1794832343312.jpg',
      location: 'Studio Rasmalas, Yogyakarta',
      dateLabel: 'September 2026',
      photographer: 'Nadia Larasati',
    },
    {
      id: 'gal-3',
      title: 'Menara Sound System Tiga Tingkat',
      category: 'Panggung',
      imageUrl: '/src/assets/images/gallery_sound_system_1794832343676.jpg',
      location: 'M Bloc Live House, Jakarta',
      dateLabel: 'Agustus 2026',
      photographer: 'Bagas Prakoso',
    },
    {
      id: 'gal-4',
      title: 'Menyetem Gitar di Dekat Peti Vinyl',
      category: 'Backstage',
      imageUrl: '/src/assets/images/gallery_backstage_vinyl_1794832344503.jpg',
      location: 'Backstage Embung Giwangan',
      dateLabel: 'Juli 2026',
      photographer: 'Damar Kusuma',
    },
    {
      id: 'gal-5',
      title: 'Sampul Piringan Hitam Pesisir Selatan',
      category: 'Studio',
      imageUrl: '/src/assets/images/album_cover_senja_1794832345337.jpg',
      location: 'Pantai Selatan Jawa',
      dateLabel: 'Juni 2026',
      photographer: 'Arsip Rasmalas',
    },
  ],
  socialChannels: [
    {
      platform: 'Instagram',
      handle: '@rasmalas.official',
      url: 'https://instagram.com',
      followersLabel: '84.2K Pengikut',
      connected: true,
    },
    {
      platform: 'YouTube',
      handle: 'Rasmalas Live Sessions',
      url: 'https://youtube.com',
      followersLabel: '52.9K Subscriber',
      connected: true,
    },
    {
      platform: 'Spotify',
      handle: 'Rasmalas Official',
      url: 'https://open.spotify.com',
      followersLabel: '128.4K Pendengar/bln',
      connected: true,
    },
    {
      platform: 'TikTok',
      handle: '@rasmalas.dub',
      url: 'https://tiktok.com',
      followersLabel: '41.5K Pengikut',
      connected: true,
    },
  ],
  socialPosts: [
    {
      id: 'soc-1',
      platform: 'Instagram',
      authorHandle: '@rasmalas.official',
      content:
        'Check sound sore ini di tepi pantai berjalan mulus. Jangan lewatkan sesi dub spesial Rasmalas menjelang matahari terbenam pukul 19:30 WITA.',
      mediaUrl: '/src/assets/images/hero_reggae_concert_1794832343358.jpg',
      externalUrl: 'https://instagram.com',
      likes: 142,
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    },
    {
      id: 'soc-2',
      platform: 'Spotify',
      authorHandle: 'Rasmalas Official',
      content:
        'Single "Ombak Senja di Uluwatu" kini masuk daftar putar utama Roots Nusantara. Terima kasih untuk semua pendengar setia Rasmalas!',
      mediaUrl: '/src/assets/images/album_cover_senja_1794832345337.jpg',
      externalUrl: 'https://open.spotify.com',
      likes: 98,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'soc-3',
      platform: 'YouTube',
      authorHandle: 'Rasmalas Live Sessions',
      content:
        'Dokumenter pendek sesi rekaman pita reel-to-reel di Studio Rasmalas sudah tayang penuh dengan kualitas audio 24-bit.',
      mediaUrl: '/src/assets/images/band_studio_session_1794832343312.jpg',
      externalUrl: 'https://youtube.com',
      likes: 215,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  shoutouts: [
    {
      id: 'sh-1',
      senderName: 'Dimas Pradipta',
      city: 'Semarang',
      message:
        'Ditunggu Rasmalas mampir ke Semarang lagi! Bas di lagu Ombak Senja bikin adem.',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'sh-2',
      senderName: 'Putri Ayu',
      city: 'Denpasar',
      message:
        'Sudah amanin tiket Canggu bulan Desember. Sampai ketemu di depan speaker!',
      createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    },
  ],
  updatedAt: new Date().toISOString(),
};

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
