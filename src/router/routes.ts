import type { RoutePath } from '@/shared/types/route'

export const PAGE_PATHS = Object.freeze({
  home: 'pages/home/index',
  profile: 'pages/profile/index',
} as const)

export const TAB_BAR_ITEMS = Object.freeze([
  { pagePath: PAGE_PATHS.home, text: '首页' },
  { pagePath: PAGE_PATHS.profile, text: '个人' },
] as const)

export type PageRoute = (typeof PAGE_PATHS)[keyof typeof PAGE_PATHS]

export function toPageUrl(path: RoutePath | PageRoute): `/${string}` {
  return `/${path.replace(/^\/+/, '')}`
}
