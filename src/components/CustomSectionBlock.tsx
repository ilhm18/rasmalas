import { ArrowRight } from 'lucide-react';
import { resolveAssetUrl } from '../shared/assetUrl';
import type { SiteSection } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface CustomSectionBlockProps {
  section: SiteSection;
}

export function CustomSectionBlock({ section }: CustomSectionBlockProps) {
  const hasMedia = Boolean(section.imageUrl && section.imageUrl.trim());
  const isVideo =
    hasMedia &&
    (section.mediaType === 'video' ||
      /\.(mp4|webm|mov)(\?|$)/i.test(section.imageUrl || ''));

  return (
    <section
      id={section.slug}
      className="border-b border-[#2A3024] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div
          className={
            hasMedia
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'
              : 'max-w-3xl space-y-5'
          }
        >
          <div className={hasMedia ? 'lg:col-span-7 space-y-5' : 'space-y-5'}>
            {section.kicker && (
              <p className="text-xs font-medium tracking-wide text-[#EAB308]">
                {section.kicker}
              </p>
            )}
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-base font-medium text-[#D6CFC2] max-w-[62ch]">
                {section.subtitle}
              </p>
            )}
            {section.body && (
              <div className="text-[15px] md:text-base leading-relaxed text-[#A8A092] whitespace-pre-line max-w-[68ch]">
                {section.body}
              </div>
            )}
            {section.ctaLabel && section.ctaUrl && (
              <div className="pt-2">
                <a
                  href={section.ctaUrl}
                  target={section.ctaUrl.startsWith('http') ? '_blank' : undefined}
                  rel={
                    section.ctaUrl.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#090B08] bg-[#EAB308] rounded-lg hover:bg-[#FACC15] transition-colors"
                >
                  {section.ctaLabel}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          {hasMedia && section.imageUrl && (
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm aspect-[4/3]">
                {isVideo ? (
                  <video
                    src={resolveAssetUrl(section.imageUrl)}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover bg-black"
                  />
                ) : (
                  <ImageWithFallback
                    src={section.imageUrl}
                    alt={section.title}
                    title={section.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
