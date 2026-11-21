import { PAGE_PATHS, TAB_BAR_ITEMS } from '../router/routes'

/** 页面和原生 tabBar 的统一配置源。 */
export const pagesConfig = {
  pages: [
    {
      path: PAGE_PATHS.home,
      style: {
        navigationBarTitleText: '首页',
      },
    },
    {
      path: PAGE_PATHS.profile,
      style: {
        navigationBarTitleText: '个人',
      },
    },
  ],
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: 'xy-uni-wx',
    navigationBarBackgroundColor: '#FFFFFF',
    backgroundColor: '#F7F8FA',
    backgroundTextStyle: 'light',
  },
  tabBar: {
    color: '#8993A7',
    selectedColor: '#356DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: TAB_BAR_ITEMS,
  },
} as const
