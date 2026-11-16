import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Film, X } from 'lucide-react';
import { resolveAssetUrl } from '../shared/assetUrl';
import type { GalleryCategory, GalleryPhoto, SiteSection } from '../shared/types';
import { ImageWithFallback } from './ImageWithFallback';

interface GallerySectionProps {
  photos: GalleryPhoto[];
  sectionMeta?: SiteSection;
}

type GalleryFilter = 'Semua' | GalleryCategory;

function isVideoItem(photo: GalleryPhoto): boolean {
  if (photo.mediaType === 'video') return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(photo.imageUrl);
}

const SLIDE_SIZE = 5;

export function GallerySection({ photos, sectionMeta }: GallerySectionProps) {
  const [filter, setFilter] = useState<GalleryFilter>('Semua');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'Semua') return photos;
    return photos.filter((p) => p.category === filter);
  }, [photos, filter]);

  const slides = useMemo(() => {
    const chunks: GalleryPhoto[][] = [];
    for (let i = 0; i < filtered.length; i += SLIDE_SIZE) {
      chunks.push(filtered.slice(i, i + SLIDE_SIZE));
    }
    return chunks;
  }, [filtered]);

  useEffect(() => {
    setCurrentSlide(0);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [filter, filtered.length]);

  function goToSlide(index: number) {
    const el = sliderRef.current;
    if (!el || slides.length === 0) return;
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentSlide(clamped);
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }

  function handleSliderScroll() {
    const el = sliderRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== currentSlide && idx >= 0 && idx < slides.length) {
      setCurrentSlide(idx);
    }
  }

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % filtered.length
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + filtered.length) % filtered.length
        );
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, filtered.length]);

  const activePhoto = activeIndex !== null ? filtered[activeIndex] ?? null : null;

  return (
    <section
      id={sectionMeta?.slug || 'galeri'}
      className="border-b border-[#2A2620] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Arsip Panggung, Studio & Backstage'}
            </h2>
            {sectionMeta?.subtitle && (
              <p className="mt-2 text-sm text-[#A8A092] max-w-[54ch]">
                {sectionMeta.subtitle}
              </p>
            )}
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#161411] border border-[#2A2620] rounded-lg self-start sm:self-auto">
            {(['Semua', 'Panggung', 'Studio', 'Backstage'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFilter(cat);
                  setActiveIndex(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === cat
                    ? 'bg-[#EAB308] text-[#0C0B09]'
                    : 'text-[#A8A092] hover:text-[#F5F2EB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-10 text-center text-sm text-[#A8A092]">
            Belum ada foto atau video pada kategori ini.
          </div>
        ) : (
          <>
            {/* Mobile & Tablet (< lg): Vertical Scroll Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:hidden">
              {filtered.map((photo, globalIndex) => {
                const isVideo = isVideoItem(photo);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveIndex(globalIndex)}
                    className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]"
                  >
                    {isVideo ? (
                      <video
                        src={resolveAssetUrl(photo.imageUrl)}
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="metadata"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <ImageWithFallback
                        src={photo.imageUrl}
                        alt={`${photo.title} — ${photo.location}`}
                        title={photo.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    )}
                    {isVideo && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-[#2A3024] bg-[#0C0B09]/85 px-2.5 py-1 text-[11px] font-medium text-[#EAB308]">
                        <Film className="w-3.5 h-3.5" aria-hidden="true" />
                        Video
                      </span>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0B09]/90 via-[#0C0B09]/25 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <p className="text-xs text-[#EAB308] font-medium">
                        {photo.category} · {photo.dateLabel}
                      </p>
                      <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F2EB] mt-0.5 line-clamp-1">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-[#A8A092] mt-0.5 truncate">
                        {photo.location} · Oleh {photo.photographer}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop (lg+): Bento Slide Carousel */}
            <div className="hidden lg:block space-y-4">
              <div
                ref={sliderRef}
                onScroll={handleSliderScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {slides.map((slideItems, slideIdx) => (
                  <div
                    key={`slide-${slideIdx}`}
                    className="w-full shrink-0 snap-start grid grid-cols-4 gap-5 auto-rows-[240px]"
                  >
                    {slideItems.map((photo, localIdx) => {
                      const globalIndex = slideIdx * SLIDE_SIZE + localIdx;
                      const isHeroTile = localIdx === 0 && slideItems.length >= 3;
                      const isVideo = isVideoItem(photo);
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setActiveIndex(globalIndex)}
                          className={`group relative overflow-hidden rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] ${
                            isHeroTile
                              ? 'col-span-2 row-span-2'
                              : 'col-span-1 row-span-1'
                          }`}
                        >
                          {isVideo ? (
                            <video
                              src={resolveAssetUrl(photo.imageUrl)}
                              muted
                              playsInline
                              loop
                              autoPlay
                              preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <ImageWithFallback
                              src={photo.imageUrl}
                              alt={`${photo.title} — ${photo.location}`}
                              title={photo.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          )}
                          {isVideo && (
                            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-[#2A3024] bg-[#0C0B09]/85 px-2.5 py-1 text-[11px] font-medium text-[#EAB308]">
                              <Film className="w-3.5 h-3.5" aria-hidden="true" />
                              Video
                            </span>
                          )}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0B09]/90 via-[#0C0B09]/25 to-transparent"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <p className="text-xs text-[#EAB308] font-medium">
                              {photo.category} · {photo.dateLabel}
                            </p>
                            <h3 className="font-display text-lg font-bold text-[#F5F2EB] mt-0.5 line-clamp-1">
                              {photo.title}
                            </h3>
                            <p className="text-xs text-[#A8A092] mt-0.5 truncate">
                              {photo.location} · Oleh {photo.photographer}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {slides.length > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs font-mono tabular-nums text-[#A8A092]">
                    Slide {currentSlide + 1} / {slides.length} · Geser ke samping untuk lihat lainnya
                  </p>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="flex items-center gap-1.5">
                      {slides.map((_, dotIdx) => (
                        <button
                          key={`dot-${dotIdx}`}
                          type="button"
                          onClick={() => goToSlide(dotIdx)}
                          aria-label={`Lihat slide galeri ${dotIdx + 1}`}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            currentSlide === dotIdx
                              ? 'w-6 bg-[#EAB308]'
                              : 'w-2 bg-[#2A3024] hover:bg-[#575046]'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => goToSlide(currentSlide - 1)}
                        disabled={currentSlide === 0}
                        aria-label="Slide galeri sebelumnya"
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[#2A3024] bg-[#11150F] text-[#F5F2EB] hover:border-[#EAB308] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToSlide(currentSlide + 1)}
                        disabled={currentSlide >= slides.length - 1}
                        aria-label="Slide galeri berikutnya"
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[#2A3024] bg-[#11150F] text-[#F5F2EB] hover:border-[#EAB308] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {activePhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau media ${activePhoto.title}`}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="flex items-center justify-between gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-[#A8A092]">
              <span className="font-mono tabular-nums text-[#F5F2EB]">
                {activeIndex + 1} / {filtered.length}
              </span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <span>{activePhoto.category}</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Tutup lightbox media"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] bg-[#161411] text-[#F5F2EB] hover:border-[#EAB308] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center my-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((activeIndex - 1 + filtered.length) % filtered.length)
                }
                aria-label="Media sebelumnya"
                className="absolute left-2 sm:left-4 z-10 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-[#2A2620] bg-[#161411]/90 text-[#F5F2EB] hover:border-[#EAB308] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="max-h-full max-w-5xl overflow-hidden rounded-xl border border-[#2A2620]">
              {isVideoItem(activePhoto) ? (
                <video
                  src={resolveAssetUrl(activePhoto.imageUrl)}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[72vh] w-auto max-w-full mx-auto bg-black"
                />
              ) : (
                <ImageWithFallback
                  src={activePhoto.imageUrl}
                  alt={activePhoto.title}
                  title={activePhoto.title}
                  className="max-h-[72vh] w-auto object-contain mx-auto"
                />
              )}
            </div>

            {filtered.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % filtered.length)}
                aria-label="Media berikutnya"
                className="absolute right-2 sm:right-4 z-10 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-[#2A2620] bg-[#161411]/90 text-[#F5F2EB] hover:border-[#EAB308] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div
            className="mx-auto max-w-3xl text-center space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F2EB]">
              {activePhoto.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#A8A092]">
              {activePhoto.location} · {activePhoto.dateLabel} · Kredit Foto:{' '}
              {activePhoto.photographer}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
