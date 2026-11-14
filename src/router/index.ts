import { PAGE_PATHS, toPageUrl } from './routes'
import type { Query, RoutePath } from '@/shared/types/route'
import { serializeQuery } from '@/shared/utils/query'

export type TabRoute = keyof typeof PAGE_PATHS

export function switchTab(route: TabRoute): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.switchTab({
      url: toPageUrl(PAGE_PATHS[route]),
      success: () => resolve(),
      fail: reject,
    })
  })
}

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

export function navigateBack(delta = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.navigateBack({
      delta,
      success: () => resolve(),
      fail: reject,
    })
  })
}
