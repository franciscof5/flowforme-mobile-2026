import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { CameraVideoOutput, Recorder } from 'react-native-vision-camera';

import {
  clearPendingRecording,
  saveRecording,
  updatePendingRecordingProgress,
  writePendingRecording,
} from '@/camera/recordings';
import {
  CAMERA_MARKER_UPDATE_MS,
  CAMERA_MAX_RECORDING_MS,
  CAMERA_MIN_RECORDING_MS,
  CAMERA_TIMER_TICK_MS,
  type RecordingOrientation,
} from '@/config/camera';
import type { LocalVideoRecord } from '@/types/video';

export type RecordingState =
  | 'idle'
  | 'starting'
  | 'recording'
  | 'paused'
  | 'stopping';

interface UseCameraRecordingOptions {
  videoOutput: CameraVideoOutput;
  username: string | undefined;
  bucket: string | undefined;
  orientation: RecordingOrientation;
  onSaved: (record: LocalVideoRecord) => void;
  onError: (message: string) => void;
}

export interface UseCameraRecordingResult {
  state: RecordingState;
  /** Time actually recorded (pauses excluded), in milliseconds. */
  elapsedMs: number;
  /** Milliseconds left before the 90s limit. */
  remainingMs: number;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Falha ao gravar o vídeo.';
}

/**
 * Orchestrates a single VisionCamera take: create → record → pause/resume →
 * stop → persist. Counts only recorded time, auto-stops at the 90s limit and
 * stops (persisting what was captured) when the app goes to the background.
 */
export function useCameraRecording(
  options: UseCameraRecordingOptions,
): UseCameraRecordingResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const stateRef = useRef<RecordingState>('idle');
  const recorderRef = useRef<Recorder | null>(null);
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMarkerRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  const setRecordingState = useCallback((next: RecordingState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const currentElapsed = useCallback(
    () =>
      accumulatedRef.current +
      (segmentStartRef.current != null
        ? Date.now() - segmentStartRef.current
        : 0),
    [],
  );

  const stopTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetTiming = useCallback(() => {
    accumulatedRef.current = 0;
    segmentStartRef.current = null;
    setElapsedMs(0);
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    tickRef.current = setInterval(() => {
      const value = currentElapsed();
      setElapsedMs(value);

      const now = Date.now();
      if (now - lastMarkerRef.current >= CAMERA_MARKER_UPDATE_MS) {
        lastMarkerRef.current = now;
        void updatePendingRecordingProgress(value).catch(() => {});
      }

      if (value >= CAMERA_MAX_RECORDING_MS) {
        stopRef.current();
      }
    }, CAMERA_TIMER_TICK_MS);
  }, [currentElapsed, stopTick]);

  const handleFinished = useCallback(
    async (tempPath: string) => {
      stopTick();
      const durationMs = currentElapsed();
      resetTiming();
      recorderRef.current = null;
      setRecordingState('idle');

      await clearPendingRecording().catch(() => {});

      const { username, bucket, onSaved, onError } = optionsRef.current;
      if (!username || !bucket) {
        onError('Sessão indisponível para salvar a gravação.');
        return;
      }
      if (durationMs < CAMERA_MIN_RECORDING_MS) {
        return;
      }

      try {
        const record = await saveRecording({
          tempPath,
          durationMs,
          username,
          bucket,
        });
        onSaved(record);
      } catch (error) {
        onError(messageFrom(error));
      }
    },
    [currentElapsed, resetTiming, setRecordingState, stopTick],
  );

  const handleError = useCallback(
    (error: unknown) => {
      stopTick();
      resetTiming();
      recorderRef.current = null;
      setRecordingState('idle');
      // The marker is kept so a crash-interrupted file can be recovered later.
      optionsRef.current.onError(messageFrom(error));
    },
    [resetTiming, setRecordingState, stopTick],
  );

  const handlePaused = useCallback(() => {
    stopTick();
    if (segmentStartRef.current != null) {
      accumulatedRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setElapsedMs(accumulatedRef.current);
    setRecordingState('paused');
  }, [setRecordingState, stopTick]);

  const handleResumed = useCallback(() => {
    if (segmentStartRef.current == null) {
      segmentStartRef.current = Date.now();
    }
    setRecordingState('recording');
    startTick();
  }, [setRecordingState, startTick]);

  const start = useCallback(async () => {
    if (stateRef.current !== 'idle') return;

    const { videoOutput, username, bucket, orientation, onError } =
      optionsRef.current;
    if (!username || !bucket) {
      onError('Sessão indisponível para gravar.');
      return;
    }

    setRecordingState('starting');
    setElapsedMs(0);
    accumulatedRef.current = 0;
    segmentStartRef.current = null;

    try {
      const recorder = await videoOutput.createRecorder({});
      recorderRef.current = recorder;

      await writePendingRecording({
        tempPath: recorder.filePath,
        username,
        bucket,
        startedAt: Date.now(),
        elapsedMs: 0,
        orientation,
      });
      lastMarkerRef.current = Date.now();

      await recorder.startRecording(
        (tempPath) => {
          void handleFinished(tempPath);
        },
        (error) => {
          handleError(error);
        },
        () => {
          handlePaused();
        },
        () => {
          handleResumed();
        },
      );

      segmentStartRef.current = Date.now();
      setRecordingState('recording');
      startTick();
    } catch (error) {
      recorderRef.current = null;
      resetTiming();
      setRecordingState('idle');
      onError(messageFrom(error));
    }
  }, [
    handleError,
    handleFinished,
    handlePaused,
    handleResumed,
    resetTiming,
    setRecordingState,
    startTick,
  ]);

  const pause = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || stateRef.current !== 'recording') return;
    try {
      await recorder.pauseRecording();
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const resume = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || stateRef.current !== 'paused') return;
    try {
      await recorder.resumeRecording();
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (stateRef.current === 'idle' || stateRef.current === 'stopping') return;

    setRecordingState('stopping');
    stopTick();
    try {
      await recorder.stopRecording();
    } catch (error) {
      handleError(error);
    }
  }, [handleError, setRecordingState, stopTick]);

  useEffect(() => {
    stopRef.current = () => {
      void stop();
    };
  }, [stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (
        next !== 'active' &&
        (stateRef.current === 'recording' || stateRef.current === 'paused')
      ) {
        void stop();
      }
    });
    return () => subscription.remove();
  }, [stop]);

  useEffect(() => () => stopTick(), [stopTick]);

  return {
    state,
    elapsedMs,
    remainingMs: Math.max(0, CAMERA_MAX_RECORDING_MS - elapsedMs),
    start,
    pause,
    resume,
    stop,
  };
}
