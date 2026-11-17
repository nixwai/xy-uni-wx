import { PAGE_PATHS, toPageUrl } from './routes'
import type { Query, RoutePath } from '@/shared/types/route'
import { serializeQuery } from '@/shared/utils/query'

/** 可通过原生 tabBar 切换的页面键。 */
export type TabRoute = keyof typeof PAGE_PATHS

/** 切换到已注册的 tabBar 页面。 */
export function switchTab(route: TabRoute): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.switchTab({
      url: toPageUrl(PAGE_PATHS[route]),
      success: () => resolve(),
      fail: reject,
    })
  })
}

/** 打开页面并序列化受约束的查询参数。 */
export function navigateTo(path: RoutePath, query?: Query): Promise<void> {
  const queryString = query ? serializeQuery(query) : ''
  const url = `${toPageUrl(path)}${queryString ? `?${queryString}` : ''}`

  return new Promise((resolve, reject) => {
    uni.navigateTo({
      url,
      success: () => resolve(),
      fail: reject,
    })
  })
}

/** 返回指定层级的页面。 */
export function navigateBack(delta = 1): Promise<void> {
  if (!Number.isInteger(delta) || delta < 1) {
    return Promise.reject(new Error('返回层级必须是正整数'))
  }

  return new Promise((resolve, reject) => {
    uni.navigateBack({
      delta,
      success: () => resolve(),
      fail: reject,
    })
  })
}
