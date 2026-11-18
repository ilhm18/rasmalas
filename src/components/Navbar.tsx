import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { resolveAssetUrl } from '../shared/assetUrl';
import type { SiteSection } from '../shared/types';

interface NavbarProps {
  bandName: string;
  logoUrl?: string;
  sections: SiteSection[];
}

export function Navbar({ bandName, logoUrl, sections }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const navLinks = [...sections]
    .filter((s) => s.visible && s.showInNav)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      href: `#${s.slug}`,
      label: s.navLabel,
    }));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-[#2A3024] bg-[#090C08]/85 backdrop-blur-md"
    >
      <div className="relative h-[3px] w-full bg-[#1C2218] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 reggae-hairline opacity-35" />
        <motion.div
          style={{ scaleX }}
          className="h-full w-full origin-left reggae-hairline"
        />
      </div>

      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3">
        <a
          href="#top"
          className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded-sm transition-transform duration-200 hover:scale-[1.02]"
        >
          {logoUrl ? (
            <span className="inline-block h-9 w-28 sm:h-10 sm:w-36 overflow-hidden">
              <img
                src={resolveAssetUrl(logoUrl)}
                alt={bandName}
                className="h-full w-full object-cover object-center scale-[1.15]"
              />
            </span>
          ) : (
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#F5F2EB]">
              {bandName}
            </span>
          )}
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-[#A8A092] overflow-x-auto"
        >
          {navLinks.map((item, idx) => (
            <motion.a
              key={item.href}
              href={item.href}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.08 + idx * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="whitespace-nowrap shrink-0 py-1 transition-colors duration-150 hover:text-[#F5F2EB] hover:underline hover:underline-offset-8 decoration-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded-sm"
            >
              {item.label}
            </motion.a>
          ))}
        </nav>

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

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Navigasi seluler"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
