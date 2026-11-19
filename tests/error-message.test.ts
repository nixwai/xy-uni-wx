import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '@/services/error/error-message'
import { RequestError } from '@/services/request'

describe('getErrorMessage', () => {
  it('统一转换请求异常', () => {
    expect(getErrorMessage(new RequestError('ignored', { kind: 'timeout' }))).toBe(
      '请求超时，请稍后重试',
    )
    expect(getErrorMessage(new RequestError('服务端提示', { kind: 'business' }))).toBe('服务端提示')
    expect(getErrorMessage(new RequestError('ignored', { kind: 'http', statusCode: 401 }))).toBe(
      '登录状态已失效，请重新登录',
    )
  })

  it('保留普通异常和平台错误信息', () => {
    expect(getErrorMessage(new Error('本地校验失败'))).toBe('本地校验失败')
    expect(getErrorMessage({ errMsg: 'request:fail offline' })).toBe('request:fail offline')
    expect(getErrorMessage(null)).toBe('操作失败，请稍后重试')
  })
})
