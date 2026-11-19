import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/services/api/user'
import { requestWechatCode, requestWechatProfile } from '@/shared/third-party/wechat-api'
import { getAccessToken, getRefreshToken, setAuthTokens } from '@/shared/utils/token-storage'

vi.mock('@/services/api/user', () => ({
  userApi: {
    getCurrentUser: vi.fn(),
    loginWithWechat: vi.fn(),
    loginForDevelopment: vi.fn(),
    logout: vi.fn(),
  },
}))
vi.mock('@/shared/third-party/wechat-api', () => ({
  requestWechatCode: vi.fn(),
  requestWechatProfile: vi.fn(),
}))
vi.mock('@/shared/utils/platform', () => ({ isDevelopment: vi.fn() }))

const storage = new Map<string, string>()
const uniMock = {
  getStorageSync: (key: string) => storage.get(key) ?? '',
  setStorageSync: (key: string, value: string) => storage.set(key, value),
  removeStorageSync: (key: string) => storage.delete(key),
}
const profile = {
  id: 'u1',
  nickname: '用户',
  avatarUrl: null,
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
const tokenResponse = {
  accessToken: 'access',
  refreshToken: 'refresh',
  tokenType: 'Bearer' as const,
  accessTokenExpiresIn: 3600,
  refreshTokenExpiresIn: 7200,
  user: { id: 'u1', nickname: '用户', avatarUrl: null, role: 'user' as const },
}

beforeEach(() => {
  setActivePinia(createPinia())
  storage.clear()
  Object.assign(globalThis, { uni: uniMock })
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  it('无访问令牌时恢复为匿名状态', async () => {
    const store = useAuthStore()
    await store.hydrate()
    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(userApi.getCurrentUser).not.toHaveBeenCalled()
  })
  it('用访问令牌恢复用户资料，失败时清理本地状态并保留错误提示', async () => {
    setAuthTokens(tokenResponse)
    vi.mocked(userApi.getCurrentUser).mockResolvedValueOnce(profile)
    const store = useAuthStore()
    await store.hydrate()
    expect(store.status).toBe('authenticated')
    expect(store.profile).toEqual(profile)
    expect(store.isAuthenticated).toBe(true)
    vi.mocked(userApi.getCurrentUser).mockRejectedValueOnce(new Error('恢复失败'))
    vi.mocked(userApi.logout).mockResolvedValue(null)
    await expect(store.hydrate()).rejects.toThrow('恢复失败')
    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
    expect(store.errorMessage).toBe('恢复失败')
    expect(getAccessToken()).toBeUndefined()
  })
  it('登录成功后保存令牌并恢复用户资料', async () => {
    vi.mocked(userApi.loginForDevelopment).mockResolvedValue(tokenResponse)
    vi.mocked(userApi.getCurrentUser).mockResolvedValue(profile)
    const store = useAuthStore()
    const { isDevelopment } = await import('@/shared/utils/platform')
    vi.mocked(isDevelopment).mockReturnValue(true)
    await store.loginForDevelopment()
    expect(store.isAuthenticated).toBe(true)
    expect(getAccessToken()).toBe('access')
    expect(getRefreshToken()).toBe('refresh')
  })
  it('微信登录会组合凭证、可选资料和用户接口', async () => {
    vi.mocked(requestWechatCode).mockResolvedValue('code')
    vi.mocked(requestWechatProfile).mockResolvedValue({ nickname: '昵称', avatarUrl: 'avatar' })
    vi.mocked(userApi.loginWithWechat).mockResolvedValue(tokenResponse)
    vi.mocked(userApi.getCurrentUser).mockResolvedValue(profile)
    const store = useAuthStore()
    await store.loginForWechat()
    expect(userApi.loginWithWechat).toHaveBeenCalledWith({
      code: 'code',
      nickname: '昵称',
      avatarUrl: 'avatar',
    })
    expect(store.status).toBe('authenticated')
  })
  it('登录失败时记录错误并释放忙碌状态', async () => {
    vi.mocked(userApi.loginForDevelopment).mockRejectedValue(new Error('登录失败'))
    const { isDevelopment } = await import('@/shared/utils/platform')
    vi.mocked(isDevelopment).mockReturnValue(true)
    const store = useAuthStore()
    await expect(store.loginForDevelopment()).rejects.toThrow('登录失败')
    expect(store.isBusy).toBe(false)
    expect(store.status).toBe('anonymous')
    expect(store.errorMessage).toBe('登录失败')
  })
  it('非开发环境拒绝开发登录且并发调用只执行一次', async () => {
    const { isDevelopment } = await import('@/shared/utils/platform')
    vi.mocked(isDevelopment).mockReturnValue(false)
    const store = useAuthStore()
    await expect(store.loginForDevelopment()).rejects.toThrow('开发登录仅支持开发环境')
    expect(userApi.loginForDevelopment).not.toHaveBeenCalled()
    expect(store.errorMessage).toBe('开发登录仅支持开发环境')
    vi.mocked(isDevelopment).mockReturnValue(true)
    let resolveLogin: ((value: typeof tokenResponse) => void) | undefined
    vi.mocked(userApi.loginForDevelopment).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
    )
    const first = store.loginForDevelopment()
    const second = store.loginForDevelopment()
    resolveLogin?.(tokenResponse)
    vi.mocked(userApi.getCurrentUser).mockResolvedValue(profile)
    await Promise.all([first, second])
    expect(userApi.loginForDevelopment).toHaveBeenCalledTimes(1)
  })
  it('退出时清理本地认证状态并通知服务端，服务端失败不阻断退出', async () => {
    setAuthTokens(tokenResponse)
    vi.mocked(userApi.logout).mockRejectedValue(new Error('服务端失败'))
    const store = useAuthStore()
    store.logout()
    await Promise.resolve()
    expect(userApi.logout).toHaveBeenCalledWith('refresh')
    expect(getAccessToken()).toBeUndefined()
    expect(getRefreshToken()).toBeUndefined()
    expect(store.status).toBe('anonymous')
    expect(store.profile).toBeNull()
  })
})
