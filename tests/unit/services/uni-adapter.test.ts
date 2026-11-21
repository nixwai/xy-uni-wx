import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUniRequestAdapter } from '@/services/request/uni-adapter'
import { RequestError } from '@/services/request'

const request = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(globalThis, { uni: { request } })
})

describe('uni 请求适配器', () => {
  it('转换成功响应和响应头', async () => {
    request.mockImplementation(({ success }: { success: (response: unknown) => void }) =>
      success({ statusCode: 200, data: { ok: true }, header: { 'x-id': '1', ignored: 2 } }),
    )
    await expect(
      createUniRequestAdapter()({
        url: 'https://api.test/a',
        method: 'GET',
        headers: {},
        timeout: 1000,
      }),
    ).resolves.toEqual({ statusCode: 200, data: { ok: true }, headers: { 'x-id': '1' } })
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://api.test/a', method: 'GET', timeout: 1000 }),
    )
  })

  it('将平台超时转换为 RequestError', async () => {
    request.mockImplementation(({ fail }: { fail: (error: unknown) => void }) =>
      fail({ errMsg: 'timeout' }),
    )
    await expect(
      createUniRequestAdapter()({ url: 'x', method: 'GET', headers: {}, timeout: 1000 }),
    ).rejects.toMatchObject({ kind: 'timeout' })
  })

  it('保留非超时平台错误', async () => {
    const error = new Error('offline')
    request.mockImplementation(({ fail }: { fail: (value: unknown) => void }) => fail(error))
    await expect(
      createUniRequestAdapter()({ url: 'x', method: 'GET', headers: {}, timeout: 1000 }),
    ).rejects.toBe(error)
    expect(error).not.toBeInstanceOf(RequestError)
  })
})
