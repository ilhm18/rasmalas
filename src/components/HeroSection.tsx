import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { BandProfile } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface HeroSectionProps {
  profile: BandProfile;
  secondaryHref?: string;
  onPlayLatest: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({
  profile,
  secondaryHref = '#jadwal',
  onPlayLatest,
}: HeroSectionProps) {
  return (
    <section id="top" className="relative border-b border-[#2A3024] overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-8 sm:pt-10 pb-10 lg:pt-12 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            {profile.kicker?.trim() && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="text-xs font-semibold tracking-wider uppercase text-[#EAB308] mb-3"
              >
                {profile.kicker}
              </motion.p>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease: EASE_OUT_EXPO }}
              className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-[#F5F2EB] text-balance max-w-2xl"
            >
              {profile.headline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22, ease: EASE_OUT_EXPO }}
              className="mt-4 text-[15px] md:text-base leading-relaxed text-[#D6CFC2] max-w-[56ch]"
            >
              {profile.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3, ease: EASE_OUT_EXPO }}
              className="mt-7 flex flex-wrap items-center gap-4 sm:gap-5"
            >
              <motion.button
                type="button"
                data-track-select="true"
                onClick={onPlayLatest}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#090B08] bg-[#EAB308] rounded-lg shadow-lg shadow-[#EAB308]/25 transition-colors duration-200 hover:bg-[#FACC15] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                {profile.heroCtaPrimary || 'Putar Album Terbaru'}
              </motion.button>

              <motion.a
                href={secondaryHref}
                whileHover={{ x: 4 }}
                className="group inline-flex items-center gap-2 min-h-[44px] px-2 text-sm font-medium text-[#F5F2EB] hover:text-[#EAB308] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                {profile.heroCtaSecondary || 'Lihat Jadwal'}
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: EASE_OUT_EXPO }}
            className="lg:col-span-6"
          >
            <div className="relative animate-float-gentle">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#16A34A]/25 via-[#EAB308]/20 to-[#DC2626]/25 blur-xl"
              />
              <div className="relative w-full aspect-[4/3] lg:aspect-[5/4] max-h-[460px] overflow-hidden rounded-2xl border border-[#2A3024] dub-surface shadow-2xl group">
                <div className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0 z-10" aria-hidden="true" />
                <ImageWithFallback
                  src={profile.heroImage}
                  alt={`Penampilan panggung live ${profile.name}`}
                  title={profile.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090C08]/90 via-[#090C08]/25 to-transparent"
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
          </motion.div>
        </div>

        <div className="mt-10 pt-8 border-t border-[#2A3024] grid grid-cols-2 lg:grid-cols-4 gap-6">
          {profile.stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: EASE_OUT_EXPO,
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              className="rounded-xl border border-[#2A3024]/60 dub-surface p-4 dub-card-hover space-y-1"
            >
              <p className="font-display text-2xl md:text-3xl font-bold text-[#F5F2EB] font-mono tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-[#A8A092]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
