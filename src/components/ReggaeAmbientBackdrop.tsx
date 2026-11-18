import { motion, useScroll, useTransform } from 'motion/react';

interface ReggaeAmbientBackdropProps {
  isPlaying: boolean;
}

const AMBIENT_PARTICLES = [
  { id: 'p1', left: '6%', top: '24%', size: 'w-2 h-2', color: 'bg-[#EAB308]/65', delay: '0s', duration: '8s' },
  { id: 'p2', left: '16%', top: '72%', size: 'w-2.5 h-2.5', color: 'bg-[#16A34A]/60', delay: '1.2s', duration: '10s' },
  { id: 'p3', left: '28%', top: '42%', size: 'w-2 h-2', color: 'bg-[#DC2626]/60', delay: '2.4s', duration: '9s' },
  { id: 'p4', left: '44%', top: '84%', size: 'w-2.5 h-2.5', color: 'bg-[#EAB308]/65', delay: '0.6s', duration: '11s' },
  { id: 'p5', left: '58%', top: '32%', size: 'w-2 h-2', color: 'bg-[#22C55E]/60', delay: '1.8s', duration: '9.5s' },
  { id: 'p6', left: '72%', top: '76%', size: 'w-2.5 h-2.5', color: 'bg-[#EAB308]/65', delay: '3.2s', duration: '8.5s' },
  { id: 'p7', left: '85%', top: '48%', size: 'w-2 h-2', color: 'bg-[#DC2626]/60', delay: '1.5s', duration: '10.5s' },
  { id: 'p8', left: '92%', top: '82%', size: 'w-2 h-2', color: 'bg-[#16A34A]/60', delay: '4.2s', duration: '9s' },
  { id: 'p9', left: '36%', top: '18%', size: 'w-1.5 h-1.5', color: 'bg-[#EAB308]/70', delay: '2.9s', duration: '7.8s' },
  { id: 'p10', left: '66%', top: '60%', size: 'w-2 h-2', color: 'bg-[#F97316]/60', delay: '0.9s', duration: '9.2s' },
] as const;

const FLOATING_NOTES = [
  { id: 'n1', left: '11%', top: '65%', color: 'text-[#16A34A]/45', delay: '0.4s', duration: '9s', symbol: '♪' },
  { id: 'n2', left: '24%', top: '82%', color: 'text-[#EAB308]/45', delay: '2.1s', duration: '10.5s', symbol: '♫' },
  { id: 'n3', left: '52%', top: '74%', color: 'text-[#DC2626]/40', delay: '1.3s', duration: '9.8s', symbol: '♪' },
  { id: 'n4', left: '79%', top: '68%', color: 'text-[#EAB308]/45', delay: '3.4s', duration: '11s', symbol: '♫' },
  { id: 'n5', left: '90%', top: '58%', color: 'text-[#22C55E]/45', delay: '0.8s', duration: '8.8s', symbol: '♪' },
] as const;

const SPECTRUM_BARS = Array.from({ length: 36 }, (_, idx) => {
  const ratio = idx / 35;
  const color =
    ratio < 0.33
      ? 'from-[#16A34A]/55 to-[#22C55E]/10'
      : ratio < 0.68
        ? 'from-[#EAB308]/55 to-[#FACC15]/10'
        : 'from-[#DC2626]/55 to-[#EF4444]/10';
  const animClass =
    idx % 4 === 0
      ? 'animate-eq-1'
      : idx % 4 === 1
        ? 'animate-eq-2'
        : idx % 4 === 2
          ? 'animate-eq-3'
          : 'animate-eq-4';
  const baseHeight = 24 + ((idx * 17) % 52);
  return { id: `bar-${idx}`, color, animClass, baseHeight };
});

export function ReggaeAmbientBackdrop({ isPlaying }: ReggaeAmbientBackdropProps) {
  const { scrollYProgress } = useScroll();
  const topVinylY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const bottomVinylY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const midWaveY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Sweeping Rasta Concert Stage Spotlights (Green · Gold · Red) */}
      <div
        className="animate-spotlight-left absolute -top-24 -left-16 w-[480px] sm:w-[680px] h-[95vh] blur-3xl"
        style={{
          background:
            'conic-gradient(from 135deg at 10% 0%, transparent 0deg, rgba(22, 163, 74, 0.26) 24deg, transparent 55deg)',
        }}
      />
      <div
        className="animate-spotlight-center absolute -top-28 left-1/2 -translate-x-1/2 w-[540px] sm:w-[760px] h-[95vh] blur-3xl"
        style={{
          background:
            'conic-gradient(from 160deg at 50% 0%, transparent 0deg, rgba(234, 179, 8, 0.24) 22deg, transparent 48deg)',
        }}
      />
      <div
        className="animate-spotlight-right absolute -top-24 -right-16 w-[480px] sm:w-[680px] h-[95vh] blur-3xl"
        style={{
          background:
            'conic-gradient(from 195deg at 90% 0%, transparent 0deg, rgba(220, 38, 38, 0.25) 24deg, transparent 55deg)',
        }}
      />

      {/* 2. Drifting Rasta Dub Aurora Orbs */}
      <div
        className={`animate-dub-orb-1 absolute -top-28 -left-20 h-[460px] w-[460px] sm:h-[640px] sm:w-[640px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-65' : 'opacity-42'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.48) 0%, rgba(21,128,61,0.18) 48%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-2 absolute top-[16%] left-[28%] h-[440px] w-[440px] sm:h-[580px] sm:w-[580px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-60' : 'opacity-38'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(234,179,8,0.42) 0%, rgba(202,138,4,0.15) 50%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-3 absolute top-[6%] -right-24 h-[460px] w-[460px] sm:h-[600px] sm:w-[600px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-58' : 'opacity-36'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(220,38,38,0.42) 0%, rgba(185,28,28,0.15) 50%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-2 absolute -bottom-32 left-[8%] h-[480px] w-[480px] sm:h-[640px] sm:w-[640px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-52' : 'opacity-34'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.38) 0%, rgba(234,179,8,0.15) 48%, transparent 72%)',
        }}
      />

      {/* 3. Giant Scroll-Reactive Rasta Dubplate Vinyl & Subwoofer Shockwaves (Top Right) */}
      <motion.div
        style={{ y: topVinylY }}
        className="absolute -top-36 -right-36 sm:-top-44 sm:-right-44 h-[420px] w-[420px] sm:h-[620px] sm:w-[620px]"
      >
        {/* Expanding Sound System Bass Shockwaves */}
        <div className="animate-sound-ripple absolute inset-6 rounded-full border border-[#EAB308]/25" />
        <div className="animate-sound-ripple-delayed absolute inset-12 rounded-full border border-[#16A34A]/25" />

        <div
          className={`animate-vinyl-bg relative h-full w-full rounded-full border border-[#EAB308]/22 vinyl-grooves transition-opacity duration-700 ${
            isPlaying ? 'opacity-95' : 'opacity-65'
          }`}
        >
          <div className="absolute inset-8 rounded-full border border-[#16A34A]/25" />
          <div className="absolute inset-16 rounded-full border border-dashed border-[#EAB308]/25" />
          <div className="absolute inset-24 rounded-full border border-[#DC2626]/25" />
          <div className="absolute inset-32 rounded-full border border-dashed border-[#22C55E]/22" />
          {/* Rasta Center Dubplate Label */}
          <div className="absolute inset-0 m-auto h-28 w-28 sm:h-36 sm:w-36 rounded-full border-2 border-[#EAB308]/35 bg-gradient-to-tr from-[#16A34A]/25 via-[#EAB308]/25 to-[#DC2626]/25 flex items-center justify-center animate-bass-pulse">
            <div className="h-6 w-6 rounded-full bg-[#060906] border border-[#EAB308]/50" />
          </div>
        </div>
      </motion.div>

      {/* 4. Giant Scroll-Reactive Rasta Dubplate Vinyl & Subwoofer Shockwaves (Bottom Left) */}
      <motion.div
        style={{ y: bottomVinylY }}
        className="absolute -bottom-40 -left-40 sm:-bottom-48 sm:-left-48 h-[400px] w-[400px] sm:h-[580px] sm:w-[580px]"
      >
        <div className="animate-sound-ripple absolute inset-8 rounded-full border border-[#16A34A]/25" />
        <div className="animate-sound-ripple-delayed absolute inset-14 rounded-full border border-[#DC2626]/22" />

        <div
          className={`animate-Vinyl-bg-reverse relative h-full w-full rounded-full border border-[#16A34A]/22 vinyl-grooves transition-opacity duration-700 ${
            isPlaying ? 'opacity-90' : 'opacity-60'
          }`}
        >
          <div className="absolute inset-10 rounded-full border border-dashed border-[#EAB308]/25" />
          <div className="absolute inset-20 rounded-full border border-[#DC2626]/22" />
          <div className="absolute inset-28 rounded-full border border-[#16A34A]/25" />
          <div className="absolute inset-0 m-auto h-24 w-24 sm:h-32 sm:w-32 rounded-full border-2 border-[#16A34A]/35 bg-gradient-to-bl from-[#DC2626]/25 via-[#EAB308]/25 to-[#16A34A]/25 flex items-center justify-center animate-bass-pulse">
            <div className="h-5 w-5 rounded-full bg-[#060906] border border-[#16A34A]/50" />
          </div>
        </div>
      </motion.div>

      {/* 5. Swaying Tropical Coastal Reggae Palm Frond Silhouettes (Left & Right) */}
      <svg
        viewBox="0 0 260 320"
        fill="none"
        className="animate-palm-left hidden sm:block absolute bottom-8 -left-10 w-56 h-72 opacity-22"
      >
        <path
          d="M10 320 C 40 220, 95 130, 210 45 C 145 95, 95 160, 55 255 Z"
          fill="url(#palmGradLeft)"
        />
        <path
          d="M0 280 C 45 200, 115 135, 240 85 C 165 125, 105 180, 35 265 Z"
          fill="url(#palmGradLeft)"
        />
        <path
          d="M20 320 C 65 245, 135 190, 250 150 C 175 185, 115 235, 55 310 Z"
          fill="url(#palmGradLeft)"
        />
        <defs>
          <linearGradient id="palmGradLeft" x1="0" y1="320" x2="240" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16A34A" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#EAB308" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        viewBox="0 0 260 320"
        fill="none"
        className="animate-palm-right hidden sm:block absolute bottom-12 -right-10 w-56 h-72 opacity-22"
      >
        <path
          d="M250 320 C 220 220, 165 130, 50 45 C 115 95, 165 160, 205 255 Z"
          fill="url(#palmGradRight)"
        />
        <path
          d="M260 280 C 215 200, 145 135, 20 85 C 95 125, 155 180, 225 265 Z"
          fill="url(#palmGradRight)"
        />
        <path
          d="M240 320 C 195 245, 125 190, 10 150 C 85 185, 145 235, 205 310 Z"
          fill="url(#palmGradRight)"
        />
        <defs>
          <linearGradient id="palmGradRight" x1="260" y1="320" x2="20" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#EAB308" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#16A34A" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>

      {/* 6. Mid-Screen Scroll-Linked Flowing Dub Echo Sine Waves */}
      <motion.div
        style={{ y: midWaveY }}
        className={`absolute top-[42%] inset-x-0 h-56 overflow-hidden transition-opacity duration-700 ${
          isPlaying ? 'opacity-45' : 'opacity-26'
        }`}
      >
        <svg
          viewBox="0 0 1600 200"
          fill="none"
          preserveAspectRatio="none"
          className="animate-wave-slide-reverse w-[200%] h-full"
        >
          <path
            d="M0 100 C 220 20, 440 180, 660 100 C 880 20, 1100 180, 1320 100 C 1460 40, 1540 150, 1600 100"
            stroke="#16A34A"
            strokeWidth="1.75"
            strokeDasharray="8 6"
            strokeOpacity="0.5"
          />
          <path
            d="M0 125 C 260 45, 460 190, 700 115 C 920 40, 1120 185, 1360 115 C 1480 65, 1550 165, 1600 120"
            stroke="#EAB308"
            strokeWidth="1.5"
            strokeOpacity="0.42"
          />
        </svg>
      </motion.div>

      {/* 7. Floating Musical Notes & Analog Studio Embers */}
      {AMBIENT_PARTICLES.map((p) => (
        <span
          key={p.id}
          className={`animate-dust absolute rounded-full blur-[0.5px] ${p.size} ${p.color}`}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {FLOATING_NOTES.map((note) => (
        <span
          key={note.id}
          className={`animate-dust absolute font-mono text-base sm:text-lg font-bold ${note.color}`}
          style={{
            left: note.left,
            top: note.top,
            animationDelay: note.delay,
            animationDuration: note.duration,
          }}
        >
          {note.symbol}
        </span>
      ))}

      {/* 8. Bottom Live Rasta Equalizer Spectrum + Flowing Analog Soundwave Ribbons */}
      <div
        className={`absolute bottom-0 inset-x-0 h-52 overflow-hidden transition-opacity duration-700 ${
          isPlaying ? 'opacity-55' : 'opacity-32'
        }`}
      >
        {/* 36-Bar Rasta Spectrum Horizon */}
        <div className="absolute bottom-0 inset-x-0 h-28 flex items-end justify-between gap-1 sm:gap-2 px-4 opacity-50">
          {SPECTRUM_BARS.map((b) => (
            <span
              key={b.id}
              className={`flex-1 rounded-t-full bg-gradient-to-t ${b.color} ${b.animClass}`}
              style={{ height: `${b.baseHeight}%` }}
            />
          ))}
        </div>

        <svg
          viewBox="0 0 1600 180"
          fill="none"
          preserveAspectRatio="none"
          className="animate-wave-slide relative z-10 w-[200%] h-full"
        >
          <path
            d="M0 105 C 200 35, 400 165, 600 92 C 800 25, 1000 160, 1200 88 C 1400 22, 1500 142, 1600 92"
            stroke="#16A34A"
            strokeWidth="2"
            strokeOpacity="0.62"
          />
          <path
            d="M0 128 C 240 60, 420 175, 660 108 C 880 42, 1060 168, 1280 102 C 1440 48, 1520 152, 1600 112"
            stroke="#EAB308"
            strokeWidth="2"
            strokeOpacity="0.58"
          />
          <path
            d="M0 148 C 180 86, 380 178, 620 126 C 860 70, 1080 176, 1320 120 C 1460 72, 1540 164, 1600 132"
            stroke="#DC2626"
            strokeWidth="2"
            strokeOpacity="0.52"
          />
        </svg>
      </div>
    </div>
  );
}
