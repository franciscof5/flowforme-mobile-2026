import { ApiError, type FlowApi, type PresignedUpload } from '@/api/FlowApi';
import type { VideoObject } from '@/types/video';

export interface HttpApiOptions {
  baseUrl: string;
  bucket: string;
  getToken: () => string | null;
  /** Called on HTTP 401 so the app can drop the session. */
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const PRESIGN_PATH = '/api/flowforme/presign';
const VIDEOS_PATH = '/api/flowforme/videos';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

/**
 * Talks to the real backend using `fetch`, authenticating with the PocketBase
 * auth token. Handles 401 (session expired) and network failures with clear
 * messages.
 */
export class HttpApi implements FlowApi {
  readonly isMock = false;

  private readonly baseUrl: string;
  private readonly bucket: string;
  private readonly getToken: () => string | null;
  private readonly onUnauthorized?: () => void;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: HttpApiOptions) {
    this.baseUrl = options.baseUrl;
    this.bucket = options.bucket;
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async presignUpload(
    key: string,
    contentType: string,
  ): Promise<PresignedUpload> {
    const payload = await this.request<Record<string, unknown>>(
      'POST',
      PRESIGN_PATH,
      { bucket: this.bucket, key, contentType },
    );

    const uploadUrl =
      typeof payload?.uploadUrl === 'string'
        ? payload.uploadUrl
        : typeof payload?.url === 'string'
          ? payload.url
          : null;

    if (!uploadUrl) {
      throw new ApiError('server', 'O servidor não retornou uma URL de upload.');
    }

    const rawExpiry = Number(payload?.expiresAt ?? payload?.expires ?? 0);
    const expiresAt =
      Number.isFinite(rawExpiry) && rawExpiry > 0
        ? rawExpiry < 1_000_000_000_000
          ? rawExpiry * 1000
          : rawExpiry
        : Date.now() + this.timeoutMs;

    const headers =
      payload?.headers && typeof payload.headers === 'object'
        ? (payload.headers as Record<string, string>)
        : undefined;

    return { key, uploadUrl, contentType, expiresAt, headers };
  }

  async listVideos(): Promise<VideoObject[]> {
    const payload = await this.request<unknown>(
      'GET',
      `${VIDEOS_PATH}?bucket=${encodeURIComponent(this.bucket)}`,
    );

    if (Array.isArray(payload)) return payload as VideoObject[];

    if (payload && typeof payload === 'object') {
      const items = (payload as { items?: unknown }).items;
      if (Array.isArray(items)) return items as VideoObject[];
    }

    throw new ApiError('server', 'Resposta inesperada do servidor.');
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(joinUrl(this.baseUrl, path), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw this.toNetworkError(error);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401) {
      this.onUnauthorized?.();
      throw new ApiError(
        'unauthorized',
        'Sua sessão expirou. Entre novamente.',
        401,
      );
    }

    if (!response.ok) {
      throw new ApiError(
        'server',
        `O servidor respondeu com erro (HTTP ${response.status}).`,
        response.status,
      );
    }

    if (response.status === 204) return null as T;

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('server', 'Resposta inválida do servidor.');
    }
  }

  private toNetworkError(error: unknown): ApiError {
    if (error instanceof Error && error.name === 'AbortError') {
      return new ApiError(
        'network',
        'Tempo de conexão esgotado. Verifique sua internet e tente novamente.',
      );
    }
    return new ApiError(
      'network',
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
    );
  }
}
