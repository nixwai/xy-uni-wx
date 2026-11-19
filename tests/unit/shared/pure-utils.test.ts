import { describe, expect, it } from 'vitest'
import { toError } from '@/shared/utils/error'
import { serializeQuery } from '@/shared/utils/query'
import { joinUrl } from '@/shared/utils/url'

describe('共享纯函数', () => {
  it('序列化查询参数并过滤 null 和 undefined', () => {
    expect(
      serializeQuery({ keyword: 'a b', page: 2, enabled: false, empty: null, missing: undefined }),
    ).toBe('keyword=a%20b&page=2&enabled=false')
  })
  it('合并地址时去除重复斜杠', () => {
    expect(joinUrl('https://api.example.com///', '///users')).toBe('https://api.example.com/users')
    expect(joinUrl('https://api.example.com///', '')).toBe('https://api.example.com')
  })
  it('保留 Error，转换平台错误并使用兜底信息', () => {
    const error = new Error('原始错误')
    expect(toError(error, 'fallback')).toBe(error)
    expect(toError({ errMsg: '平台失败' }, 'fallback')).toEqual(new Error('平台失败'))
    expect(toError({ errMsg: '' }, 'fallback')).toEqual(new Error('fallback'))
    expect(toError(null, 'fallback')).toEqual(new Error('fallback'))
  })
})
