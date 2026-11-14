import { describe, expect, it } from 'vitest'
import { createAppConfig } from '@/config/env'

describe('运行配置', () => {
  it('读取并校验公开运行配置', () => {
    expect(
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com/',
        VITE_REQUEST_TIMEOUT: '12000',
      }),
    ).toEqual({
      apiBaseUrl: 'https://api.example.com',
      requestTimeoutMs: 12000,
    })
  })

  it('使用默认请求超时', () => {
    expect(createAppConfig({ VITE_API_BASE_URL: 'https://api.example.com' })).toEqual({
      apiBaseUrl: 'https://api.example.com',
      requestTimeoutMs: 10000,
    })
  })

  it('拒绝缺失或非法的 API 地址', () => {
    expect(() => createAppConfig({ VITE_API_BASE_URL: '' })).toThrow('VITE_API_BASE_URL')
    expect(() => createAppConfig({ VITE_API_BASE_URL: 'not-a-url' })).toThrow('VITE_API_BASE_URL')
    expect(() => createAppConfig({ VITE_API_BASE_URL: 'https://' })).toThrow('VITE_API_BASE_URL')
    expect(() => createAppConfig({ VITE_API_BASE_URL: 'ftp://api.example.com' })).toThrow(
      'VITE_API_BASE_URL',
    )
  })

  it('拒绝非法的请求超时配置', () => {
    expect(() =>
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_REQUEST_TIMEOUT: '0',
      }),
    ).toThrow('VITE_REQUEST_TIMEOUT')
    expect(() =>
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_REQUEST_TIMEOUT: '120001',
      }),
    ).toThrow('VITE_REQUEST_TIMEOUT')
    expect(() =>
      createAppConfig({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_REQUEST_TIMEOUT: '1.5',
      }),
    ).toThrow('VITE_REQUEST_TIMEOUT')
  })
})
