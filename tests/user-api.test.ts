import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userApi } from '@/services/api/user'
import type { UserProfile, UserTokenResponse } from '@/shared/types/user'

const requestMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/request', () => ({ request: requestMock }))

const tokenResponse: UserTokenResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  accessTokenExpiresIn: 7200,
  refreshTokenExpiresIn: 2592000,
  user: {
    id: 'user-1',
    nickname: '微信用户',
    avatarUrl: null,
    role: 'user',
  },
}

const currentUser: UserProfile = {
  id: 'user-1',
  nickname: '微信用户',
  avatarUrl: null,
  isActive: true,
  createdAt: '2026-11-15T00:00:00.000Z',
  updatedAt: '2026-11-15T00:00:00.000Z',
}

describe('用户 API 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('调用微信登录接口并透传可选用户资料', async () => {
    requestMock.mockResolvedValueOnce(tokenResponse)

    await expect(
      userApi.loginWithWechat({
        code: 'wechat-code',
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.png',
      }),
    ).resolves.toEqual(tokenResponse)

    expect(requestMock).toHaveBeenCalledWith({
      url: '/auth/wechat/login',
      method: 'POST',
      data: {
        code: 'wechat-code',
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.png',
      },
    })
  })

  it('调用 H5 开发登录接口', async () => {
    requestMock.mockResolvedValueOnce(tokenResponse)

    await expect(userApi.loginForDevelopment({ nickname: 'H5开发用户' })).resolves.toEqual(
      tokenResponse,
    )

    expect(requestMock).toHaveBeenCalledWith({
      url: '/auth/dev/login',
      method: 'POST',
      data: { nickname: 'H5开发用户' },
    })
  })

  it('调用当前用户资料接口', async () => {
    requestMock.mockResolvedValueOnce(currentUser)

    await expect(userApi.getCurrentUser()).resolves.toEqual(currentUser)

    expect(requestMock).toHaveBeenCalledWith({
      url: '/user/me',
      method: 'GET',
    })
  })

  it.each([
    ['accessToken', { refreshToken: 'refresh-token', user: { id: 'user-1' } }],
    ['refreshToken', { accessToken: 'access-token', user: { id: 'user-1' } }],
    ['user.id', { accessToken: 'access-token', refreshToken: 'refresh-token', user: {} }],
  ])('拒绝缺少 %s 的登录响应', async (_field, response) => {
    requestMock.mockResolvedValueOnce(response)

    await expect(userApi.loginForDevelopment()).rejects.toThrow('登录响应格式无效')
  })

  it('拒绝缺少 id 的用户资料响应', async () => {
    requestMock.mockResolvedValueOnce({ nickname: '微信用户' })

    await expect(userApi.getCurrentUser()).rejects.toThrow('用户信息响应格式无效')
  })

  it('调用用户退出登录接口', async () => {
    requestMock.mockResolvedValueOnce(null)

    await expect(userApi.logout('refresh-token')).resolves.toBeNull()

    expect(requestMock).toHaveBeenCalledWith({
      url: '/auth/user/logout',
      method: 'POST',
      data: { refreshToken: 'refresh-token' },
    })
  })
})
