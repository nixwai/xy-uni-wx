import { beforeEach, describe, expect, it } from 'vitest'
import { RequestError, request } from '@/services/request'
import {
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/shared/utils/token-storage'

type Header = Record<string, string>

interface FakeResponse {
  statusCode: number
  data: unknown
}

interface UniRequestOptions {
  url: string
  header?: Header
  success: (response: FakeResponse) => void
}

const storage = new Map<string, string>()
let refreshCalls = 0
let handler: (url: string, header: Header) => FakeResponse

function installUni(): void {
  const uni = {
    getStorageSync: (key: string) => storage.get(key) ?? '',
    setStorageSync: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeStorageSync: (key: string) => {
      storage.delete(key)
    },
    request: (options: UniRequestOptions) => {
      const response = handler(options.url, options.header ?? {})
      void Promise.resolve().then(() => options.success(response))
    },
  }
  Object.assign(globalThis, { uni })
}

function envelope(data: unknown): FakeResponse {
  return { statusCode: 200, data: { code: 0, data } }
}

function unauthorized(code = 401): FakeResponse {
  return { statusCode: 401, data: { code, message: '登录状态已失效' } }
}

describe('token refresh', () => {
  beforeEach(() => {
    installUni()
    storage.clear()
    refreshCalls = 0
    setAuthTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' })
  })

  it('401 后刷新令牌并重放原请求', async () => {
    handler = (url, header) => {
      if (url.endsWith('/auth/user/refresh')) {
        refreshCalls += 1
        return envelope({ accessToken: 'new-access', refreshToken: 'new-refresh' })
      }
      if (header.Authorization === 'Bearer new-access') {
        return envelope({ id: 'u1' })
      }
      return unauthorized()
    }

    const profile = await request<{ id: string }>({ url: '/user/me' })

    expect(profile.id).toBe('u1')
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBe('new-access')
    expect(getRefreshToken()).toBe('new-refresh')
  })

  it('并发 401 只触发一次刷新', async () => {
    handler = (url, header) => {
      if (url.endsWith('/auth/user/refresh')) {
        refreshCalls += 1
        return envelope({ accessToken: 'new-access', refreshToken: 'new-refresh' })
      }
      if (header.Authorization === 'Bearer new-access') {
        return envelope({ ok: true })
      }
      return unauthorized()
    }

    const results = await Promise.all([
      request<{ ok: boolean }>({ url: '/a' }),
      request<{ ok: boolean }>({ url: '/b' }),
    ])

    expect(results.every((item) => item.ok)).toBe(true)
    expect(refreshCalls).toBe(1)
  })

  it('刷新失败时清理令牌并抛出未授权错误', async () => {
    handler = (url) => {
      if (url.endsWith('/auth/user/refresh')) {
        refreshCalls += 1
        return unauthorized()
      }
      return unauthorized(40100)
    }

    const error = await request({ url: '/user/me' }).catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBeUndefined()
    expect(getRefreshToken()).toBeUndefined()
  })

  it('本地无刷新令牌时不发起刷新请求', async () => {
    clearRefreshToken()
    handler = (url) => {
      if (url.endsWith('/auth/user/refresh')) {
        refreshCalls += 1
        return envelope({ accessToken: 'new-access', refreshToken: 'new-refresh' })
      }
      return unauthorized(40100)
    }

    const error = await request({ url: '/user/me' }).catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(refreshCalls).toBe(0)
    expect(getAccessToken()).toBeUndefined()
  })
})
