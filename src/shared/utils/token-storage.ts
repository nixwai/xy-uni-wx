import { STORAGE_KEYS } from '@/constants/storage'

function normalizeToken(token: string): string {
  const normalizedToken = typeof token === 'string' ? token.trim() : ''
  if (!normalizedToken) {
    throw new Error('认证令牌无效')
  }

  return normalizedToken
}

function getStringValue(key: string): string | undefined {
  const value = uni.getStorageSync(key)
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()
  return normalizedValue || undefined
}

/** 读取本地访问令牌。 */
export function getAccessToken(): string | undefined {
  return getStringValue(STORAGE_KEYS.accessToken)
}

/** 保存本地访问令牌。 */
export function setAccessToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.accessToken, normalizeToken(token))
}

/** 读取本地刷新令牌。 */
export function getRefreshToken(): string | undefined {
  return getStringValue(STORAGE_KEYS.refreshToken)
}

/** 保存本地刷新令牌。 */
export function setRefreshToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.refreshToken, normalizeToken(token))
}

/** 一次校验并保存访问令牌和刷新令牌。 */
export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  const accessToken = normalizeToken(tokens.accessToken)
  const refreshToken = normalizeToken(tokens.refreshToken)

  uni.setStorageSync(STORAGE_KEYS.accessToken, accessToken)
  uni.setStorageSync(STORAGE_KEYS.refreshToken, refreshToken)
}

/** 删除本地访问令牌。 */
export function clearAccessToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.accessToken)
}

/** 删除本地刷新令牌。 */
export function clearRefreshToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.refreshToken)
}

/** 一次删除完整本地认证状态。 */
export function clearAuthTokens(): void {
  clearAccessToken()
  clearRefreshToken()
}
