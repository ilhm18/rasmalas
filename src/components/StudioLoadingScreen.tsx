import { Disc3, Music2 } from 'lucide-react';
import { ReggaeAmbientBackdrop } from './ReggaeAmbientBackdrop';

export function StudioLoadingScreen() {
  return (
    <div className="relative min-h-screen text-[#F5F2EB] flex flex-col justify-between overflow-hidden">
      <div className="h-[3px] w-full reggae-hairline relative z-20" aria-hidden="true" />
      <ReggaeAmbientBackdrop isPlaying={true} />

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#2A3024] dub-surface p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
          <div
            className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0"
            aria-hidden="true"
          />

          {/* Spinning Analog Dubplate Vinyl */}
          <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 mb-7">
            {/* Ambient Rasta Halo */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#16A34A]/40 via-[#EAB308]/35 to-[#DC2626]/40 blur-xl animate-pulse"
            />

            {/* Outer Turntable Platter Ring */}
            <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-tr from-[#16A34A] via-[#EAB308] to-[#DC2626] shadow-2xl">
              {/* Spinning Vinyl Disc */}
              <div className="w-full h-full rounded-full bg-[#090B08] vinyl-grooves animate-vinyl relative flex items-center justify-center overflow-hidden border-2 border-[#1F241B]">
                {/* Vinyl Light Sheen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.14)_45deg,transparent_90deg,transparent_180deg,rgba(22,163,74,0.14)_225deg,transparent_270deg)]"
                />

                {/* Groove Rings */}
                <div className="absolute inset-3 rounded-full border border-[#F5F2EB]/10" />
                <div className="absolute inset-6 rounded-full border border-[#EAB308]/15" />
                <div className="absolute inset-9 rounded-full border border-[#F5F2EB]/10" />

                {/* Center Dubplate Label */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#EAB308] via-[#CA8A04] to-[#DC2626] p-0.5 shadow-inner flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#0E120C] flex items-center justify-center relative">
                    <Disc3 className="w-5 h-5 text-[#EAB308]" aria-hidden="true" />
                    <span
                      aria-hidden="true"
                      className="absolute w-2 h-2 rounded-full bg-[#060906] border border-[#EAB308]/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Music Note Badge */}
            <div
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border border-[#2A3024] bg-[#11150F] flex items-center justify-center shadow-lg text-[#EAB308]"
            >
              <Music2 className="w-4 h-4" />
            </div>
          </div>

          {/* Live Studio Spectrum Equalizer */}
          <div
            aria-hidden="true"
            className="flex items-end justify-center gap-1.5 h-6 mb-5"
          >
            <span className="w-1.5 h-full bg-[#16A34A] rounded-full animate-eq-1" />
            <span className="w-1.5 h-full bg-[#22C55E] rounded-full animate-eq-3" />
            <span className="w-1.5 h-full bg-[#EAB308] rounded-full animate-eq-2" />
            <span className="w-1.5 h-full bg-[#FACC15] rounded-full animate-eq-4" />
            <span className="w-1.5 h-full bg-[#EAB308] rounded-full animate-eq-1" />
            <span className="w-1.5 h-full bg-[#F97316] rounded-full animate-eq-3" />
            <span className="w-1.5 h-full bg-[#DC2626] rounded-full animate-eq-2" />
          </div>

          {/* Studio Text Hierarchy */}
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#EAB308] font-semibold">
            Pondok Ranggon, Jakarta Timur
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F2EB] tracking-tight mt-1.5">
            Rasmalas Official
          </h1>
          <p className="text-xs sm:text-sm text-[#A8A092] mt-2">
            memuat profile, harap tunggu...
          </p>

          {/* Animated Rasta Loading Meter */}
          <div className="mt-6 h-1.5 w-full rounded-full bg-[#1A2016] overflow-hidden p-[1px]">
            <div className="h-full w-full rounded-full reggae-hairline animate-pulse" />
          </div>
        </div>
      </div>

      <div className="relative z-10 pb-6 text-center">
        <p className="text-[11px] font-mono text-[#787166]">
          @rasmalas.official @2026
        </p>
      </div>
    </div>
  );
}
