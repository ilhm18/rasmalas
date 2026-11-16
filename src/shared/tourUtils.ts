import type { TourStatus } from './types';

export function getTodayYmd(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function isTourDatePast(dateStr: string): boolean {
  const clean = (dateStr || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return false;
  return clean < getTodayYmd();
}

export function normalizeTourStatus(dateStr: string, status: TourStatus): TourStatus {
  return isTourDatePast(dateStr) ? 'Selesai' : status;
}
