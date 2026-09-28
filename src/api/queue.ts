/**
 * Placeholder for the upload queue that lands in stage 4.
 *
 * Recording finalization calls `enqueue(...)` end-to-end today, but this
 * implementation only keeps the items in memory and logs them in development.
 * The real queue (persistence, Wi-Fi-only rules, retries, backend calls) will
 * replace the body of `enqueue` without changing its callers.
 */
export interface EnqueueItem {
  key: string;
  name: string;
  size: number;
  localPath: string;
  durationMs: number;
  username: string;
  bucket: string;
}

const enqueued: EnqueueItem[] = [];

export async function enqueue(item: EnqueueItem): Promise<void> {
  enqueued.push(item);
  if (__DEV__) {
    console.log(`[flowforme] enqueue (placeholder): ${item.key}`);
  }
}

/** Items handed to the placeholder queue this session. Intended for tests. */
export function getEnqueuedItems(): EnqueueItem[] {
  return [...enqueued];
}

/** Clears the placeholder queue. Intended for tests. */
export function resetQueue(): void {
  enqueued.length = 0;
}
