import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '@/constants/storage'
import type { UserProfile, UserTokenResponse } from '@/shared/types/user'

const userApiMock = vi.hoisted(() => ({
  loginWithWechat: vi.fn(),
  loginForDevelopment: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('@/services/api/user', () => ({ userApi: userApiMock }))

import { loginWithDevelopment, loginWithWechat } from '@/pages/profile/login'

const currentUser: UserProfile = {
  id: 'user-1',
  nickname: '小明',
  avatarUrl: 'https://example.com/avatar.png',
  isActive: true,
  createdAt: '2026-11-15T00:00:00.000Z',
  updatedAt: '2026-11-15T00:00:00.000Z',
}

const tokenResponse: UserTokenResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  accessTokenExpiresIn: 7200,
  refreshTokenExpiresIn: 2592000,
  user: {
    id: 'user-1',
    nickname: '小明',
    avatarUrl: 'https://example.com/avatar.png',
    role: 'user',
  },
}

describe('个人页登录流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('H5 开发环境可免微信登录并保存令牌', async () => {
    vi.stubEnv('DEV', true)
    const setStorageSync = vi.fn()
    vi.stubGlobal('uni', { setStorageSync })
    userApiMock.loginForDevelopment.mockResolvedValue(tokenResponse)
    userApiMock.getCurrentUser.mockResolvedValue(currentUser)

    await expect(loginWithDevelopment()).resolves.toEqual(currentUser)

    expect(userApiMock.loginForDevelopment).toHaveBeenCalledWith({ nickname: 'H5开发用户' })
    expect(setStorageSync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, 'access-token')
    expect(userApiMock.getCurrentUser).toHaveBeenCalledOnce()
  })

  it('H5 生产环境拒绝开发登录', async () => {
    vi.stubEnv('DEV', false)

    await expect(loginWithDevelopment()).rejects.toThrow('开发登录仅支持 H5 开发环境')
    expect(userApiMock.loginForDevelopment).not.toHaveBeenCalled()
  })

  it('获取微信 code 和用户资料，登录后保存令牌并加载当前用户', async () => {
    const storage = new Map<string, string>()
    const login = vi.fn((options: UniNamespace.LoginOptions) => {
      options.success?.({
        errMsg: 'login:ok',
        authResult: '',
        code: 'wechat-code',
      })
    })
    const getUserProfile = vi.fn((options: UniNamespace.GetUserProfileOptions) => {
      options.success?.({
        errMsg: 'getUserProfile:ok',
        userInfo: {
          nickName: '小明',
          avatarUrl: 'https://example.com/avatar.png',
          openId: 'openid-not-forwarded',
        },
        rawData: '',
        signature: '',
        encryptedData: '',
        iv: '',
      })
    })
    const setStorageSync = vi.fn((key: string, value: string) => {
      storage.set(key, value)
    })
    vi.stubGlobal('uni', { login, getUserProfile, setStorageSync })
    userApiMock.loginWithWechat.mockResolvedValue(tokenResponse)
    userApiMock.getCurrentUser.mockResolvedValue(currentUser)

    await expect(loginWithWechat()).resolves.toEqual(currentUser)

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'weixin', onlyAuthorize: true }),
    )
    expect(getUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'weixin', lang: 'zh_CN' }),
    )
    expect(userApiMock.loginWithWechat).toHaveBeenCalledWith({
      code: 'wechat-code',
      nickname: '小明',
      avatarUrl: 'https://example.com/avatar.png',
    })
    expect(setStorageSync).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, 'access-token')
    expect(storage.get(STORAGE_KEYS.accessToken)).toBe('access-token')
    expect(userApiMock.getCurrentUser).toHaveBeenCalledOnce()
  })

  it('用户拒绝资料授权时仍使用 code 登录', async () => {
    const login = vi.fn((options: UniNamespace.LoginOptions) => {
      options.success?.({
        errMsg: 'login:ok',
        authResult: '',
        code: 'wechat-code',
      })
    })
    const getUserProfile = vi.fn((options: UniNamespace.GetUserProfileOptions) => {
      options.fail?.({ errMsg: 'getUserProfile:fail auth deny' })
    })
    vi.stubGlobal('uni', {
      login,
      getUserProfile,
      setStorageSync: vi.fn(),
    })
    userApiMock.loginWithWechat.mockResolvedValue(tokenResponse)
    userApiMock.getCurrentUser.mockResolvedValue(currentUser)

    await expect(loginWithWechat()).resolves.toEqual(currentUser)

    expect(userApiMock.loginWithWechat).toHaveBeenCalledWith({ code: 'wechat-code' })
  })

  it('微信登录未返回有效 code 时终止登录', async () => {
    const login = vi.fn((options: UniNamespace.LoginOptions) => {
      options.success?.({
        errMsg: 'login:ok',
        authResult: '',
        code: '',
      })
    })
    vi.stubGlobal('uni', { login })

    await expect(loginWithWechat()).rejects.toThrow('微信登录凭证无效')
    expect(userApiMock.loginWithWechat).not.toHaveBeenCalled()
  })
})
