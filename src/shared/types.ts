export type TourStatus = 'Tersedia' | 'Terbatas' | 'Habis' | 'Selesai';

export type GalleryCategory = 'Panggung' | 'Studio' | 'Backstage';

export type SocialPlatform = 'Instagram' | 'YouTube' | 'Spotify' | 'TikTok';

export interface BandMember {
  id: string;
  name: string;
  role: string;
  instrument: string;
  origin: string;
  instagramUrl?: string;
}

export interface BandStat {
  label: string;
  value: string;
}

export type BuiltinSectionKey = 'profil' | 'musik' | 'jadwal' | 'galeri' | 'sosial';

export interface SiteSection {
  id: string;
  slug: string;
  navLabel: string;
  kicker: string;
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  ctaLabel?: string;
  ctaUrl?: string;
  builtinKey?: BuiltinSectionKey;
  visible: boolean;
  showInNav: boolean;
  sortOrder: number;
}

export interface BandProfile {
  name: string;
  logoUrl?: string;
  kicker: string;
  headline: string;
  subheadline: string;
  bio: string;
  studioQuote: string;
  originCity: string;
  bookingEmail: string;
  heroImage: string;
  studioImage: string;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  heroCardKicker?: string;
  heroCardTitle?: string;
  footerNote?: string;
  stats: BandStat[];
  members: BandMember[];
}

export interface Track {
  id: string;
  title: string;
  album: string;
  year: string;
  durationSec: number;
  bpm: number;
  musicalKey: string;
  synthSeed: number;
  coverUrl: string;
  audioUrl?: string;
  plays: number;
  lyrics: string;
  credits: string;
}

export interface TourDate {
  id: string;
  date: string;
  city: string;
  country: string;
  venue: string;
  stageTime: string;
  priceLabel: string;
  status: TourStatus;
  ticketUrl: string;
  rsvpCount: number;
  notes?: string;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  category: GalleryCategory;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  location: string;
  dateLabel: string;
  photographer: string;
  featured?: boolean;
}

export interface SocialChannel {
  platform: SocialPlatform;
  handle: string;
  url: string;
  followersLabel: string;
  connected: boolean;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  authorHandle: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  externalUrl?: string;
  likes: number;
  createdAt: string;
}

export interface FanShoutout {
  id: string;
  senderName: string;
  city: string;
  message: string;
  createdAt: string;
}

export interface BandState {
  profile: BandProfile;
  siteSections: SiteSection[];
  tracks: Track[];
  tours: TourDate[];
  gallery: GalleryPhoto[];
  socialChannels: SocialChannel[];
  socialPosts: SocialPost[];
  shoutouts: FanShoutout[];
  updatedAt: string;
}

export interface WsServerMessage {
  type:
    | 'state:init'
    | 'profile:updated'
    | 'sections:updated'
    | 'tracks:updated'
    | 'tours:updated'
    | 'gallery:updated'
    | 'social:updated'
    | 'presence:count';
  payload: unknown;
}
