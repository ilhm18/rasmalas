import type { BandProfile, SiteSection } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface BandProfileSectionProps {
  profile: BandProfile;
  sectionMeta?: SiteSection;
}

export function BandProfileSection({ profile, sectionMeta }: BandProfileSectionProps) {
  return (
    <section
      id={sectionMeta?.slug || 'profil'}
      className="border-b border-[#2A3024] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm aspect-[4/3]">
              <ImageWithFallback
                src={profile.studioImage}
                alt={`Sesi rekaman studio analog ${profile.name}`}
                title="Studio Karang Analog"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-medium tracking-wide text-[#EAB308]">
              {sectionMeta?.kicker || '01. Profil Kolektif & Filosofi Suara'}
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Rekaman Pita Analog, Akar Reggae Pesisir.'}
            </h2>
            <p className="text-[15px] md:text-base leading-relaxed text-[#D6CFC2] max-w-[68ch]">
              {profile.bio}
            </p>
            <blockquote className="pt-4 border-t border-[#2A3024] text-sm md:text-[15px] italic text-[#D6CFC2] max-w-[65ch]">
              “{profile.studioQuote}”
            </blockquote>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#A8A092]">
              <span>Basis Produksi: {profile.originCity}</span>
              <span aria-hidden="true">·</span>
              <span>Kontak Booking: {profile.bookingEmail}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-[#2A3024]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <h3 className="font-display text-xl font-bold text-[#F5F2EB]">
              Formasi Panggung Utama
            </h3>
            <p className="text-xs text-[#A8A092]">
              {sectionMeta?.subtitle || 'Instrumen live tanpa backing track digital'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profile.members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-6 space-y-2"
              >
                <p className="text-xs text-[#EAB308] font-medium">{member.role}</p>
                <h4 className="font-display text-lg font-bold text-[#F5F2EB]">
                  {member.name}
                </h4>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#A8A092]">
                  <span>{member.instrument}</span>
                  <span aria-hidden="true">·</span>
                  <span>{member.origin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
