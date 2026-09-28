import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { STORAGE_KEYS } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [wifiOnly, setWifiOnly] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEYS.wifiOnly).then((value) => {
      if (active) setWifiOnly(value === 'true');
    });
    return () => {
      active = false;
    };
  }, []);

  function handleWifiToggle(value: boolean) {
    setWifiOnly(value);
    void AsyncStorage.setItem(STORAGE_KEYS.wifiOnly, value ? 'true' : 'false');
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  }

  const initial = (user?.username ?? '?').charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>Conta</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.username}>{user?.username ?? 'Desconhecido'}</Text>
          <Text style={styles.bucket}>Bucket: {user?.bucket ?? '—'}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Preferências</Text>
      <View style={styles.card}>
        <View style={styles.rowIcon}>
          <Ionicons name="wifi" size={18} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Somente Wi-Fi</Text>
          <Text style={styles.rowSubtitle}>
            Ainda sem efeito nesta versão.
          </Text>
        </View>
        <Switch
          value={wifiOnly}
          onValueChange={handleWifiToggle}
          trackColor={{ false: colors.surfaceAlt, true: colors.primaryMuted }}
          thumbColor={wifiOnly ? colors.primary : colors.textFaint}
          ios_backgroundColor={colors.surfaceAlt}
        />
      </View>

      <Text style={styles.sectionLabel}>Sessão</Text>
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutLabel}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FlowForMe</Text>
        <Text style={styles.footerText}>Versão {appVersion}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  username: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  bucket: {
    color: colors.textMuted,
    fontSize: 13,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  logoutLabel: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 2,
    marginTop: 32,
  },
  footerText: {
    color: colors.textFaint,
    fontSize: 12,
  },
});
