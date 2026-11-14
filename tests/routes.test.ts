import { describe, expect, it } from 'vitest'
import { pagesConfig } from '@/config/pages'
import { PAGE_PATHS, TAB_BAR_ITEMS, toPageUrl } from '@/router/routes'
import pagesJson from '@/pages.json'

describe('路由配置', () => {
  it('集中维护首页与个人页路径', () => {
    expect(PAGE_PATHS).toEqual({
      home: 'pages/home/index',
      profile: 'pages/profile/index',
    })
  })

  it('页面配置生成结果与原生 tabBar 配置保持一致', () => {
    const registeredPaths = pagesConfig.pages.map((page) => page.path)
    const tabBarPaths = pagesConfig.tabBar.list.map((item) => item.pagePath)

    expect(registeredPaths).toEqual(Object.values(PAGE_PATHS))
    expect(tabBarPaths).toEqual(TAB_BAR_ITEMS.map((item) => item.pagePath))
    expect(pagesConfig.tabBar.list).toHaveLength(2)
    expect(pagesJson).toEqual(pagesConfig)
  })

  it('为 uni 路由 API 生成绝对页面地址', () => {
    expect(toPageUrl(PAGE_PATHS.home)).toBe('/pages/home/index')
    expect(toPageUrl('/pages/profile/index')).toBe('/pages/profile/index')
  })
})
