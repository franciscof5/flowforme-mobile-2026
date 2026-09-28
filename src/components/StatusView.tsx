import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/constants/theme';

type StatusKind = 'loading' | 'empty' | 'error';

interface StatusViewProps {
  kind: StatusKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ICONS: Record<StatusKind, keyof typeof Ionicons.glyphMap> = {
  loading: 'cloud-download-outline',
  empty: 'albums-outline',
  error: 'alert-circle-outline',
};

export function StatusView({ kind, title, message, onRetry }: StatusViewProps) {
  return (
    <View style={styles.container}>
      {kind === 'loading' ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <Ionicons
          name={ICONS[kind]}
          size={44}
          color={kind === 'error' ? colors.danger : colors.textFaint}
        />
      )}

      <Text style={styles.title}>
        {title ??
          (kind === 'loading'
            ? 'Carregando vídeos...'
            : kind === 'empty'
              ? 'Nada por aqui'
              : 'Algo deu errado')}
      </Text>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {kind === 'error' && onRetry ? (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
  },
  retryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
