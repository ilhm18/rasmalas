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

  const total = duration > 0 ? duration : track.durationSec;

  return (
    <div
      role="region"
      aria-label="Pemutar musik mini"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[#2A3024] bg-[#0B0E0A]/92 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-2 flex items-center justify-between gap-3">
        <a href="#musik" className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-md overflow-hidden border border-[#2A2620] shrink-0">
            <ImageWithFallback
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#F5F2EB] truncate">{track.title}</p>
            <p className="text-[11px] font-mono tabular-nums text-[#A8A092] truncate">
              {formatTime(currentTime)} / {formatTime(total)}
            </p>
          </div>
        </a>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Lagu sebelumnya"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#D6CFC2] hover:text-[#F5F2EB] cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full bg-[#EAB308] text-[#0C0B09] hover:bg-[#FACC15] cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            type="button"
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
