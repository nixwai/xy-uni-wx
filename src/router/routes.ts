import type { RoutePath } from '@/shared/types/route'

/** 应用页面的规范化路径，不包含开头斜杠。 */
export const PAGE_PATHS = Object.freeze({
  home: 'pages/home/index',
  profile: 'pages/profile/index',
} as const)

/** 原生 tabBar 使用的页面和图标配置。 */
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

/** 已注册页面路径组成的联合类型。 */
export type PageRoute = (typeof PAGE_PATHS)[keyof typeof PAGE_PATHS]

/** 将页面路径转换为 uni 路由 API 使用的绝对地址。 */
export function toPageUrl(path: RoutePath | PageRoute): `/${string}` {
  return `/${path.replace(/^\/+/, '')}`
}
