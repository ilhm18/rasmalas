import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STATE } from '../shared/defaultState';
import type {
  BandProfile,
  BandState,
  GalleryPhoto,
  SiteSection,
  SocialChannel,
  SocialPost,
  FanShoutout,
  TourDate,
  Track,
  WsServerMessage,
} from '../shared/types';

interface SocialPayload {
  socialChannels: SocialChannel[];
  socialPosts: SocialPost[];
  shoutouts: FanShoutout[];
}

export function useBandRealtime() {
  const [bandState, setBandState] = useState<BandState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const fetchInitialState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('STATIC_FALLBACK');
      }
      const data = (await res.json()) as { state: BandState; onlineCount: number };
      setBandState(data.state);
      setOnlineCount(Math.max(1, data.onlineCount || 1));
      setBackendAvailable(true);
      setError(null);
    } catch {
      // Static hosting fallback (e.g. GitHub Pages without Node.js backend)
      setBandState((prev) => prev ?? DEFAULT_STATE);
      setBackendAvailable(false);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitialState();
  }, [fetchInitialState]);

  useEffect(() => {
    if (!backendAvailable) return;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (unmounted) return;
        attemptRef.current = 0;
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as WsServerMessage;
          if (msg.type === 'state:init') {
            setBandState(msg.payload as BandState);
            setLoading(false);
          } else if (msg.type === 'profile:updated') {
            setBandState((prev) =>
              prev ? { ...prev, profile: msg.payload as BandProfile } : prev
            );
          } else if (msg.type === 'sections:updated') {
            setBandState((prev) =>
              prev ? { ...prev, siteSections: msg.payload as SiteSection[] } : prev
            );
          } else if (msg.type === 'tracks:updated') {
            setBandState((prev) =>
              prev ? { ...prev, tracks: msg.payload as Track[] } : prev
            );
          } else if (msg.type === 'tours:updated') {
            setBandState((prev) =>
              prev ? { ...prev, tours: msg.payload as TourDate[] } : prev
            );
          } else if (msg.type === 'gallery:updated') {
            setBandState((prev) =>
              prev ? { ...prev, gallery: msg.payload as GalleryPhoto[] } : prev
            );
          } else if (msg.type === 'social:updated') {
            const payload = msg.payload as SocialPayload;
            setBandState((prev) =>
              prev
                ? {
                    ...prev,
                    socialChannels: payload.socialChannels,
                    socialPosts: payload.socialPosts,
                    shoutouts: payload.shoutouts,
                  }
                : prev
            );
          } else if (msg.type === 'presence:count') {
            const count = (msg.payload as { count: number }).count;
            setOnlineCount(Math.max(1, count));
          }
        } catch {
          // Ignore malformed ws messages
        }
      };

      socket.onclose = () => {
        if (unmounted) return;
        setWsConnected(false);
        const delay = Math.min(8000, 1000 * Math.pow(1.6, attemptRef.current));
        attemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [backendAvailable]);

  return {
    bandState,
    setBandState,
    loading,
    error,
    wsConnected,
    onlineCount,
    refetch: fetchInitialState,
  };
}
