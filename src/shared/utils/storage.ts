import { STORAGE_KEYS } from '@/constants/storage'

export function getAccessToken(): string | undefined {
  const value = uni.getStorageSync(STORAGE_KEYS.accessToken)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function setAccessToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.accessToken, token)
}

export function clearAccessToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.accessToken)
}
