import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ url?: string; title?: string }>();

  const url = typeof params.url === 'string' ? params.url : undefined;
  const title = typeof params.title === 'string' ? params.title : 'Vídeo';

  const player = useVideoPlayer(url ?? null, (instance) => {
    instance.loop = false;
  });

  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEffect(() => {
    if (url) {
      player.play();
    }
  }, [player, url]);

  const isLoading = status === 'loading' || status === 'idle';

  return (
    <View style={styles.container}>
      {url ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
        />
      ) : null}

      {isLoading ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}

      {error ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.errorText}>
            Não foi possível reproduzir este vídeo.
          </Text>
        </View>
      ) : null}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.overlay,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
