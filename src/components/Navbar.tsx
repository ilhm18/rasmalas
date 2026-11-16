import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { SiteSection } from '../shared/types';

interface NavbarProps {
  bandName: string;
  logoUrl?: string;
  sections: SiteSection[];
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export function Navbar({
  bandName,
  logoUrl,
  sections,
  isAdmin,
  onOpenAdmin,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [...sections]
    .filter((s) => s.visible && s.showInNav)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      href: `#${s.slug}`,
      label: s.navLabel,
    }));

  return (
    <header className="sticky top-0 z-40 border-b border-[#2A3024] bg-[#090C08]/85 backdrop-blur-md">
      <div className="h-[3px] w-full reggae-hairline" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-3">
        <a
          href="#top"
          className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded-sm"
        >
          {logoUrl ? (
            <span className="inline-block h-10 w-36 overflow-hidden">
              <img
                src={logoUrl}
                alt={bandName}
                className="h-full w-full object-cover object-center scale-[1.15]"
              />
            </span>
          ) : (
            <span className="font-display text-xl font-bold tracking-tight text-[#F5F2EB]">
              {bandName}
            </span>
          )}
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A8A092] overflow-x-auto"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 py-1 transition-colors duration-150 hover:text-[#F5F2EB] hover:underline hover:underline-offset-8 decoration-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#0C0B09] bg-[#EAB308] rounded-lg transition-colors duration-150 hover:bg-[#FACC15] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
          >
            {isAdmin ? 'Kelola Konten' : 'Masuk Admin'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[#2A2620] text-[#F5F2EB] hover:bg-[#161411] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Navigasi seluler"
          className="md:hidden border-t border-[#2A2620] bg-[#161411] px-6 py-4 flex flex-col gap-2"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="min-h-[44px] flex items-center text-sm font-medium text-[#D6CFC2] hover:text-[#EAB308]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
