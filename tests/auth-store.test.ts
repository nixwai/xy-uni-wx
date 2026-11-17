import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { UserProfile } from '@/shared/types/user'

const loginMock = vi.hoisted(() => ({
  loginWithDevelopment: vi.fn(),
  loginWithWechat: vi.fn(),
  logoutWithRefreshToken: vi.fn(),
}))
const userApiMock = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/pages/profile/login', () => loginMock)
vi.mock('@/services/api/user', () => ({ userApi: userApiMock }))

import { useAuthStore } from '@/stores/auth'

const profile: UserProfile = {
  id: 'user-1',
  nickname: '小明',
  avatarUrl: 'https://example.com/avatar.png',
  isActive: true,
  createdAt: '2026-11-15T00:00:00.000Z',
  updatedAt: '2026-11-15T00:00:00.000Z',
}

function stubStorage(token?: string): void {
  vi.stubGlobal('uni', {
    getStorageSync: vi.fn(() => token),
    removeStorageSync: vi.fn(),
  })
}

describe('用户认证状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('没有本地令牌时恢复为未登录状态', async () => {
    stubStorage()
    const store = useAuthStore()

    await expect(store.hydrate()).resolves.toBeUndefined()

    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
    expect(userApiMock.getCurrentUser).not.toHaveBeenCalled()
  })

  it('恢复用户资料期间标记忙碌并在完成后释放', async () => {
    stubStorage('access-token')
    let resolveProfile!: (value: UserProfile) => void
    userApiMock.getCurrentUser.mockReturnValue(
      new Promise<UserProfile>((resolve) => {
        resolveProfile = resolve
      }),
    )
    const store = useAuthStore()

    const hydration = store.hydrate()
    expect(store.isBusy).toBe(true)

    resolveProfile(profile)
    await hydration

    expect(store.isBusy).toBe(false)
  })

  it('有本地令牌时加载当前用户资料', async () => {
    stubStorage('access-token')
    userApiMock.getCurrentUser.mockResolvedValue(profile)
    const store = useAuthStore()

    await expect(store.hydrate()).resolves.toBeUndefined()

    expect(store.status).toBe('authenticated')
    expect(store.profile).toEqual(profile)
  })

  it('恢复用户资料失败时进入错误状态并保留错误提示', async () => {
    stubStorage('access-token')
    userApiMock.getCurrentUser.mockRejectedValue(new Error('服务暂时不可用'))
    const store = useAuthStore()

    await expect(store.hydrate()).resolves.toBeUndefined()

    expect(store.status).toBe('error')
    expect(store.profile).toBeNull()
    expect(store.errorMessage).toBe('服务暂时不可用')
  })

  it('登录成功后更新用户资料和状态', async () => {
    stubStorage()
    loginMock.loginWithDevelopment.mockResolvedValue(profile)
    const store = useAuthStore()

    await expect(store.loginForDevelopment()).resolves.toBeUndefined()

    expect(store.status).toBe('authenticated')
    expect(store.profile).toEqual(profile)
  })

  it('退出成功后清理用户资料', async () => {
    stubStorage('access-token')
    loginMock.logoutWithRefreshToken.mockResolvedValue(undefined)
    const store = useAuthStore()
    store.profile = profile

    await expect(store.logout()).resolves.toBeUndefined()

    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
  })

  it('退出失败时清理本地状态并保留可展示错误', async () => {
    stubStorage('access-token')
    loginMock.logoutWithRefreshToken.mockRejectedValue(new Error('网络请求失败'))
    const store = useAuthStore()
    store.profile = profile

    await expect(store.logout()).rejects.toThrow('网络请求失败')

    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
    expect(store.errorMessage).toBe('网络请求失败')
  })
})
