import { describe, expect, it, vi } from 'vitest'
import { navigateBack, navigateTo, switchTab } from '@/router'

describe('路由调用封装', () => {
  it('调用原生 tab 切换 API', async () => {
    const switchTabMock = vi.fn((options) => options.success())
    vi.stubGlobal('uni', { switchTab: switchTabMock })

    await expect(switchTab('home')).resolves.toBeUndefined()
    expect(switchTabMock).toHaveBeenCalledWith({
      url: '/pages/home/index',
      success: expect.any(Function),
      fail: expect.any(Function),
    })
  })

  it('编码参数后调用页面跳转 API', async () => {
    const navigateToMock = vi.fn((options) => options.success())
    vi.stubGlobal('uni', { navigateTo: navigateToMock })

    await expect(
      navigateTo('pages/profile/index', { source: 'home page', page: 1 }),
    ).resolves.toBeUndefined()
    expect(navigateToMock).toHaveBeenCalledWith({
      url: '/pages/profile/index?source=home%20page&page=1',
      success: expect.any(Function),
      fail: expect.any(Function),
    })
  })

  it('调用返回 API 并传递返回层级', async () => {
    const navigateBackMock = vi.fn((options) => options.success())
    vi.stubGlobal('uni', { navigateBack: navigateBackMock })

    await expect(navigateBack(2)).resolves.toBeUndefined()
    expect(navigateBackMock).toHaveBeenCalledWith({
      delta: 2,
      success: expect.any(Function),
      fail: expect.any(Function),
    })
  })
})
