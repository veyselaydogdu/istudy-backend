import { Stack, router, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { authEvent } from '../lib/authEvent';
import { AppColors } from '@/constants/theme';
import {
  clearAuth,
  clearTeacherAuth,
  getStoredTeacherToken,
  getStoredTeacherUser,
  getStoredToken,
  getStoredUser,
  saveAuth,
  saveTeacherAuth,
  type User,
} from '../lib/auth';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  teacherToken: string | null;
  teacherUser: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: (user: User) => void;
  signInAsTeacher: (token: string, user: User) => Promise<void>;
  signOutTeacher: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoading: true,
  teacherToken: null,
  teacherUser: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: () => {},
  signInAsTeacher: async () => {},
  signOutTeacher: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/**
 * Auth guard — token durumuna göre kullanıcıyı doğru gruba yönlendirir.
 * isLoading true iken bekler (splash gösterilir).
 */
function AuthGuard({
  token,
  teacherToken,
  isLoading,
}: {
  token: string | null;
  teacherToken: string | null;
  isLoading: boolean;
}) {
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) { return; }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inTeacherAppGroup = segments[0] === '(teacher-app)';

    if (!token && !teacherToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (teacherToken && !token && !inTeacherAppGroup) {
      router.replace('/(teacher-app)');
    } else if (token && !teacherToken && (inAuthGroup || inTeacherAppGroup)) {
      router.replace('/(app)');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [token, teacherToken, segments, isLoading]);

  return null;
}

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [teacherToken, setTeacherToken] = useState<string | null>(null);
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan oturum yükle
  useEffect(() => {
    void (async () => {
      const storedToken = await getStoredToken();
      const storedUser = await getStoredUser();
      const storedTeacherToken = await getStoredTeacherToken();
      const storedTeacherUser = await getStoredTeacherUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
      if (storedTeacherToken && storedTeacherUser) {
        setTeacherToken(storedTeacherToken);
        setTeacherUser(storedTeacherUser);
      }
      setIsLoading(false);
    })();
  }, []);

  // 401 interceptor'dan signOut tetiklenir
  useEffect(() => {
    authEvent.register(() => {
      setToken(null);
      setUser(null);
      setTeacherToken(null);
      setTeacherUser(null);
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

  const signInAsTeacher = async (newToken: string, newUser: User): Promise<void> => {
    await saveTeacherAuth(newToken, newUser);
    setTeacherToken(newToken);
    setTeacherUser(newUser);
  };

  const signOutTeacher = async (): Promise<void> => {
    await clearTeacherAuth();
    setTeacherToken(null);
    setTeacherUser(null);
  };

  // Oturum yüklenirken splash göster
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: AppColors.primaryContainer,
        }}
      >
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        teacherToken,
        teacherUser,
        signIn,
        signOut,
        refreshUser,
        signInAsTeacher,
        signOutTeacher,
      }}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(teacher-app)" />
      </Stack>
      <AuthGuard token={token} teacherToken={teacherToken} isLoading={isLoading} />
    </AuthContext.Provider>
  );
}
