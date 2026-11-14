import { PAGE_PATHS, TAB_BAR_ITEMS } from '../router/routes'

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
    color: '#86909C',
    selectedColor: '#1D2129',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: TAB_BAR_ITEMS,
  },
} as const
