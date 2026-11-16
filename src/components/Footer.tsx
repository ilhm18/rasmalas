import { ArrowUp, ArrowUpRight, Lock, Mail, MapPin } from 'lucide-react';
import { resolveAssetUrl } from '../shared/assetUrl';
import type { BandProfile, SiteSection, SocialChannel } from '../shared/types';

interface FooterProps {
  profile: BandProfile;
  links: SiteSection[];
  channels: SocialChannel[];
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export function Footer({
  profile,
  links,
  channels,
  isAdmin,
  onOpenAdmin,
}: FooterProps) {
  const activeChannels = channels.filter((c) => c.connected);
  const currentYear = new Date().getFullYear();

  const descriptionText =
    profile.footerDescription !== undefined
      ? profile.footerDescription.trim()
      : `${profile.footerNote ? `${profile.footerNote} — ` : ''}${profile.subheadline}`.trim();

  const originText = profile.originCity.trim();
  const bookingEmail = profile.bookingEmail.trim();

  const navItems = [
    ...links.map((sec) => ({
      id: `sec-${sec.id}`,
      label: sec.navLabel,
      url: `#${sec.slug}`,
    })),
    ...(profile.footerLinks ?? [])
      .filter((item) => item.label.trim() && item.url.trim())
      .map((item) => ({
        id: item.id,
        label: item.label.trim(),
        url: item.url.trim(),
      })),
  ];

  const copyrightText =
    profile.footerCopyright !== undefined
      ? profile.footerCopyright.trim()
      : `© ${currentYear} ${profile.name}. ${profile.footerNote || 'Roots Reggae & Analog Dub'}.`;

  const hasContactColumn = Boolean(bookingEmail) || activeChannels.length > 0;
  const hasNavColumn = navItems.length > 0;

  return (
    <footer className="relative border-t border-[#2A3024] bg-[#090C08]/95 backdrop-blur-md">
      <div className="h-[2px] w-full reggae-hairline opacity-80" aria-hidden="true" />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand & Info */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <a
              href="#top"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded-sm"
            >
              {profile.logoUrl ? (
                <span className="inline-block h-10 w-36 overflow-hidden">
                  <img
                    src={resolveAssetUrl(profile.logoUrl)}
                    alt={profile.name}
                    className="h-full w-full object-cover object-center scale-[1.15]"
                  />
                </span>
              ) : (
                <span className="font-display text-xl font-bold tracking-tight text-[#F5F2EB]">
                  {profile.name}
                </span>
              )}
            </a>

            {descriptionText && (
              <p className="text-sm leading-relaxed text-[#A8A092] max-w-[42ch]">
                {descriptionText}
              </p>
            )}

            {originText && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#D6CFC2]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EAB308]" aria-hidden="true" />
                  {originText}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          {hasNavColumn && (
            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#EAB308]">
                Navigasi
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 text-sm text-[#D6CFC2]">
                {navItems.map((item) => {
                  const isExternal = /^https?:\/\//i.test(item.url);
                  return (
                    <li key={item.id}>
                      <a
                        href={item.url}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1 py-0.5 hover:text-[#EAB308] transition-colors"
                      >
                        <span>{item.label}</span>
                        {isExternal && (
                          <ArrowUpRight className="w-3 h-3 text-[#EAB308]" aria-hidden="true" />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Booking & Official Channels */}
          {hasContactColumn && (
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#EAB308]">
                Kontak &amp; Kanal Resmi
              </h2>

              {bookingEmail && (
                <a
                  href={`mailto:${bookingEmail}`}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#2A3024] bg-[#11150F] px-4 py-2.5 text-sm font-medium text-[#F5F2EB] hover:border-[#EAB308] hover:text-[#EAB308] transition-colors w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                  <span className="truncate">{bookingEmail}</span>
                </a>
              )}

              {activeChannels.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeChannels.map((ch) => (
                    <a
                      key={ch.platform}
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3024] bg-[#11150F]/80 px-3 py-1.5 text-xs font-medium text-[#D6CFC2] hover:border-[#EAB308] hover:text-[#F5F2EB] transition-colors"
                    >
                      <span>{ch.platform}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#EAB308]" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-[#2A3024]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#787166]">
          {copyrightText ? (
            <p className="text-[#A8A092]">{copyrightText}</p>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-[#787166] hover:text-[#EAB308] transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>{isAdmin ? 'Dashboard Admin' : 'Login Admin'}</span>
            </button>

            <a
              href="#top"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6CFC2] hover:text-[#EAB308] transition-colors"
            >
              Kembali ke atas
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
