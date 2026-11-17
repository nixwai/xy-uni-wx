import type { RoutePath } from '@/shared/types/route'

export const PAGE_PATHS = Object.freeze({
  home: 'pages/home/index',
  profile: 'pages/profile/index',
} as const)

export const TAB_BAR_ITEMS = Object.freeze([
  {
    pagePath: PAGE_PATHS.home,
    text: '首页',
    iconPath: 'static/tabbar/home.png',
    selectedIconPath: 'static/tabbar/home-active.png',
  },
  {
    pagePath: PAGE_PATHS.profile,
    text: '个人',
    iconPath: 'static/tabbar/profile.png',
    selectedIconPath: 'static/tabbar/profile-active.png',
  },
] as const)

export type PageRoute = (typeof PAGE_PATHS)[keyof typeof PAGE_PATHS]

export function toPageUrl(path: RoutePath | PageRoute): `/${string}` {
  return `/${path.replace(/^\/+/, '')}`
}
