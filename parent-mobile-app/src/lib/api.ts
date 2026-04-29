import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import { authEvent } from './authEvent';

/**
 * API URL seçim mantığı:
 *  1. app.json extra.apiUrl varsa kullan (production / fiziksel cihaz)
 *  2. Yoksa platform bazlı default:
 *       Android emülatör → 10.0.2.2 (emülatördeki localhost)
 *       iOS Simulator     → localhost
 *
 * Fiziksel cihaz için app.json extra.apiUrl'e bilgisayarın LAN IP'sini yaz:
 *   "apiUrl": "http://192.168.128.73:8000/api"
 */
const configuredUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

const DEFAULT_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';

export const API_URL = configuredUrl ?? DEFAULT_URL;

// In-memory token cache — avoids AsyncStorage read on every request
// UNINIT sentinel: not yet loaded from storage. null means "no token".
const UNINIT = Symbol('UNINIT');
let cachedToken: string | null | typeof UNINIT = UNINIT;

export function setTokenCache(token: string | null): void {
  cachedToken = token;
}

export function clearTokenCache(): void {
  cachedToken = null;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  if (cachedToken === UNINIT) {
    const parentToken = await AsyncStorage.getItem('parent_token');
    cachedToken = parentToken ?? await AsyncStorage.getItem('teacher_token');
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearTokenCache();
      await AsyncStorage.multiRemove(['parent_token', 'parent_user']);
      authEvent.trigger();
    }
    return Promise.reject(error);
  }
);

export default api;
