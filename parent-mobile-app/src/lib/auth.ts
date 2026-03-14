import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setTokenCache, clearTokenCache } from './api';

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  email_verified_at: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    email_verified: boolean;
  };
}

export const TOKEN_KEY = 'parent_token';
export const USER_KEY = 'parent_user';

export async function saveAuth(token: string, user: User): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  setTokenCache(token);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  clearTokenCache();
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function loginRequest(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/parent/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function registerRequest(payload: {
  name: string;
  surname: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    '/parent/auth/register',
    payload
  );
  return response.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/parent/auth/logout');
}

export function getApiError(err: unknown): string {
  const e = err as {
    code?: string;
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    message?: string;
  };

  // Network timeout
  if (e.code === 'ECONNABORTED') {
    return 'Sunucu yanıt vermedi. Lütfen tekrar deneyin.';
  }

  // No response at all (network error)
  if (!e.response) {
    return 'İnternet bağlantınızı kontrol edin.';
  }

  if (e.response?.data?.errors) {
    const firstKey = Object.keys(e.response.data.errors)[0];
    if (firstKey) {
      return e.response.data.errors[firstKey][0];
    }
  }

  return (
    e.response?.data?.message ||
    e.message ||
    'Bir hata oluştu. Lütfen tekrar deneyin.'
  );
}
