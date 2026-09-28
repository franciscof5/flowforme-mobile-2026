import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { buildVideoKeyForUuid, enqueue } from '@/api';
import { STORAGE_KEYS } from '@/constants/config';
import {
  RECORDINGS_ROOT_DIR,
  RECORDINGS_THUMB_DIR,
  RECORDINGS_VIDEO_DIR,
  type RecordingOrientation,
} from '@/config/camera';
import type { LocalVideoRecord } from '@/types/video';

const listeners = new Set<() => void>();

/** Notifies subscribers whenever the local recording list changes. */
export function subscribeLocalVideos(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of [...listeners]) listener();
}

function storageKey(username: string): string {
  return `${STORAGE_KEYS.localVideosPrefix}/${username}`;
}

function isLocalVideoRecord(value: unknown): value is LocalVideoRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === 'string' &&
    typeof record.name === 'string' &&
    typeof record.url === 'string' &&
    typeof record.path === 'string'
  );
}

function parseList(raw: string | null): LocalVideoRecord[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalVideoRecord);
  } catch {
    return [];
  }
}

export async function listLocalVideos(
  username: string,
): Promise<LocalVideoRecord[]> {
  const raw = await AsyncStorage.getItem(storageKey(username));
  return parseList(raw).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addLocalVideo(
  username: string,
  record: LocalVideoRecord,
): Promise<void> {
  const current = await listLocalVideos(username);
  const next = [record, ...current.filter((item) => item.key !== record.key)];
  await AsyncStorage.setItem(storageKey(username), JSON.stringify(next));
  emit();
}

export async function removeLocalVideo(
  username: string,
  key: string,
): Promise<void> {
  const current = await listLocalVideos(username);
  const next = current.filter((item) => item.key !== key);
  await AsyncStorage.setItem(storageKey(username), JSON.stringify(next));
  emit();
}

/** Marker persisted while a take is in flight, so a crash can be recovered. */
export interface PendingRecordingMarker {
  tempPath: string;
  username: string;
  bucket: string;
  startedAt: number;
  elapsedMs: number;
  orientation: RecordingOrientation;
}

export async function readPendingRecording(): Promise<PendingRecordingMarker | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.pendingRecording);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingRecordingMarker;
    if (!parsed.tempPath || !parsed.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writePendingRecording(
  marker: PendingRecordingMarker,
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.pendingRecording,
    JSON.stringify(marker),
  );
}

export async function updatePendingRecordingProgress(
  elapsedMs: number,
): Promise<void> {
  const marker = await readPendingRecording();
  if (!marker) return;
  await writePendingRecording({ ...marker, elapsedMs });
}

export async function clearPendingRecording(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.pendingRecording);
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function safeUser(username: string): string {
  return (
    username
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'user'
  );
}

function ensureDirectory(...segments: string[]): Directory {
  const dir = new Directory(Paths.document, ...segments);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export interface SaveRecordingInput {
  /** Temporary file path returned by the VisionCamera recorder. */
  tempPath: string;
  durationMs: number;
  username: string;
  bucket: string;
}

/**
 * Moves a finished take from the recorder's temporary file into the app's
 * persistent document storage, generates a thumbnail, stores the local record
 * (so it shows up in Originais) and hands it to the upload queue.
 */
export async function saveRecording(
  input: SaveRecordingInput,
): Promise<LocalVideoRecord> {
  const { tempPath, durationMs, username, bucket } = input;

  const uuid = Crypto.randomUUID();
  const key = buildVideoKeyForUuid(username, uuid);
  const name = key.split('/').pop() ?? `${uuid}.mp4`;

  const videoDir = ensureDirectory(
    RECORDINGS_ROOT_DIR,
    RECORDINGS_VIDEO_DIR,
    safeUser(username),
  );
  const source = new File(toFileUri(tempPath));
  const destination = new File(videoDir, name);
  await source.move(destination);

  let thumbnailUrl: string | undefined;
  try {
    // TODO: `expo-video-thumbnails` is deprecated in favor of `expo-video`'s
    // `generateThumbnailsAsync`; migrate once its output can be persisted here.
    const { uri } = await VideoThumbnails.getThumbnailAsync(destination.uri, {
      time: Math.min(1_000, Math.max(0, Math.floor(durationMs / 2))),
      quality: 0.7,
    });
    const thumbDir = ensureDirectory(
      RECORDINGS_ROOT_DIR,
      RECORDINGS_THUMB_DIR,
      safeUser(username),
    );
    const thumbFile = new File(thumbDir, `${uuid}.jpg`);
    await new File(uri).move(thumbFile);
    thumbnailUrl = thumbFile.uri;
  } catch {
    // A missing thumbnail must not fail the recording.
    thumbnailUrl = undefined;
  }

  const record: LocalVideoRecord = {
    key,
    name,
    size: destination.size,
    lastModified: new Date().toISOString(),
    url: destination.uri,
    path: destination.uri.replace(/^file:\/\//, ''),
    durationMs,
    thumbnailUrl,
    createdAt: Date.now(),
    queued: true,
  };

  await addLocalVideo(username, record);
  await enqueue({
    key,
    name,
    size: record.size,
    localPath: record.path,
    durationMs,
    username,
    bucket,
  });

  return record;
}

/**
 * Recovers a take that was interrupted by a crash or kill: if the temporary
 * file still exists, it is finalized into persistent storage like a normal
 * recording.
 */
export async function recoverPendingRecording(
  username: string,
): Promise<LocalVideoRecord | null> {
  const marker = await readPendingRecording();
  if (!marker || marker.username !== username) return null;

  try {
    const source = new File(toFileUri(marker.tempPath));
    if (source.exists && source.size > 0) {
      const record = await saveRecording({
        tempPath: marker.tempPath,
        durationMs: marker.elapsedMs,
        username: marker.username,
        bucket: marker.bucket,
      });
      await clearPendingRecording();
      return record;
    }
  } catch {
    // The temporary file is gone or unusable; drop the marker below.
  }

  await clearPendingRecording();
  return null;
}
