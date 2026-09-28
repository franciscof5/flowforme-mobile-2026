import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { clearFlowApiCache } from '@/api';
import { subscribeUnauthorized } from '@/api/authEvents';
import { MOCK_USER, STORAGE_KEYS, USE_MOCK } from '@/constants/config';
import { pb } from '@/lib/pocketbase';
import type { Session, SessionUser } from '@/types/video';

interface AuthContextValue {
  session: Session | null;
  user: SessionUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistSession(session: Session | null): Promise<void> {
  if (session) {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.session);
  }
}

function friendlyAuthError(error: unknown): string {
  if (error instanceof Error) {
    if (/Failed to authenticate|status 400/i.test(error.message)) {
      return 'Email ou senha inválidos.';
    }
    if (/Network request failed|fetch/i.test(error.message)) {
      return 'Não foi possível conectar ao servidor.';
    }
    return error.message;
  }
  return 'Não foi possível entrar. Tente novamente.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.session);
        if (active && stored) {
          setSession(JSON.parse(stored) as Session);
        }
      } catch {
        // Corrupted session: start signed out.
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      throw new Error('Informe email e senha.');
    }

    if (USE_MOCK) {
      await sleep(600);
      const next: Session = { user: { ...MOCK_USER } };
      await persistSession(next);
      setSession(next);
      return;
    }

    try {
      const auth = await pb
        .collection('users')
        .authWithPassword(trimmedEmail, password);
      const record = auth.record as unknown as Record<string, unknown>;
      const username = String(
        record.username ?? record.name ?? record.email ?? trimmedEmail,
      );
      const bucket = String(record.bucket ?? 'default-bucket');

      const next: Session = {
        user: { username, bucket },
        token: pb.authStore.token,
      };
      await persistSession(next);
      setSession(next);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!USE_MOCK) {
      pb.authStore.clear();
    }
    clearFlowApiCache();
    await persistSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      void signOut();
    });
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return value;
}
