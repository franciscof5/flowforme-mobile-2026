import {
  EDITED_SUFFIX,
  MOCK_EDITING_DELAY_MS,
  MOCK_URL_TTL_MS,
} from '@/constants/config';
import { MOCK_VIDEOS } from '@/data/videos';
import { appendQueryParam } from '@/api/urlExpiry';
import type { VideoObject } from '@/types/video';

export interface MockTiming {
  urlTtlMs?: number;
  editingDelayMs?: number;
}

export interface RegisterUploadInput {
  key: string;
  name: string;
  size: number;
}

interface MockRecord {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  baseUrl: string;
  url: string;
  expiresAt: number;
}

interface MockBucketState {
  records: Map<string, MockRecord>;
  pendingEdits: Set<string>;
  timers: Map<string, ReturnType<typeof setTimeout>>;
}

const buckets = new Map<string, MockBucketState>();
const listeners = new Set<() => void>();

export function subscribeMockChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange(): void {
  for (const listener of [...listeners]) listener();
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function sampleUrlFor(key: string): string {
  return MOCK_VIDEOS[hashString(key) % MOCK_VIDEOS.length].url;
}

function baseName(name: string): string {
  return name.toLowerCase().endsWith('.mp4') ? name.slice(0, -4) : name;
}

function editedNameFor(name: string): string {
  return `${baseName(name)}${EDITED_SUFFIX}`;
}

function editedKeyFor(key: string): string {
  return `${baseName(key)}${EDITED_SUFFIX}`;
}

function getBucket(bucket: string): MockBucketState {
  let state = buckets.get(bucket);
  if (state) return state;

  state = { records: new Map(), pendingEdits: new Set(), timers: new Map() };
  for (const video of MOCK_VIDEOS) {
    state.records.set(video.key, {
      key: video.key,
      name: video.name,
      size: video.size,
      lastModified: video.lastModified,
      baseUrl: video.url,
      url: video.url,
      expiresAt: 0,
    });
  }
  buckets.set(bucket, state);
  return state;
}

function signUrl(baseUrl: string, ttlMs: number): { url: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  // Milliseconds keep short mock TTLs precise; `getUrlExpiry` accepts both.
  const url = appendQueryParam(baseUrl, 'expires', String(expiresAt));
  return { url, expiresAt };
}

function refreshExpired(record: MockRecord, ttlMs: number, now: number): void {
  if (record.expiresAt <= now) {
    const signed = signUrl(record.baseUrl, ttlMs);
    record.url = signed.url;
    record.expiresAt = signed.expiresAt;
  }
}

function toVideoObject(record: MockRecord): VideoObject {
  return {
    key: record.key,
    name: record.name,
    size: record.size,
    lastModified: record.lastModified,
    url: record.url,
  };
}

export function listVideos(
  bucket: string,
  timing: MockTiming = {},
): VideoObject[] {
  const ttl = timing.urlTtlMs ?? MOCK_URL_TTL_MS;
  const state = getBucket(bucket);
  const now = Date.now();

  return [...state.records.values()].map((record) => {
    refreshExpired(record, ttl, now);
    return toVideoObject(record);
  });
}

export function presignUpload(
  bucket: string,
  key: string,
  contentType: string,
  timing: MockTiming = {},
): {
  key: string;
  uploadUrl: string;
  contentType: string;
  expiresAt: number;
  headers: Record<string, string>;
} {
  const ttl = timing.urlTtlMs ?? MOCK_URL_TTL_MS;
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const base = `https://mock.flowforme.local/upload/${encodedKey}?bucket=${encodeURIComponent(
    bucket,
  )}`;
  const signed = signUrl(base, ttl);

  return {
    key,
    uploadUrl: signed.url,
    contentType,
    expiresAt: signed.expiresAt,
    headers: { 'Content-Type': contentType },
  };
}

function addEditedPair(
  bucket: string,
  input: RegisterUploadInput,
  ttlMs: number,
): void {
  const state = getBucket(bucket);
  const editedKey = editedKeyFor(input.key);

  if (!state.records.has(editedKey)) {
    const original = state.records.get(input.key);
    const baseUrl = original?.baseUrl ?? sampleUrlFor(editedKey);
    const signed = signUrl(baseUrl, ttlMs);
    state.records.set(editedKey, {
      key: editedKey,
      name: editedNameFor(input.name),
      size: Math.max(1, Math.round(input.size * 0.45)),
      lastModified: new Date().toISOString(),
      baseUrl,
      url: signed.url,
      expiresAt: signed.expiresAt,
    });
  }

  emitChange();
}

function scheduleEditedPair(
  bucket: string,
  input: RegisterUploadInput,
  editingDelayMs: number,
  ttlMs: number,
): void {
  const state = getBucket(bucket);
  const editedKey = editedKeyFor(input.key);

  if (state.records.has(editedKey) || state.pendingEdits.has(input.key)) return;

  state.pendingEdits.add(input.key);
  const timer = setTimeout(() => {
    state.pendingEdits.delete(input.key);
    state.timers.delete(input.key);
    addEditedPair(bucket, input, ttlMs);
  }, editingDelayMs);
  state.timers.set(input.key, timer);
}

/**
 * Registers an original uploaded through the simulated uploader. It shows up
 * immediately and, after `editingDelayMs`, so does its `-sultano.mp4` pair.
 */
export function registerUploaded(
  bucket: string,
  input: RegisterUploadInput,
  timing: MockTiming = {},
): void {
  const ttl = timing.urlTtlMs ?? MOCK_URL_TTL_MS;
  const editingDelay = timing.editingDelayMs ?? MOCK_EDITING_DELAY_MS;
  const state = getBucket(bucket);

  if (!state.records.has(input.key)) {
    const baseUrl = sampleUrlFor(input.key);
    const signed = signUrl(baseUrl, ttl);
    state.records.set(input.key, {
      key: input.key,
      name: input.name,
      size: input.size,
      lastModified: new Date().toISOString(),
      baseUrl,
      url: signed.url,
      expiresAt: signed.expiresAt,
    });
  }

  scheduleEditedPair(bucket, input, editingDelay, ttl);
  emitChange();
}

/** Clears all mock state. Intended for tests. */
export function resetMockStore(): void {
  for (const state of buckets.values()) {
    for (const timer of state.timers.values()) clearTimeout(timer);
  }
  buckets.clear();
  listeners.clear();
}
