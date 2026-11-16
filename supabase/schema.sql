-- ============================================================================
-- RASMALAS OFFICIAL — SUPABASE POSTGRESQL SCHEMA, REALTIME, STORAGE & ADMIN RLS
-- Jalankan seluruh skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Tabel Daftar Admin & Hak Akses (Tambah, Edit & Hapus di Dashboard Admin)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Admin Rasmalas',
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  can_edit BOOLEAN NOT NULL DEFAULT true,
  can_delete BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Profil Band (single row id = 'rasmalas')
CREATE TABLE IF NOT EXISTS public.band_profile (
  id TEXT PRIMARY KEY DEFAULT 'rasmalas',
  name TEXT NOT NULL,
  logo_url TEXT,
  kicker TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  studio_quote TEXT NOT NULL DEFAULT '',
  origin_city TEXT NOT NULL DEFAULT '',
  booking_email TEXT NOT NULL DEFAULT '',
  hero_image TEXT NOT NULL DEFAULT '',
  studio_image TEXT NOT NULL DEFAULT '',
  hero_cta_primary TEXT NOT NULL DEFAULT 'Putar Album Terbaru',
  hero_cta_secondary TEXT NOT NULL DEFAULT 'Lihat Jadwal',
  hero_card_kicker TEXT NOT NULL DEFAULT 'Jadwal Panggung Nusantara',
  hero_card_title TEXT NOT NULL DEFAULT 'Sesi Panggung Terbuka & 12-Stack Sound System',
  footer_note TEXT NOT NULL DEFAULT 'Roots Reggae & Analog Dub',
  footer_description TEXT,
  footer_copyright TEXT,
  footer_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tambah kolom baru ke band_profile bila tabel sudah ada sebelumnya
ALTER TABLE public.band_profile
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_primary TEXT NOT NULL DEFAULT 'Putar Album Terbaru',
  ADD COLUMN IF NOT EXISTS hero_cta_secondary TEXT NOT NULL DEFAULT 'Lihat Jadwal',
  ADD COLUMN IF NOT EXISTS hero_card_kicker TEXT NOT NULL DEFAULT 'Jadwal Panggung Nusantara',
  ADD COLUMN IF NOT EXISTS hero_card_title TEXT NOT NULL DEFAULT 'Sesi Panggung Terbuka & 12-Stack Sound System',
  ADD COLUMN IF NOT EXISTS footer_note TEXT NOT NULL DEFAULT 'Roots Reggae & Analog Dub',
  ADD COLUMN IF NOT EXISTS footer_description TEXT,
  ADD COLUMN IF NOT EXISTS footer_copyright TEXT,
  ADD COLUMN IF NOT EXISTS footer_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2B. Manajemen Halaman & Bagian Website (Atur, Edit, Tambah, Urutkan, Hapus)
CREATE TABLE IF NOT EXISTS public.site_sections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nav_label TEXT NOT NULL,
  kicker TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT,
  image_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  cta_label TEXT,
  cta_url TEXT,
  builtin_key TEXT CHECK (builtin_key IS NULL OR builtin_key IN ('profil', 'musik', 'jadwal', 'galeri', 'sosial')),
  visible BOOLEAN NOT NULL DEFAULT true,
  show_in_nav BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_sections
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS builtin_key TEXT,
  ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_nav BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 3. Personel / Anggota Band
CREATE TABLE IF NOT EXISTS public.band_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  instrument TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT '',
  instagram_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.band_members
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 4. Katalog Lagu & Pemutar Musik Streaming
CREATE TABLE IF NOT EXISTS public.tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  album TEXT NOT NULL DEFAULT 'Single Terbaru',
  year TEXT NOT NULL DEFAULT '2026',
  duration_sec INTEGER NOT NULL DEFAULT 26,
  bpm INTEGER NOT NULL DEFAULT 76,
  musical_key TEXT NOT NULL DEFAULT 'Am',
  synth_seed INTEGER NOT NULL DEFAULT 1,
  cover_url TEXT NOT NULL DEFAULT '',
  audio_url TEXT,
  plays INTEGER NOT NULL DEFAULT 0,
  lyrics TEXT NOT NULL DEFAULT '',
  credits TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 5. Jadwal Penampilan & Panggung
CREATE TABLE IF NOT EXISTS public.tours (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Indonesia',
  venue TEXT NOT NULL,
  stage_time TEXT NOT NULL DEFAULT '20:00 WIB',
  price_label TEXT NOT NULL DEFAULT 'Rp 150.000',
  status TEXT NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Terbatas', 'Habis', 'Selesai')),
  ticket_url TEXT NOT NULL DEFAULT '#jadwal',
  rsvp_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Galeri Foto & Video Panggung, Studio & Backstage
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Panggung' CHECK (category IN ('Panggung', 'Studio', 'Backstage')),
  image_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  location TEXT NOT NULL DEFAULT '',
  date_label TEXT NOT NULL DEFAULT '',
  photographer TEXT NOT NULL DEFAULT 'Tim Rasmalas',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- 7. Kanal Media Sosial & Footer (Bebas Tambah, Edit, Hapus Kanal Apa Saja)
CREATE TABLE IF NOT EXISTS public.social_channels (
  platform TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  followers_label TEXT NOT NULL DEFAULT '',
  connected BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.social_channels
  DROP CONSTRAINT IF EXISTS social_channels_platform_check;

-- 8. Postingan Feed Sosial Real-Time
CREATE TABLE IF NOT EXISTS public.social_posts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  external_url TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts
  DROP CONSTRAINT IF EXISTS social_posts_platform_check;

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- 9. Dinding Sapaan Penggemar (Fan Shoutouts)
CREATE TABLE IF NOT EXISTS public.fan_shoutouts (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nusantara',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- FUNGSI OTORISASI ADMIN & RPC PUBLIK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(
    COALESCE(
      NULLIF(auth.jwt() ->> 'email', ''),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      ''
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_rasmalas_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = public.current_user_email()
      AND role IN ('admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_admin_edit()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = public.current_user_email()
      AND can_edit = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_admin_delete()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = public.current_user_email()
      AND can_delete = true
  );
$$;

-- Fungsi RPC aman untuk interaksi publik (tanpa membuka UPDATE langsung ke publik)
CREATE OR REPLACE FUNCTION public.increment_track_play(track_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tracks SET plays = plays + 1 WHERE id = track_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_tour_rsvp(tour_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tours SET rsvp_count = rsvp_count + 1 WHERE id = tour_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_post_like(post_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.social_posts SET likes = likes + 1 WHERE id = post_id;
$$;

-- ============================================================================
-- HAK AKSES SCHEMA & TABEL (GRANTS) UNTUK ANON & AUTHENTICATED
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON
  public.band_profile,
  public.site_sections,
  public.band_members,
  public.tracks,
  public.tours,
  public.gallery_photos,
  public.social_channels,
  public.social_posts,
  public.fan_shoutouts
TO anon, authenticated;

GRANT INSERT ON public.fan_shoutouts TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.admin_users,
  public.band_profile,
  public.site_sections,
  public.band_members,
  public.tracks,
  public.tours,
  public.gallery_photos,
  public.social_channels,
  public.social_posts,
  public.fan_shoutouts
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.current_user_email(),
  public.is_rasmalas_admin(),
  public.can_admin_edit(),
  public.can_admin_delete(),
  public.increment_track_play(TEXT),
  public.increment_tour_rsvp(TEXT),
  public.increment_post_like(TEXT)
TO anon, authenticated;

-- ============================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) & KEBIJAKAN TAMBAH / EDIT / HAPUS ADMIN
-- ============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_shoutouts ENABLE ROW LEVEL SECURITY;

-- Kebijakan tabel admin_users
DROP POLICY IF EXISTS "Admin dapat melihat daftar admin sendiri" ON public.admin_users;
CREATE POLICY "Admin dapat melihat daftar admin sendiri"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (lower(email) = public.current_user_email() OR public.is_rasmalas_admin());

DROP POLICY IF EXISTS "Admin utama kelola admin_users" ON public.admin_users;
CREATE POLICY "Admin utama kelola admin_users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.is_rasmalas_admin())
  WITH CHECK (public.is_rasmalas_admin());

-- band_profile
DROP POLICY IF EXISTS "Publik baca profil band" ON public.band_profile;
CREATE POLICY "Publik baca profil band" ON public.band_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah profil band" ON public.band_profile;
CREATE POLICY "Admin tambah profil band" ON public.band_profile FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit profil band" ON public.band_profile;
CREATE POLICY "Admin edit profil band" ON public.band_profile FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus profil band" ON public.band_profile;
CREATE POLICY "Admin hapus profil band" ON public.band_profile FOR DELETE TO authenticated USING (public.can_admin_delete());

-- site_sections (Halaman Website)
DROP POLICY IF EXISTS "Publik baca bagian halaman" ON public.site_sections;
CREATE POLICY "Publik baca bagian halaman" ON public.site_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah bagian halaman" ON public.site_sections;
CREATE POLICY "Admin tambah bagian halaman" ON public.site_sections FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit bagian halaman" ON public.site_sections;
CREATE POLICY "Admin edit bagian halaman" ON public.site_sections FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus bagian halaman" ON public.site_sections;
CREATE POLICY "Admin hapus bagian halaman" ON public.site_sections FOR DELETE TO authenticated USING (public.can_admin_delete());

-- band_members
DROP POLICY IF EXISTS "Publik baca personel" ON public.band_members;
CREATE POLICY "Publik baca personel" ON public.band_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah personel" ON public.band_members;
CREATE POLICY "Admin tambah personel" ON public.band_members FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit personel" ON public.band_members;
CREATE POLICY "Admin edit personel" ON public.band_members FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus personel" ON public.band_members;
CREATE POLICY "Admin hapus personel" ON public.band_members FOR DELETE TO authenticated USING (public.can_admin_delete());

-- tracks
DROP POLICY IF EXISTS "Publik baca musik" ON public.tracks;
CREATE POLICY "Publik baca musik" ON public.tracks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah musik" ON public.tracks;
CREATE POLICY "Admin tambah musik" ON public.tracks FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit musik" ON public.tracks;
CREATE POLICY "Admin edit musik" ON public.tracks FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus musik" ON public.tracks;
CREATE POLICY "Admin hapus musik" ON public.tracks FOR DELETE TO authenticated USING (public.can_admin_delete());

-- tours (Jadwal)
DROP POLICY IF EXISTS "Publik baca jadwal" ON public.tours;
CREATE POLICY "Publik baca jadwal" ON public.tours FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah jadwal" ON public.tours;
CREATE POLICY "Admin tambah jadwal" ON public.tours FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit jadwal" ON public.tours;
CREATE POLICY "Admin edit jadwal" ON public.tours FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus jadwal" ON public.tours;
CREATE POLICY "Admin hapus jadwal" ON public.tours FOR DELETE TO authenticated USING (public.can_admin_delete());

-- gallery_photos
DROP POLICY IF EXISTS "Publik baca galeri" ON public.gallery_photos;
CREATE POLICY "Publik baca galeri" ON public.gallery_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah galeri" ON public.gallery_photos;
CREATE POLICY "Admin tambah galeri" ON public.gallery_photos FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit galeri" ON public.gallery_photos;
CREATE POLICY "Admin edit galeri" ON public.gallery_photos FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus galeri" ON public.gallery_photos;
CREATE POLICY "Admin hapus galeri" ON public.gallery_photos FOR DELETE TO authenticated USING (public.can_admin_delete());

-- social_channels
DROP POLICY IF EXISTS "Publik baca kanal sosial" ON public.social_channels;
CREATE POLICY "Publik baca kanal sosial" ON public.social_channels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah kanal sosial" ON public.social_channels;
CREATE POLICY "Admin tambah kanal sosial" ON public.social_channels FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit kanal sosial" ON public.social_channels;
CREATE POLICY "Admin edit kanal sosial" ON public.social_channels FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus kanal sosial" ON public.social_channels;
CREATE POLICY "Admin hapus kanal sosial" ON public.social_channels FOR DELETE TO authenticated USING (public.can_admin_delete());

-- social_posts
DROP POLICY IF EXISTS "Publik baca postingan sosial" ON public.social_posts;
CREATE POLICY "Publik baca postingan sosial" ON public.social_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin tambah postingan sosial" ON public.social_posts;
CREATE POLICY "Admin tambah postingan sosial" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin edit postingan sosial" ON public.social_posts;
CREATE POLICY "Admin edit postingan sosial" ON public.social_posts FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus postingan sosial" ON public.social_posts;
CREATE POLICY "Admin hapus postingan sosial" ON public.social_posts FOR DELETE TO authenticated USING (public.can_admin_delete());

-- fan_shoutouts
DROP POLICY IF EXISTS "Publik baca sapaan" ON public.fan_shoutouts;
CREATE POLICY "Publik baca sapaan" ON public.fan_shoutouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Publik kirim sapaan" ON public.fan_shoutouts;
CREATE POLICY "Publik kirim sapaan" ON public.fan_shoutouts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin edit sapaan" ON public.fan_shoutouts;
CREATE POLICY "Admin edit sapaan" ON public.fan_shoutouts FOR UPDATE TO authenticated USING (public.can_admin_edit()) WITH CHECK (public.can_admin_edit());
DROP POLICY IF EXISTS "Admin hapus sapaan" ON public.fan_shoutouts;
CREATE POLICY "Admin hapus sapaan" ON public.fan_shoutouts FOR DELETE TO authenticated USING (public.can_admin_delete());

-- ============================================================================
-- DATA AWAL ADMIN (TERMASUK SINKRONISASI OTOMATIS USER AUTH YANG SUDAH ADA)
-- ============================================================================

INSERT INTO public.admin_users (email, full_name, role, can_edit, can_delete)
VALUES
  ('hamzhome18@gmail.com', 'Owner Rasmalas', 'admin', true, true),
  ('admin@rasmalas.id', 'Studio Admin Rasmalas', 'admin', true, true)
ON CONFLICT (email) DO UPDATE
SET
  role = 'admin',
  can_edit = true,
  can_delete = true;

-- Sinkronkan akun yang sudah dibuat di Authentication -> Users agar otomatis punya akses Edit & Delete
INSERT INTO public.admin_users (email, full_name, role, can_edit, can_delete)
SELECT
  lower(u.email),
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), 'Admin Rasmalas'),
  'admin',
  true,
  true
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET
  role = 'admin',
  can_edit = true,
  can_delete = true;

-- ============================================================================
-- SEED AWAL KONTEN BAND RASMALAS
-- ============================================================================

INSERT INTO public.band_profile (
  id, name, logo_url, kicker, headline, subheadline, bio, studio_quote,
  origin_city, booking_email, hero_image, studio_image, stats
)
VALUES (
  'rasmalas',
  'Rasmalas',
  '/assets/aistudio/172078516_945511602919683_1850007273041871948_n-removebg-preview_ff5e76fa.png',
  'Roots Reggae & Analog Dub · Rasmalas Official',
  'Harmoni Pesisir, Bas Hangat, dan Denyut Reggae Rasmalas.',
  'Kolektif roots reggae dan dub analog yang memadukan ritem one-drop Jamaika dengan kisah tropis Nusantara, instrumen tiup langsung, serta rekaman pita reel-to-reel.',
  'Dibentuk pada tahun 2012, Rasmalas membangun reputasi lewat pertunjukan sound system terbuka dan aransemen brass yang hangat. Setiap lagu direkam secara live-tracking menggunakan konsol analog dan efek spring reverb autentik untuk menjaga napas organik di setiap ketukan.',
  'Kami tidak mengejar kesempurnaan steril; kami mengejar getaran ruang yang membuat kaki bergerak sebelum pikiran sempat bertanya.',
  'Denpasar & Yogyakarta',
  'booking@rasmalas.id',
  '/src/assets/images/hero_reggae_concert_1794832343358.jpg',
  '/src/assets/images/band_studio_session_1794832343312.jpg',
  '[
    {"label": "Tahun Berkarya", "value": "14 Tahun"},
    {"label": "Album Studio", "value": "4 Rilisan"},
    {"label": "Kota Panggung", "value": "38 Kota"},
    {"label": "Pendengar Bulanan", "value": "128.400+"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.band_members (id, name, role, instrument, origin, instagram_url, sort_order)
VALUES
  ('m1', 'Raka Mahendra', 'Vokal Utama & Gitar Skank', 'Hollow-Body Guitar · Mic', 'Yogyakarta', 'https://instagram.com/raka.rasmalas', 0),
  ('m2', 'Bima Pratama', 'Sub-Bass & Dub Director', '4-String Jazz Bass · Tape Delay', 'Denpasar', 'https://instagram.com/bima.rasmalas', 1),
  ('m3', 'Surya & Kawan Brass', 'Drum One-Drop, Organ & Brass', 'Hammond Organ · Terompet · Saksofon', 'Bandung & Lombok', 'https://instagram.com/surya.rasmalas', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tracks (id, title, album, year, duration_sec, bpm, musical_key, synth_seed, cover_url, plays, credits, lyrics, sort_order)
VALUES
  ('trk-ombak-senja', 'Ombak Senja di Uluwatu', 'Pesisir Selatan (LP)', '2026', 26, 74, 'Am', 1, '/src/assets/images/album_cover_senja_1794832345337.jpg', 48210, 'Musik oleh Bima Pratama · Lirik oleh Raka Mahendra · Direkam oleh Rasmalas Studio', E'Langit tembaga turun perlahan di garis karang,\nAngin selatan membawa gema bas dari kejauhan.\nLepas penat di bahu, biarkan ritem berjalan pelan,\nDi tepi senja, semua langkah menemukan pulang.', 0),
  ('trk-kopi-pagi', 'Kopi Pagi & Piringan Hitam', 'Pesisir Selatan (LP)', '2026', 24, 78, 'Em', 2, '/src/assets/images/gallery_backstage_vinyl_1794832344503.jpg', 36940, 'Aransemen Brass oleh Surya · Mixing analog tape oleh Rasmalas Collective', E'Jarum piringan hitam berputar di atas meja kayu,\nAroma seduhan pagi menyapa jendela berdebu.\nSatu ketukan drum menenangkan detak yang terburu,\nHari ini milik kita, hangat tanpa ragu.', 1),
  ('trk-gema-sound-system', 'Gema Sound System (Dub Version)', 'Rasmalas Dub Sessions', '2025', 28, 70, 'Dm', 3, '/src/assets/images/gallery_sound_system_1794832343676.jpg', 29450, 'Live Dub Mix oleh Bima Pratama · Spring Reverb & Space Echo', E'[Instrumental Dub Mix]\nGetaran kotak speaker kayu setinggi tiga meter,\nGema tape echo memantul di dinding malam pesisir.', 2),
  ('trk-jalan-pulang', 'Jalan Pulang Tanpa Arah', 'Langit Tropis', '2024', 24, 82, 'G', 4, '/src/assets/images/band_studio_session_1794832343312.jpg', 61820, 'Rasmalas Collective · Live Studio Take #3', E'Tak perlu peta bila suara hati masih jernih,\nSetiap persimpangan menyimpan cerita yang bersih.\nBernyanyilah bersama angin laut yang tak pernah letih,\nHingga fajar menyalakan harapan yang lebih gigih.', 3),
  ('trk-api-unggun', 'Api Unggun Pantai Timur', 'Langit Tropis', '2024', 25, 76, 'Cm', 5, '/src/assets/images/hero_reggae_concert_1794832343358.jpg', 53110, 'Vokal & Gitar Akustik oleh Raka Mahendra · Perkusi Nyoman', E'Percik bara menari mengikuti petikan gitar tua,\nKawan lama duduk melingkar berbagi tawa dan doa.\nDi bawah bintang timur, jarak tak lagi bermakna,\nMusik menyatukan jiwa yang sempat terpisah.', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tours (id, date, city, country, venue, stage_time, price_label, status, ticket_url, rsvp_count, notes)
VALUES
  ('tour-bali-2026', '2026-12-05', 'Canggu, Bali', 'Indonesia', 'Pantai Batu Bolong Sound Garden', '19:30 WITA', 'Rp 175.000', 'Terbatas', '#jadwal', 312, 'Panggung terbuka matahari terbenam dengan 12-stack sound system kayu.'),
  ('tour-jogja-2026', '2026-12-19', 'Yogyakarta', 'Indonesia', 'Taman Budaya Embung Giwangan', '20:00 WIB', 'Rp 150.000', 'Tersedia', '#jadwal', 248, 'Pertunjukan pulang kampung bersama kolaborasi brass lengkap.'),
  ('tour-jakarta-2027', '2027-01-16', 'Jakarta Selatan', 'Indonesia', 'M Bloc Live House', '20:30 WIB', 'Rp 220.000', 'Tersedia', '#jadwal', 405, 'Peluncuran vinyl edisi terbatas Pesisir Selatan LP.'),
  ('tour-bandung-2027', '2027-01-30', 'Bandung', 'Indonesia', 'Gudang Selatan Creative Yard', '19:45 WIB', 'Rp 165.000', 'Habis', '#jadwal', 520, 'Tiket presale dan reguler telah habis terjual.'),
  ('tour-lombok-2026', '2026-10-12', 'Kuta, Lombok', 'Indonesia', 'Bukit Merese Sunset Stage', '18:00 WITA', 'Rp 140.000', 'Selesai', '#jadwal', 480, 'Rekaman live akustik tersedia pada rilisan arsip.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gallery_photos (id, title, category, image_url, location, date_label, photographer, featured)
VALUES
  ('gal-1', 'Matahari Terbenam di Panggung Pesisir', 'Panggung', '/src/assets/images/hero_reggae_concert_1794832343358.jpg', 'Pantai Uluwatu, Bali', 'Oktober 2026', 'Damar Kusuma', true),
  ('gal-2', 'Sesi Live-Tracking Pita Analog', 'Studio', '/src/assets/images/band_studio_session_1794832343312.jpg', 'Studio Rasmalas, Yogyakarta', 'September 2026', 'Nadia Larasati', false),
  ('gal-3', 'Menara Sound System Tiga Tingkat', 'Panggung', '/src/assets/images/gallery_sound_system_1794832343676.jpg', 'M Bloc Live House, Jakarta', 'Agustus 2026', 'Bagas Prakoso', false),
  ('gal-4', 'Menyetem Gitar di Dekat Peti Vinyl', 'Backstage', '/src/assets/images/gallery_backstage_vinyl_1794832344503.jpg', 'Backstage Embung Giwangan', 'Juli 2026', 'Damar Kusuma', false),
  ('gal-5', 'Sampul Piringan Hitam Pesisir Selatan', 'Studio', '/src/assets/images/album_cover_senja_1794832345337.jpg', 'Pantai Selatan Jawa', 'Juni 2026', 'Arsip Rasmalas', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.social_channels (platform, handle, url, followers_label, connected, sort_order)
VALUES
  ('Instagram', '@rasmalas.official', 'https://instagram.com', '84.2K Pengikut', true, 0),
  ('YouTube', 'Rasmalas Live Sessions', 'https://youtube.com', '52.9K Subscriber', true, 1),
  ('Spotify', 'Rasmalas Official', 'https://open.spotify.com', '128.4K Pendengar/bln', true, 2),
  ('TikTok', '@rasmalas.dub', 'https://tiktok.com', '41.5K Pengikut', true, 3)
ON CONFLICT (platform) DO NOTHING;

INSERT INTO public.social_posts (id, platform, author_handle, content, media_url, external_url, likes)
VALUES
  ('soc-1', 'Instagram', '@rasmalas.official', 'Check sound sore ini di tepi pantai berjalan mulus. Jangan lewatkan sesi dub spesial Rasmalas menjelang matahari terbenam pukul 19:30 WITA.', '/src/assets/images/hero_reggae_concert_1794832343358.jpg', 'https://instagram.com', 142),
  ('soc-2', 'Spotify', 'Rasmalas Official', 'Single "Ombak Senja di Uluwatu" kini masuk daftar putar utama Roots Nusantara. Terima kasih untuk semua pendengar setia Rasmalas!', '/src/assets/images/album_cover_senja_1794832345337.jpg', 'https://open.spotify.com', 98),
  ('soc-3', 'YouTube', 'Rasmalas Live Sessions', 'Dokumenter pendek sesi rekaman pita reel-to-reel di Studio Rasmalas sudah tayang penuh dengan kualitas audio 24-bit.', '/src/assets/images/band_studio_session_1794832343312.jpg', 'https://youtube.com', 215)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fan_shoutouts (id, sender_name, city, message)
VALUES
  ('sh-1', 'Dimas Pradipta', 'Semarang', 'Ditunggu Rasmalas mampir ke Semarang lagi! Bas di lagu Ombak Senja bikin adem.'),
  ('sh-2', 'Putri Ayu', 'Denpasar', 'Sudah amanin tiket Canggu bulan Desember. Sampai ketemu di depan speaker!')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_sections (
  id, slug, nav_label, kicker, title, subtitle, builtin_key, visible, show_in_nav, sort_order
)
VALUES
  ('sec-profil', 'profil', 'Profil', '01. Profil Kolektif & Filosofi Suara', 'Rekaman Pita Analog, Akar Reggae Pesisir.', 'Instrumen live tanpa backing track digital', 'profil', true, true, 0),
  ('sec-musik', 'musik', 'Musik', '02. Pemutar Musik Streaming', 'Katalog Rilisan & Studio Dub Stream', 'Putar langsung rekaman reggae one-drop dan sesi dub analog dengan kontrol pemutar penuh.', 'musik', true, true, 1),
  ('sec-jadwal', 'jadwal', 'Jadwal', '03. Jadwal Panggung & Acara', 'Jadwal Penampilan Rasmalas', 'Cek kota terdekat, ketersediaan tiket, dan konfirmasi kehadiran Anda.', 'jadwal', true, true, 2),
  ('sec-galeri', 'galeri', 'Galeri', '04. Galeri Foto & Video Dokumentasi', 'Arsip Panggung, Studio & Backstage', NULL, 'galeri', true, true, 3),
  ('sec-sosial', 'sosial', 'Sosial', '05. Integrasi Media Sosial Real-Time', 'Kanal Resmi & Siaran Langsung Komunitas', NULL, 'sosial', true, true, 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SUPABASE REALTIME PUBLICATION (PEMBARUAN LANGSUNG TANPA REFRESH)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'band_profile',
    'site_sections',
    'band_members',
    'tracks',
    'tours',
    'gallery_photos',
    'social_channels',
    'social_posts',
    'fan_shoutouts'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES (UPLOAD FOTO, VIDEO & AUDIO ADMIN)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rasmalas-media',
  'rasmalas-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Publik baca file media rasmalas" ON storage.objects;
CREATE POLICY "Publik baca file media rasmalas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rasmalas-media');

DROP POLICY IF EXISTS "Admin upload file media rasmalas" ON storage.objects;
CREATE POLICY "Admin upload file media rasmalas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'rasmalas-media' AND public.can_admin_edit());

DROP POLICY IF EXISTS "Admin edit file media rasmalas" ON storage.objects;
CREATE POLICY "Admin edit file media rasmalas"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'rasmalas-media' AND public.can_admin_edit())
  WITH CHECK (bucket_id = 'rasmalas-media' AND public.can_admin_edit());

DROP POLICY IF EXISTS "Admin hapus file media rasmalas" ON storage.objects;
CREATE POLICY "Admin hapus file media rasmalas"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'rasmalas-media' AND public.can_admin_delete());
