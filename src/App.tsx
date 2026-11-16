import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BandProfileSection } from './components/BandProfileSection';
import { CustomSectionBlock } from './components/CustomSectionBlock';
import { Footer } from './components/Footer';
import { GallerySection } from './components/GallerySection';
import { HeroSection } from './components/HeroSection';
import { MusicPlayerSection } from './components/MusicPlayerSection';
import { Navbar } from './components/Navbar';
import { SocialRealtimeSection } from './components/SocialRealtimeSection';
import { StickyMiniPlayer } from './components/StickyMiniPlayer';
import { TourSection } from './components/TourSection';
import { useBandRealtime } from './hooks/useBandRealtime';
import {
  sbAdminLogout,
  sbAdminSessionCheck,
  sbIncrementPostLike,
  sbIncrementTourRsvp,
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
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  // Admin auth state
  const [authToken, setAuthToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
  );
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
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
            setAuthToken(sbSession.token);
          } else {
            setIsAuthenticated(false);
            setAdminEmail(null);
            window.localStorage.removeItem(TOKEN_STORAGE_KEY);
            setAuthToken(null);
          }
          return;
        }
        if (backendMode === 'static') {
          setIsAuthenticated(false);
          setAdminEmail(null);
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
        };
        if (data.authenticated && data.email) {
          setIsAuthenticated(true);
          setAdminEmail(data.email);
        } else {
          setIsAuthenticated(false);
          setAdminEmail(null);
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAuthToken(null);
        }
      } catch {
        // Ignore transient offline check
      }
    }
    void checkSession();
  }, [authToken, backendMode, loading]);

  const tracks = bandState?.tracks ?? [];
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

  const playTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;
      const src = getTrackSource(track);
      setCurrentTrackId(track.id);
      setMiniDismissed(false);
      setCurrentTime(0);
      setDuration(track.durationSec);

      const resolvedHref = src.startsWith('blob:')
        ? src
        : new URL(src, window.location.origin).href;
      if (audio.src !== resolvedHref) {
        audio.src = src;
      }
      audio.volume = isMuted ? 0 : volume;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (backendMode === 'express') {
            void fetch(`/api/tracks/${encodeURIComponent(track.id)}/play`, {
              method: 'POST',
            });
          } else {
            setBandState((prev) =>
              prev
                ? {
                    ...prev,
                    tracks: prev.tracks.map((t) =>
                      t.id === track.id ? { ...t, plays: t.plays + 1 } : t
                    ),
                  }
                : prev
            );
            if (backendMode === 'supabase') {
              void sbIncrementTrackPlay(track.id);
            }
          }
        })
        .catch(() => {
          setIsPlaying(false);
        });
    },
    [backendMode, getTrackSource, isMuted, setBandState, volume]
  );

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack && tracks[0]) {
      playTrack(tracks[0]);
      return;
    }
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack, tracks, playTrack]);

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
    if (audio) audio.volume = val;
  }, []);

  const handleToggleMute = useCallback(() => {
    const audio = audioRef.current;
    setIsMuted((prev) => {
      const next = !prev;
      if (audio) audio.volume = next ? 0 : volume;
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
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeatOne, handleNext]);

  async function handleRsvpTour(tourId: string) {
    if (backendMode === 'express') {
      await fetch(`/api/tours/${encodeURIComponent(tourId)}/rsvp`, { method: 'POST' });
      return;
    }
    setBandState((prev) =>
      prev
        ? {
            ...prev,
            tours: prev.tours.map((t) =>
              t.id === tourId ? { ...t, rsvpCount: t.rsvpCount + 1 } : t
            ),
          }
        : prev
    );
    if (backendMode === 'supabase') {
      await sbIncrementTourRsvp(tourId);
    }
  }

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
                city: city.trim() || 'Nusantara',
                message: message.trim(),
                createdAt: new Date().toISOString(),
              },
              ...prev.shoutouts,
            ],
          }
        : prev
    );
  }

  function handleLoginSuccess(email: string, token: string) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setAdminEmail(email);
    setIsAuthenticated(true);
  }

  async function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
    if (backendMode === 'express') {
      await fetch('/api/auth/logout', { method: 'POST' });
    } else if (backendMode === 'supabase') {
      await sbAdminLogout();
    }
  }

  if (loading && !bandState) {
    return (
      <div className="min-h-screen text-[#F5F2EB] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#D6CFC2]">Memuat profil Rasmalas...</p>
        </div>
      </div>
    );
  }

  if (error && !bandState) {
    return (
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
    );
  }

  if (!bandState) return null;

  return (
    <div className="min-h-screen text-[#F5F2EB]">
      <audio ref={audioRef} preload="metadata" />

      {viewMode === 'admin' ? (
        <AdminDashboard
          bandState={bandState}
          backendMode={backendMode}
          isAuthenticated={isAuthenticated}
          adminEmail={adminEmail}
          authToken={authToken}
          wsConnected={wsConnected}
          onlineCount={onlineCount}
          onBackToSite={() => {
            setViewMode('public');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLoginSuccess={handleLoginSuccess}
          onLogout={() => void handleLogout()}
          onRefreshState={refetch}
        />
      ) : (
        <div className={!miniDismissed && currentTrack ? 'pb-16' : ''}>
          {(() => {
            const visibleSections: SiteSection[] = [...(bandState.siteSections ?? [])]
              .filter((s) => s.visible)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            const musicSection = visibleSections.find((s) => s.builtinKey === 'musik');
            const jadwalSection = visibleSections.find((s) => s.builtinKey === 'jadwal');
            const footerLinks = visibleSections.filter((s) => s.showInNav);

            return (
              <>
                <Navbar
                  bandName={bandState.profile.name}
                  logoUrl={bandState.profile.logoUrl}
                  sections={bandState.siteSections ?? []}
                  isAdmin={isAuthenticated}
                  onOpenAdmin={() => {
                    setViewMode('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
                          onRsvpTour={handleRsvpTour}
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
                          wsConnected={wsConnected}
                          onlineCount={onlineCount}
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
                />
              </>
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
