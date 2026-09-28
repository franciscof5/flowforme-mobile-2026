import type { VideoObject } from '@/types/video';

function splitQuery(url: string): { path: string; query: string; hash: string } {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex === -1) return { path: withoutHash, query: '', hash };
  return {
    path: withoutHash.slice(0, queryIndex),
    query: withoutHash.slice(queryIndex + 1),
    hash,
  };
}

export function readQueryParam(url: string, key: string): string | null {
  const { query } = splitQuery(url);
  if (!query) return null;

  for (const part of query.split('&')) {
    if (!part) continue;
    const separator = part.indexOf('=');
    const rawKey = separator === -1 ? part : part.slice(0, separator);
    if (decodeURIComponent(rawKey) !== key) continue;
    const rawValue = separator === -1 ? '' : part.slice(separator + 1);
    return decodeURIComponent(rawValue);
  }
  return null;
}

export function appendQueryParam(url: string, key: string, value: string): string {
  const { path, query, hash } = splitQuery(url);
  const pair = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  const nextQuery = query ? `${query}&${pair}` : pair;
  return `${path}?${nextQuery}${hash}`;
}

/**
 * Reads the expiry encoded in a (presigned) URL. Supports the common
 * `expires` / `Expires` query params, in seconds or milliseconds.
 */
export function getUrlExpiry(url: string): number | null {
  const raw = readQueryParam(url, 'expires') ?? readQueryParam(url, 'Expires');
  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;

  // Seconds since epoch are ~1e9, milliseconds ~1e12.
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export function isUrlExpired(url: string, now: number = Date.now()): boolean {
  const expiry = getUrlExpiry(url);
  return expiry !== null && expiry <= now;
}

export function earliestUrlExpiry(videos: VideoObject[]): number | null {
  let earliest: number | null = null;
  for (const video of videos) {
    const expiry = getUrlExpiry(video.url);
    if (expiry === null) continue;
    if (earliest === null || expiry < earliest) earliest = expiry;
  }
  return earliest;
}
