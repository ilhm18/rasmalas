export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${normalizedBase}${cleanPath}`;
}
