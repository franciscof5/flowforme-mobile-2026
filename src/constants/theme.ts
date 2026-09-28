import { DarkTheme, type Theme } from 'expo-router';

export const colors = {
  background: '#0B0F14',
  surface: '#151B23',
  surfaceAlt: '#1E2630',
  border: '#263241',
  primary: '#4EA1FF',
  primaryMuted: '#16324B',
  text: '#F5F7FA',
  textMuted: '#93A1B0',
  textFaint: '#5E6B7A',
  danger: '#FF6B6B',
  success: '#4ADE80',
  warning: '#FBBF24',
  overlay: 'rgba(5, 8, 12, 0.72)',
} as const;

export const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};
