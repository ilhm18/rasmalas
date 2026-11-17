interface ReggaeAmbientBackdropProps {
  isPlaying: boolean;
}

export function ReggaeAmbientBackdrop({ isPlaying }: ReggaeAmbientBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Drifting Rasta Dub Aurora Orbs */}
      <div
        className={`animate-dub-orb-1 absolute -top-32 -left-24 h-[440px] w-[440px] sm:h-[600px] sm:w-[600px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-45' : 'opacity-28'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.42) 0%, rgba(21,128,61,0.14) 45%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-2 absolute top-[18%] left-[32%] h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-42' : 'opacity-25'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(234,179,8,0.36) 0%, rgba(202,138,4,0.12) 48%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-3 absolute top-[8%] -right-28 h-[440px] w-[440px] sm:h-[580px] sm:w-[580px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-40' : 'opacity-24'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(220,38,38,0.35) 0%, rgba(185,28,28,0.12) 48%, transparent 72%)',
        }}
      />

      <div
        className={`animate-dub-orb-2 absolute -bottom-36 left-[10%] h-[460px] w-[460px] sm:h-[620px] sm:w-[620px] rounded-full transition-opacity duration-1000 ${
          isPlaying ? 'opacity-36' : 'opacity-20'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(22,163,74,0.32) 0%, rgba(234,179,8,0.12) 45%, transparent 72%)',
        }}
      />

      {/* Giant Architectural Vinyl Dubplate Rings (Top Right) */}
      <div
        className={`animate-vinyl-bg absolute -top-64 -right-64 h-[560px] w-[560px] sm:h-[740px] sm:w-[740px] rounded-full border border-[#EAB308]/10 transition-opacity duration-700 ${
          isPlaying ? 'opacity-90' : 'opacity-45'
        }`}
      >
        <div className="absolute inset-10 rounded-full border border-[#16A34A]/10" />
        <div className="absolute inset-20 rounded-full border border-dashed border-[#EAB308]/10" />
        <div className="absolute inset-32 rounded-full border border-[#DC2626]/10" />
        <div className="absolute inset-44 rounded-full border border-[#EAB308]/10" />
      </div>

      {/* Giant Architectural Vinyl Dubplate Rings (Bottom Left) */}
      <div
        className={`animate-vinyl-bg absolute -bottom-72 -left-72 h-[540px] w-[540px] sm:h-[700px] sm:w-[700px] rounded-full border border-[#16A34A]/10 transition-opacity duration-700 ${
          isPlaying ? 'opacity-85' : 'opacity-40'
        }`}
      >
        <div className="absolute inset-12 rounded-full border border-dashed border-[#EAB308]/10" />
        <div className="absolute inset-24 rounded-full border border-[#DC2626]/10" />
        <div className="absolute inset-36 rounded-full border border-[#16A34A]/10" />
      </div>

      {/* Flowing Analog Soundwave SVG Ribbons */}
      <div
        className={`absolute bottom-0 inset-x-0 h-48 overflow-hidden transition-opacity duration-700 ${
          isPlaying ? 'opacity-35' : 'opacity-18'
        }`}
      >
        <svg
          viewBox="0 0 1600 180"
          fill="none"
           preserveAspectRatio="none"
          className="animate-wave-slide w-[200%] h-full"
        >
          <path
            d="M0 110 C 200 40, 400 160, 600 95 C 800 30, 1000 155, 1200 90 C 1400 25, 1500 140, 1600 95"
            stroke="#16A34A"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
          <path
            d="M0 130 C 240 65, 420 175, 660 110 C 880 45, 1060 165, 1280 105 C 1440 50, 1520 150, 1600 115"
            stroke="#EAB308"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <path
            d="M0 150 C 180 90, 380 178, 620 128 C 860 72, 1080 175, 1320 122 C 1460 75, 1540 162, 1600 135"
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
        </svg>
      </div>
    </div>
  );
}
