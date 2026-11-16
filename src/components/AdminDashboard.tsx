import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  Camera,
  Check,
  Disc3,
  Edit3,
  Eye,
  EyeOff,
  Film,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Mail,
  Menu,
  PanelBottom,
  Plus,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import type { BackendMode } from '../hooks/useBandRealtime';
import {
  sbAdminLogin,
  sbDeleteGalleryPhoto,
  sbDeleteShoutout,
  sbDeleteSiteSection,
  sbDeleteSocialPost,
  sbDeleteTour,
  sbDeleteTrack,
  sbInsertSocialPost,
  sbReorderSiteSections,
  sbSaveProfileAndMembers,
  sbSaveSocialChannels,
  sbSendPasswordResetEmail,
  sbUpdateAdminPassword,
  sbUploadMedia,
  sbUpsertGalleryPhoto,
  sbUpsertSiteSection,
  sbUpsertTour,
  sbUpsertTrack,
} from '../lib/supabaseBrowser';
import { resolveAssetUrl } from '../shared/assetUrl';
import { isTourDatePast, normalizeTourStatus } from '../shared/tourUtils';
import type {
  BandMember,
  BandProfile,
  BandState,
  BuiltinSectionKey,
  FooterLink,
  GalleryCategory,
  GalleryPhoto,
  SiteSection,
  SocialChannel,
  SocialPost,
  SocialPlatform,
  TourDate,
  TourStatus,
  Track,
} from '../shared/types';

interface AdminDashboardProps {
  bandState: BandState;
  backendMode: BackendMode;
  isAuthenticated: boolean;
  adminEmail: string | null;
  adminUsername: string | null;
  adminFullName: string | null;
  initialSection?: 'overview' | 'settings';
  authToken: string | null;
  wsConnected: boolean;
  onlineCount: number;
  onBackToSite: () => void;
  onLoginSuccess: (
    email: string,
    token: string,
    username?: string,
    fullName?: string
  ) => void;
  onAccountUpdated?: (info: {
    email?: string;
    username?: string;
    fullName?: string;
    token?: string;
  }) => void;
  onLogout: () => void;
  onRefreshState: () => Promise<void>;
}

type AdminSection =
  | 'overview'
  | 'pages'
  | 'footer'
  | 'profile'
  | 'tracks'
  | 'tours'
  | 'gallery'
  | 'social'
  | 'settings';

const SECTION_LABELS: Record<AdminSection, string> = {
  overview: 'Ringkasan',
  pages: 'Halaman Website',
  footer: 'Footer Website',
  profile: 'Profil & Personel',
  tracks: 'Musik & Audio',
  tours: 'Jadwal',
  gallery: 'Galeri Foto & Video',
  social: 'Media Sosial',
  settings: 'Pengaturan & Akun',
};

export function AdminDashboard({
  bandState,
  backendMode,
  isAuthenticated,
  adminEmail,
  adminUsername,
  adminFullName,
  initialSection = 'overview',
  authToken,
  wsConnected,
  onlineCount,
  onBackToSite,
  onLoginSuccess,
  onLogout,
  onRefreshState,
}: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login & reset password form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetLoginInput, setResetLoginInput] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Admin password reset state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [resetEmailBusy, setResetEmailBusy] = useState(false);

  // Global feedback
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<
    'logo' | 'hero' | 'studio' | 'section' | 'cover' | 'audio' | 'gallery' | 'social' | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Profile & Lineup state
  const [profileForm, setProfileForm] = useState<BandProfile>(bandState.profile);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<Omit<BandMember, 'id'>>({
    name: '',
    role: '',
    instrument: '',
    origin: '',
    instagramUrl: '',
  });

  // Website Pages / Sections CRUD state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionBuiltinKey, setEditingSectionBuiltinKey] = useState<
    BuiltinSectionKey | undefined
  >(undefined);
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(
    null
  );
  const [sectionForm, setSectionForm] = useState({
    navLabel: '',
    slug: '',
    kicker: '',
    title: '',
    subtitle: '',
    body: '',
    imageUrl: '',
    mediaType: 'image' as 'image' | 'video',
    ctaLabel: '',
    ctaUrl: '',
    visible: true,
    showInNav: true,
  });

  // Tracks CRUD state (UI focused on Judul Lagu, File Audio, Foto Sampul, Lirik Lagu)
  const [trackSearch, setTrackSearch] = useState('');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState({
    title: '',
    album: 'Rasmalas Audio',
    year: '2026',
    bpm: 76,
    musicalKey: 'Am',
    durationSec: 26,
    audioUrl: '',
    coverUrl: '/src/assets/images/album_cover_senja_1794832345337.jpg',
    credits: 'Rasmalas',
    lyrics: '',
  });

  // Tours CRUD state
  const [tourFilter, setTourFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [tourForm, setTourForm] = useState({
    date: '2027-02-14',
    city: '',
    country: 'Indonesia',
    venue: '',
    stageTime: '20:00 WIB',
    priceLabel: 'Rp 150.000',
    status: 'Tersedia' as TourStatus,
    ticketUrl: '#jadwal',
    notes: '',
  });

  // Gallery CRUD state
  const [galleryFilter, setGalleryFilter] = useState<'Semua' | GalleryCategory>('Semua');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoForm, setPhotoForm] = useState({
    title: '',
    category: 'Panggung' as GalleryCategory,
    imageUrl: '',
    mediaType: 'image' as 'image' | 'video',
    location: '',
    dateLabel: 'November 2026',
    photographer: 'Tim Rasmalas',
    featured: false,
  });

  // Footer custom links & channel add state
  const [editingFooterLinkId, setEditingFooterLinkId] = useState<string | null>(null);
  const [footerLinkForm, setFooterLinkForm] = useState({ label: '', url: '' });
  const [newChannelForm, setNewChannelForm] = useState({
    platform: '',
    handle: '',
    followersLabel: '',
    url: '',
  });

  // Social state
  const socialPostFormRef = useRef<HTMLFormElement | null>(null);
  const [channelsForm, setChannelsForm] = useState<SocialChannel[]>(
    bandState.socialChannels
  );
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostLikes, setEditingPostLikes] = useState(0);
  const [editingPostCreatedAt, setEditingPostCreatedAt] = useState<string | null>(null);
  const [postPlatform, setPostPlatform] = useState<SocialPlatform>('Instagram');
  const [postAuthorHandle, setPostAuthorHandle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video'>('image');
  const [postExternalUrl, setPostExternalUrl] = useState('');

  useEffect(() => {
    setProfileForm(bandState.profile);
    setChannelsForm(bandState.socialChannels);
  }, [bandState]);

  useEffect(() => {
    if (initialSection === 'settings') {
      setSection('settings');
    }
  }, [initialSection]);

  function buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return headers;
  }

  async function uploadMediaFile(
    file: File,
    folder: string,
    target: 'logo' | 'hero' | 'studio' | 'section' | 'cover' | 'audio' | 'gallery' | 'social'
  ): Promise<{ url: string; mediaType: 'image' | 'video' | 'audio' } | null> {
    setUploadingTarget(target);
    setUploadProgress(0);
    try {
      if (backendMode === 'supabase') {
        return await sbUploadMedia(file, folder, (pct) => setUploadProgress(pct));
      }
      if (backendMode === 'static') {
        throw new Error(
          'Upload file membutuhkan koneksi database dan penyimpanan media yang aktif.'
        );
      }
      const headers: Record<string, string> = {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
        'X-Folder': folder,
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: file,
      });
      const data = (await res.json()) as {
        url?: string;
        mediaType?: 'image' | 'video' | 'audio';
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Gagal mengunggah file media.');
      }
      setUploadProgress(100);
      return { url: data.url, mediaType: data.mediaType ?? 'image' };
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengunggah file media.');
      return null;
    } finally {
      setUploadingTarget(null);
      setUploadProgress(null);
    }
  }

  function showNotice(msg: string) {
    setErrorMsg(null);
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  }

  function showError(msg: string) {
    setNotice(null);
    setErrorMsg(msg);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (backendMode === 'supabase') {
        const result = await sbAdminLogin(emailInput, passwordInput);
        onLoginSuccess(result.email, result.token, result.username, result.fullName);
        setPasswordInput('');
        return;
      }
      if (backendMode === 'static') {
        throw new Error(
          'Server database belum terhubung pada deployment statis ini. Periksa konfigurasi environment variables lalu lakukan redeploy.'
        );
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = (await res.json()) as {
        authenticated?: boolean;
        email?: string;
        username?: string;
        fullName?: string;
        token?: string;
        error?: string;
      };
      if (!res.ok || !data.authenticated || !data.token || !data.email) {
        throw new Error(data.error || 'Email/username atau kata sandi admin tidak sesuai.');
      }
      onLoginSuccess(data.email, data.token, data.username, data.fullName);
      setPasswordInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk ke dashboard admin.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSendLoginResetEmail(e: FormEvent) {
    e.preventDefault();
    setResetFeedback(null);
    setResetBusy(true);
    try {
      if (backendMode !== 'supabase') {
        throw new Error(
          'Reset kata sandi via email hanya tersedia saat terhubung ke server cloud. Pada mode server lokal, login lalu ubah kata sandi di menu Pengaturan.'
        );
      }
      const res = await sbSendPasswordResetEmail(resetLoginInput);
      setResetFeedback({
        type: 'success',
        message: `Tautan reset kata sandi telah dikirim ke ${res.email}. Silakan cek kotak masuk atau folder spam email Anda.`,
      });
      setResetLoginInput('');
    } catch (err) {
      setResetFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Gagal mengirim tautan reset kata sandi.',
      });
    } finally {
      setResetBusy(false);
    }
  }

  async function handleSaveNewPassword(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      showError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setPasswordBusy(true);
    try {
      if (backendMode === 'supabase') {
        await sbUpdateAdminPassword(passwordForm.newPassword);
      } else if (backendMode === 'static') {
        throw new Error('Mode statis membutuhkan koneksi database untuk reset kata sandi.');
      } else {
        const res = await fetch('/api/admin/account/password', {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ newPassword: passwordForm.newPassword }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memperbarui kata sandi admin.');
        }
      }

      setPasswordForm({ newPassword: '', confirmPassword: '' });
      showNotice('Kata sandi admin berhasil direset dan langsung aktif untuk login berikutnya.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal memperbarui kata sandi admin.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleSendResetEmailFromSettings() {
    const target = adminEmail || adminUsername;
    if (!target) {
      showError('Email akun admin belum tersedia.');
      return;
    }
    setResetEmailBusy(true);
    try {
      const res = await sbSendPasswordResetEmail(target);
      showNotice(`Link reset kata sandi telah dikirim ke ${res.email}.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengirim email reset kata sandi.');
    } finally {
      setResetEmailBusy(false);
    }
  }

  // Profile + Members save
  async function saveProfilePayload(nextProfile: BandProfile, successMsg: string) {
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        await sbSaveProfileAndMembers(nextProfile);
      } else {
        const res = await fetch('/api/admin/profile', {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify(nextProfile),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil.');
      }
      await onRefreshState();
      showNotice(successMsg);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  }

  function handleSaveProfileForm(e: FormEvent) {
    e.preventDefault();
    void saveProfilePayload(profileForm, 'Profil band & statistik KPI diperbarui real-time.');
  }

  function startEditMember(m: BandMember) {
    setEditingMemberId(m.id);
    setNewMember({
      name: m.name,
      role: m.role,
      instrument: m.instrument,
      origin: m.origin,
      instagramUrl: m.instagramUrl ?? '',
    });
  }

  function resetMemberForm() {
    setEditingMemberId(null);
    setNewMember({
      name: '',
      role: '',
      instrument: '',
      origin: '',
      instagramUrl: '',
    });
  }

  function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.role.trim()) return;
    const cleanIg = newMember.instagramUrl?.trim() || undefined;
    if (editingMemberId) {
      const updated = {
        ...profileForm,
        members: profileForm.members.map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                name: newMember.name.trim(),
                role: newMember.role.trim(),
                instrument: newMember.instrument.trim() || 'Vokal & Instrumen',
                origin: newMember.origin.trim() || profileForm.originCity,
                instagramUrl: cleanIg,
              }
            : m
        ),
      };
      setProfileForm(updated);
      resetMemberForm();
      void saveProfilePayload(updated, 'Data personel berhasil diperbarui.');
      return;
    }

    const member: BandMember = {
      id: `m-${Date.now().toString(36)}`,
      name: newMember.name.trim(),
      role: newMember.role.trim(),
      instrument: newMember.instrument.trim() || 'Vokal & Instrumen',
      origin: newMember.origin.trim() || profileForm.originCity,
      instagramUrl: cleanIg,
    };
    const updated = { ...profileForm, members: [...profileForm.members, member] };
    setProfileForm(updated);
    resetMemberForm();
    void saveProfilePayload(updated, 'Personel baru berhasil ditambahkan.');
  }

  function handleDeleteMember(id: string) {
    const updated = {
      ...profileForm,
      members: profileForm.members.filter((m) => m.id !== id),
    };
    setProfileForm(updated);
    if (editingMemberId === id) resetMemberForm();
    void saveProfilePayload(updated, 'Personel dihapus dari formasi.');
  }

  // Website Pages & Sections CRUD
  async function handleHeroImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'hero', 'hero');
    if (uploaded) {
      setProfileForm((prev) => ({ ...prev, heroImage: uploaded.url }));
      showNotice('Foto Hero berhasil diunggah. Klik Simpan Tampilan Hero & Footer.');
    }
  }

  async function handleStudioImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'studio', 'studio');
    if (uploaded) {
      setProfileForm((prev) => ({ ...prev, studioImage: uploaded.url }));
      showNotice('Foto Studio Profil berhasil diunggah. Klik Simpan Tampilan Hero & Footer.');
    }
  }

  async function handleSectionMediaUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'pages', 'section');
    if (uploaded) {
      setSectionForm((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        mediaType: uploaded.mediaType === 'video' ? 'video' : 'image',
      }));
      showNotice(
        uploaded.mediaType === 'video'
          ? 'Video bagian halaman berhasil diunggah.'
          : 'Foto bagian halaman berhasil diunggah.'
      );
    }
  }

  function startEditSection(sec: SiteSection) {
    setEditingSectionId(sec.id);
    setEditingSectionBuiltinKey(sec.builtinKey);
    setConfirmDeleteSectionId(null);
    setSectionForm({
      navLabel: sec.navLabel,
      slug: sec.slug,
      kicker: sec.kicker,
      title: sec.title,
      subtitle: sec.subtitle ?? '',
      body: sec.body ?? '',
      imageUrl: sec.imageUrl ?? '',
      mediaType: sec.mediaType === 'video' ? 'video' : 'image',
      ctaLabel: sec.ctaLabel ?? '',
      ctaUrl: sec.ctaUrl ?? '',
      visible: sec.visible,
      showInNav: sec.showInNav,
    });
  }

  function resetSectionForm() {
    setEditingSectionId(null);
    setEditingSectionBuiltinKey(undefined);
    setSectionForm({
      navLabel: '',
      slug: '',
      kicker: '',
      title: '',
      subtitle: '',
      body: '',
      imageUrl: '',
      mediaType: 'image',
      ctaLabel: '',
      ctaUrl: '',
      visible: true,
      showInNav: true,
    });
  }

  async function handleSaveSection(e: FormEvent) {
    e.preventDefault();
    if (!sectionForm.navLabel.trim() || !sectionForm.title.trim()) {
      showError('Nama menu navigasi dan judul bagian halaman wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        const existing = editingSectionId
          ? (bandState.siteSections ?? []).find((s) => s.id === editingSectionId)
          : undefined;
        const rawSlug = (sectionForm.slug || sectionForm.navLabel)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const cleanSlug = rawSlug || `bagian-${Date.now().toString(36)}`;
        const maxOrder = (bandState.siteSections ?? []).reduce(
          (m, s) => Math.max(m, s.sortOrder),
          -1
        );
        const secPayload: SiteSection = {
          id: existing?.id ?? `sec-${Date.now().toString(36)}`,
          slug: cleanSlug,
          navLabel: sectionForm.navLabel.trim(),
          kicker: sectionForm.kicker.trim(),
          title: sectionForm.title.trim(),
          subtitle: sectionForm.subtitle.trim() || undefined,
          body: sectionForm.body.trim() || undefined,
          imageUrl: sectionForm.imageUrl.trim() || undefined,
          mediaType: sectionForm.imageUrl.trim() ? sectionForm.mediaType : undefined,
          ctaLabel: sectionForm.ctaLabel.trim() || undefined,
          ctaUrl: sectionForm.ctaUrl.trim() || undefined,
          builtinKey: existing?.builtinKey,
          visible: sectionForm.visible,
          showInNav: sectionForm.showInNav,
          sortOrder: existing ? existing.sortOrder : maxOrder + 1,
        };
        await sbUpsertSiteSection(secPayload);
      } else {
        const url = editingSectionId
          ? `/api/admin/sections/${editingSectionId}`
          : '/api/admin/sections';
        const method = editingSectionId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: buildHeaders(),
          body: JSON.stringify(sectionForm),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan bagian halaman.');
      }
      resetSectionForm();
      await onRefreshState();
      showNotice(
        editingSectionId
          ? 'Pengaturan bagian halaman diperbarui secara real-time.'
          : 'Bagian halaman website baru berhasil ditambahkan.'
      );
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Gagal menyimpan bagian halaman.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSectionVisible(sec: SiteSection) {
    try {
      if (backendMode === 'supabase') {
        await sbUpsertSiteSection({ ...sec, visible: !sec.visible });
      } else {
        const res = await fetch(`/api/admin/sections/${sec.id}`, {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ visible: !sec.visible }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah visibilitas.');
      }
      await onRefreshState();
      showNotice(
        !sec.visible
          ? `Bagian "${sec.navLabel}" sekarang ditampilkan di website.`
          : `Bagian "${sec.navLabel}" disembunyikan dari website.`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengubah visibilitas.');
    }
  }

  async function handleToggleSectionNav(sec: SiteSection) {
    try {
      if (backendMode === 'supabase') {
        await sbUpsertSiteSection({ ...sec, showInNav: !sec.showInNav });
      } else {
        const res = await fetch(`/api/admin/sections/${sec.id}`, {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ showInNav: !sec.showInNav }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah tampilan navigasi.');
      }
      await onRefreshState();
      showNotice(
        !sec.showInNav
          ? `Link "${sec.navLabel}" ditampilkan di Navbar & Footer.`
          : `Link "${sec.navLabel}" dihapus dari Navbar & Footer.`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengubah tampilan navigasi.');
    }
  }

  async function handleMoveSection(index: number, direction: -1 | 1) {
    const ordered = [...(bandState.siteSections ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= ordered.length) return;
    const [moved] = ordered.splice(index, 1);
    ordered.splice(targetIdx, 0, moved);
    try {
      if (backendMode === 'supabase') {
        await sbReorderSiteSections(ordered);
      } else {
        const res = await fetch('/api/admin/sections/reorder', {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ orderedIds: ordered.map((s) => s.id) }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah urutan halaman.');
      }
      await onRefreshState();
      showNotice('Urutan bagian website diperbarui secara real-time.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengubah urutan.');
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      if (backendMode === 'supabase') {
        const target = (bandState.siteSections ?? []).find((s) => s.id === id);
        if (target?.builtinKey) {
          throw new Error('Bagian bawaan tidak dapat dihapus permanen. Gunakan Sembunyikan.');
        }
        await sbDeleteSiteSection(id);
      } else {
        const res = await fetch(`/api/admin/sections/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menghapus bagian halaman.');
      }
      if (editingSectionId === id) resetSectionForm();
      setConfirmDeleteSectionId(null);
      await onRefreshState();
      showNotice('Bagian halaman website dihapus.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus bagian halaman.');
    }
  }

  // Tracks CRUD
  function startEditTrack(t: Track) {
    setEditingTrackId(t.id);
    setTrackForm({
      title: t.title,
      album: t.album,
      year: t.year,
      bpm: t.bpm,
      musicalKey: t.musicalKey,
      durationSec: t.durationSec || 26,
      audioUrl: t.audioUrl ?? '',
      coverUrl: t.coverUrl,
      credits: t.credits,
      lyrics: t.lyrics,
    });
  }

  function resetTrackForm() {
    setEditingTrackId(null);
    setTrackForm({
      title: '',
      album: 'Rasmalas Audio',
      year: '2026',
      bpm: 76,
      musicalKey: 'Am',
      durationSec: 26,
      audioUrl: '',
      coverUrl: '/src/assets/images/album_cover_senja_1794832345337.jpg',
      credits: 'Rasmalas',
      lyrics: '',
    });
  }

  async function handleSaveTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackForm.title.trim()) return;
    setSaving(true);
    try {
      const resolvedDuration = Math.max(1, Math.round(trackForm.durationSec || 26));
      if (backendMode === 'supabase') {
        const existing = editingTrackId
          ? bandState.tracks.find((t) => t.id === editingTrackId)
          : undefined;
        await sbUpsertTrack({
          id: existing?.id ?? `trk-${Date.now().toString(36)}`,
          title: trackForm.title.trim(),
          album: trackForm.album.trim() || 'Rasmalas Audio',
          year: trackForm.year.trim() || '2026',
          durationSec: resolvedDuration,
          bpm: Number(trackForm.bpm) || 76,
          musicalKey: trackForm.musicalKey.trim() || 'Am',
          synthSeed: existing?.synthSeed ?? bandState.tracks.length + 1,
          coverUrl:
            trackForm.coverUrl.trim() ||
            '/src/assets/images/album_cover_senja_1794832345337.jpg',
          audioUrl: trackForm.audioUrl.trim() || undefined,
          plays: existing?.plays ?? 0,
          credits: trackForm.credits.trim() || 'Rasmalas',
          lyrics: trackForm.lyrics.trim(),
        });
      } else {
        const url = editingTrackId
          ? `/api/admin/tracks/${editingTrackId}`
          : '/api/admin/tracks';
        const method = editingTrackId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: buildHeaders(),
          body: JSON.stringify({
            ...trackForm,
            bpm: Number(trackForm.bpm) || 76,
            audioUrl: trackForm.audioUrl.trim() || undefined,
            durationSec: resolvedDuration,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan lagu.');
      }
      resetTrackForm();
      await onRefreshState();
      showNotice(
        editingTrackId
          ? 'Detail lagu berhasil diperbarui.'
          : 'Lagu baru ditambahkan ke pemutar streaming.'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menyimpan lagu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTrack(id: string) {
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        await sbDeleteTrack(id);
      } else {
        const res = await fetch(`/api/admin/tracks/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        if (!res.ok) throw new Error('Gagal menghapus lagu.');
      }
      if (editingTrackId === id) resetTrackForm();
      await onRefreshState();
      showNotice('Lagu dihapus dari katalog.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus lagu.');
    } finally {
      setSaving(false);
    }
  }

  // Tours CRUD
  function startEditTour(t: TourDate) {
    setEditingTourId(t.id);
    setTourForm({
      date: t.date,
      city: t.city,
      country: t.country,
      venue: t.venue,
      stageTime: t.stageTime,
      priceLabel: t.priceLabel,
      status: normalizeTourStatus(t.date, t.status),
      ticketUrl: t.ticketUrl,
      notes: t.notes ?? '',
    });
  }

  function resetTourForm() {
    setEditingTourId(null);
    setTourForm({
      date: '2027-02-14',
      city: '',
      country: 'Indonesia',
      venue: '',
      stageTime: '20:00 WIB',
      priceLabel: 'Rp 150.000',
      status: 'Tersedia',
      ticketUrl: '#jadwal',
      notes: '',
    });
  }

  async function handleSaveTour(e: FormEvent) {
    e.preventDefault();
    if (!tourForm.city.trim() || !tourForm.venue.trim()) return;
    const resolvedStatus = normalizeTourStatus(tourForm.date.trim(), tourForm.status);
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        const existing = editingTourId
          ? bandState.tours.find((t) => t.id === editingTourId)
          : undefined;
        await sbUpsertTour({
          id: existing?.id ?? `tour-${Date.now().toString(36)}`,
          date: tourForm.date.trim(),
          city: tourForm.city.trim(),
          country: tourForm.country.trim() || 'Indonesia',
          venue: tourForm.venue.trim(),
          stageTime: tourForm.stageTime.trim() || '20:00 WIB',
          priceLabel: tourForm.priceLabel.trim() || 'Rp 150.000',
          status: resolvedStatus,
          ticketUrl: tourForm.ticketUrl.trim() || '#jadwal',
          rsvpCount: existing?.rsvpCount ?? 0,
          notes: tourForm.notes.trim() || undefined,
        });
      } else {
        const url = editingTourId
          ? `/api/admin/tours/${editingTourId}`
          : '/api/admin/tours';
        const method = editingTourId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: buildHeaders(),
          body: JSON.stringify({ ...tourForm, status: resolvedStatus }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan jadwal.');
      }
      resetTourForm();
      await onRefreshState();
      showNotice(
        editingTourId ? 'Jadwal diperbarui.' : 'Jadwal baru dipublikasikan.'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickTourStatus(id: string, status: TourStatus) {
    try {
      const existing = bandState.tours.find((t) => t.id === id);
      const nextStatus = existing ? normalizeTourStatus(existing.date, status) : status;
      if (backendMode === 'supabase') {
        if (!existing) throw new Error('Jadwal tidak ditemukan.');
        await sbUpsertTour({ ...existing, status: nextStatus });
      } else {
        const res = await fetch(`/api/admin/tours/${id}`, {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error('Gagal mengubah status jadwal.');
      }
      await onRefreshState();
      showNotice(
        existing && isTourDatePast(existing.date)
          ? 'Tanggal sudah lewat, status otomatis menjadi Selesai.'
          : 'Status tiket diperbarui real-time.'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal mengubah status jadwal.');
    }
  }

  async function handleDeleteTour(id: string) {
    try {
      if (backendMode === 'supabase') {
        await sbDeleteTour(id);
      } else {
        const res = await fetch(`/api/admin/tours/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        if (!res.ok) throw new Error('Gagal menghapus jadwal.');
      }
      if (editingTourId === id) resetTourForm();
      await onRefreshState();
      showNotice('Jadwal dihapus.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus jadwal.');
    }
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'brand', 'logo');
    if (uploaded) {
      setProfileForm((prev) => ({ ...prev, logoUrl: uploaded.url }));
      showNotice('Logo band berhasil diunggah. Klik Simpan Perubahan Profil.');
    }
  }

  async function handleTrackCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'covers', 'cover');
    if (uploaded) {
      setTrackForm((prev) => ({ ...prev, coverUrl: uploaded.url }));
      showNotice('Sampul album berhasil diunggah.');
    }
  }

  async function handleTrackAudioUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const detectedDuration = await new Promise<number>((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const probe = new Audio(objectUrl);
      probe.onloadedmetadata = () => {
        const sec = Number.isFinite(probe.duration) ? Math.round(probe.duration) : 26;
        URL.revokeObjectURL(objectUrl);
        resolve(Math.max(1, sec));
      };
      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(26);
      };
    });

    const uploaded = await uploadMediaFile(file, 'audio', 'audio');
    if (uploaded) {
      setTrackForm((prev) => ({
        ...prev,
        audioUrl: uploaded.url,
        durationSec: detectedDuration,
      }));
      showNotice('File audio lagu berhasil diunggah.');
    }
  }

  // Gallery CRUD
  async function handleGalleryMediaUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'gallery', 'gallery');
    if (uploaded) {
      setPhotoForm((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        mediaType: uploaded.mediaType === 'video' ? 'video' : 'image',
      }));
      showNotice(
        uploaded.mediaType === 'video'
          ? 'Video berhasil diunggah. Lengkapi judul lalu simpan.'
          : 'Foto berhasil diunggah. Lengkapi judul lalu simpan.'
      );
    }
  }

  function startEditPhoto(p: GalleryPhoto) {
    setEditingPhotoId(p.id);
    setPhotoForm({
      title: p.title,
      category: p.category,
      imageUrl: p.imageUrl,
      mediaType:
        p.mediaType === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(p.imageUrl)
          ? 'video'
          : 'image',
      location: p.location,
      dateLabel: p.dateLabel,
      photographer: p.photographer,
      featured: Boolean(p.featured),
    });
  }

  function resetPhotoForm() {
    setEditingPhotoId(null);
    setPhotoForm({
      title: '',
      category: 'Panggung',
      imageUrl: '',
      mediaType: 'image',
      location: '',
      dateLabel: 'November 2026',
      photographer: 'Tim Rasmalas',
      featured: false,
    });
  }

  async function handleSavePhoto(e: FormEvent) {
    e.preventDefault();
    if (!photoForm.title.trim() || !photoForm.imageUrl.trim()) {
      showError('Judul dokumentasi dan unggahan foto/video wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        const photo: GalleryPhoto = {
          id: editingPhotoId ?? `gal-${Date.now().toString(36)}`,
          title: photoForm.title.trim(),
          category: photoForm.category,
          imageUrl: photoForm.imageUrl.trim(),
          mediaType: photoForm.mediaType,
          location: photoForm.location.trim() || 'Indonesia',
          dateLabel: photoForm.dateLabel.trim() || '2026',
          photographer: photoForm.photographer.trim() || 'Tim Rasmalas',
          featured: Boolean(photoForm.featured),
        };
        await sbUpsertGalleryPhoto(photo, Boolean(photoForm.featured));
      } else {
        const url = editingPhotoId
          ? `/api/admin/gallery/${editingPhotoId}`
          : '/api/admin/gallery';
        const method = editingPhotoId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: buildHeaders(),
          body: JSON.stringify(photoForm),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan media galeri.');
      }
      resetPhotoForm();
      await onRefreshState();
      showNotice(
        editingPhotoId
          ? 'Media galeri diperbarui.'
          : 'Foto/video baru ditambahkan ke galeri.'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menyimpan media galeri.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto(id: string) {
    try {
      if (backendMode === 'supabase') {
        await sbDeleteGalleryPhoto(id);
      } else {
        const res = await fetch(`/api/admin/gallery/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        if (!res.ok) throw new Error('Gagal menghapus media.');
      }
      if (editingPhotoId === id) resetPhotoForm();
      await onRefreshState();
      showNotice('Media dihapus dari galeri.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus media.');
    }
  }

  // Social CRUD
  async function handleSocialMediaUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadMediaFile(file, 'social', 'social');
    if (uploaded) {
      setPostMediaUrl(uploaded.url);
      setPostMediaType(uploaded.mediaType === 'video' ? 'video' : 'image');
      showNotice(
        uploaded.mediaType === 'video'
          ? 'Video lampiran sosial berhasil diunggah.'
          : 'Foto lampiran sosial berhasil diunggah.'
      );
    }
  }

  async function saveChannelsList(nextChannels: SocialChannel[], successMsg: string) {
    setSaving(true);
    try {
      if (backendMode === 'supabase') {
        await sbSaveSocialChannels(nextChannels);
      } else {
        const res = await fetch('/api/admin/social/channels', {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({ channels: nextChannels }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kanal resmi.');
      }
      setChannelsForm(nextChannels);
      await onRefreshState();
      showNotice(successMsg);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal memperbarui kanal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveChannels() {
    await saveChannelsList(channelsForm, 'Kanal media sosial & footer diperbarui secara real-time.');
  }

  async function handleAddChannel(e: FormEvent) {
    e.preventDefault();
    const platformName = newChannelForm.platform.trim();
    if (!platformName) {
      showError('Nama kanal / platform wajib diisi (mis. Instagram, WhatsApp, SoundCloud).');
      return;
    }
    const duplicate = channelsForm.some(
      (c) => c.platform.toLowerCase() === platformName.toLowerCase()
    );
    if (duplicate) {
      showError(`Kanal "${platformName}" sudah ada. Edit langsung di daftar.`);
      return;
    }
    const created: SocialChannel = {
      platform: platformName,
      handle: newChannelForm.handle.trim() || `@${platformName.toLowerCase().replace(/\s+/g, '')}`,
      followersLabel: newChannelForm.followersLabel.trim() || 'Kanal Resmi',
      url: newChannelForm.url.trim() || 'https://instagram.com',
      connected: true,
    };
    const next = [...channelsForm, created];
    setNewChannelForm({ platform: '', handle: '', followersLabel: '', url: '' });
    await saveChannelsList(next, `Kanal "${platformName}" berhasil ditambahkan.`);
  }

  async function handleDeleteChannel(platformName: string) {
    const next = channelsForm.filter((c) => c.platform !== platformName);
    await saveChannelsList(next, `Kanal "${platformName}" dihapus dari footer & media sosial.`);
  }

  function startEditFooterLink(link: FooterLink) {
    setEditingFooterLinkId(link.id);
    setFooterLinkForm({ label: link.label, url: link.url });
  }

  function resetFooterLinkForm() {
    setEditingFooterLinkId(null);
    setFooterLinkForm({ label: '', url: '' });
  }

  function handleSaveFooterLink(e: FormEvent) {
    e.preventDefault();
    const label = footerLinkForm.label.trim();
    const url = footerLinkForm.url.trim();
    if (!label || !url) {
      showError('Label tautan dan URL tujuan wajib diisi.');
      return;
    }
    const existingLinks = profileForm.footerLinks ?? [];
    const nextLinks: FooterLink[] = editingFooterLinkId
      ? existingLinks.map((l) =>
          l.id === editingFooterLinkId ? { ...l, label, url } : l
        )
      : [...existingLinks, { id: `fl-${Date.now().toString(36)}`, label, url }];
    const updatedProfile: BandProfile = { ...profileForm, footerLinks: nextLinks };
    setProfileForm(updatedProfile);
    resetFooterLinkForm();
    void saveProfilePayload(
      updatedProfile,
      editingFooterLinkId
        ? 'Tautan footer berhasil diperbarui.'
        : 'Tautan footer baru berhasil ditambahkan.'
    );
  }

  function handleDeleteFooterLink(id: string) {
    const nextLinks = (profileForm.footerLinks ?? []).filter((l) => l.id !== id);
    const updatedProfile: BandProfile = { ...profileForm, footerLinks: nextLinks };
    setProfileForm(updatedProfile);
    if (editingFooterLinkId === id) resetFooterLinkForm();
    void saveProfilePayload(updatedProfile, 'Tautan footer dihapus.');
  }

  function resetSocialPostForm() {
    setEditingPostId(null);
    setEditingPostLikes(0);
    setEditingPostCreatedAt(null);
    setPostAuthorHandle('');
    setPostContent('');
    setPostMediaUrl('');
    setPostMediaType('image');
    setPostExternalUrl('');
  }

  function startEditSocialPost(post: SocialPost) {
    setEditingPostId(post.id);
    setEditingPostLikes(post.likes ?? 0);
    setEditingPostCreatedAt(post.createdAt || null);
    setPostPlatform(post.platform);
    setPostAuthorHandle(post.authorHandle || '');
    setPostContent(post.content);
    setPostMediaUrl(post.mediaUrl ?? '');
    setPostMediaType(post.mediaType === 'video' ? 'video' : 'image');
    setPostExternalUrl(post.externalUrl ?? '');
    socialPostFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handlePublishSocialPost(e: FormEvent) {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSaving(true);
    const isEditing = Boolean(editingPostId);
    const channel = bandState.socialChannels.find((c) => c.platform === postPlatform);
    const resolvedHandle =
      postAuthorHandle.trim() || channel?.handle || '@rasmalas.official';
    const resolvedExternalUrl = postExternalUrl.trim() || (isEditing ? undefined : channel?.url);

    try {
      if (backendMode === 'supabase') {
        const post: SocialPost = {
          id: editingPostId ?? `soc-${Date.now().toString(36)}`,
          platform: postPlatform,
          authorHandle: resolvedHandle,
          content: postContent.trim(),
          mediaUrl: postMediaUrl.trim() || undefined,
          mediaType: postMediaUrl.trim() ? postMediaType : undefined,
          externalUrl: resolvedExternalUrl,
          likes: isEditing ? editingPostLikes : 0,
          createdAt: isEditing
            ? editingPostCreatedAt || new Date().toISOString()
            : new Date().toISOString(),
        };
        await sbInsertSocialPost(post);
      } else if (editingPostId) {
        const res = await fetch(`/api/admin/social/posts/${editingPostId}`, {
          method: 'PUT',
          headers: buildHeaders(),
          body: JSON.stringify({
            platform: postPlatform,
            authorHandle: resolvedHandle,
            content: postContent.trim(),
            mediaUrl: postMediaUrl.trim() || undefined,
            mediaType: postMediaUrl.trim() ? postMediaType : undefined,
            externalUrl: resolvedExternalUrl,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui postingan.');
      } else {
        const res = await fetch('/api/admin/social/posts', {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            platform: postPlatform,
            authorHandle: resolvedHandle,
            content: postContent.trim(),
            mediaUrl: postMediaUrl.trim() || undefined,
            mediaType: postMediaUrl.trim() ? postMediaType : undefined,
            externalUrl: resolvedExternalUrl,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Gagal menyiarkan pembaruan.');
      }
      resetSocialPostForm();
      await onRefreshState();
      showNotice(
        isEditing
          ? 'Postingan media sosial berhasil diperbarui.'
          : 'Postingan media sosial baru langsung tampil di halaman publik.'
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Gagal memperbarui postingan.'
            : 'Gagal menyiarkan pembaruan.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSocialPost(id: string) {
    try {
      if (backendMode === 'supabase') {
        await sbDeleteSocialPost(id);
      } else {
        const res = await fetch(`/api/admin/social/posts/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        if (!res.ok) throw new Error('Gagal menghapus postingan.');
      }
      if (editingPostId === id) resetSocialPostForm();
      await onRefreshState();
      showNotice('Postingan media sosial dihapus.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus postingan.');
    }
  }

  async function handleDeleteShoutout(id: string) {
    try {
      if (backendMode === 'supabase') {
        await sbDeleteShoutout(id);
      } else {
        const res = await fetch(`/api/admin/social/shoutouts/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(),
        });
        if (!res.ok) throw new Error('Gagal menghapus sapaan.');
      }
      await onRefreshState();
      showNotice('Sapaan pendengar dihapus.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus sapaan.');
    }
  }

  const normalizedTours = useMemo(
    () =>
      bandState.tours.map((t) => ({
        ...t,
        status: normalizeTourStatus(t.date, t.status),
      })),
    [bandState.tours]
  );

  const totalPlays = bandState.tracks.reduce((acc, t) => acc + t.plays, 0);
  const upcomingTours = normalizedTours.filter((t) => t.status !== 'Selesai');
  const totalLikes = bandState.socialPosts.reduce((acc, p) => acc + p.likes, 0);

  const filteredTracks = useMemo(() => {
    const q = trackSearch.trim().toLowerCase();
    if (!q) return bandState.tracks;
    return bandState.tracks.filter((t) => t.title.toLowerCase().includes(q));
  }, [bandState.tracks, trackSearch]);

  const filteredTours = useMemo(() => {
    if (tourFilter === 'upcoming') return normalizedTours.filter((t) => t.status !== 'Selesai');
    if (tourFilter === 'past') return normalizedTours.filter((t) => t.status === 'Selesai');
    return normalizedTours;
  }, [normalizedTours, tourFilter]);

  const filteredPhotos = useMemo(() => {
    if (galleryFilter === 'Semua') return bandState.gallery;
    return bandState.gallery.filter((p) => p.category === galleryFilter);
  }, [bandState.gallery, galleryFilter]);

  // 1. Dedicated Full-Screen Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="h-[3px] w-full reggae-hairline" aria-hidden="true" />
        <header className="px-6 py-4 border-b border-[#2A3024] bg-[#0B0D09]/75 backdrop-blur-md">
          <div className="mx-auto max-w-[1200px] flex items-center justify-between gap-4">
            {bandState.profile.logoUrl ? (
              <span className="inline-block h-9 w-32 overflow-hidden">
                <img
                  src={resolveAssetUrl(bandState.profile.logoUrl)}
                  alt={bandState.profile.name}
                  className="h-full w-full object-cover object-center scale-[1.15]"
                />
              </span>
            ) : (
              <span className="font-display text-lg font-bold text-[#F5F2EB]">
                {bandState.profile.name}
              </span>
            )}
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-medium text-[#D6CFC2] border border-[#2A3024] bg-[#12150F]/80 rounded-lg hover:text-[#F5F2EB] hover:border-[#EAB308] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Kembali ke Website
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3024] bg-[#11140E]/90 backdrop-blur-md overflow-hidden">
            <div className="h-[3px] w-full reggae-hairline" aria-hidden="true" />
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#EAB308]">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>Akses Manajemen Studio</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-[#F5F2EB]">
                  Masuk Dashboard Admin
                </h1>
              </div>

              {!showResetForm ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="dash-email" className="block text-xs font-medium text-[#D6CFC2]">
                      Email atau Username Admin
                    </label>
                    <input
                      id="dash-email"
                      type="text"
                      required
                      autoComplete="username"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="dash-password"
                      className="block text-xs font-medium text-[#D6CFC2]"
                    >
                      Kata Sandi
                    </label>
                    <input
                      id="dash-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  {authError && (
                    <p role="alert" className="text-xs text-[#FCA5A5]">
                      {authError}
                    </p>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={authBusy}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-sm font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                    >
                      {authBusy ? 'Memverifikasi...' : 'Buka Dashboard'}
                    </button>

                    {backendMode === 'supabase' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetForm(true);
                          setResetFeedback(null);
                          setResetLoginInput(emailInput);
                        }}
                        className="text-xs font-medium text-[#EAB308] hover:text-[#FACC15] hover:underline cursor-pointer"
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSendLoginResetEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="dash-reset-login"
                      className="block text-xs font-medium text-[#D6CFC2]"
                    >
                      Email atau Username Admin untuk Reset Kata Sandi
                    </label>
                    <input
                      id="dash-reset-login"
                      type="text"
                      required
                      value={resetLoginInput}
                      onChange={(e) => setResetLoginInput(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  {resetFeedback && (
                    <p
                      role="alert"
                      className={`text-xs ${
                        resetFeedback.type === 'success' ? 'text-[#4ADE80]' : 'text-[#FCA5A5]'
                      }`}
                    >
                      {resetFeedback.message}
                    </p>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-sm font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                    >
                      {resetBusy ? 'Mengirim...' : 'Kirim Tautan Reset'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetFeedback(null);
                      }}
                      className="text-xs font-medium text-[#D6CFC2] hover:text-[#F5F2EB] hover:underline cursor-pointer"
                    >
                      Kembali ke Login
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Full-Featured Authenticated Admin Dashboard
  const navGroups: {
    group: string;
    items: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[];
  }[] = [
    {
      group: 'Utama',
      items: [{ id: 'overview', label: 'Ringkasan', icon: LayoutDashboard }],
    },
    {
      group: 'Konten Band',
      items: [
        { id: 'profile', label: 'Profil & Personel', icon: User },
        { id: 'tracks', label: 'Musik & Audio', icon: Disc3 },
        { id: 'tours', label: 'Jadwal Panggung', icon: Calendar },
        { id: 'gallery', label: 'Galeri Media', icon: Camera },
        { id: 'social', label: 'Media Sosial', icon: Share2 },
      ],
    },
    {
      group: 'Tampilan & Akun',
      items: [
        { id: 'pages', label: 'Halaman Website', icon: Layers },
        { id: 'footer', label: 'Footer Website', icon: PanelBottom },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090B08]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        aria-label="Navigasi dashboard admin"
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-[#2A3024] bg-[#0B0E0A] flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-[3px] w-full reggae-hairline shrink-0" aria-hidden="true" />
        <div className="px-5 py-4 border-b border-[#2A3024] flex items-center justify-between gap-2">
          <div className="min-w-0">
            {bandState.profile.logoUrl ? (
              <span className="inline-block h-7 w-24 overflow-hidden">
                <img
                  src={resolveAssetUrl(bandState.profile.logoUrl)}
                  alt={bandState.profile.name}
                  className="h-full w-full object-cover object-center scale-[1.15]"
                />
              </span>
            ) : (
              <p className="font-display text-base font-bold text-[#F5F2EB] truncate">
                {bandState.profile.name}
              </p>
            )}
            <p className="text-[11px] font-medium text-[#EAB308]">Dashboard Admin</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
            className="lg:hidden min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F5F2EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#6E675B]">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                      active
                        ? 'bg-[#EAB308] text-[#090B08] font-semibold'
                        : 'text-[#D6CFC2] hover:bg-[#161B14] hover:text-[#F5F2EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#2A3024] space-y-2 bg-[#090B08]/60">
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-[#F5F2EB] truncate">
              {adminFullName || adminUsername || 'Admin'}
            </p>
            <p className="text-[11px] text-[#A8A092] truncate">
              {adminEmail || 'admin@rasmalas.id'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 text-xs font-medium text-[#F5F2EB] border border-[#2A3024] bg-[#121610] rounded-lg hover:border-[#EAB308] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Website</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 text-xs font-medium text-[#FCA5A5] border border-[#2A3024] bg-[#121610] rounded-lg hover:bg-[#2A1515] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-[#2A3024] bg-[#0B0E0A]/90 backdrop-blur-md px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu dashboard"
              className="lg:hidden min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-[#2A3024] text-[#F5F2EB]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm text-[#A8A092] truncate">
              <span>Admin</span>
              <span className="mx-2 text-[#4A5240]" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-[#F5F2EB]">
                {SECTION_LABELS[section]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToSite}
            className="min-h-[36px] px-3.5 py-1.5 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Lihat Website
          </button>
        </header>

        {(notice || errorMsg) && (
          <div
            role="status"
            className={`px-6 py-2.5 text-xs font-medium border-b border-[#2A3024] ${
              errorMsg ? 'bg-[#2B1212] text-[#FCA5A5]' : 'bg-[#102819] text-[#86EFAC]'
            }`}
          >
            {errorMsg || notice}
          </div>
        )}

        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* SECTION 1: OVERVIEW */}
          {section === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-[#F5F2EB]">
                  Ringkasan Konten Band
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Statistik konten aktif dan pintasan pengelolaan untuk {bandState.profile.name}.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSection('tracks')}
                  className="text-left rounded-xl border border-[#2A3024] bg-[#11150F] p-4 hover:border-[#EAB308]/50 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-[#A8A092]">Lagu Streaming</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#F5F2EB]">
                    {bandState.tracks.length}
                  </p>
                  <p className="mt-1 text-[11px] font-mono tabular-nums text-[#4ADE80]">
                    {totalPlays.toLocaleString('id-ID')} total putar
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSection('tours')}
                  className="text-left rounded-xl border border-[#2A3024] bg-[#11150F] p-4 hover:border-[#EAB308]/50 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-[#A8A092]">Jadwal Aktif</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#F5F2EB]">
                    {upcomingTours.length}
                  </p>
                  <p className="mt-1 text-[11px] font-mono tabular-nums text-[#EAB308]">
                    Dari {bandState.tours.length} jadwal panggung
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSection('gallery')}
                  className="text-left rounded-xl border border-[#2A3024] bg-[#11150F] p-4 hover:border-[#EAB308]/50 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-[#A8A092]">Galeri Media</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#F5F2EB]">
                    {bandState.gallery.length}
                  </p>
                  <p className="mt-1 text-[11px] text-[#D6CFC2]">
                    Foto &amp; video dokumentasi
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSection('social')}
                  className="text-left rounded-xl border border-[#2A3024] bg-[#11150F] p-4 hover:border-[#EAB308]/50 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-[#A8A092]">Sosial &amp; Sapaan</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#F5F2EB]">
                    {bandState.socialPosts.length + bandState.shoutouts.length}
                  </p>
                  <p className="mt-1 text-[11px] font-mono tabular-nums text-[#D6CFC2]">
                    {totalLikes.toLocaleString('id-ID')} suka · {bandState.shoutouts.length} sapaan
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3.5">
                  <h2 className="text-sm font-semibold text-[#F5F2EB]">
                    Pintasan Kelola Konten
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSection('profile')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Profil &amp; Personel</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Identitas, hero &amp; anggota</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('tracks')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Musik &amp; Audio</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Unggah lagu &amp; lirik</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('tours')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Jadwal Panggung</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Kota, venue &amp; status</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('gallery')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Galeri Media</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Foto &amp; video panggung</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('pages')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Halaman Website</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Susunan &amp; seksi kustom</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('footer')}
                      className="p-3 text-left rounded-lg border border-[#2A3024] bg-[#090B08] hover:border-[#EAB308] transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#F5F2EB]">Footer Website</p>
                      <p className="text-[11px] text-[#A8A092] mt-0.5">Hak cipta &amp; tautan</p>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Jadwal Terdekat
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('tours')}
                      className="text-xs text-[#EAB308] hover:underline cursor-pointer"
                    >
                      Kelola Semua
                    </button>
                  </div>
                  <div className="divide-y divide-[#2A3024]">
                    {upcomingTours.length === 0 ? (
                      <p className="py-4 text-xs text-[#A8A092]">
                        Belum ada jadwal aktif terdekat.
                      </p>
                    ) : (
                      upcomingTours.slice(0, 4).map((t) => (
                        <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F5F2EB] truncate">
                              {t.venue}
                            </p>
                            <p className="text-[11px] text-[#A8A092]">
                              {t.city} · <span className="font-mono">{t.date}</span>
                            </p>
                          </div>
                          <span className="text-xs font-medium text-[#EAB308] shrink-0">
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1B: HALAMAN WEBSITE */}
          {section === 'pages' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Struktur &amp; Bagian Halaman Website
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Atur urutan tampil, sembunyikan bagian, atau tambahkan bagian kustom baru di halaman utama.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Tambah / Edit Bagian */}
                <form
                  onSubmit={handleSaveSection}
                  className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      {editingSectionId
                        ? `Edit Bagian: ${sectionForm.navLabel || 'Bagian'}`
                        : 'Tambah Bagian Kustom'}
                    </h2>
                    {editingSectionId && (
                      <button
                        type="button"
                        onClick={resetSectionForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Nama Menu Navigasi *
                      </label>
                      <input
                        type="text"
                        required
                        value={sectionForm.navLabel}
                        onChange={(e) =>
                          setSectionForm({ ...sectionForm, navLabel: e.target.value })
                        }
                        placeholder="Contoh: Merchandise"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Judul Bagian Halaman *
                      </label>
                      <input
                        type="text"
                        required
                        value={sectionForm.title}
                        onChange={(e) =>
                          setSectionForm({ ...sectionForm, title: e.target.value })
                        }
                        placeholder="Judul utama bagian"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Subjudul / Deskripsi Singkat
                      </label>
                      <input
                        type="text"
                        value={sectionForm.subtitle}
                        onChange={(e) =>
                          setSectionForm({ ...sectionForm, subtitle: e.target.value })
                        }
                        placeholder="Penjelasan singkat (opsional)"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>

                    {!editingSectionBuiltinKey && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                            Isi Konten Lengkap
                          </label>
                          <textarea
                            rows={3}
                            value={sectionForm.body}
                            onChange={(e) =>
                              setSectionForm({ ...sectionForm, body: e.target.value })
                            }
                            placeholder="Isi informasi bagian..."
                            className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-semibold bg-[#090B08] border border-[#2A3024] text-[#F5F2EB] rounded-lg hover:border-[#EAB308] cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                            {uploadingTarget === 'section'
                              ? 'Mengunggah...'
                              : sectionForm.imageUrl
                                ? 'Ganti Media'
                                : 'Unggah Foto / Video'}
                            <input
                              type="file"
                              accept="image/*,video/mp4,video/webm,video/quicktime"
                              disabled={uploadingTarget === 'section'}
                              onChange={handleSectionMediaUpload}
                              className="sr-only"
                            />
                          </label>
                          {sectionForm.imageUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSectionForm((prev) => ({
                                  ...prev,
                                  imageUrl: '',
                                  mediaType: 'image',
                                }))
                              }
                              className="text-xs text-[#FCA5A5] hover:underline cursor-pointer"
                            >
                              Hapus Media
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                              Teks Tombol
                            </label>
                            <input
                              type="text"
                              value={sectionForm.ctaLabel}
                              onChange={(e) =>
                                setSectionForm({ ...sectionForm, ctaLabel: e.target.value })
                              }
                              placeholder="Hubungi Kami"
                              className="w-full min-h-[36px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                              Tautan Tombol
                            </label>
                            <input
                              type="text"
                              value={sectionForm.ctaUrl}
                              onChange={(e) =>
                                setSectionForm({ ...sectionForm, ctaUrl: e.target.value })
                              }
                              placeholder="https://..."
                              className="w-full min-h-[36px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-xs text-[#D6CFC2] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sectionForm.visible}
                          onChange={(e) =>
                            setSectionForm({ ...sectionForm, visible: e.target.checked })
                          }
                          className="accent-[#EAB308]"
                        />
                        Tampilkan di halaman website
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[#D6CFC2] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sectionForm.showInNav}
                          onChange={(e) =>
                            setSectionForm({ ...sectionForm, showInNav: e.target.checked })
                          }
                          className="accent-[#EAB308]"
                        />
                        Tampilkan di menu navigasi &amp; footer
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || uploadingTarget === 'section'}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                  >
                    {editingSectionId ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    )}
                    {editingSectionId ? 'Simpan Perubahan' : 'Tambah Bagian'}
                  </button>
                </form>

                {/* Right Column: Daftar Susunan Bagian Website */}
                <div className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#2A3024] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Urutan Bagian Halaman ({bandState.siteSections?.length ?? 0})
                    </h2>
                    <span className="text-[11px] text-[#A8A092]">
                      Atur urutan tampil
                    </span>
                  </div>

                  <div className="divide-y divide-[#2A3024]">
                    {[...(bandState.siteSections ?? [])]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((sec, idx, arr) => (
                        <div
                          key={sec.id}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#171C14]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[#EAB308]">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-[#F5F2EB]">
                                {sec.navLabel}
                              </span>
                              <span className="text-[11px] text-[#A8A092]">
                                · {sec.builtinKey ? 'Bawaan' : 'Kustom'}
                              </span>
                              {!sec.visible && (
                                <span className="text-[11px] text-[#FCA5A5]">
                                  · Tersembunyi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A8A092] truncate mt-0.5">{sec.title}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => void handleMoveSection(idx, -1)}
                              aria-label={`Geser ${sec.navLabel} ke atas`}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#2A3024] text-[#D6CFC2] hover:text-[#EAB308] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => void handleMoveSection(idx, 1)}
                              aria-label={`Geser ${sec.navLabel} ke bawah`}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#2A3024] text-[#D6CFC2] hover:text-[#EAB308] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleSectionVisible(sec)}
                              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-[#2A3024] text-xs text-[#D6CFC2] hover:border-[#EAB308] cursor-pointer"
                            >
                              {sec.visible ? (
                                <Eye className="w-3.5 h-3.5 text-[#4ADE80]" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-[#A8A092]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditSection(sec)}
                              aria-label={`Edit bagian ${sec.navLabel}`}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#2A3024] text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteSectionId === sec.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteSection(sec.id)}
                                  className="h-8 px-2.5 text-[11px] font-semibold bg-[#7F1D1D] text-[#FEE2E2] rounded-lg hover:bg-[#991B1B] cursor-pointer"
                                >
                                  Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSectionId(null)}
                                  className="h-8 px-2 text-[11px] text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSectionId(sec.id)}
                                aria-label={`Hapus bagian ${sec.navLabel}`}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#2A3024] text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1C: FOOTER WEBSITE */}
          {section === 'footer' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Pengaturan Footer Website
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Kelola informasi deskripsi, lokasi, hak cipta, dan tautan navigasi di bagian bawah website.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Teks, Kontak & Hak Cipta Footer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveProfilePayload(
                      profileForm,
                      'Konten footer website diperbarui secara real-time.'
                    );
                  }}
                  className="lg:col-span-6 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4"
                >
                  <h2 className="text-sm font-semibold text-[#F5F2EB]">
                    Informasi &amp; Hak Cipta Footer
                  </h2>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Tagline Singkat Footer
                    </label>
                    <input
                      type="text"
                      value={profileForm.footerNote}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, footerNote: e.target.value })
                      }
                      placeholder="Contoh: Roots Reggae & Analog Dub"
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-xs font-medium text-[#D6CFC2]">
                        Deskripsi Singkat di Footer
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            footerDescription: `${profileForm.footerNote ? `${profileForm.footerNote} — ` : ''}${profileForm.subheadline}`,
                          })
                        }
                        className="text-[11px] text-[#EAB308] hover:underline cursor-pointer"
                      >
                        Isi dari Subjudul
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={
                        profileForm.footerDescription !== undefined
                          ? profileForm.footerDescription
                          : `${profileForm.footerNote ? `${profileForm.footerNote} — ` : ''}${profileForm.subheadline}`
                      }
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, footerDescription: e.target.value })
                      }
                      placeholder="Deskripsi singkat di footer..."
                      className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Lokasi / Kota Basis
                      </label>
                      <input
                        type="text"
                        value={profileForm.originCity}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, originCity: e.target.value })
                        }
                        placeholder="Denpasar & Yogyakarta"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Email Kontak / Booking
                      </label>
                      <input
                        type="text"
                        value={profileForm.bookingEmail}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, bookingEmail: e.target.value })
                        }
                        placeholder="booking@rasmalas.id"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Teks Hak Cipta Bawah (Copyright)
                    </label>
                    <input
                      type="text"
                      value={
                        profileForm.footerCopyright !== undefined
                          ? profileForm.footerCopyright
                          : `© ${new Date().getFullYear()} ${profileForm.name}. ${profileForm.footerNote || 'Roots Reggae & Analog Dub'}.`
                      }
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, footerCopyright: e.target.value })
                      }
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    {saving ? 'Menyimpan...' : 'Simpan Teks Footer'}
                  </button>
                </form>

                {/* Right Column: Navigasi & Tautan Kustom Footer */}
                <div className="lg:col-span-6 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-[#F5F2EB]">
                    Tautan Navigasi &amp; Link Kustom Footer
                  </h2>

                  <div className="space-y-2">
                    <p className="text-xs text-[#A8A092]">
                      Klik untuk menampilkan/menyembunyikan bagian halaman di navigasi footer:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...(bandState.siteSections ?? [])]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => void handleToggleSectionNav(sec)}
                            className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                              sec.showInNav && sec.visible
                                ? 'border-[#EAB308]/60 bg-[#292310]/60 text-[#F5F2EB]'
                                : 'border-[#2A3024] bg-[#090B08] text-[#787166]'
                            }`}
                          >
                            {sec.showInNav && sec.visible ? (
                              <Eye className="w-3.5 h-3.5 text-[#4ADE80]" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                            <span>{sec.navLabel}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveFooterLink}
                    className="pt-3 border-t border-[#2A3024] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#D6CFC2]">
                        {editingFooterLinkId ? 'Edit Tautan Kustom' : 'Tambah Tautan Kustom'}
                      </p>
                      {editingFooterLinkId && (
                        <button
                          type="button"
                          onClick={resetFooterLinkForm}
                          className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        required
                        value={footerLinkForm.label}
                        onChange={(e) =>
                          setFooterLinkForm({ ...footerLinkForm, label: e.target.value })
                        }
                        placeholder="Label (mis. Press Kit)"
                        className="sm:col-span-4 min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <input
                        type="text"
                        required
                        value={footerLinkForm.url}
                        onChange={(e) =>
                          setFooterLinkForm({ ...footerLinkForm, url: e.target.value })
                        }
                        placeholder="https://..."
                        className="sm:col-span-5 min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                      >
                        {editingFooterLinkId ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                        {editingFooterLinkId ? 'Simpan' : 'Tambah'}
                      </button>
                    </div>
                  </form>

                  {(profileForm.footerLinks ?? []).length > 0 && (
                    <div className="divide-y divide-[#2A3024] rounded-lg border border-[#2A3024] bg-[#090B08] overflow-hidden">
                      {(profileForm.footerLinks ?? []).map((link) => (
                        <div
                          key={link.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F5F2EB] truncate">
                              {link.label}
                            </p>
                            <p className="text-[11px] font-mono text-[#A8A092] truncate">
                              {link.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditFooterLink(link)}
                              aria-label={`Edit tautan ${link.label}`}
                              className="h-7 w-7 inline-flex items-center justify-center rounded text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFooterLink(link.id)}
                              aria-label={`Hapus tautan ${link.label}`}
                              className="h-7 w-7 inline-flex items-center justify-center rounded text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROFIL & PERSONEL */}
          {section === 'profile' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Profil Band, Hero &amp; Formasi Personel
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Kelola identitas utama band, visual hero, biografi, statistik, dan daftar anggota personel.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Identitas & Visual Band */}
                <form
                  onSubmit={handleSaveProfileForm}
                  className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Identitas &amp; Tampilan Hero
                    </h2>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      {saving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                  </div>

                  {/* Upload Logo, Hero, Studio dalam 3 kartu ringkas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-[#2A3024] bg-[#090B08] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#D6CFC2]">Logo Band</span>
                        {profileForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...profileForm, logoUrl: undefined };
                              setProfileForm(next);
                              void saveProfilePayload(next, 'Logo gambar dihapus.');
                            }}
                            className="text-[10px] text-[#FCA5A5] hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <label className="inline-flex w-full items-center justify-center gap-1.5 min-h-[34px] px-2.5 text-xs font-medium bg-[#141911] border border-[#2A3024] text-[#F5F2EB] rounded-lg hover:border-[#EAB308] cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                        <span className="truncate">
                          {uploadingTarget === 'logo' ? 'Mengunggah...' : 'Unggah Logo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTarget === 'logo'}
                          onChange={handleLogoUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="rounded-lg border border-[#2A3024] bg-[#090B08] p-3 space-y-2">
                      <span className="block text-[11px] font-medium text-[#D6CFC2]">
                        Foto Utama Hero
                      </span>
                      <label className="inline-flex w-full items-center justify-center gap-1.5 min-h-[34px] px-2.5 text-xs font-medium bg-[#141911] border border-[#2A3024] text-[#F5F2EB] rounded-lg hover:border-[#EAB308] cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                        <span className="truncate">
                          {uploadingTarget === 'hero' ? 'Mengunggah...' : 'Foto Hero'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTarget === 'hero'}
                          onChange={handleHeroImageUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="rounded-lg border border-[#2A3024] bg-[#090B08] p-3 space-y-2">
                      <span className="block text-[11px] font-medium text-[#D6CFC2]">
                        Foto Studio Profil
                      </span>
                      <label className="inline-flex w-full items-center justify-center gap-1.5 min-h-[34px] px-2.5 text-xs font-medium bg-[#141911] border border-[#2A3024] text-[#F5F2EB] rounded-lg hover:border-[#EAB308] cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                        <span className="truncate">
                          {uploadingTarget === 'studio' ? 'Mengunggah...' : 'Foto Studio'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTarget === 'studio'}
                          onChange={handleStudioImageUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Nama Band
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Kota Basis
                      </label>
                      <input
                        type="text"
                        value={profileForm.originCity}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, originCity: e.target.value })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Email Booking
                      </label>
                      <input
                        type="email"
                        value={profileForm.bookingEmail}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, bookingEmail: e.target.value })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Label Kicker Hero
                      </label>
                      <input
                        type="text"
                        value={profileForm.kicker}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, kicker: e.target.value })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Headline Utama Hero
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.headline}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, headline: e.target.value })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Subheadline Hero
                    </label>
                    <textarea
                      rows={2}
                      value={profileForm.subheadline}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, subheadline: e.target.value })
                      }
                      className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Biografi Band
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Kutipan Filosofi Studio
                    </label>
                    <input
                      type="text"
                      value={profileForm.studioQuote}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, studioQuote: e.target.value })
                      }
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#2A3024] space-y-2">
                    <p className="text-xs font-semibold text-[#D6CFC2]">
                      4 Statistik Hero
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {profileForm.stats.map((st, idx) => (
                        <div key={idx} className="space-y-1">
                          <input
                            type="text"
                            value={st.value}
                            onChange={(e) => {
                              const next = [...profileForm.stats];
                              next[idx] = { ...st, value: e.target.value };
                              setProfileForm({ ...profileForm, stats: next });
                            }}
                            placeholder="Nilai"
                            className="w-full min-h-[34px] px-2.5 text-xs font-mono bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                          />
                          <input
                            type="text"
                            value={st.label}
                            onChange={(e) => {
                              const next = [...profileForm.stats];
                              next[idx] = { ...st, label: e.target.value };
                              setProfileForm({ ...profileForm, stats: next });
                            }}
                            placeholder="Label"
                            className="w-full min-h-[34px] px-2.5 text-[11px] bg-[#090B08] border border-[#2A3024] rounded-lg text-[#A8A092]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Right Column: Formasi Personel */}
                <div className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#EAB308]" aria-hidden="true" />
                      <h2 className="text-sm font-semibold text-[#F5F2EB]">
                        Personel Band ({profileForm.members.length})
                      </h2>
                    </div>
                    {editingMemberId && (
                      <button
                        type="button"
                        onClick={resetMemberForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddMember} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Nama Personel *"
                        className="min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <input
                        type="text"
                        required
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        placeholder="Peran (Vokal / Gitar) *"
                        className="min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={newMember.instrument}
                        onChange={(e) =>
                          setNewMember({ ...newMember, instrument: e.target.value })
                        }
                        placeholder="Instrumen"
                        className="min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <input
                        type="text"
                        value={newMember.origin}
                        onChange={(e) =>
                          setNewMember({ ...newMember, origin: e.target.value })
                        }
                        placeholder="Kota Asal"
                        className="min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <input
                      type="text"
                      value={newMember.instagramUrl ?? ''}
                      onChange={(e) =>
                        setNewMember({ ...newMember, instagramUrl: e.target.value })
                      }
                      placeholder="Link / Username Instagram (@akun)"
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] cursor-pointer"
                    >
                      {editingMemberId ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {editingMemberId ? 'Simpan Personel' : 'Tambah Personel'}
                    </button>
                  </form>

                  <div className="divide-y divide-[#2A3024] pt-1">
                    {profileForm.members.map((m) => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F5F2EB] truncate">{m.name}</p>
                          <p className="text-[11px] text-[#A8A092] truncate">
                            {m.role}
                            {m.instrument ? ` · ${m.instrument}` : ''}
                            {m.origin ? ` · ${m.origin}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditMember(m)}
                            aria-label={`Edit personel ${m.name}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id)}
                            aria-label={`Hapus personel ${m.name}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: MUSIK & AUDIO */}
          {section === 'tracks' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Katalog Musik &amp; Streaming Audio
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Unggah file lagu (MP3/WAV/M4A), sampul rilisan, serta lirik lagu untuk pemutar musik website.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Tambah / Edit Lagu */}
                <form
                  onSubmit={handleSaveTrack}
                  className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      {editingTrackId ? 'Edit Lagu Streaming' : 'Tambah Lagu Baru'}
                    </h2>
                    {editingTrackId && (
                      <button
                        type="button"
                        onClick={resetTrackForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Judul Lagu *
                    </label>
                    <input
                      type="text"
                      required
                      value={trackForm.title}
                      onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                      placeholder="Masukkan judul lagu..."
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        File Audio (MP3 / WAV / M4A)
                      </span>
                      <div className="flex flex-wrap items-center gap-2 min-h-[42px] px-3 py-2 bg-[#090B08] border border-[#2A3024] rounded-lg">
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EAB308] cursor-pointer">
                          <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {uploadingTarget === 'audio'
                              ? `Mengunggah${uploadProgress !== null ? ` (${uploadProgress}%)` : '...'}`
                              : trackForm.audioUrl
                                ? 'Ganti File Audio'
                                : 'Unggah File Audio'}
                          </span>
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
                            disabled={uploadingTarget === 'audio'}
                            onChange={handleTrackAudioUpload}
                            className="sr-only"
                          />
                        </label>
                        {trackForm.audioUrl && (
                          <button
                            type="button"
                            onClick={() => setTrackForm({ ...trackForm, audioUrl: '' })}
                            className="ml-auto text-[11px] text-[#FCA5A5] hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Foto Sampul Lagu
                      </span>
                      <div className="flex items-center gap-3 min-h-[42px] px-3 py-1.5 bg-[#090B08] border border-[#2A3024] rounded-lg">
                        {trackForm.coverUrl && (
                          <img
                            src={resolveAssetUrl(trackForm.coverUrl)}
                            alt="Pratinjau sampul"
                            className="w-8 h-8 rounded object-cover border border-[#2A3024] shrink-0"
                          />
                        )}
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F5F2EB] hover:text-[#EAB308] cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#EAB308] shrink-0" aria-hidden="true" />
                          <span>
                            {uploadingTarget === 'cover'
                              ? 'Mengunggah...'
                              : 'Unggah Foto Sampul'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingTarget === 'cover'}
                            onChange={handleTrackCoverUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Lirik Lagu
                    </label>
                    <textarea
                      rows={4}
                      value={trackForm.lyrics}
                      onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value })}
                      placeholder="Tulis lirik lagu di sini..."
                      className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving || uploadingTarget === 'audio' || uploadingTarget === 'cover'}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                  >
                    {editingTrackId ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    )}
                    {editingTrackId ? 'Simpan Perubahan Lagu' : 'Tambah ke Katalog'}
                  </button>
                </form>

                {/* Right Column: Daftar Katalog Lagu */}
                <div className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#2A3024] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Daftar Katalog ({filteredTracks.length})
                    </h2>
                    <div className="relative">
                      <Search
                        className="w-3.5 h-3.5 text-[#A8A092] absolute left-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={trackSearch}
                        onChange={(e) => setTrackSearch(e.target.value)}
                        placeholder="Cari judul lagu..."
                        className="w-full sm:w-52 min-h-[34px] pl-8 pr-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-[#2A3024]">
                    {filteredTracks.map((t) => (
                      <div
                        key={t.id}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#171C14]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={resolveAssetUrl(t.coverUrl)}
                            alt={t.title}
                            className="w-10 h-10 rounded-lg object-cover border border-[#2A3024] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F5F2EB] truncate">
                              {t.title}
                            </p>
                            <p className="text-[11px] font-mono text-[#A8A092] truncate">
                              {t.audioUrl ? 'Audio terunggah' : 'Audio bawaan'} ·{' '}
                              {t.plays.toLocaleString('id-ID')} putar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditTrack(t)}
                            aria-label={`Edit lagu ${t.title}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrack(t.id)}
                            aria-label={`Hapus lagu ${t.title}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: JADWAL PANGGUNG */}
          {section === 'tours' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Jadwal Panggung &amp; Pertunjukan
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Kelola agenda panggung mendatang. Jadwal yang sudah lewat otomatis berstatus Selesai.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Tambah / Edit Jadwal */}
                <form
                  onSubmit={handleSaveTour}
                  className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      {editingTourId ? 'Edit Jadwal Panggung' : 'Tambah Jadwal Baru'}
                    </h2>
                    {editingTourId && (
                      <button
                        type="button"
                        onClick={resetTourForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Tanggal Tampil *
                      </label>
                      <input
                        type="date"
                        required
                        value={tourForm.date}
                        onChange={(e) => {
                          const nextDate = e.target.value;
                          const past = isTourDatePast(nextDate);
                          setTourForm((prev) => ({
                            ...prev,
                            date: nextDate,
                            status: past
                              ? 'Selesai'
                              : isTourDatePast(prev.date) && prev.status === 'Selesai'
                                ? 'Tersedia'
                                : prev.status,
                          }));
                        }}
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Kota *
                      </label>
                      <input
                        type="text"
                        required
                        value={tourForm.city}
                        onChange={(e) => setTourForm({ ...tourForm, city: e.target.value })}
                        placeholder="Mis. Yogyakarta"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Nama Venue / Acara *
                    </label>
                    <input
                      type="text"
                      required
                      value={tourForm.venue}
                      onChange={(e) => setTourForm({ ...tourForm, venue: e.target.value })}
                      placeholder="Nama panggung atau festival"
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Jam Tampil
                      </label>
                      <input
                        type="text"
                        value={tourForm.stageTime}
                        onChange={(e) =>
                          setTourForm({ ...tourForm, stageTime: e.target.value })
                        }
                        placeholder="20:30 WIB"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Harga / Info Tiket
                      </label>
                      <input
                        type="text"
                        value={tourForm.priceLabel}
                        onChange={(e) =>
                          setTourForm({ ...tourForm, priceLabel: e.target.value })
                        }
                        placeholder="Rp 75.000 / Gratis"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Status Jadwal
                      </label>
                      <select
                        value={normalizeTourStatus(tourForm.date, tourForm.status)}
                        disabled={isTourDatePast(tourForm.date)}
                        onChange={(e) =>
                          setTourForm({ ...tourForm, status: e.target.value as TourStatus })
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] disabled:opacity-75"
                      >
                        <option value="Tersedia">Tersedia</option>
                        <option value="Terbatas">Terbatas</option>
                        <option value="Habis">Habis</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Link Tiket (Opsional)
                      </label>
                      <input
                        type="text"
                        value={tourForm.ticketUrl}
                        onChange={(e) =>
                          setTourForm({ ...tourForm, ticketUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  {isTourDatePast(tourForm.date) && (
                    <p className="text-[11px] text-[#EAB308]">
                      Tanggal sudah lewat — status otomatis diset menjadi Selesai.
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Catatan Panggung (Opsional)
                    </label>
                    <input
                      type="text"
                      value={tourForm.notes}
                      onChange={(e) => setTourForm({ ...tourForm, notes: e.target.value })}
                      placeholder="Keterangan singkat acara..."
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] cursor-pointer"
                  >
                    {editingTourId ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    )}
                    {editingTourId ? 'Simpan Jadwal' : 'Publikasikan Jadwal'}
                  </button>
                </form>

                {/* Right Column: Daftar Pertunjukan */}
                <div className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#2A3024] flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Daftar Pertunjukan ({filteredTours.length})
                    </h2>
                    <div className="inline-flex items-center gap-1 p-1 bg-[#090B08] border border-[#2A3024] rounded-lg">
                      {(
                        [
                          { id: 'all', label: 'Semua' },
                          { id: 'upcoming', label: 'Akan Datang' },
                          { id: 'past', label: 'Selesai' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTourFilter(tab.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                            tourFilter === tab.id
                              ? 'bg-[#EAB308] text-[#090B08]'
                              : 'text-[#A8A092] hover:text-[#F5F2EB]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-[#2A3024]">
                    {filteredTours.map((t) => (
                      <div
                        key={t.id}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#171C14]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F5F2EB] truncate">
                            {t.venue} · {t.city}
                          </p>
                          <p className="text-[11px] font-mono text-[#A8A092] mt-0.5">
                            {t.date} · {t.stageTime} · {t.priceLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            aria-label={`Ubah status ${t.venue}`}
                            value={t.status}
                            disabled={isTourDatePast(t.date)}
                            onChange={(e) =>
                              handleQuickTourStatus(t.id, e.target.value as TourStatus)
                            }
                            className="min-h-[34px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] disabled:opacity-75"
                          >
                            <option value="Tersedia">Tersedia</option>
                            <option value="Terbatas">Terbatas</option>
                            <option value="Habis">Habis</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => startEditTour(t)}
                            aria-label={`Edit jadwal ${t.venue}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTour(t.id)}
                            aria-label={`Hapus jadwal ${t.venue}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: GALERI FOTO & VIDEO */}
          {section === 'gallery' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Galeri Foto &amp; Video Dokumentasi
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Unggah dokumentasi panggung, studio, atau backstage dalam format foto maupun video.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Unggah / Edit Media */}
                <form
                  onSubmit={handleSavePhoto}
                  className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      {editingPhotoId ? 'Edit Media Galeri' : 'Unggah Media Baru'}
                    </h2>
                    {editingPhotoId && (
                      <button
                        type="button"
                        onClick={resetPhotoForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Judul Dokumentasi *
                    </label>
                    <input
                      type="text"
                      required
                      value={photoForm.title}
                      onChange={(e) =>
                        setPhotoForm({ ...photoForm, title: e.target.value })
                      }
                      placeholder="Mis. Event Soundrenaline"
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Kategori
                    </label>
                    <select
                      value={photoForm.category}
                      onChange={(e) =>
                        setPhotoForm({
                          ...photoForm,
                          category: e.target.value as GalleryCategory,
                        })
                      }
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    >
                      <option value="Panggung">Panggung</option>
                      <option value="Studio">Studio</option>
                      <option value="Backstage">Backstage</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      File Foto atau Video *
                    </span>
                    <div className="rounded-lg border border-[#2A3024] bg-[#090B08] p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {uploadingTarget === 'gallery'
                              ? 'Mengunggah...'
                              : photoForm.imageUrl
                                ? 'Ganti File'
                                : 'Pilih Foto / Video'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            disabled={uploadingTarget === 'gallery'}
                            onChange={handleGalleryMediaUpload}
                            className="sr-only"
                          />
                        </label>
                        {photoForm.imageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoForm((prev) => ({
                                ...prev,
                                imageUrl: '',
                                mediaType: 'image',
                              }))
                            }
                            className="text-xs text-[#FCA5A5] hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {photoForm.imageUrl && (
                        <div className="flex items-center gap-3 pt-2 border-t border-[#2A3024]">
                          {photoForm.mediaType === 'video' ? (
                            <video
                              src={resolveAssetUrl(photoForm.imageUrl)}
                              controls
                              playsInline
                              className="h-16 w-24 rounded object-cover border border-[#2A3024] bg-black"
                            />
                          ) : (
                            <img
                              src={resolveAssetUrl(photoForm.imageUrl)}
                              alt="Pratinjau galeri"
                              className="h-16 w-24 rounded object-cover border border-[#2A3024]"
                            />
                          )}
                          <span className="text-[11px] font-medium text-[#4ADE80]">
                            {photoForm.mediaType === 'video'
                              ? 'Video siap disimpan'
                              : 'Foto siap disimpan'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Lokasi
                      </label>
                      <input
                        type="text"
                        value={photoForm.location}
                        onChange={(e) =>
                          setPhotoForm({ ...photoForm, location: e.target.value })
                        }
                        placeholder="Jakarta / Depok"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Bulan &amp; Tahun
                      </label>
                      <input
                        type="text"
                        value={photoForm.dateLabel}
                        onChange={(e) =>
                          setPhotoForm({ ...photoForm, dateLabel: e.target.value })
                        }
                        placeholder="November 2026"
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Kredit Fotografer / Videografer
                    </label>
                    <input
                      type="text"
                      value={photoForm.photographer}
                      onChange={(e) =>
                        setPhotoForm({ ...photoForm, photographer: e.target.value })
                      }
                      placeholder="Tim Rasmalas"
                      className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#D6CFC2] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={photoForm.featured}
                      onChange={(e) =>
                        setPhotoForm({ ...photoForm, featured: e.target.checked })
                      }
                      className="accent-[#EAB308]"
                    />
                    Jadikan sorotan utama (kartu besar)
                  </label>

                  <button
                    type="submit"
                    disabled={saving || uploadingTarget === 'gallery'}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                  >
                    {editingPhotoId ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    )}
                    {editingPhotoId ? 'Simpan Perubahan' : 'Tambahkan ke Galeri'}
                  </button>
                </form>

                {/* Right Column: Koleksi Galeri */}
                <div className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Koleksi Galeri ({filteredPhotos.length})
                    </h2>
                    <div className="inline-flex items-center gap-1 p-1 bg-[#090B08] border border-[#2A3024] rounded-lg">
                      {(['Semua', 'Panggung', 'Studio', 'Backstage'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGalleryFilter(cat)}
                          className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                            galleryFilter === cat
                              ? 'bg-[#EAB308] text-[#090B08]'
                              : 'text-[#A8A092] hover:text-[#F5F2EB]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-[#2A3024]">
                    {filteredPhotos.map((p) => {
                      const isVideo =
                        p.mediaType === 'video' ||
                        /\.(mp4|webm|mov)(\?|$)/i.test(p.imageUrl);
                      return (
                        <div
                          key={p.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#2A3024] shrink-0 bg-black">
                              {isVideo ? (
                                <>
                                  <video
                                    src={resolveAssetUrl(p.imageUrl)}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 right-1 rounded bg-black/80 p-0.5 text-[#EAB308]">
                                    <Film className="w-3 h-3" />
                                  </span>
                                </>
                              ) : (
                                <img
                                  src={resolveAssetUrl(p.imageUrl)}
                                  alt={p.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {p.featured && (
                                  <Star className="w-3.5 h-3.5 text-[#EAB308] fill-current shrink-0" />
                                )}
                                <p className="text-xs font-semibold text-[#F5F2EB] truncate">
                                  {p.title}
                                </p>
                              </div>
                              <p className="text-[11px] text-[#A8A092] truncate mt-0.5">
                                {isVideo ? 'Video' : 'Foto'} · {p.category} · {p.location} ·{' '}
                                {p.dateLabel}
                              </p>
                              <p className="text-[11px] text-[#6E675B] truncate">
                                Oleh {p.photographer}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditPhoto(p)}
                              aria-label={`Edit media ${p.title}`}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(p.id)}
                              aria-label={`Hapus media ${p.title}`}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: MEDIA SOSIAL */}
          {section === 'social' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Postingan Sosial, Sapaan &amp; Kanal Resmi
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Kelola kabar media sosial, moderasi pesan penggemar, dan tautan kanal sosial resmi band.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Tambah / Edit Postingan */}
                <form
                  ref={socialPostFormRef}
                  onSubmit={handlePublishSocialPost}
                  className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      {editingPostId ? 'Edit Postingan' : 'Tambah Postingan Baru'}
                    </h2>
                    {editingPostId && (
                      <button
                        type="button"
                        onClick={resetSocialPostForm}
                        className="text-xs text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Platform
                      </label>
                      <select
                        value={postPlatform}
                        onChange={(e) => setPostPlatform(e.target.value as SocialPlatform)}
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      >
                        {Array.from(
                          new Set([
                            ...(channelsForm.length > 0
                              ? channelsForm.map((c) => c.platform)
                              : ['Instagram', 'YouTube', 'Spotify', 'TikTok']),
                            postPlatform,
                          ])
                        ).map((plat) => (
                          <option key={plat} value={plat}>
                            {plat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Akun / Handle
                      </label>
                      <input
                        type="text"
                        value={postAuthorHandle}
                        onChange={(e) => setPostAuthorHandle(e.target.value)}
                        placeholder={
                          channelsForm.find((c) => c.platform === postPlatform)?.handle ||
                          '@rasmalas.official'
                        }
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                      Isi Pengumuman / Postingan *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Tulis kabar terbaru, rilis lagu, atau info panggung..."
                      className="w-full p-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between min-h-[38px] px-3 bg-[#090B08] border border-[#2A3024] rounded-lg">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EAB308] cursor-pointer">
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {uploadingTarget === 'social'
                            ? `Mengunggah${uploadProgress !== null ? ` (${uploadProgress}%)` : '...'}`
                            : postMediaUrl
                              ? 'Ganti Foto / Video'
                              : 'Lampiran Foto / Video (Opsional)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,video/mp4,video/webm,video/quicktime"
                          disabled={uploadingTarget === 'social'}
                          onChange={handleSocialMediaUpload}
                          className="sr-only"
                        />
                      </label>
                      {postMediaUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPostMediaUrl('');
                            setPostMediaType('image');
                          }}
                          className="text-[11px] text-[#FCA5A5] hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {postMediaUrl && (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border border-[#2A3024] bg-[#090B08]">
                        {postMediaType === 'video' ? (
                          <video
                            src={resolveAssetUrl(postMediaUrl)}
                            controls
                            playsInline
                            className="h-14 w-24 rounded object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={resolveAssetUrl(postMediaUrl)}
                            alt="Pratinjau lampiran"
                            className="h-14 w-20 rounded object-cover"
                          />
                        )}
                        <span className="text-[11px] text-[#4ADE80]">
                          Lampiran siap disimpan
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-[#D6CFC2] mb-1">
                        Tautan Postingan Asli (Opsional)
                      </label>
                      <input
                        type="text"
                        value={postExternalUrl}
                        onChange={(e) => setPostExternalUrl(e.target.value)}
                        placeholder="https://instagram.com/p/..."
                        className="w-full min-h-[38px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || uploadingTarget === 'social'}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                  >
                    {editingPostId ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        Simpan Perubahan
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Tambah &amp; Siarkan Postingan
                      </>
                    )}
                  </button>
                </form>

                {/* Right Column: Arsip Postingan & Moderasi Sapaan */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-[#F5F2EB]">
                        Arsip Postingan ({bandState.socialPosts.length})
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          resetSocialPostForm();
                          socialPostFormRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className="inline-flex items-center gap-1 min-h-[30px] px-2.5 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        Tambah
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bandState.socialPosts.length === 0 ? (
                        <p className="text-xs text-[#A8A092] py-4 text-center">
                          Belum ada postingan media sosial.
                        </p>
                      ) : (
                        bandState.socialPosts.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-start justify-between gap-3 rounded-lg border bg-[#090B08] p-3 ${
                              editingPostId === p.id
                                ? 'border-[#EAB308]'
                                : 'border-[#2A3024]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#EAB308]">
                                {p.platform} · {p.authorHandle} · {p.likes} suka
                              </p>
                              <p className="text-xs text-[#D6CFC2] mt-1 line-clamp-2">
                                {p.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditSocialPost(p)}
                                aria-label="Edit postingan"
                                className="h-8 w-8 inline-flex items-center justify-center rounded text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSocialPost(p.id)}
                                aria-label="Hapus postingan"
                                className="h-8 w-8 inline-flex items-center justify-center rounded text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Moderasi Dinding Sapaan ({bandState.shoutouts.length})
                    </h2>
                    <div className="space-y-2">
                      {bandState.shoutouts.length === 0 ? (
                        <p className="text-xs text-[#A8A092] py-2">
                          Belum ada pesan sapaan dari pengunjung.
                        </p>
                      ) : (
                        bandState.shoutouts.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-[#2A3024] bg-[#090B08] p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#F5F2EB]">
                                {s.senderName} · {s.city}
                              </p>
                              <p className="text-xs text-[#A8A092] mt-0.5">{s.message}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteShoutout(s.id)}
                              aria-label="Hapus sapaan"
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-[#A8A092] hover:text-[#F87171] cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Konfigurasi Kanal Sosial Resmi */}
              <div className="rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#F5F2EB]">
                      Konfigurasi Akun &amp; Kanal Sosial Resmi ({channelsForm.length})
                    </h2>
                    <p className="text-xs text-[#A8A092] mt-0.5">
                      Atur tautan akun sosial resmi yang tampil di seksi Media Sosial dan Footer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveChannels}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Simpan Kanal
                  </button>
                </div>

                <form
                  onSubmit={handleAddChannel}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1"
                >
                  <input
                    type="text"
                    required
                    value={newChannelForm.platform}
                    onChange={(e) =>
                      setNewChannelForm({ ...newChannelForm, platform: e.target.value })
                    }
                    placeholder="Nama Platform (mis. TikTok)"
                    className="lg:col-span-3 min-h-[36px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                  />
                  <input
                    type="text"
                    value={newChannelForm.handle}
                    onChange={(e) =>
                      setNewChannelForm({ ...newChannelForm, handle: e.target.value })
                    }
                    placeholder="Handle (@rasmalas)"
                    className="lg:col-span-3 min-h-[36px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                  />
                  <input
                    type="url"
                    required
                    value={newChannelForm.url}
                    onChange={(e) =>
                      setNewChannelForm({ ...newChannelForm, url: e.target.value })
                    }
                    placeholder="URL Profil (https://...)"
                    className="lg:col-span-4 min-h-[36px] px-3 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="lg:col-span-2 inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3 text-xs font-semibold bg-[#1A2016] border border-[#EAB308]/60 text-[#EAB308] rounded-lg hover:bg-[#EAB308] hover:text-[#090B08] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Kanal
                  </button>
                </form>

                <div className="divide-y divide-[#2A3024]">
                  {channelsForm.map((ch, idx) => (
                    <div
                      key={ch.platform}
                      className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-[#F5F2EB] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ch.connected}
                          onChange={(e) => {
                            const next = [...channelsForm];
                            next[idx] = { ...ch, connected: e.target.checked };
                            setChannelsForm(next);
                          }}
                          className="accent-[#EAB308]"
                        />
                        <span className="truncate">{ch.platform}</span>
                      </label>
                      <input
                        type="text"
                        value={ch.handle}
                        onChange={(e) => {
                          const next = [...channelsForm];
                          next[idx] = { ...ch, handle: e.target.value };
                          setChannelsForm(next);
                        }}
                        placeholder="Handle"
                        className="sm:col-span-3 min-h-[36px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <input
                        type="text"
                        value={ch.followersLabel}
                        onChange={(e) => {
                          const next = [...channelsForm];
                          next[idx] = { ...ch, followersLabel: e.target.value };
                          setChannelsForm(next);
                        }}
                        placeholder="Label Pengikut"
                        className="sm:col-span-3 min-h-[36px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <input
                        type="url"
                        value={ch.url}
                        onChange={(e) => {
                          const next = [...channelsForm];
                          next[idx] = { ...ch, url: e.target.value };
                          setChannelsForm(next);
                        }}
                        placeholder="URL Profil"
                        className="sm:col-span-3 min-h-[36px] px-2.5 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB]"
                      />
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleDeleteChannel(ch.platform)}
                          aria-label={`Hapus kanal ${ch.platform}`}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F87171] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: PENGATURAN AKUN ADMIN */}
          {section === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#F5F2EB]">
                  Pengaturan Akun Admin
                </h1>
                <p className="text-xs text-[#A8A092] mt-1">
                  Kelola keamanan kata sandi dan informasi sesi akun admin Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Info Sesi Aktif */}
                <div className="lg:col-span-5 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-[#F5F2EB]">
                    Informasi Akun Aktif
                  </h2>
                  <div className="divide-y divide-[#2A3024] text-xs">
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[#A8A092]">Username</span>
                      <span className="font-mono font-semibold text-[#EAB308]">
                        {adminUsername || '-'}
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[#A8A092]">Nama Admin</span>
                      <span className="font-medium text-[#F5F2EB]">
                        {adminFullName || 'Admin Rasmalas'}
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[#A8A092]">Email Sesi</span>
                      <span className="font-mono text-[#F5F2EB] truncate">
                        {adminEmail || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Reset / Ubah Kata Sandi */}
                <form
                  onSubmit={handleSaveNewPassword}
                  className="lg:col-span-7 rounded-xl border border-[#2A3024] bg-[#11150F] p-5 space-y-4"
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="text-sm font-semibold text-[#F5F2EB]">
                        Ubah Kata Sandi Admin
                      </h2>
                      <p className="text-xs text-[#A8A092]">
                        Tetapkan kata sandi baru secara langsung atau kirim tautan reset ke email.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="admin-new-password"
                        className="block text-xs font-medium text-[#D6CFC2] mb-1"
                      >
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          id="admin-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          placeholder="Minimal 6 karakter"
                          className="w-full min-h-[38px] pl-3 pr-9 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] focus:outline-none focus:border-[#EAB308]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          aria-label={showNewPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="admin-confirm-password"
                        className="block text-xs font-medium text-[#D6CFC2] mb-1"
                      >
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          id="admin-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Ulangi kata sandi baru"
                          className="w-full min-h-[38px] pl-3 pr-9 text-xs bg-[#090B08] border border-[#2A3024] rounded-lg text-[#F5F2EB] focus:outline-none focus:border-[#EAB308]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          aria-label={
                            showConfirmPassword
                              ? 'Sembunyikan konfirmasi sandi'
                              : 'Lihat konfirmasi sandi'
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={passwordBusy}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg hover:bg-[#FACC15] disabled:opacity-50 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      {passwordBusy ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                    </button>

                    {backendMode === 'supabase' && (
                      <button
                        type="button"
                        disabled={resetEmailBusy}
                        onClick={() => void handleSendResetEmailFromSettings()}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 text-xs font-medium border border-[#2A3024] text-[#D6CFC2] rounded-lg hover:border-[#EAB308] hover:text-[#F5F2EB] disabled:opacity-50 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                        {resetEmailBusy ? 'Mengirim...' : 'Kirim Link Reset ke Email'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
