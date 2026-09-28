import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/constants/theme';
import { formatBytes } from '@/lib/format';
import type { PendingUpload } from '@/types/video';

interface PendingUploadItemProps {
  upload: PendingUpload;
  onDismiss: (key: string) => void;
}

export function PendingUploadItem({
  upload,
  onDismiss,
}: PendingUploadItemProps) {
  const isUploading = upload.status === 'uploading';
  const isError = upload.status === 'error';

  return (
    <View style={[styles.row, isError && styles.rowError]}>
      <View style={styles.thumbnail}>
        <Ionicons
          name={isError ? 'cloud-offline-outline' : 'cloud-upload-outline'}
          size={22}
          color={isError ? colors.danger : colors.primary}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {upload.name}
        </Text>

        {isUploading ? (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${upload.progress}%` }]}
              />
            </View>
            <Text style={styles.meta}>
              Enviando... {upload.progress}% · {formatBytes(upload.size)}
            </Text>
          </>
        ) : isError ? (
          <Text style={styles.error} numberOfLines={2}>
            {upload.error ?? 'Falha ao enviar.'}
          </Text>
        ) : (
          <View style={styles.sentRow}>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={colors.success}
            />
            <Text style={styles.sent}>Enviado</Text>
          </View>
        )}
      </View>

      {isUploading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <TouchableOpacity
          style={styles.dismiss}
          onPress={() => onDismiss(upload.key)}
          activeOpacity={0.7}
          accessibilityLabel="Remover envio"
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceAlt,
  },
  rowError: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  thumbnail: {
    width: 96,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sent: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  dismiss: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
