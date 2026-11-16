import { ArrowRight, Play } from 'lucide-react';
import type { BandProfile } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface HeroSectionProps {
  profile: BandProfile;
  secondaryHref?: string;
  onPlayLatest: () => void;
}

export function HeroSection({
  profile,
  secondaryHref = '#jadwal',
  onPlayLatest,
}: HeroSectionProps) {
  return (
    <section id="top" className="border-b border-[#2A3024]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-8 sm:pt-10 pb-10 lg:pt-12 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col justify-center">
            {profile.kicker?.trim() && (
              <p className="text-xs font-medium tracking-wide text-[#EAB308] mb-3">
                {profile.kicker}
              </p>
            )}
            <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-[#F5F2EB] text-balance max-w-2xl">
              {profile.headline}
            </h1>
            <p className="mt-4 text-[15px] md:text-base leading-relaxed text-[#D6CFC2] max-w-[56ch]">
              {profile.subheadline}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={onPlayLatest}
                className="inline-flex items-center gap-2.5 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#090B08] bg-[#EAB308] rounded-lg transition-colors duration-150 hover:bg-[#FACC15] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                {profile.heroCtaPrimary || 'Putar Album Terbaru'}
              </button>

              <a
                href={secondaryHref}
                className="inline-flex items-center gap-2 min-h-[44px] px-2 text-sm font-medium text-[#F5F2EB] hover:text-[#EAB308] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                {profile.heroCtaSecondary || 'Lihat Jadwal'}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative w-full aspect-[4/3] lg:aspect-[5/4] max-h-[460px] overflow-hidden rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm">
              <ImageWithFallback
                src={profile.heroImage}
                alt={`Penampilan panggung live ${profile.name}`}
                title={profile.name}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090C08]/85 via-[#090C08]/25 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#EAB308]">
                    {profile.heroCardKicker || 'Jadwal Panggung Nusantara'}
                  </p>
                  <p className="text-sm font-semibold text-[#F5F2EB] mt-0.5">
                    {profile.heroCardTitle ||
                      'Sesi Panggung Terbuka & 12-Stack Sound System'}
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#D6CFC2] whitespace-nowrap shrink-0">
                  {profile.originCity}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[#2A3024] grid grid-cols-2 lg:grid-cols-4 gap-6">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="font-display text-2xl md:text-3xl font-bold text-[#F5F2EB] font-mono tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-[#A8A092]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
