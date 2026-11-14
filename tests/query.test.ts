import { describe, expect, it } from 'vitest'
import { serializeQuery } from '@/shared/utils/query'

describe('查询参数工具', () => {
  it('忽略空值并编码查询参数', () => {
    expect(
      serializeQuery({
        keyword: '微信 小程序',
        page: 1,
        enabled: true,
        empty: undefined,
        missing: null,
      }),
    ).toBe('keyword=%E5%BE%AE%E4%BF%A1%20%E5%B0%8F%E7%A8%8B%E5%BA%8F&page=1&enabled=true')
  })
})
