export interface VideoObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
  /** Duration of locally recorded videos, in milliseconds. */
  durationMs?: number;
  /** Thumbnail of locally recorded videos (a `file://` URI). */
  thumbnailUrl?: string;
}

/**
 * A video recorded on this device. The file lives in the app's persistent
 * document storage; `path` is the bare filesystem path and `url` the `file://`
 * URI used by the player.
 */
export interface LocalVideoRecord extends VideoObject {
  path: string;
  durationMs: number;
  thumbnailUrl?: string;
  createdAt: number;
  /** Whether the recording was handed to the (placeholder) upload queue. */
  queued: boolean;
}

export interface SessionUser {
  username: string;
  bucket: string;
}

export interface Session {
  user: SessionUser;
  token?: string;
}

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface PendingUpload {
  key: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}
