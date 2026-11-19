import { describe, expect, it } from 'vitest'
import {
  createBusinessError,
  createHttpError,
  createNetworkError,
} from '@/services/error/error-creator'
import { getErrorMessage } from '@/services/error/error-message'
import { RequestError } from '@/services/request'

describe('请求错误', () => {
  it('创建网络、HTTP 和业务错误并保留上下文', () => {
    const cause = { reason: 'offline' }
    expect(createNetworkError(cause)).toMatchObject({
      kind: 'network',
      message: '网络请求失败',
      cause,
    })
    expect(createHttpError({ statusCode: 503, data: cause, headers: {} })).toMatchObject({
      kind: 'http',
      statusCode: 503,
      cause,
    })
    expect(createBusinessError({ code: 1001 })).toMatchObject({
      kind: 'business',
      code: 1001,
      message: '业务请求失败',
    })
    expect(createBusinessError({ code: 1002, message: '余额不足' })).toMatchObject({
      kind: 'business',
      code: 1002,
      message: '余额不足',
    })
  })

  it('将不同异常转换为用户可读信息', () => {
    expect(getErrorMessage(new RequestError('timeout', { kind: 'timeout' }))).toBe(
      '请求超时，请稍后重试',
    )
    expect(getErrorMessage(new RequestError('network', { kind: 'network' }))).toBe(
      '网络连接失败，请检查网络后重试',
    )
    expect(
      getErrorMessage(new RequestError('unauthorized', { kind: 'http', statusCode: 401 })),
    ).toBe('登录状态已失效，请重新登录')
    expect(getErrorMessage(new RequestError('server', { kind: 'http', statusCode: 500 }))).toBe(
      '服务暂时不可用，请稍后重试',
    )
    expect(getErrorMessage(new RequestError('', { kind: 'business' }))).toBe('业务请求失败')
    expect(getErrorMessage(new RequestError('业务失败', { kind: 'business' }))).toBe('业务失败')
    expect(getErrorMessage(new RequestError('unknown', { kind: 'unknown' }))).toBe('unknown')
    expect(getErrorMessage(new Error('本地失败'))).toBe('本地失败')
    expect(getErrorMessage({ errMsg: '平台失败' })).toBe('平台失败')
    expect(getErrorMessage({ errMsg: '' })).toBe('操作失败，请稍后重试')
    expect(getErrorMessage(null)).toBe('操作失败，请稍后重试')
  })
})
