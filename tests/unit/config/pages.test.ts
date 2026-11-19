import { describe, expect, it } from 'vitest'
import { pagesConfig } from '@/config/pages'
import { PAGE_PATHS, TAB_BAR_ITEMS, toPageUrl } from '@/router/routes'

describe('页面与路由配置', () => {
  it('页面配置使用注册路由并覆盖 tabBar 页面', () => {
    expect(pagesConfig.pages.map((page) => page.path)).toEqual([
      PAGE_PATHS.home,
      PAGE_PATHS.profile,
    ])
    expect(pagesConfig.tabBar.list).toEqual(TAB_BAR_ITEMS)
  })
  it('将相对和绝对页面路径统一为单斜杠地址', () => {
    expect(toPageUrl(PAGE_PATHS.home)).toBe('/pages/home/index')
    expect(toPageUrl('/pages/profile/index')).toBe('/pages/profile/index')
  })
})
