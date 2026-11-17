import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import type { Track } from '../shared/types';
import { formatTime } from './MusicPlayerSection';
import { ImageWithFallback } from './ImageWithFallback';

interface StickyMiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}

export function StickyMiniPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onDismiss,
}: StickyMiniPlayerProps) {
  if (!track) return null;

  const total = duration > 0 ? duration : track.durationSec || 1;
  const pct = Math.min(100, Math.max(0, (currentTime / total) * 100));

  return (
    <div
      role="region"
      aria-label="Pemutar musik mini"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[#2A3024] bg-[#080B07]/95 backdrop-blur-xl shadow-2xl"
    >
      <div className="h-[2px] w-full bg-[#1C2218] overflow-hidden" aria-hidden="true">
        <div
          className="h-full reggae-hairline transition-transform duration-200 origin-left"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-2.5 flex items-center justify-between gap-3">
        <a href="#musik" className="flex items-center gap-3 min-w-0 flex-1 group">
          <div
            className={`w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAB308]/50 shrink-0 ${
              isPlaying ? 'animate-vinyl' : 'animate-vinyl-paused'
            }`}
          >
            <ImageWithFallback
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isPlaying && (
                <span aria-hidden="true" className="inline-flex items-end gap-[2px] h-3 shrink-0">
                  <span className="w-[2px] h-full bg-[#16A34A] rounded-full animate-eq-1" />
                  <span className="w-[2px] h-full bg-[#EAB308] rounded-full animate-eq-2" />
                  <span className="w-[2px] h-full bg-[#DC2626] rounded-full animate-eq-3" />
                </span>
              )}
              <p className="text-xs font-semibold text-[#F5F2EB] group-hover:text-[#EAB308] transition-colors truncate">
                {track.title}
              </p>
            </div>
            <p className="text-[11px] font-mono tabular-nums text-[#A8A092] truncate">
              {formatTime(currentTime)} / {formatTime(total)}
            </p>
          </div>
        </a>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-track-select="true"
            onClick={onPrev}
            aria-label="Lagu sebelumnya"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#F5F2EB] cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-track-select="true"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full bg-[#EAB308] text-[#0C0B09] hover:bg-[#FACC15] shadow-md shadow-[#EAB308]/20 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            type="button"
            data-track-select="true"
            onClick={onNext}
            aria-label="Lagu berikutnya"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#F5F2EB] cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup pemutar mini"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
