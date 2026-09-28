import { MOCK_API_LATENCY_MS } from '@/constants/config';
import * as mockStore from '@/api/mockStore';
import type { MockTiming, RegisterUploadInput } from '@/api/mockStore';
import type { FlowApi, PresignedUpload } from '@/api/FlowApi';
import type { VideoObject } from '@/types/video';

export interface MockApiOptions extends MockTiming {
  latencyMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * In-memory implementation used when `USE_MOCK` is true. It seeds the stage-1
 * data and simulates the Sultano producing edited pairs after an upload.
 */
export class MockApi implements FlowApi {
  readonly isMock = true;

  private readonly latencyMs: number;
  private readonly timing: MockTiming;

  constructor(
    private readonly bucket: string,
    options: MockApiOptions = {},
  ) {
    this.latencyMs = options.latencyMs ?? MOCK_API_LATENCY_MS;
    this.timing = {
      urlTtlMs: options.urlTtlMs,
      editingDelayMs: options.editingDelayMs,
    };
  }

  async presignUpload(
    key: string,
    contentType: string,
  ): Promise<PresignedUpload> {
    await sleep(this.latencyMs);
    return mockStore.presignUpload(this.bucket, key, contentType, this.timing);
  }

  async listVideos(): Promise<VideoObject[]> {
    await sleep(this.latencyMs);
    return mockStore.listVideos(this.bucket, this.timing);
  }

  /** Extra behaviour beyond {@link FlowApi}, used by the simulated uploader. */
  registerUploaded(input: RegisterUploadInput): void {
    mockStore.registerUploaded(this.bucket, input, this.timing);
  }
}
