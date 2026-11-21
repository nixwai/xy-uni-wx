import { describe, expect, it } from 'vitest'
import { createAppConfig } from '@/config/env'

describe('createAppConfig', () => {
  it('规范化合法 API 地址并使用默认超时时间', () => {
    expect(createAppConfig({ VITE_API_BASE_URL: ' https://api.example.com/// ' })).toEqual({
      apiBaseUrl: 'https://api.example.com',
      requestTimeoutMs: 10_000,
    })
  })
  it.each([undefined, '', '   ', 'api.example.com', 'ftp://api.example.com'])(
    '拒绝非法 API 地址：%s',
    (value) => {
      expect(() => createAppConfig({ VITE_API_BASE_URL: value })).toThrow()
    },
  )
  it.each(['999', '120001', '10.5', 'abc'])('拒绝非法超时时间：%s', (value) => {
    expect(() =>
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_REQUEST_TIMEOUT: value,
      }),
    ).toThrow('VITE_REQUEST_TIMEOUT')
  })
  it('接受边界超时时间并冻结配置', () => {
    const config = createAppConfig({
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_REQUEST_TIMEOUT: '1000',
    })
    expect(config.requestTimeoutMs).toBe(1000)
    expect(Object.isFrozen(config)).toBe(true)
    expect(
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_REQUEST_TIMEOUT: '120000',
      }).requestTimeoutMs,
    ).toBe(120000)
  })
})
