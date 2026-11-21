import { beforeEach, describe, expect, it, vi } from 'vitest'
import { navigateBack, navigateTo, switchTab } from '@/router'
const uniMock = { switchTab: vi.fn(), navigateTo: vi.fn(), navigateBack: vi.fn() }
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(globalThis, { uni: uniMock })
})
describe('路由导航', () => {
  it('切换 tabBar 页面并返回异步结果', async () => {
    uniMock.switchTab.mockImplementation(({ success }: { success: () => void }) => success())
    await expect(switchTab('profile')).resolves.toBeUndefined()
    expect(uniMock.switchTab).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/pages/profile/index' }),
    )
  })
  it('打开页面时过滤空查询值并编码参数', async () => {
    uniMock.navigateTo.mockImplementation(({ success }: { success: () => void }) => success())
    await navigateTo('/pages/profile/index', { name: '张 三', page: 2, empty: null })
    expect(uniMock.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/pages/profile/index?name=%E5%BC%A0%20%E4%B8%89&page=2' }),
    )
  })
  it('转发平台导航失败', async () => {
    const failure = new Error('navigate failed')
    uniMock.navigateTo.mockImplementation(({ fail }: { fail: (error: Error) => void }) =>
      fail(failure),
    )
    uniMock.switchTab.mockImplementation(({ fail }: { fail: (error: Error) => void }) =>
      fail(failure),
    )
    uniMock.navigateBack.mockImplementation(({ fail }: { fail: (error: Error) => void }) =>
      fail(failure),
    )
    await expect(navigateTo('/pages/home/index')).rejects.toBe(failure)
    await expect(switchTab('home')).rejects.toBe(failure)
    await expect(navigateBack()).rejects.toBe(failure)
  })
  it('拒绝非正整数返回层级', async () => {
    await expect(navigateBack(0)).rejects.toThrow('返回层级必须是正整数')
    await expect(navigateBack(1.5)).rejects.toThrow('返回层级必须是正整数')
    expect(uniMock.navigateBack).not.toHaveBeenCalled()
  })
})
