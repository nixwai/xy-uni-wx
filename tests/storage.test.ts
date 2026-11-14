import { describe, expect, it, vi } from 'vitest'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/shared/utils/storage'

describe('本地存储工具', () => {
  it('读写并清除访问令牌', () => {
    let token = ''
    const uniStub = {
      getStorageSync: vi.fn(() => token),
      setStorageSync: vi.fn((_key: string, value: string) => {
        token = value
      }),
      removeStorageSync: vi.fn(() => {
        token = ''
      }),
    }
    vi.stubGlobal('uni', uniStub)

    expect(getAccessToken()).toBeUndefined()
    setAccessToken('token-value')
    expect(getAccessToken()).toBe('token-value')
    clearAccessToken()
    expect(getAccessToken()).toBeUndefined()
    expect(uniStub.setStorageSync).toHaveBeenCalledOnce()
    expect(uniStub.removeStorageSync).toHaveBeenCalledOnce()
  })

  it('忽略非字符串令牌', () => {
    vi.stubGlobal('uni', { getStorageSync: vi.fn(() => 123) })

    expect(getAccessToken()).toBeUndefined()
  })
})
