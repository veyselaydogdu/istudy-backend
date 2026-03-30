import { Stack, router, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { authEvent } from '../lib/authEvent';
import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  saveAuth,
  type User,
} from '../lib/auth';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/**
 * Auth guard — token durumuna göre kullanıcıyı doğru gruba yönlendirir.
 * isLoading true iken bekler (splash gösterilir).
 */
function AuthGuard({ token, isLoading }: { token: string | null; isLoading: boolean }) {
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) { return; }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!token && !inAuthGroup) {
      // Oturum yok, auth ekranı dışında → login'e yönlendir
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Oturum var ama hâlâ auth ekranında → uygulamaya yönlendir
      router.replace('/(app)');
    }
  }, [token, segments, isLoading]);

  return null;
}

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan oturum yükle
  useEffect(() => {
    void (async () => {
      const storedToken = await getStoredToken();
      const storedUser = await getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
      setIsLoading(false);
    })();
  }, []);

  // 401 interceptor'dan signOut tetiklenir
  useEffect(() => {
    authEvent.register(() => {
      setToken(null);
      setUser(null);
    });
    return () => {
      authEvent.unregister();
    };
  }, []);

  const signIn = async (newToken: string, newUser: User): Promise<void> => {
    await saveAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async (): Promise<void> => {
    await clearAuth();
    setToken(null);
    setUser(null);
  };

  const refreshUser = (newUser: User): void => {
    setUser(newUser);
  };

  // Oturum yüklenirken splash göster
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#208AEF',
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut, refreshUser }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <AuthGuard token={token} isLoading={isLoading} />
    </AuthContext.Provider>
  );
}
