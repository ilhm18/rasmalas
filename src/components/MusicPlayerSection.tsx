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
import { AnimatePresence, motion } from 'motion/react';
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

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
      className="border-b border-[#2A2620] py-16 lg:py-20 overflow-hidden"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10"
        >
          <div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Katalog Rilisan & Studio Dub Stream'}
            </h2>
          </div>
        </motion.div>

        {active ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Active Vinyl Deck */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 16 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
              className="lg:col-span-5 rounded-2xl border border-[#2A3024] dub-surface p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0" aria-hidden="true" />

              <div className="flex items-center gap-4 sm:gap-5 pt-1">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
                  {isPlaying && (
                    <div
                      aria-hidden="true"
                      className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#16A34A]/35 via-[#EAB308]/35 to-[#DC2626]/35 blur-md animate-bass-pulse"
                    />
                  )}
                  <div
                    className={`relative w-full h-full rounded-full overflow-hidden border-4 border-[#2A2620] shadow-xl ${
                      isPlaying ? 'animate-vinyl' : 'animate-vinyl-paused'
                    }`}
                  >
                    <ImageWithFallback
                      src={active.coverUrl}
                      alt={`Foto sampul ${active.title}`}
                      title={active.title}
                      className="w-full h-full object-cover"
                    />
                    <div aria-hidden="true" className="absolute inset-0 vinyl-grooves pointer-events-none" />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-[#090B08] border-2 border-[#EAB308]/60 shadow-inner"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <span
                        aria-hidden="true"
                        className="inline-flex items-end gap-[2px] h-3.5 px-1"
                      >
                        <span className="w-[3px] h-full bg-[#16A34A] rounded-full animate-eq-1" />
                        <span className="w-[3px] h-full bg-[#EAB308] rounded-full animate-eq-2" />
                        <span className="w-[3px] h-full bg-[#DC2626] rounded-full animate-eq-3" />
                        <span className="w-[3px] h-full bg-[#EAB308] rounded-full animate-eq-4" />
                      </span>
                    ) : null}
                    <p className="text-xs text-[#EAB308] font-semibold tracking-wide">
                      {isPlaying ? 'Sedang Diputar' : 'Siap Diputar'}
                    </p>
                  </div>
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
                  <motion.button
                    type="button"
                    data-track-select="true"
                    onClick={onPrev}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label="Lagu sebelumnya"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] text-[#F5F2EB] hover:bg-[#1F1C17] cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    data-track-select="true"
                    onClick={() => {
                      if (!currentTrack) {
                        onSelectTrack(active);
                      } else {
                        onTogglePlay();
                      }
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
                    className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-full bg-[#EAB308] text-[#0C0B09] hover:bg-[#FACC15] shadow-lg shadow-[#EAB308]/20 transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    data-track-select="true"
                    onClick={onNext}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label="Lagu berikutnya"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] text-[#F5F2EB] hover:bg-[#1F1C17] cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </motion.button>
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

              {/* Lyrics Toggle (Manual from Admin Dashboard) */}
              <div className="pt-2 border-t border-[#2A2620]">
                <button
                  type="button"
                  onClick={() => setShowLyrics((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] cursor-pointer min-h-[36px]"
                >
                  <FileText className="w-4 h-4 text-[#EAB308]" aria-hidden="true" />
                  <span>{showLyrics ? 'Tutup Lirik Lagu' : 'Lihat Lirik Lagu'}</span>
                </button>

                <AnimatePresence initial={false}>
                  {showLyrics && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                      className="mt-3 pt-3 border-t border-[#2A2620]/70 text-sm"
                    >
                      <p className="whitespace-pre-line text-[#D6CFC2] leading-relaxed">
                        {active.lyrics?.trim() || 'Lirik lagu belum ditambahkan.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Tracklist Table */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 16 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="lg:col-span-7 rounded-2xl border border-[#2A3024] dub-surface overflow-hidden shadow-2xl"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-[#2A2620] flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#F5F2EB]">
                  Daftar Putar ({tracks.length} Lagu)
                </span>
                <span className="text-xs text-[#A8A092]">
                  Klik lagu lain kapan saja untuk mengganti pemutaran
                </span>
              </div>

              <div className="divide-y divide-[#2A2620]/80">
                {tracks.map((track, idx) => {
                  const isActive = active.id === track.id;
                  const isCurrentlyPlaying = isActive && isPlaying;
                  return (
                    <motion.button
                      key={track.id}
                      type="button"
                      data-track-select="true"
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(idx * 0.05, 0.35),
                        ease: EASE_OUT_EXPO,
                      }}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        if (isActive && currentTrack) {
                          onTogglePlay();
                        } else {
                          onSelectTrack(track);
                        }
                      }}
                      className={`group relative w-full text-left px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#EAB308]/15 via-[#16A34A]/10 to-transparent'
                          : 'hover:bg-[#1B1814]/80'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-[#16A34A] via-[#EAB308] to-[#DC2626]"
                        />
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-6 sm:w-7 text-xs font-mono tabular-nums text-[#A8A092] shrink-0 flex items-center justify-center">
                          {isCurrentlyPlaying ? (
                            <span
                              aria-hidden="true"
                              className="inline-flex items-end gap-[2px] h-3.5"
                            >
                              <span className="w-[2.5px] h-full bg-[#16A34A] rounded-full animate-eq-1" />
                              <span className="w-[2.5px] h-full bg-[#EAB308] rounded-full animate-eq-2" />
                              <span className="w-[2.5px] h-full bg-[#DC2626] rounded-full animate-eq-3" />
                            </span>
                          ) : isActive ? (
                            <Play className="w-4 h-4 text-[#EAB308] fill-current" />
                          ) : (
                            <span className="group-hover:hidden">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          )}
                          {!isActive && (
                            <Play className="w-4 h-4 text-[#EAB308] hidden group-hover:inline-block" />
                          )}
                        </span>

                        <div
                          className={`w-11 h-11 rounded-lg overflow-hidden border shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                            isActive
                              ? 'border-[#EAB308]/70 shadow-md shadow-[#EAB308]/10'
                              : 'border-[#2A2620]'
                          }`}
                        >
                          <ImageWithFallback
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate transition-colors ${
                              isActive
                                ? 'text-[#EAB308]'
                                : 'text-[#F5F2EB] group-hover:text-[#EAB308]'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-[#A8A092] truncate">
                            {isCurrentlyPlaying
                              ? 'Sedang diputar · Audio streaming'
                              : track.lyrics?.trim()
                                ? 'Dilengkapi lirik lagu'
                                : 'Audio streaming'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-5 shrink-0 font-mono text-xs tabular-nums text-[#A8A092]">
                        <span className="hidden sm:inline">
                          {track.plays.toLocaleString('id-ID')} putar
                        </span>
                        <span
                          className={
                            isActive ? 'text-[#EAB308] font-semibold' : 'text-[#D6CFC2]'
                          }
                        >
                          {formatTime(track.durationSec)}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
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
