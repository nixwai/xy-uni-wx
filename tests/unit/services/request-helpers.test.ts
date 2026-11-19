import { describe, expect, it } from 'vitest'
import {
  isApiEnvelope,
  isBusinessFailure,
  isTimeoutFailure,
  isUnauthorizedError,
  normalizeHeaders,
} from '@/services/request/helpers'
import { RequestError } from '@/services/request'

describe('请求辅助函数', () => {
  it('识别接口包装和业务失败', () => {
    expect(isApiEnvelope({ code: 0, data: { ok: true } })).toBe(true)
    expect(isApiEnvelope({ code: '0', data: {} })).toBe(false)
    expect(isApiEnvelope(null)).toBe(false)
    expect(isBusinessFailure({ code: 0, data: {} })).toBe(false)
    expect(isBusinessFailure({ code: 200, data: {} })).toBe(false)
    expect(isBusinessFailure({ code: 40100, message: '失效' })).toBe(true)
  })

  it('归一化响应头并识别超时错误', () => {
    expect(normalizeHeaders({ 'x-id': '1', count: 2 })).toEqual({ 'x-id': '1' })
    expect(normalizeHeaders(null)).toEqual({})
    expect(isTimeoutFailure({ errMsg: 'request:fail timeout' })).toBe(true)
    expect(isTimeoutFailure({ errMsg: 'request:fail offline' })).toBe(false)
    expect(isTimeoutFailure(null)).toBe(false)
  })

  it('识别 HTTP 401 和业务 40100', () => {
    expect(
      isUnauthorizedError(new RequestError('unauthorized', { kind: 'http', statusCode: 401 })),
    ).toBe(true)
    expect(
      isUnauthorizedError(new RequestError('unauthorized', { kind: 'business', code: 40100 })),
    ).toBe(true)
    expect(isUnauthorizedError(new RequestError('other', { kind: 'http', statusCode: 403 }))).toBe(
      false,
    )
    expect(isUnauthorizedError(new Error('other'))).toBe(false)
  })
})
