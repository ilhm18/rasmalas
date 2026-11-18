import { ArrowUpRight } from 'lucide-react';
import type { BandProfile, SiteSection } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface BandProfileSectionProps {
  profile: BandProfile;
  sectionMeta?: SiteSection;
}

function normalizeInstagramUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?instagram\.com\//i.test(trimmed)) {
    return `https://${trimmed.replace(/^www\./i, '')}`;
  }
  const cleanHandle = trimmed.replace(/^@+/, '').replace(/\/+$/, '');
  if (!cleanHandle) return null;
  return `https://instagram.com/${cleanHandle}`;
}

function formatInstagramHandle(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (match && match[1]) return `@${match[1].replace(/^@+/, '')}`;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function BandProfileSection({ profile, sectionMeta }: BandProfileSectionProps) {
  return (
    <section
      id={sectionMeta?.slug || 'profil'}
      className="border-b border-[#2A3024] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-[#2A3024] dub-surface shadow-xl aspect-[4/3] group">
              <div className="h-[2px] w-full reggae-hairline absolute top-0 inset-x-0 z-10" aria-hidden="true" />
              <ImageWithFallback
                src={profile.studioImage}
                alt={`Sesi rekaman studio analog ${profile.name}`}
                title="Studio Karang Analog"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {profile.profileSectionTitle?.trim() ||
                sectionMeta?.title ||
                'Rekaman Pita Analog, Akar Reggae Pesisir.'}
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6">
            <h3 className="font-display text-xl font-bold text-[#F5F2EB]">
              Formasi Panggung Utama
            </h3>
            <p className="text-xs text-[#A8A092]">
              {profile.profileSectionSubtitle?.trim() ||
                sectionMeta?.subtitle ||
                'Instrumen live tanpa backing track digital'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {profile.members.map((member) => {
              const igHref = normalizeInstagramUrl(member.instagramUrl);
              const igHandle = formatInstagramHandle(member.instagramUrl);
              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-[#2A3024] dub-surface dub-card-hover p-5 sm:p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-[#EAB308] font-medium">{member.role}</p>
                    <h4 className="font-display text-lg font-bold text-[#F5F2EB]">
                      {member.name}
                    </h4>
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[#A8A092]">
                      <span>{member.instrument}</span>
                      <span aria-hidden="true">·</span>
                      <span>{member.origin}</span>
                    </div>
                  </div>

                  {igHref && (
                    <div className="pt-3 border-t border-[#2A3024]/80">
                      <a
                        href={igHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] transition-colors min-h-[32px]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 text-[#EAB308] shrink-0"
                          aria-hidden="true"
                        >
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                        <span className="truncate">{igHandle}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-75" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
