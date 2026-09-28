import * as Crypto from 'expo-crypto';

import { API_URL, USE_MOCK } from '@/constants/config';
import { createCachedFlowApi, type CachedFlowApi } from '@/api/cache';
import { emitUnauthorized } from '@/api/authEvents';
import { HttpApi } from '@/api/HttpApi';
import { MockApi } from '@/api/MockApi';
import * as mockStore from '@/api/mockStore';
import {
  uploadWithRetry,
  type UploadFile,
  type UploadResult,
} from '@/api/uploader';
import { pb } from '@/lib/pocketbase';

export { ApiError } from '@/api/FlowApi';
export type { FlowApi, PresignedUpload } from '@/api/FlowApi';
export { simulateUpload, uploadWithRetry, UploadError } from '@/api/uploader';
export type { UploadFile, UploadResult } from '@/api/uploader';

export const isMockMode = USE_MOCK;

const registry = new Map<string, CachedFlowApi>();

/**
 * Returns the (cached) FlowApi bound to a bucket. Both tabs and repeated
 * requests share the same instance, so the in-memory list cache is shared too.
 */
export function getFlowApi(bucket: string): CachedFlowApi {
  const existing = registry.get(bucket);
  if (existing) return existing;

  const raw = USE_MOCK
    ? new MockApi(bucket)
    : new HttpApi({
        baseUrl: API_URL,
        bucket,
        getToken: () => pb.authStore.token || null,
        onUnauthorized: emitUnauthorized,
      });

  const cached = createCachedFlowApi(raw);
  registry.set(bucket, cached);
  return cached;
}

/** Forgets every cached list. Called on logout. */
export function clearFlowApiCache(): void {
  registry.clear();
}

export interface UploadVideoTarget {
  bucket: string;
  username: string;
}

export interface UploadVideoOptions {
  /** Overrides the generated storage key (useful to track the upload). */
  key?: string;
  onProgress?: (percent: number) => void;
  failureRate?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  onRetry?: (attempt: number) => void;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** `{username}/{YYYY}-{MM}-{DD}-{uuid}.mp4`, using the device's local date. */
export function buildVideoKey(
  username: string,
  date: Date = new Date(),
): string {
  const safeUser =
    username
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'user';
  const stamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
  return `${safeUser}/${stamp}-${Crypto.randomUUID()}.mp4`;
}

/**
 * End-to-end simulated upload: presigns a key, streams progress through the
 * simulated uploader (with retry) and, in mock mode, tells the mock store an
 * original was sent so it can "edit" it after ~20s.
 */
export async function uploadVideo(
  target: UploadVideoTarget,
  file: UploadFile,
  options: UploadVideoOptions = {},
): Promise<UploadResult> {
  const api = getFlowApi(target.bucket);
  const key = options.key ?? buildVideoKey(target.username);

  await api.presignUpload(key, file.type ?? 'video/mp4');

  const result = await uploadWithRetry({
    key,
    file,
    onProgress: options.onProgress,
    failureRate: options.failureRate,
    retries: options.retries,
    retryDelayMs: options.retryDelayMs,
    signal: options.signal,
    onRetry: options.onRetry,
  });

  if (USE_MOCK) {
    mockStore.registerUploaded(target.bucket, {
      key,
      name: file.name,
      size: file.size,
    });
  }

  return result;
}

if (USE_MOCK) {
  mockStore.subscribeMockChanges(() => {
    for (const api of registry.values()) api.invalidate();
  });
}
