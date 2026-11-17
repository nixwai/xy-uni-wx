import { STORAGE_KEYS } from '@/constants/storage'

function getStringValue(key: string): string | undefined {
  const value = uni.getStorageSync(key)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function getAccessToken(): string | undefined {
  return getStringValue(STORAGE_KEYS.accessToken)
}

export function setAccessToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.accessToken, token)
}

export function getRefreshToken(): string | undefined {
  return getStringValue(STORAGE_KEYS.refreshToken)
}

export function setRefreshToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.refreshToken, token)
}

export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  setAccessToken(tokens.accessToken)
  setRefreshToken(tokens.refreshToken)
}

export function clearAccessToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.accessToken)
}

export function clearRefreshToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.refreshToken)
}

export function clearAuthTokens(): void {
  clearAccessToken()
  clearRefreshToken()
}
