/**
 * Axios interceptor'dan doğrudan router'a erişilemez.
 * Bu modül, 401 geldiğinde _layout.tsx'teki signOut'u tetiklemek için
 * global callback pattern kullanır.
 */
type UnauthorizedCallback = () => void;

export const authEvent = {
  onUnauthorized: null as UnauthorizedCallback | null,

  trigger(): void {
    this.onUnauthorized?.();
  },

  register(callback: UnauthorizedCallback): void {
    this.onUnauthorized = callback;
  },

  unregister(): void {
    this.onUnauthorized = null;
  },
};
