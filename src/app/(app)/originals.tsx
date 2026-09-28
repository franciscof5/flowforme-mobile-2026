import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { VideoList } from '@/components/VideoList';
import { USE_MOCK } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import type { UploadFile } from '@/api';

// Temporary helper for stage 2. Removed once the real camera lands (stage 3).
const SHOW_UPLOAD_SIMULATOR = __DEV__ && USE_MOCK;

function createFakeFile(): UploadFile {
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  return {
    name: `gravacao-simulada-${stamp}.mp4`,
    size: 48 * 1024 * 1024 + Math.floor(Math.random() * 40 * 1024 * 1024),
    type: 'video/mp4',
  };
}

export default function OriginalsScreen() {
  const { pending, isUploading, startUpload, dismiss } = useVideoUpload();

  const handleSimulate = useCallback(() => {
    void startUpload(createFakeFile());
  }, [startUpload]);

  return (
    <View style={styles.container}>
      {SHOW_UPLOAD_SIMULATOR ? (
        <View style={styles.devBar}>
          <TouchableOpacity
            style={[styles.devButton, isUploading && styles.devButtonDisabled]}
            onPress={handleSimulate}
            activeOpacity={0.85}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#04121F" />
            ) : (
              <>
                <Ionicons name="videocam" size={18} color="#04121F" />
                <Text style={styles.devButtonLabel}>Simular gravação</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.devHint}>DEV · mock</Text>
        </View>
      ) : null}

      <VideoList
        mode="originals"
        pendingUploads={pending}
        onDismissUpload={dismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  devBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  devButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  devButtonDisabled: {
    opacity: 0.6,
  },
  devButtonLabel: {
    color: '#04121F',
    fontSize: 15,
    fontWeight: '800',
  },
  devHint: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
