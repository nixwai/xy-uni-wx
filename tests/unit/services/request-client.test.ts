import { describe, expect, it, vi } from 'vitest'
import { RequestClient, RequestError } from '@/services/request'
import type { AdapterOptions, AdapterResponse } from '@/services/request/types'

function client(
  _adapter: (options: AdapterOptions) => Promise<AdapterResponse> | AdapterResponse,
  overrides: Partial<ConstructorParameters<typeof RequestClient>[0]> = {},
): RequestClient {
  return new RequestClient({
    baseUrl: 'https://api.test///',
    timeoutMs: 5000,
    adapter: _adapter,
    ...overrides,
  })
}

describe('RequestClient', () => {
  it('组装地址、令牌、请求拦截器并解包响应', async () => {
    const adapter = vi.fn(async (_options: AdapterOptions) => ({
      statusCode: 200,
      data: { code: 0, data: { ok: true } },
      headers: {},
    }))
    const result = await client(adapter, {
      getToken: () => 'token',
      requestInterceptors: [async (options) => ({ ...options, url: '/changed' })],
      responseInterceptors: [vi.fn(async <T>(data: T): Promise<T> => data)],
    }).request({ url: '/original', headers: { Authorization: 'spoof', 'x-id': '1' } })
    expect(result).toEqual({ ok: true })
    expect(adapter).toHaveBeenCalledWith({
      url: 'https://api.test/changed',
      method: 'GET',
      data: undefined,
      headers: { 'x-id': '1', Authorization: 'Bearer token' },
      timeout: 5000,
    })
  })

  it('在请求错误边界统一生成用户可读的异常文本', async () => {
    await expect(
      client(async () => ({ statusCode: 500, data: {}, headers: {} })).request({ url: '/a' }),
    ).rejects.toMatchObject({
      kind: 'http',
      message: '服务暂时不可用，请稍后重试',
    })

    await expect(
      client(async () => {
        throw new RequestError('请求超时', { kind: 'timeout' })
      }).request({ url: '/a' }),
    ).rejects.toMatchObject({
      kind: 'timeout',
      message: '请求超时，请稍后重试',
    })

    await expect(
      client(async () => ({ statusCode: 200, data: { ok: true }, headers: {} }), {
        responseInterceptors: [
          () => {
            throw new Error('响应转换失败')
          },
        ],
      }).request({ url: '/a' }),
    ).rejects.toMatchObject({
      kind: 'unknown',
      message: '响应转换失败',
    })
  })

  it('报告 HTTP、业务和网络错误', async () => {
    await expect(
      client(async () => ({ statusCode: 500, data: { message: 'server' }, headers: {} })).request({
        url: '/a',
      }),
    ).rejects.toMatchObject({ kind: 'http', statusCode: 500 })
    await expect(
      client(async () => ({
        statusCode: 200,
        data: { code: 1001, message: 'business' },
        headers: {},
      })).request({ url: '/a' }),
    ).rejects.toMatchObject({ kind: 'business', code: 1001, message: 'business' })
    await expect(
      client(async () => {
        throw new Error('offline')
      }).request({ url: '/a' }),
    ).rejects.toMatchObject({ kind: 'network', message: '网络连接失败，请检查网络后重试' })
  })

  it('未授权时刷新并只重放一次，刷新失败则通知并抛错', async () => {
    let calls = 0
    const adapter = vi.fn(async () => {
      calls += 1
      return calls === 1
        ? { statusCode: 401, data: {}, headers: {} }
        : { statusCode: 200, data: { ok: true }, headers: {} }
    })
    const onUnauthorized = vi.fn()
    await expect(
      client(adapter, { refreshAccessToken: async () => true, onUnauthorized }).request({
        url: '/a',
      }),
    ).resolves.toEqual({ ok: true })
    expect(calls).toBe(2)
    expect(onUnauthorized).not.toHaveBeenCalled()

    const failure = new RequestError('unauthorized', { kind: 'http', statusCode: 401 })
    const notify = vi.fn()
    await expect(
      client(
        async () => {
          throw failure
        },
        { refreshAccessToken: async () => false, onUnauthorized: notify },
      ).request({ url: '/a' }),
    ).rejects.toMatchObject({
      kind: 'http',
      statusCode: 401,
      message: '登录状态已失效，请重新登录',
    })
    expect(notify).toHaveBeenCalledWith(failure)
  })

  it('skipTokenRefresh 时不刷新，重放后的未授权也会通知', async () => {
    const refresh = vi.fn(async () => true)
    const notify = vi.fn()
    const error = new RequestError('unauthorized', { kind: 'http', statusCode: 401 })
    await expect(
      client(
        async () => {
          throw error
        },
        { refreshAccessToken: refresh, onUnauthorized: notify },
      ).request({ url: '/a', skipTokenRefresh: true }),
    ).rejects.toMatchObject({
      kind: 'http',
      statusCode: 401,
      message: '登录状态已失效，请重新登录',
    })
    expect(refresh).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledTimes(1)

    let calls = 0
    const repeatError = new RequestError('unauthorized', { kind: 'http', statusCode: 401 })
    await expect(
      client(
        async () => {
          calls += 1
          throw repeatError
        },
        { refreshAccessToken: async () => true, onUnauthorized: notify },
      ).request({ url: '/b' }),
    ).rejects.toMatchObject({
      kind: 'http',
      statusCode: 401,
      message: '登录状态已失效，请重新登录',
    })
    expect(calls).toBe(2)
  })
})
