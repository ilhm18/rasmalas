import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BandProfileSection } from './components/BandProfileSection';
import { CustomSectionBlock } from './components/CustomSectionBlock';
import { Footer } from './components/Footer';
import { GallerySection } from './components/GallerySection';
import { HeroSection } from './components/HeroSection';
import { MusicPlayerSection } from './components/MusicPlayerSection';
import { Navbar } from './components/Navbar';
import { ReggaeAmbientBackdrop } from './components/ReggaeAmbientBackdrop';
import { SocialRealtimeSection } from './components/SocialRealtimeSection';
import { StickyMiniPlayer } from './components/StickyMiniPlayer';
import { StudioLoadingScreen } from './components/StudioLoadingScreen';
import { TourSection } from './components/TourSection';
import { useBandRealtime } from './hooks/useBandRealtime';
import {
  sbAdminLogout,
  sbAdminSessionCheck,
  sbIncrementPostLike,
  sbIncrementTrackPlay,
  sbInsertShoutout,
} from './lib/supabaseBrowser';
import { resolveAssetUrl } from './shared/assetUrl';
import { getClientReggaeTrackUrl } from './shared/clientAudioSynth';
import type { SiteSection, Track } from './shared/types';

const TOKEN_STORAGE_KEY = 'senja_admin_token';

export default function App() {
  const {
    bandState,
    setBandState,
    loading,
    error,
    wsConnected,
    backendMode,
    onlineCount,
    refetch,
  } = useBandRealtime();

  // View mode: public site or full Admin Dashboard
  const [viewMode, setViewMode] = useState<'public' | 'admin'>(() =>
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
      ? 'admin'
      : 'public'
  );
  const [initialAdminSection, setInitialAdminSection] = useState<'overview' | 'settings'>(() =>
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
      ? 'settings'
      : 'overview'
  );

  // Admin auth state
  const [authToken, setAuthToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
  );
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [adminFullName, setAdminFullName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Streaming music player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [miniDismissed, setMiniDismissed] = useState(false);

  // Autoplay & track-switching refs
  const hasAutoplayInitRef = useRef(false);
  const autoplayedUyeeRef = useRef(false);
  const userChangedTrackRef = useRef(false);
  const cleanupAutoplayUnlockRef = useRef<(() => void) | null>(null);

  // Verify stored admin session on mount / mode detection
  useEffect(() => {
    if (loading) return;
    async function checkSession() {
      try {
        if (backendMode === 'supabase') {
          const sbSession = await sbAdminSessionCheck();
          if (sbSession.authenticated && sbSession.email && sbSession.token) {
            setIsAuthenticated(true);
            setAdminEmail(sbSession.email);
            setAdminUsername(sbSession.username);
            setAdminFullName(sbSession.fullName);
            setAuthToken(sbSession.token);
            if (window.location.hash.includes('type=recovery')) {
              setViewMode('admin');
              setInitialAdminSection('settings');
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else {
            setIsAuthenticated(false);
            setAdminEmail(null);
            setAdminUsername(null);
            setAdminFullName(null);
            window.localStorage.removeItem(TOKEN_STORAGE_KEY);
            setAuthToken(null);
          }
          return;
        }
        if (backendMode === 'static') {
          setIsAuthenticated(false);
          setAdminEmail(null);
          setAdminUsername(null);
          setAdminFullName(null);
          return;
        }

        const headers: Record<string, string> = {};
        if (authToken) headers.Authorization = `Bearer ${authToken}`;
        const res = await fetch('/api/auth/me', { headers });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const data = (await res.json()) as {
          authenticated: boolean;
          email: string | null;
          username?: string | null;
          fullName?: string | null;
        };
        if (data.authenticated && data.email) {
          setIsAuthenticated(true);
          setAdminEmail(data.email);
          setAdminUsername(data.username ?? data.email.split('@')[0]);
          setAdminFullName(data.fullName ?? 'Admin Rasmalas');
        } else {
          setIsAuthenticated(false);
          setAdminEmail(null);
          setAdminUsername(null);
          setAdminFullName(null);
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAuthToken(null);
        }
      } catch {
        // Ignore transient offline check
      }
    }
    void checkSession();
  }, [authToken, backendMode, loading]);

  // Prioritize "Rasmalas - Uyee" at the top of the playlist if present
  const tracks = useMemo(() => {
    const raw = bandState?.tracks ?? [];
    if (raw.length <= 1) return raw;
    const uyeeIdx = raw.findIndex((t) => /uyee/i.test(t.title));
    if (uyeeIdx <= 0) return raw;
    const next = [...raw];
    const [uyeeTrack] = next.splice(uyeeIdx, 1);
    return [uyeeTrack, ...next];
  }, [bandState?.tracks]);

  const currentTrack: Track | null =
    tracks.find((t) => t.id === currentTrackId) ?? null;

  const getTrackSource = useCallback(
    (track: Track): string => {
      if (track.audioUrl && track.audioUrl.trim()) {
        return resolveAssetUrl(track.audioUrl.trim()) || track.audioUrl.trim();
      }
      if (backendMode === 'express') {
        return (
          resolveAssetUrl(`/api/audio/${encodeURIComponent(track.id)}.wav`) ||
          `/api/audio/${encodeURIComponent(track.id)}.wav`
        );
      }
      return getClientReggaeTrackUrl(track);
    },
    [backendMode]
  );

  const recordTrackPlay = useCallback(
    (trackId: string) => {
      if (backendMode === 'express') {
        void fetch(`/api/tracks/${encodeURIComponent(trackId)}/play`, {
          method: 'POST',
        });
      } else {
        setBandState((prev) =>
          prev
            ? {
                ...prev,
                tracks: prev.tracks.map((t) =>
                  t.id === trackId ? { ...t, plays: t.plays + 1 } : t
                ),
              }
            : prev
        );
        if (backendMode === 'supabase') {
          void sbIncrementTrackPlay(trackId);
        }
      }
    },
    [backendMode, setBandState]
  );

  const playTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Cancel any pending initial autoplay unlock listener because user explicitly selected a track
      userChangedTrackRef.current = true;
      if (cleanupAutoplayUnlockRef.current) {
        cleanupAutoplayUnlockRef.current();
        cleanupAutoplayUnlockRef.current = null;
      }

      const src = getTrackSource(track);
      setCurrentTrackId(track.id);
      setMiniDismissed(false);
      setCurrentTime(0);
      setDuration(track.durationSec);

      audio.pause();
      const resolvedHref = src.startsWith('blob:')
        ? src
        : new URL(src, window.location.origin).href;
      if (audio.src !== resolvedHref) {
        audio.src = src;
      }
      audio.currentTime = 0;
      audio.muted = isMuted;
      audio.volume = isMuted ? 0 : volume;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          recordTrackPlay(track.id);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    },
    [getTrackSource, isMuted, recordTrackPlay, volume]
  );

  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);
  useEffect(() => {
    isMutedRef.current = isMuted;
    volumeRef.current = volume;
  }, [isMuted, volume]);

  // Instant Autoplay "Rasmalas - Uyee" (or first track) immediately when the web opens
  useEffect(() => {
    if (viewMode !== 'public' || tracks.length === 0) return;
    const audio = audioRef.current;
    if (!audio) return;

    const uyeeTrack = tracks.find((t) => /uyee/i.test(t.title));
    const targetTrack = uyeeTrack ?? tracks[0];
    if (!targetTrack) return;

    const shouldInitFirstTime = !hasAutoplayInitRef.current;
    const shouldUpgradeToUyee =
      Boolean(uyeeTrack) && !autoplayedUyeeRef.current && !userChangedTrackRef.current;

    if (!shouldInitFirstTime && !shouldUpgradeToUyee) return;

    hasAutoplayInitRef.current = true;
    if (uyeeTrack) {
      autoplayedUyeeRef.current = true;
    }

    if (cleanupAutoplayUnlockRef.current) {
      cleanupAutoplayUnlockRef.current();
      cleanupAutoplayUnlockRef.current = null;
    }

    const src = getTrackSource(targetTrack);
    setCurrentTrackId(targetTrack.id);
    setMiniDismissed(false);
    setCurrentTime(0);
    setDuration(targetTrack.durationSec);

    const resolvedHref = src.startsWith('blob:')
      ? src
      : new URL(src, window.location.origin).href;
    if (audio.src !== resolvedHref) {
      audio.src = src;
      audio.load();
    }
    audio.autoplay = true;
    audio.preload = 'auto';
    audio.muted = isMutedRef.current;
    audio.volume = isMutedRef.current ? 0 : volumeRef.current;

    let unlocked = false;
    let countedPlay = false;
    let playInFlight = false;

    const markPlayingOnce = () => {
      setIsPlaying(true);
      if (!countedPlay) {
        countedPlay = true;
        recordTrackPlay(targetTrack.id);
      }
    };

    const UNLOCK_EVENTS = [
      'pointerdown',
      'mousedown',
      'touchstart',
      'touchend',
      'keydown',
      'click',
      'wheel',
      'scroll',
    ] as const;

    const removeUnlockListeners = () => {
      audio.removeEventListener('canplay', onReadyToPlay);
      audio.removeEventListener('loadeddata', onReadyToPlay);
      for (const evt of UNLOCK_EVENTS) {
        window.removeEventListener(evt, handleUnlockInteraction, true);
        document.removeEventListener(evt, handleUnlockInteraction, true);
      }
    };

    function tryPlayUnmuted() {
      const el = audioRef.current;
      if (!el || unlocked || userChangedTrackRef.current) return;

      if (!el.paused) {
        unlocked = true;
        removeUnlockListeners();
        cleanupAutoplayUnlockRef.current = null;
        markPlayingOnce();
        return;
      }

      if (playInFlight) return;
      playInFlight = true;

      el.muted = isMutedRef.current;
      el.volume = isMutedRef.current ? 0 : volumeRef.current;

      el.play()
        .then(() => {
          playInFlight = false;
          unlocked = true;
          removeUnlockListeners();
          cleanupAutoplayUnlockRef.current = null;
          markPlayingOnce();
        })
        .catch(() => {
          playInFlight = false;
          // Keep unlock listeners active so the very first user gesture plays immediately with sound
        });
    }

    function handleUnlockInteraction(e: Event) {
      if (unlocked || userChangedTrackRef.current) {
        removeUnlockListeners();
        return;
      }
      const targetEl = e.target as HTMLElement | null;
      if (
        (e.type === 'click' || e.type === 'pointerdown' || e.type === 'mousedown') &&
        targetEl?.closest?.('[data-track-select="true"]')
      ) {
        removeUnlockListeners();
        return;
      }
      tryPlayUnmuted();
    }

    function onReadyToPlay() {
      if (!unlocked && !userChangedTrackRef.current) {
        tryPlayUnmuted();
      }
    }

    cleanupAutoplayUnlockRef.current = removeUnlockListeners;
    audio.addEventListener('loadeddata', onReadyToPlay);
    audio.addEventListener('canplay', onReadyToPlay);
    for (const evt of UNLOCK_EVENTS) {
      window.addEventListener(evt, handleUnlockInteraction, {
        capture: true,
        passive: true,
      });
      document.addEventListener(evt, handleUnlockInteraction, {
        capture: true,
        passive: true,
      });
    }

    tryPlayUnmuted();
  }, [viewMode, tracks, getTrackSource, recordTrackPlay]);

  useEffect(() => {
    return () => {
      if (cleanupAutoplayUnlockRef.current) {
        cleanupAutoplayUnlockRef.current();
      }
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (cleanupAutoplayUnlockRef.current) {
      cleanupAutoplayUnlockRef.current();
      cleanupAutoplayUnlockRef.current = null;
    }
    if (!currentTrack && tracks[0]) {
      playTrack(tracks[0]);
      return;
    }
    if (audio.paused) {
      audio.muted = isMuted;
      audio.volume = isMuted ? 0 : volume;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack, tracks, playTrack, isMuted, volume]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle && tracks.length > 1) {
      const candidates = tracks.filter((t) => t.id !== currentTrackId);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick) playTrack(pick);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    const nextIdx = idx >= 0 ? (idx + 1) % tracks.length : 0;
    playTrack(tracks[nextIdx]);
  }, [tracks, shuffle, currentTrackId, playTrack]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrackId);
    const prevIdx = idx >= 0 ? (idx - 1 + tracks.length) % tracks.length : 0;
    playTrack(tracks[prevIdx]);
  }, [tracks, currentTrackId, playTrack]);

  const handleSeek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const audio = audioRef.current;
    setVolume(val);
    setIsMuted(val === 0);
    if (audio) {
      audio.muted = val === 0;
      audio.volume = val;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const audio = audioRef.current;
    setIsMuted((prev) => {
      const next = !prev;
      if (audio) {
        audio.muted = next;
        audio.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  // Attach audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatOne) {
        audio.currentTime = 0;
        void audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeatOne, handleNext]);

  async function handleLikePost(postId: string) {
    if (backendMode === 'express') {
      await fetch(`/api/social/posts/${encodeURIComponent(postId)}/like`, {
        method: 'POST',
      });
      return;
    }
    setBandState((prev) =>
      prev
        ? {
            ...prev,
            socialPosts: prev.socialPosts.map((p) =>
              p.id === postId ? { ...p, likes: p.likes + 1 } : p
            ),
          }
        : prev
    );
    if (backendMode === 'supabase') {
      await sbIncrementPostLike(postId);
    }
  }

  async function handleSendShoutout(senderName: string, city: string, message: string) {
    if (backendMode === 'express') {
      const res = await fetch('/api/social/shoutouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, city, message }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Gagal mengirim pesan.');
      }
      return;
    }
    if (backendMode === 'supabase') {
      await sbInsertShoutout(senderName, city, message);
      await refetch();
      return;
    }
    setBandState((prev) =>
      prev
        ? {
            ...prev,
            shoutouts: [
              {
                id: `sh-${Date.now().toString(36)}`,
                senderName: senderName.trim(),
                city: city.trim(),
                message: message.trim(),
                createdAt: new Date().toISOString(),
              },
              ...prev.shoutouts,
            ],
          }
        : prev
    );
  }

  function handleLoginSuccess(
    email: string,
    token: string,
    username?: string,
    fullName?: string
  ) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setAdminEmail(email);
    setAdminUsername(username ?? email.split('@')[0]);
    setAdminFullName(fullName ?? 'Admin Rasmalas');
    setIsAuthenticated(true);
  }

  function handleAccountUpdated(info: {
    email?: string;
    username?: string;
    fullName?: string;
    token?: string;
  }) {
    if (info.token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, info.token);
      setAuthToken(info.token);
    }
    if (info.email) setAdminEmail(info.email);
    if (info.username) setAdminUsername(info.username);
    if (info.fullName) setAdminFullName(info.fullName);
  }

  async function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setAdminEmail(null);
    setAdminUsername(null);
    setAdminFullName(null);
    setIsAuthenticated(false);
    if (backendMode === 'express') {
      await fetch('/api/auth/logout', { method: 'POST' });
    } else if (backendMode === 'supabase') {
      await sbAdminLogout();
    }
  }

  return (
    <div className="min-h-screen text-[#F5F2EB]">
      <audio ref={audioRef} autoPlay playsInline preload="auto" />

      {loading && !bandState ? (
        <StudioLoadingScreen />
      ) : error && !bandState ? (
        <div className="min-h-screen text-[#F5F2EB] flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-[#2A3024] bg-[#11150F]/85 backdrop-blur-md p-6 text-center space-y-4">
            <p className="text-sm text-[#FCA5A5]">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-[#EAB308] text-[#090B08] rounded-lg cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      ) : !bandState ? null : viewMode === 'admin' ? (
        <AdminDashboard
          bandState={bandState}
          backendMode={backendMode}
          isAuthenticated={isAuthenticated}
          adminEmail={adminEmail}
          adminUsername={adminUsername}
          adminFullName={adminFullName}
          initialSection={initialAdminSection}
          authToken={authToken}
          wsConnected={wsConnected}
          onlineCount={onlineCount}
          onBackToSite={() => {
            setViewMode('public');
            setInitialAdminSection('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLoginSuccess={handleLoginSuccess}
          onAccountUpdated={handleAccountUpdated}
          onLogout={() => void handleLogout()}
          onRefreshState={refetch}
        />
      ) : (
        <div
          className={`relative z-10 ${
            !miniDismissed && currentTrack ? 'pb-16' : ''
          }`}
        >
          <ReggaeAmbientBackdrop isPlaying={isPlaying} />
          {(() => {
            const visibleSections: SiteSection[] = [...(bandState.siteSections ?? [])]
              .filter((s) => s.visible)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            const musicSection = visibleSections.find((s) => s.builtinKey === 'musik');
            const jadwalSection = visibleSections.find((s) => s.builtinKey === 'jadwal');
            const footerLinks = visibleSections.filter((s) => s.showInNav);

            return (
              <div className="relative z-10">
                <Navbar
                  bandName={bandState.profile.name}
                  logoUrl={bandState.profile.logoUrl}
                  sections={bandState.siteSections ?? []}
                />

                <main>
                  <HeroSection
                    profile={bandState.profile}
                    secondaryHref={`#${jadwalSection?.slug || visibleSections[0]?.slug || 'jadwal'}`}
                    onPlayLatest={() => {
                      if (tracks[0]) {
                        playTrack(tracks[0]);
                        const targetId = musicSection?.slug || 'musik';
                        document
                          .getElementById(targetId)
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />

                  {visibleSections.map((sec) => {
                    if (sec.builtinKey === 'profil') {
                      return (
                        <BandProfileSection
                          key={sec.id}
                          profile={bandState.profile}
                          sectionMeta={sec}
                        />
                      );
                    }
                    if (sec.builtinKey === 'musik') {
                      return (
                        <MusicPlayerSection
                          key={sec.id}
                          tracks={tracks}
                          sectionMeta={sec}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          currentTime={currentTime}
                          duration={duration}
                          volume={volume}
                          isMuted={isMuted}
                          shuffle={shuffle}
                          repeatOne={repeatOne}
                          onSelectTrack={playTrack}
                          onTogglePlay={handleTogglePlay}
                          onNext={handleNext}
                          onPrev={handlePrev}
                          onSeek={handleSeek}
                          onVolumeChange={handleVolumeChange}
                          onToggleMute={handleToggleMute}
                          onToggleShuffle={() => setShuffle((prev) => !prev)}
                          onToggleRepeat={() => setRepeatOne((prev) => !prev)}
                        />
                      );
                    }
                    if (sec.builtinKey === 'jadwal') {
                      return (
                        <TourSection
                          key={sec.id}
                          tours={bandState.tours}
                          sectionMeta={sec}
                        />
                      );
                    }
                    if (sec.builtinKey === 'galeri') {
                      return (
                        <GallerySection
                          key={sec.id}
                          photos={bandState.gallery}
                          sectionMeta={sec}
                        />
                      );
                    }
                    if (sec.builtinKey === 'sosial') {
                      return (
                        <SocialRealtimeSection
                          key={sec.id}
                          channels={bandState.socialChannels}
                          posts={bandState.socialPosts}
                          shoutouts={bandState.shoutouts}
                          sectionMeta={sec}
                          onLikePost={handleLikePost}
                          onSendShoutout={handleSendShoutout}
                        />
                      );
                    }
                    return <CustomSectionBlock key={sec.id} section={sec} />;
                  })}
                </main>

                <Footer
                  profile={bandState.profile}
                  links={footerLinks}
                  channels={bandState.socialChannels}
                  isAdmin={isAuthenticated}
                  onOpenAdmin={() => {
                    setViewMode('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            );
          })()}

          {!miniDismissed && currentTrack && (
            <StickyMiniPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrev={handlePrev}
              onDismiss={() => setMiniDismissed(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
