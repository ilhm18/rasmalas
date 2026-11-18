const DEVICE_ID_STORAGE_KEY = 'rasmalas_device_id_v1';
const LIKED_POSTS_STORAGE_KEY = 'rasmalas_liked_posts_v1';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && existing.trim().length >= 8) {
      return existing.trim();
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'fallback-device';
  }
}

export function getLikedPostIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

export function hasDeviceLikedPost(postId: string): boolean {
  return getLikedPostIds().has(postId);
}

export function markPostLikedOnDevice(postId: string): Set<string> {
  const next = getLikedPostIds();
  next.add(postId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function unmarkPostLikedOnDevice(postId: string): Set<string> {
  const next = getLikedPostIds();
  next.delete(postId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}
