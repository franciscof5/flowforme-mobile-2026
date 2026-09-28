import type { CameraDevice, Size } from 'react-native-vision-camera';

import {
  CAMERA_VIDEO_FPS,
  CAMERA_VIDEO_HEIGHT,
  CAMERA_VIDEO_WIDTH,
} from '@/config/camera';

export interface CameraSupport {
  /** A device exists for the requested position. */
  deviceFound: boolean;
  /** The device offers the exact 1280x720 (or 720x1280) format. */
  exactResolution: boolean;
  /** The device can stream at the target frame rate. */
  fps: boolean;
  /** The format the session will fall back to when there is no exact match. */
  resolution: Size | null;
  /** Exact resolution and frame rate are both available. */
  supported: boolean;
  /** Human readable warning shown in the UI when not fully supported. */
  message: string | null;
}

const TARGET_PIXELS = CAMERA_VIDEO_WIDTH * CAMERA_VIDEO_HEIGHT;
const TARGET_RATIO = CAMERA_VIDEO_WIDTH / CAMERA_VIDEO_HEIGHT;

function isExact(size: Size): boolean {
  return (
    (size.width === CAMERA_VIDEO_WIDTH && size.height === CAMERA_VIDEO_HEIGHT) ||
    (size.width === CAMERA_VIDEO_HEIGHT && size.height === CAMERA_VIDEO_WIDTH)
  );
}

/** Prefers a 16:9 format, then the one closest in pixel count to 720p. */
function score(size: Size): number {
  const ratio =
    Math.max(size.width, size.height) / Math.min(size.width, size.height);
  const ratioPenalty = Math.abs(ratio - TARGET_RATIO) * 1_000_000;
  const pixelPenalty = Math.abs(size.width * size.height - TARGET_PIXELS);
  return ratioPenalty + pixelPenalty;
}

function closestResolution(sizes: Size[]): Size | null {
  if (sizes.length === 0) return null;
  return sizes.reduce((best, current) =>
    score(current) < score(best) ? current : best,
  );
}

/**
 * Picks the VisionCamera format closest to 1280x720@30 for the given device and
 * reports whether the exact target is supported, so the UI can warn the user.
 */
export function resolveCameraSupport(
  device: CameraDevice | undefined,
): CameraSupport {
  if (!device) {
    return {
      deviceFound: false,
      exactResolution: false,
      fps: false,
      resolution: null,
      supported: false,
      message: 'Nenhuma câmera disponível neste dispositivo.',
    };
  }

  let resolutions: Size[] = [];
  try {
    resolutions = device.getSupportedResolutions('video');
  } catch {
    resolutions = [];
  }

  const exact = resolutions.find(isExact) ?? null;
  const resolution = exact ?? closestResolution(resolutions);

  let fps = false;
  try {
    fps = device.supportsFPS(CAMERA_VIDEO_FPS);
  } catch {
    fps = false;
  }

  const exactResolution = exact !== null;
  const parts: string[] = [];
  if (!exactResolution) {
    parts.push(
      resolution
        ? `720p indisponível (usando ${resolution.width}x${resolution.height})`
        : '720p indisponível',
    );
  }
  if (!fps) parts.push(`${CAMERA_VIDEO_FPS}fps indisponível`);

  return {
    deviceFound: true,
    exactResolution,
    fps,
    resolution,
    supported: exactResolution && fps,
    message: parts.length
      ? `Formato ideal não suportado: ${parts.join(' e ')}.`
      : null,
  };
}
