import type { FlowApi } from '@/api/FlowApi';
import { earliestUrlExpiry, isUrlExpired } from '@/api/urlExpiry';
import type { VideoObject } from '@/types/video';

export interface CachedFlowApi extends FlowApi {
  /** Drops the cached list and notifies subscribers so they refetch. */
  invalidate(): void;
  subscribe(listener: () => void): () => void;
}

/**
 * Keeps the listed videos in memory. While every URL is still valid the cached
 * copy is returned, so both tabs share a single request. When a URL expires (or
 * `invalidate` is called) the next call refetches; a timer also notifies
 * subscribers exactly when the earliest URL expires.
 */
export function createCachedFlowApi(api: FlowApi): CachedFlowApi {
  let items: VideoObject[] | null = null;
  let inflight: Promise<VideoObject[]> | null = null;
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function clearExpiryTimer(): void {
    if (expiryTimer) {
      clearTimeout(expiryTimer);
      expiryTimer = null;
    }
  }

  function scheduleExpiry(list: VideoObject[]): void {
    clearExpiryTimer();
    const expiry = earliestUrlExpiry(list);
    if (expiry === null) return;

    const delay = Math.max(0, expiry - Date.now()) + 50;
    expiryTimer = setTimeout(() => {
      items = null;
      expiryTimer = null;
      notify();
    }, delay);
  }

  async function listVideos(): Promise<VideoObject[]> {
    const hasValidCache =
      items !== null && !items.some((video) => isUrlExpired(video.url));
    if (hasValidCache) return items as VideoObject[];

    if (inflight) return inflight;

    inflight = api
      .listVideos()
      .then((result) => {
        items = result;
        scheduleExpiry(result);
        return result;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  }

  function invalidate(): void {
    items = null;
    clearExpiryTimer();
    notify();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    presignUpload: (key, contentType) => api.presignUpload(key, contentType),
    listVideos,
    invalidate,
    subscribe,
  };
}
