import { useState } from 'react';
import {
  FileText,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { SiteSection, Track } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface MusicPlayerSectionProps {
  tracks: Track[];
  sectionMeta?: SiteSection;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatOne: boolean;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MusicPlayerSection({
  tracks,
  sectionMeta,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffle,
  repeatOne,
  onSelectTrack,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
}: MusicPlayerSectionProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const active = currentTrack ?? tracks[0] ?? null;
  const effectiveDuration = duration > 0 ? duration : active?.durationSec || 24;
  const progressPct = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  return (
    <section
      id={sectionMeta?.slug || 'musik'}
      className="border-b border-[#2A2620] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#EAB308] mb-2">
              {sectionMeta?.kicker || '02. Pemutar Musik Streaming'}
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Katalog Rilisan & Studio Dub Stream'}
            </h2>
          </div>
          <p className="text-sm text-[#A8A092] max-w-[42ch]">
            {sectionMeta?.subtitle ||
              'Putar langsung rekaman reggae one-drop dan sesi dub analog dengan kontrol pemutar penuh.'}
          </p>
        </div>

        {active ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Active Vinyl Deck */}
            <div className="lg:col-span-5 rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
                  <div
                    className={`w-full h-full rounded-full overflow-hidden border-4 border-[#2A2620] shadow-lg ${
                      isPlaying ? 'animate-vinyl' : 'animate-vinyl-paused'
                    }`}
                  >
                    <ImageWithFallback
                      src={active.coverUrl}
                      alt={`Foto sampul ${active.title}`}
                      title={active.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-[#0C0B09] border border-[#2A2620]"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-xs text-[#EAB308] font-medium">
                    {isPlaying ? 'Sedang Diputar' : 'Siap Diputar'}
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F2EB] leading-snug break-words">
                    {active.title}
                  </h3>
                  <p className="text-xs text-[#A8A092] font-mono tabular-nums">
                    {formatTime(effectiveDuration)} · {active.plays.toLocaleString('id-ID')} putar
                  </p>
                </div>
              </div>

              {/* Scrubber */}
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    aria-label="Posisi durasi lagu"
                    min={0}
                    max={effectiveDuration}
                    step={0.1}
                    value={Math.min(currentTime, effectiveDuration)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="w-full h-2 accent-[#EAB308] bg-[#2A2620] rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#A8A092]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{Math.round(progressPct)}%</span>
                  <span>{formatTime(effectiveDuration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2A2620]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleShuffle}
                    aria-label="Acak daftar putar"
                    aria-pressed={shuffle}
                    className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      shuffle
                        ? 'text-[#EAB308] bg-[#EAB308]/10'
                        : 'text-[#A8A092] hover:text-[#F5F2EB]'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleRepeat}
                    aria-label="Ulangi lagu"
                    aria-pressed={repeatOne}
                    className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      repeatOne
                        ? 'text-[#EAB308] bg-[#EAB308]/10'
                        : 'text-[#A8A092] hover:text-[#F5F2EB]'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrev}
                    aria-label="Lagu sebelumnya"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] text-[#F5F2EB] hover:bg-[#1F1C17] cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentTrack) {
                        onSelectTrack(active);
                      } else {
                        onTogglePlay();
                      }
                    }}
                    aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
                    className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-full bg-[#EAB308] text-[#0C0B09] hover:bg-[#FACC15] transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    aria-label="Lagu berikutnya"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] text-[#F5F2EB] hover:bg-[#1F1C17] cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Bunyikan audio' : 'Bisukan audio'}
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    aria-label="Volume audio"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-16 accent-[#EAB308] cursor-pointer hidden sm:block"
                  />
                </div>
              </div>

              {/* Lyrics Toggle */}
              <div className="pt-2 border-t border-[#2A2620]">
                <button
                  type="button"
                  onClick={() => setShowLyrics((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer min-h-[36px]"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  {showLyrics ? 'Tutup Lirik Lagu' : 'Lihat Lirik Lagu'}
                </button>

                {showLyrics && (
                  <div className="mt-3 pt-3 border-t border-[#2A2620]/70 text-sm">
                    <p className="whitespace-pre-line text-[#D6CFC2] leading-relaxed">
                      {active.lyrics?.trim() || 'Lirik lagu belum ditambahkan.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tracklist Table */}
            <div className="lg:col-span-7 rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-[#2A2620] flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#F5F2EB]">
                  Daftar Putar ({tracks.length} Lagu)
                </span>
                <span className="text-xs text-[#A8A092]">
                  Klik lagu untuk memutar audio
                </span>
              </div>

              <div className="divide-y divide-[#2A2620]">
                {tracks.map((track, idx) => {
                  const isActive = active.id === track.id;
                  const isCurrentlyPlaying = isActive && isPlaying;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        if (isActive && currentTrack) {
                          onTogglePlay();
                        } else {
                          onSelectTrack(track);
                        }
                      }}
                      className={`w-full text-left px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors duration-150 cursor-pointer ${
                        isActive ? 'bg-[#1F1C17]' : 'hover:bg-[#1B1814]'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-6 sm:w-7 text-xs font-mono tabular-nums text-[#A8A092] shrink-0">
                          {isCurrentlyPlaying ? (
                            <Pause className="w-4 h-4 text-[#EAB308]" />
                          ) : isActive ? (
                            <Play className="w-4 h-4 text-[#EAB308]" />
                          ) : (
                            String(idx + 1).padStart(2, '0')
                          )}
                        </span>

                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#2A2620] shrink-0">
                          <ImageWithFallback
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isActive ? 'text-[#EAB308]' : 'text-[#F5F2EB]'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-[#A8A092] truncate">
                            {track.lyrics?.trim() ? 'Dilengkapi lirik lagu' : 'Audio streaming'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-5 shrink-0 font-mono text-xs tabular-nums text-[#A8A092]">
                        <span className="hidden sm:inline">
                          {track.plays.toLocaleString('id-ID')} putar
                        </span>
                        <span className="text-[#D6CFC2]">{formatTime(track.durationSec)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#2A2620] bg-[#161411] p-10 text-center text-sm text-[#A8A092]">
            Belum ada lagu di daftar putar. Admin dapat menambahkan lagu melalui Panel Admin.
          </div>
        )}
      </div>
    </section>
  );
}
