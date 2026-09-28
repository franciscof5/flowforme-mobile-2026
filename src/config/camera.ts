/**
 * Camera capture targets. The preview and recorder negotiate the closest
 * format the device offers to these values (see `src/camera/format.ts`), and the
 * UI warns when the device cannot match them.
 */
export const CAMERA_VIDEO_WIDTH = 1280;
export const CAMERA_VIDEO_HEIGHT = 720;
export const CAMERA_VIDEO_FPS = 30;

/** Target resolution object handed to the VisionCamera video output. */
export const CAMERA_VIDEO_TARGET = {
  width: CAMERA_VIDEO_WIDTH,
  height: CAMERA_VIDEO_HEIGHT,
} as const;

/**
 * Hard limit for a single take. Only time actually being recorded counts;
 * pausing the take freezes the countdown.
 */
export const CAMERA_MAX_RECORDING_MS = 90_000;

/** Takes shorter than this are discarded instead of saved. */
export const CAMERA_MIN_RECORDING_MS = 1_000;

/** How often the on-screen timer and the 90s watchdog are evaluated. */
export const CAMERA_TIMER_TICK_MS = 250;

/** How often the in-flight recording marker is persisted, for crash recovery. */
export const CAMERA_MARKER_UPDATE_MS = 5_000;

export type RecordingOrientation = 'portrait' | 'landscape';

export const RECORDING_ORIENTATIONS: RecordingOrientation[] = [
  'portrait',
  'landscape',
];

export const RECORDING_ORIENTATION_LABELS: Record<
  RecordingOrientation,
  string
> = {
  portrait: 'Retrato',
  landscape: 'Paisagem',
};

/** Root folder (inside the app's document directory) for local recordings. */
export const RECORDINGS_ROOT_DIR = 'flowforme';
export const RECORDINGS_VIDEO_DIR = 'videos';
export const RECORDINGS_THUMB_DIR = 'thumbnails';
