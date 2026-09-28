import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/constants/theme';
import { formatBytes, formatDate } from '@/lib/format';
import type { VideoObject } from '@/types/video';

interface VideoListItemProps {
  video: VideoObject;
  showEditedBadge?: boolean;
  onPress: (video: VideoObject) => void;
}

function thumbnailUri(key: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(key)}/320/180`;
}

export function VideoListItem({
  video,
  showEditedBadge,
  onPress,
}: VideoListItemProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => onPress(video)}
    >
      <View style={styles.thumbnail}>
        <Ionicons name="videocam" size={22} color={colors.textFaint} />
        <Image
          source={{ uri: thumbnailUri(video.key) }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playBadge}>
          <Ionicons name="play" size={12} color={colors.text} />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {video.name}
          </Text>
          {showEditedBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Editado</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {formatDate(video.lastModified)} · {formatBytes(video.size)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  thumbnail: {
    width: 96,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  badgeLabel: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
