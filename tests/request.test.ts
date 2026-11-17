import { describe, expect, it, vi } from 'vitest'
import { RequestClient } from '@/services/request'
import type { RequestAdapter } from '@/services/request'

const httpErrorAdapter: RequestAdapter = async () => ({
  statusCode: 401,
  data: { message: '未登录' },
  headers: {},
})

const interceptorAdapter: RequestAdapter = async (options) => ({
  statusCode: 200,
  data: { code: 0, data: { value: options.data } },
  headers: {},
})

const businessErrorAdapter: RequestAdapter = async () => ({
  statusCode: 200,
  data: { code: 1001, data: null, message: '业务失败' },
  headers: {},
})

const networkErrorAdapter: RequestAdapter = async () => {
  throw new Error('offline')
}

const businessUnauthorizedAdapter: RequestAdapter = async () => ({
  statusCode: 200,
  data: { code: 40100, data: null, message: '登录状态无效' },
  headers: {},
})

describe('请求服务', () => {
  it('拼接基础地址并解包标准业务响应', async () => {
    const calls: string[] = []
    const adapter: RequestAdapter = async (options) => {
      calls.push(options.url)
      return {
        statusCode: 200,
        data: { code: 0, data: { id: 1 } },
        headers: {},
      }
    }
    const client = new RequestClient({
      baseUrl: 'https://api.example.com/',
      timeoutMs: 5000,
      adapter,
    })

    await expect(client.get<{ id: number }>('/users/1')).resolves.toEqual({ id: 1 })
    expect(calls).toEqual(['https://api.example.com/users/1'])
  })

  it('支持请求与响应拦截器', async () => {
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter: interceptorAdapter,
    })
      .withRequestInterceptor((options) => ({ ...options, data: 'intercepted' }))
      .withResponseInterceptor((data) => ({ ...data, changed: true }))

    await expect(client.post('/events')).resolves.toEqual({ value: 'intercepted', changed: true })
  })

  it('把 HTTP 错误转换为统一 RequestError 并触发未授权扩展点', async () => {
    const onUnauthorized = vi.fn()
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter: httpErrorAdapter,
      onUnauthorized,
    })

    await expect(client.get('/private')).rejects.toMatchObject({
      kind: 'http',
      statusCode: 401,
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('把业务错误转换为统一 RequestError', async () => {
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter: businessErrorAdapter,
    })

    await expect(client.get('/business')).rejects.toMatchObject({
      kind: 'business',
      code: 1001,
      message: '业务失败',
    })
  })

  it('业务未授权响应也触发未授权扩展点', async () => {
    const onUnauthorized = vi.fn()
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter: businessUnauthorizedAdapter,
      onUnauthorized,
    })

    await expect(client.get('/private')).rejects.toMatchObject({
      kind: 'business',
      code: 40100,
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('把网络异常转换为统一 RequestError', async () => {
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter: networkErrorAdapter,
    })

    await expect(client.get('/offline')).rejects.toMatchObject({
      kind: 'network',
      message: '网络请求失败',
    })
  })

  it('调用方不能覆盖请求客户端注入的认证令牌', async () => {
    const requests: Array<{ headers: Record<string, string> }> = []
    const adapter: RequestAdapter = async (options) => {
      requests.push({ headers: options.headers })
      return { statusCode: 204, data: undefined, headers: {} }
    }
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter,
      getToken: () => 'trusted-token',
    })

    await client.get('/private', { headers: { authorization: 'spoofed-token' } })

    expect(requests).toEqual([{ headers: { Authorization: 'Bearer trusted-token' } }])
  })

  it('在请求前注入令牌并保留请求参数', async () => {
    const requests: Array<{ headers: Record<string, string>; data: unknown }> = []
    const adapter: RequestAdapter = async (options) => {
      requests.push({ headers: options.headers, data: options.data })
      return { statusCode: 204, data: undefined, headers: {} }
    }
    const client = new RequestClient({
      baseUrl: 'https://api.example.com',
      timeoutMs: 5000,
      adapter,
      getToken: () => 'token-value',
    })

    await expect(
      client.post('/events', {
        data: { type: 'launch' },
        headers: { 'X-Trace-Id': 'trace-id' },
      }),
    ).resolves.toBeUndefined()
    expect(requests).toEqual([
      {
        headers: {
          Authorization: 'Bearer token-value',
          'X-Trace-Id': 'trace-id',
        },
        data: { type: 'launch' },
      },
    ])
  })
})
