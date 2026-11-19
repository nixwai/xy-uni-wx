import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAccessToken,
  clearAuthTokens,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setAuthTokens,
  setRefreshToken,
} from '@/shared/utils/token-storage'
const storage = new Map<string, unknown>()
const uniMock = {
  getStorageSync: (key: string) => storage.get(key),
  setStorageSync: (key: string, value: unknown) => storage.set(key, value),
  removeStorageSync: (key: string) => storage.delete(key),
}
beforeEach(() => {
  storage.clear()
  Object.assign(globalThis, { uni: uniMock })
})
describe('token-storage', () => {
  it('保存和读取令牌时去除首尾空白', () => {
    setAccessToken(' access ')
    setRefreshToken(' refresh ')
    expect(getAccessToken()).toBe('access')
    expect(getRefreshToken()).toBe('refresh')
  })
  it('拒绝空令牌且不会写入无效值', () => {
    expect(() => setAccessToken('  ')).toThrow('认证令牌无效')
    expect(() => setRefreshToken('')).toThrow('认证令牌无效')
    expect(() => setAuthTokens({ accessToken: 'ok', refreshToken: ' ' })).toThrow('认证令牌无效')
    expect(getAccessToken()).toBeUndefined()
    expect(getRefreshToken()).toBeUndefined()
  })
  it('批量保存并清理认证令牌', () => {
    setAuthTokens({ accessToken: 'access', refreshToken: 'refresh' })
    expect(getAccessToken()).toBe('access')
    expect(getRefreshToken()).toBe('refresh')
    clearAccessToken()
    expect(getAccessToken()).toBeUndefined()
    clearRefreshToken()
    expect(getRefreshToken()).toBeUndefined()
    setAuthTokens({ accessToken: 'access', refreshToken: 'refresh' })
    clearAuthTokens()
    expect(getAccessToken()).toBeUndefined()
    expect(getRefreshToken()).toBeUndefined()
  })
  it('忽略存储中的非字符串值和空字符串', () => {
    storage.set('xy-uni-wx.access-token', 123)
    storage.set('xy-uni-wx.refresh-token', '  ')
    expect(getAccessToken()).toBeUndefined()
    expect(getRefreshToken()).toBeUndefined()
  })
})
