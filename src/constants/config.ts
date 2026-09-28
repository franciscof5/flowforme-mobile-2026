function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

/**
 * When true, authentication and listing run fully local against fake data.
 * Set `EXPO_PUBLIC_USE_MOCK=false` to talk to PocketBase instead.
 */
export const USE_MOCK = boolFromEnv(process.env.EXPO_PUBLIC_USE_MOCK, true);

export const POCKETBASE_URL =
  process.env.EXPO_PUBLIC_POCKETBASE_URL ?? 'http://127.0.0.1:8090';

/** Base URL of the FlowForMe API. Defaults to PocketBase. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? POCKETBASE_URL;

/** Files produced by the editor end with this suffix. */
export const EDITED_SUFFIX = '-sultano.mp4';

/** How long the mock takes to simulate the Sultano generating an edited pair. */
export const MOCK_EDITING_DELAY_MS = 20_000;

/** Lifetime of a mock presigned URL, so expiration can be tested. */
export const MOCK_URL_TTL_MS = 30_000;

/** Fake network latency for the mock API, in milliseconds. */
export const MOCK_API_LATENCY_MS = 400;

/** Chance (0..1) that a simulated upload fails, to exercise retry. */
export const UPLOAD_FAILURE_RATE = 0.2;

/** Default number of retries for a simulated upload. */
export const DEFAULT_UPLOAD_RETRIES = 3;

export const MOCK_USER = {
  username: 'francisco',
  bucket: 'mock-bucket',
} as const;

export const STORAGE_KEYS = {
  session: '@flowforme/session',
  wifiOnly: '@flowforme/wifi-only',
  pbAuth: '@flowforme/pb-auth',
} as const;
