import type { VideoObject } from '@/types/video';

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  contentType: string;
  /** Epoch milliseconds after which `uploadUrl` stops working. */
  expiresAt: number;
  headers?: Record<string, string>;
}

export type ApiErrorKind = 'unauthorized' | 'network' | 'server' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

/**
 * The single contract the UI depends on. Implemented by {@link MockApi} and
 * {@link HttpApi}, selected through `USE_MOCK`.
 */
export interface FlowApi {
  /** Asks the backend for a short-lived URL to upload `key` to. */
  presignUpload(key: string, contentType: string): Promise<PresignedUpload>;
  /** Lists every object stored for the bucket this instance is bound to. */
  listVideos(): Promise<VideoObject[]>;
}
