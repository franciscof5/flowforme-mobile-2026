import { DEFAULT_UPLOAD_RETRIES, UPLOAD_FAILURE_RATE } from '@/constants/config';

export interface UploadFile {
  name: string;
  size: number;
  type?: string;
  uri?: string;
}

export interface SimulateUploadOptions {
  key: string;
  file: UploadFile;
  onProgress?: (percent: number) => void;
  /** Chance (0..1) that this run fails. Defaults to `UPLOAD_FAILURE_RATE`. */
  failureRate?: number;
  /** Total simulated duration. Defaults to a random 2.5s–4.5s. */
  durationMs?: number;
  signal?: AbortSignal;
}

export interface UploadResult {
  key: string;
  bytesSent: number;
  durationMs: number;
}

export class UploadError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'UploadError';
    this.retryable = retryable;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadError('Upload cancelado.', false));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new UploadError('Upload cancelado.', false));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Simulates uploading a file: reports progress from 0 to 100% over a few
 * seconds and can fail at a random point (controlled by `failureRate`) so retry
 * logic can be exercised. No bytes leave the device.
 */
export async function simulateUpload(
  options: SimulateUploadOptions,
): Promise<UploadResult> {
  const { key, file, onProgress, signal } = options;
  const failureRate = clamp(
    options.failureRate ?? UPLOAD_FAILURE_RATE,
    0,
    1,
  );
  const durationMs = options.durationMs ?? randomBetween(2500, 4500);
  const totalSteps = 20;
  const stepDelay = durationMs / totalSteps;
  const startedAt = Date.now();

  const shouldFail = failureRate > 0 && Math.random() < failureRate;
  const failAtStep = shouldFail
    ? Math.floor(Math.random() * (totalSteps - 2)) + 1
    : -1;

  onProgress?.(0);

  for (let step = 1; step <= totalSteps; step += 1) {
    if (signal?.aborted) throw new UploadError('Upload cancelado.', false);
    await sleep(stepDelay, signal);

    const percent = Math.round((step / totalSteps) * 100);
    if (step === failAtStep) {
      onProgress?.(percent);
      throw new UploadError(
        'Falha ao enviar o arquivo. Tente novamente.',
        true,
      );
    }
    onProgress?.(percent);
  }

  return { key, bytesSent: file.size, durationMs: Date.now() - startedAt };
}

export interface UploadWithRetryOptions extends SimulateUploadOptions {
  retries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: UploadError) => void;
}

/** Runs {@link simulateUpload}, retrying retryable failures with backoff. */
export async function uploadWithRetry(
  options: UploadWithRetryOptions,
): Promise<UploadResult> {
  const retries = Math.max(0, options.retries ?? DEFAULT_UPLOAD_RETRIES);
  let lastError: UploadError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await simulateUpload(options);
    } catch (error) {
      if (!(error instanceof UploadError) || !error.retryable) throw error;

      lastError = error;
      if (attempt === retries) break;

      options.onRetry?.(attempt + 1, error);
      await sleep(options.retryDelayMs ?? 400 * (attempt + 1), options.signal);
    }
  }

  throw lastError ?? new UploadError('Não foi possível enviar o arquivo.');
}
