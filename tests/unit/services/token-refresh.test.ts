import { beforeEach, describe, expect, it } from 'vitest'
import { createTokenRefresher } from '@/services/request/token-refresh'
import type { RequestOptions } from '@/services/request/types'
import { getAccessToken, getRefreshToken, setAuthTokens } from '@/shared/utils/token-storage'

const storage = new Map<string, string>()
const uniMock = {
  getStorageSync: (key: string) => storage.get(key) ?? '',
  setStorageSync: (key: string, value: string) => storage.set(key, value),
  removeStorageSync: (key: string) => storage.delete(key),
}

beforeEach(() => {
  storage.clear()
  Object.assign(globalThis, { uni: uniMock })
})

type Sender = <TResponse>(options: RequestOptions) => Promise<TResponse>

function sender(value: unknown): Sender {
  return async (_options: RequestOptions) => JSON.parse(JSON.stringify(value))
}

describe('令牌刷新器', () => {
  it('无刷新令牌时直接返回 false', async () => {
    await expect(
      createTokenRefresher(sender({ accessToken: 'x', refreshToken: 'y' }))(),
    ).resolves.toBe(false)
  })

  it('刷新成功时保存新令牌', async () => {
    setAuthTokens({ accessToken: 'old', refreshToken: 'refresh' })
    const refresher = createTokenRefresher(
      sender({ accessToken: 'new', refreshToken: 'new-refresh' }),
    )
    await expect(refresher()).resolves.toBe(true)
    expect(getAccessToken()).toBe('new')
    expect(getRefreshToken()).toBe('new-refresh')
  })

  it('响应缺少令牌或请求失败时返回 false', async () => {
    setAuthTokens({ accessToken: 'old', refreshToken: 'refresh' })
    expect(await createTokenRefresher(sender({ accessToken: '', refreshToken: 'new' }))()).toBe(
      false,
    )
    expect(
      await createTokenRefresher(
        async <TResponse>(_options: RequestOptions): Promise<TResponse> => {
          throw new Error('offline')
        },
      )(),
    ).toBe(false)
  })

  it('并发刷新共享同一任务', async () => {
    setAuthTokens({ accessToken: 'old', refreshToken: 'refresh' })
    let resolveRequest: ((value: { accessToken: string; refreshToken: string }) => void) | undefined
    const send: Sender = async <TResponse>(_options: RequestOptions) =>
      new Promise<TResponse>((resolve) => {
        resolveRequest = (value) => resolve(JSON.parse(JSON.stringify(value)))
      })
    const refresher = createTokenRefresher(send)
    const first = refresher()
    const second = refresher()
    expect(first).toBe(second)
    resolveRequest?.({ accessToken: 'new', refreshToken: 'new-refresh' })
    await expect(first).resolves.toBe(true)
  })
})
