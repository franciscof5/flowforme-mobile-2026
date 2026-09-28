import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NativePreviewView,
  useCamera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  usePreviewOutput,
  useVideoOutput,
  type CameraOrientation,
  type Constraint,
} from 'react-native-vision-camera';

import { resolveCameraSupport } from '@/camera/format';
import { useCameraRecording } from '@/camera/useCameraRecording';
import { CameraPermissionView } from '@/components/CameraPermissionView';
import {
  CAMERA_MAX_RECORDING_MS,
  CAMERA_VIDEO_FPS,
  CAMERA_VIDEO_TARGET,
  RECORDING_ORIENTATION_LABELS,
  type RecordingOrientation,
} from '@/config/camera';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { formatDuration } from '@/lib/format';
import type { LocalVideoRecord } from '@/types/video';

type CameraPosition = 'back' | 'front';

const ORIENTATION_TO_CAMERA: Record<RecordingOrientation, CameraOrientation> = {
  portrait: 'up',
  landscape: 'right',
};

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const cameraPermission = useCameraPermission();
  const microphonePermission = useMicrophonePermission();

  const [position, setPosition] = useState<CameraPosition>('back');
  const [orientation, setOrientation] =
    useState<RecordingOrientation>('portrait');
  const [focused, setFocused] = useState(true);
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [saved, setSaved] = useState<LocalVideoRecord | null>(null);

  const device = useCameraDevice(position);

  const previewOutput = usePreviewOutput();
  const videoOutput = useVideoOutput({
    targetResolution: CAMERA_VIDEO_TARGET,
    enableAudio: microphonePermission.hasPermission,
    fileType: 'mp4',
  });
  const outputs = useMemo(
    () => [previewOutput, videoOutput],
    [previewOutput, videoOutput],
  );
  const constraints = useMemo<Constraint[]>(
    () => [{ fps: CAMERA_VIDEO_FPS }],
    [],
  );

  const recording = useCameraRecording({
    videoOutput,
    username: user?.username,
    bucket: user?.bucket,
    orientation,
    onSaved: setSaved,
    onError: setBanner,
  });

  const busy =
    recording.state === 'starting' ||
    recording.state === 'recording' ||
    recording.state === 'paused' ||
    recording.state === 'stopping';

  const hasCamera = cameraPermission.hasPermission;
  const isActive = (focused || busy) && hasCamera && !!device;

  useCamera({
    isActive,
    device: device ?? position,
    outputs,
    constraints,
    orientationSource: 'custom',
    onStarted: () => setReady(true),
    onStopped: () => setReady(false),
  });

  const stopRecording = recording.stop;

  // The chosen orientation drives both the preview and the recorded file.
  // VisionCamera outputs are native mutable objects, so they are set
  // imperatively (this is the documented way to use `orientationSource="custom"`).
  useEffect(() => {
    const value = ORIENTATION_TO_CAMERA[orientation];
    // eslint-disable-next-line react-hooks/immutability
    previewOutput.outputOrientation = value;
    // eslint-disable-next-line react-hooks/immutability
    videoOutput.outputOrientation = value;
  }, [orientation, previewOutput, videoOutput]);

  // Keep the camera alive until an in-flight take finishes saving.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        void stopRecording();
      };
    }, [stopRecording]),
  );

  // Ask for permissions once; afterwards the explicit gate/buttons take over.
  const requestedRef = useRef(false);
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    const ask = async () => {
      if (cameraPermission.canRequestPermission) {
        await cameraPermission.requestPermission();
      }
      if (microphonePermission.canRequestPermission) {
        await microphonePermission.requestPermission();
      }
    };
    void ask();
  }, [cameraPermission, microphonePermission]);

  // Auto-dismiss the "saved" toast.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(null), 4_000);
    return () => clearTimeout(timer);
  }, [saved]);

  const support = useMemo(() => resolveCameraSupport(device), [device]);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  }, []);

  const flipCamera = useCallback(() => {
    setPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const requestMicrophone = useCallback(() => {
    if (microphonePermission.canRequestPermission) {
      void microphonePermission.requestPermission();
    } else {
      void Linking.openSettings();
    }
  }, [microphonePermission]);

  if (!hasCamera) {
    return (
      <CameraPermissionView
        title="Precisamos da câmera"
        message="Autorize o acesso à câmera para gravar seus vídeos no FlowForMe."
        canRequest={cameraPermission.canRequestPermission}
        onRequest={() => {
          void cameraPermission.requestPermission();
        }}
        onOpenSettings={() => {
          void Linking.openSettings();
        }}
      />
    );
  }

  const isRecording = recording.state === 'recording';
  const isPaused = recording.state === 'paused';
  const isTransitioning =
    recording.state === 'starting' || recording.state === 'stopping';
  const canStop = isRecording || isPaused;

  return (
    <View style={styles.container}>
      {device ? (
        <NativePreviewView
          style={StyleSheet.absoluteFill}
          previewOutput={previewOutput}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.centerText}>Procurando câmera...</Text>
        </View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.timerPill}>
          <View
            style={[
              styles.dot,
              isRecording && styles.dotRecording,
              isPaused && styles.dotPaused,
            ]}
          />
          <Text style={styles.timerText}>
            {formatDuration(recording.elapsedMs)}
          </Text>
          <Text style={styles.timerRemaining}>
            -{formatDuration(recording.remainingMs)}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  (recording.elapsedMs / CAMERA_MAX_RECORDING_MS) * 100,
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      <View
        style={[styles.bannerStack, { top: insets.top + 70 }]}
        pointerEvents="box-none"
      >
        {support.message ? (
          <View style={styles.warnBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={styles.warnText}>{support.message}</Text>
          </View>
        ) : null}

        {!microphonePermission.hasPermission ? (
          <View style={styles.warnBanner}>
            <Ionicons name="mic-off-outline" size={16} color={colors.warning} />
            <Text style={styles.warnText}>
              Microfone desativado — o vídeo será gravado sem áudio.
            </Text>
            <TouchableOpacity onPress={requestMicrophone}>
              <Text style={styles.bannerAction}>
                {microphonePermission.canRequestPermission
                  ? 'Permitir'
                  : 'Ajustes'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {banner ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.danger}
            />
            <Text style={styles.errorText} numberOfLines={2}>
              {banner}
            </Text>
            <TouchableOpacity onPress={() => setBanner(null)}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sideGroup}>
          <TouchableOpacity
            style={[styles.sideButton, busy && styles.disabled]}
            onPress={flipCamera}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={colors.text}
            />
            <Text style={styles.sideLabel}>Virar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sideButton, busy && styles.disabled]}
            onPress={toggleOrientation}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                orientation === 'portrait'
                  ? 'phone-portrait-outline'
                  : 'phone-landscape-outline'
              }
              size={24}
              color={colors.text}
            />
            <Text style={styles.sideLabel}>
              {RECORDING_ORIENTATION_LABELS[orientation]}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={() => {
            if (recording.state === 'idle') {
              void recording.start();
            } else if (isRecording) {
              void recording.pause();
            } else if (isPaused) {
              void recording.resume();
            }
          }}
          disabled={!ready || isTransitioning}
          activeOpacity={0.85}
          accessibilityLabel={
            isRecording ? 'Pausar gravação' : isPaused ? 'Retomar' : 'Gravar'
          }
        >
          {isTransitioning ? (
            <ActivityIndicator color={colors.text} />
          ) : isRecording ? (
            <Ionicons name="pause" size={30} color="#04121F" />
          ) : isPaused ? (
            <Ionicons name="play" size={30} color="#04121F" />
          ) : (
            <View style={styles.recordDot} />
          )}
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={[
              styles.sideButton,
              styles.stopButton,
              (!canStop || recording.state === 'stopping') && styles.disabled,
            ]}
            onPress={() => {
              void recording.stop();
            }}
            disabled={!canStop || recording.state === 'stopping'}
            activeOpacity={0.8}
          >
            {recording.state === 'stopping' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <View style={styles.stopSquare} />
            )}
            <Text style={styles.sideLabel}>Parar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {saved ? (
        <View
          style={[styles.toast, { bottom: insets.bottom + 140 }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText} numberOfLines={1}>
            Salvo em Originais: {saved.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.background,
  },
  centerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.overlay,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(5, 8, 12, 0.6)',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.textFaint,
  },
  dotRecording: {
    backgroundColor: colors.danger,
  },
  dotPaused: {
    backgroundColor: colors.warning,
  },
  timerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerRemaining: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.danger,
  },
  bannerStack: {
    position: 'absolute',
    left: 12,
    right: 12,
    gap: 8,
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  warnText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  bannerAction: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  errorText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.overlay,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sideLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.18)',
  },
  stopSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recordButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  recordButtonActive: {
    backgroundColor: '#FFD34E',
  },
  recordDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 8, 12, 0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  toastText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
