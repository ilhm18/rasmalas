import { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Search, Ticket, X } from 'lucide-react';
import { normalizeTourStatus } from '../shared/tourUtils';
import type { SiteSection, TourDate, TourStatus } from '../shared/types';

interface TourSectionProps {
  tours: TourDate[];
  sectionMeta?: SiteSection;
}

type TourFilter = 'all' | 'upcoming' | 'past';

function formatTourDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getStatusColor(status: TourStatus): string {
  switch (status) {
    case 'Tersedia':
      return 'text-[#4ADE80]';
    case 'Terbatas':
      return 'text-[#EAB308]';
    case 'Habis':
      return 'text-[#F87171]';
    case 'Selesai':
      return 'text-[#A8A092]';
  }
}

export function TourSection({ tours, sectionMeta }: TourSectionProps) {
  const [filter, setFilter] = useState<TourFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedTour, setSelectedTour] = useState<TourDate | null>(null);

  const normalizedTours = useMemo(
    () =>
      tours.map((t) => ({
        ...t,
        status: normalizeTourStatus(t.date, t.status),
      })),
    [tours]
  );

  const filteredTours = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalizedTours.filter((t) => {
      if (filter === 'upcoming' && t.status === 'Selesai') return false;
      if (filter === 'past' && t.status !== 'Selesai') return false;
      if (!q) return true;
      return (
        t.city.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q)
      );
    });
  }, [normalizedTours, filter, query]);

  return (
    <section
      id={sectionMeta?.slug || 'jadwal'}
      className="border-b border-[#2A2620] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F5F2EB] text-balance">
              {sectionMeta?.title || 'Jadwal Penampilan Rasmalas'}
            </h2>
            {sectionMeta?.subtitle && (
              <p className="mt-2 text-sm text-[#A8A092] max-w-[54ch]">
                {sectionMeta.subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#A8A092] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kota atau venue..."
                aria-label="Cari jadwal berdasarkan kota atau venue"
                className="w-full sm:w-56 min-h-[40px] pl-9 pr-3 text-sm bg-[#161411] border border-[#2A2620] rounded-lg text-[#F5F2EB] placeholder:text-[#787166] focus:outline-none focus:border-[#EAB308]"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-[#161411] border border-[#2A2620] rounded-lg">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'upcoming', label: 'Akan Datang' },
                  { id: 'past', label: 'Selesai' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab.id
                      ? 'bg-[#EAB308] text-[#0C0B09]'
                      : 'text-[#A8A092] hover:text-[#F5F2EB]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm divide-y divide-[#2A2620] overflow-hidden">
          {filteredTours.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#A8A092]">
              Tidak ada jadwal yang sesuai filter pencarian.
            </div>
          ) : (
            filteredTours.map((tour) => (
              <div
                key={tour.id}
                className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1B1814] transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 flex-1 items-center">
                  <div className="sm:col-span-3">
                    <p className="font-mono text-sm font-semibold tabular-nums text-[#F5F2EB]">
                      {formatTourDate(tour.date)}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-[#A8A092] mt-0.5">
                      {tour.stageTime}
                    </p>
                  </div>

                  <div className="sm:col-span-5">
                    <h3 className="text-base font-semibold text-[#F5F2EB]">{tour.venue}</h3>
                    <p className="text-xs text-[#A8A092] mt-0.5">
                      {tour.city}, {tour.country}
                    </p>
                  </div>

                  <div className="sm:col-span-4 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
                    <span className={`font-semibold ${getStatusColor(tour.status)}`}>
                      Status: {tour.status}
                    </span>
                    <span aria-hidden="true" className="text-[#575046]">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-[#D6CFC2]">
                      {tour.priceLabel}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTour(tour)}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg border border-[#2A2620] bg-[#0C0B09] text-[#F5F2EB] hover:border-[#EAB308] hover:text-[#EAB308] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Detail &amp; Tiket
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket / Tour Detail Modal */}
      {selectedTour && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTour(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#2A3024] bg-[#11150F]/80 backdrop-blur-sm p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#EAB308]">Informasi Pertunjukan</p>
                <h3
                  id="tour-modal-title"
                  className="font-display text-2xl font-bold text-[#F5F2EB] mt-1"
                >
                  {selectedTour.venue}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTour(null)}
                aria-label="Tutup modal detail jadwal"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-[#2A2620] text-[#A8A092] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 border-y border-[#2A2620] py-4 text-sm text-[#D6CFC2]">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                <span className="font-mono tabular-nums">
                  {formatTourDate(selectedTour.date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                <span className="font-mono tabular-nums">{selectedTour.stageTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                <span>
                  {selectedTour.city}, {selectedTour.country}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-[#EAB308] shrink-0" aria-hidden="true" />
                <span>
                  {selectedTour.priceLabel} · Status: {selectedTour.status}
                </span>
              </div>
            </div>

            {selectedTour.notes && (
              <p className="text-sm text-[#A8A092] leading-relaxed">{selectedTour.notes}</p>
            )}

            {selectedTour.ticketUrl && selectedTour.ticketUrl.startsWith('http') && (
              <div className="pt-2">
                <a
                  href={selectedTour.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center px-4 py-2 text-xs font-medium text-[#D6CFC2] border border-[#2A2620] rounded-lg hover:text-[#F5F2EB]"
                >
                  Buka Loket Resmi
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
