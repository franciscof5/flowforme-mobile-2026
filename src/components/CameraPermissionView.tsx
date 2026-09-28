import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/constants/theme';

interface CameraPermissionViewProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  /** When false the permission can no longer be requested and Settings must be opened. */
  canRequest: boolean;
  requesting?: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}

/** Clear full-screen state shown when a camera permission is missing. */
export function CameraPermissionView({
  icon = 'camera-outline',
  title,
  message,
  canRequest,
  requesting,
  onRequest,
  onOpenSettings,
}: CameraPermissionViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity
        style={[styles.button, requesting && styles.buttonDisabled]}
        activeOpacity={0.85}
        disabled={requesting}
        onPress={canRequest ? onRequest : onOpenSettings}
      >
        {requesting ? (
          <ActivityIndicator color="#04121F" />
        ) : (
          <>
            <Ionicons
              name={canRequest ? 'lock-open-outline' : 'settings-outline'}
              size={18}
              color="#04121F"
            />
            <Text style={styles.buttonLabel}>
              {canRequest ? 'Permitir acesso' : 'Abrir Ajustes'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: colors.background,
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 200,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#04121F',
    fontSize: 15,
    fontWeight: '800',
  },
});
