import { request } from '@/services/request'
import type {
  DevelopmentLoginRequest,
  UserProfile,
  UserTokenResponse,
  WechatLoginRequest,
} from '@/shared/types/user'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserProfile(value: unknown): value is UserProfile {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (typeof value.nickname === 'string' || value.nickname === null) &&
    (typeof value.avatarUrl === 'string' || value.avatarUrl === null) &&
    typeof value.isActive === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

function isUserTokenResponse(value: unknown): value is UserTokenResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0 &&
    value.tokenType === 'Bearer' &&
    typeof value.accessTokenExpiresIn === 'number' &&
    typeof value.refreshTokenExpiresIn === 'number' &&
    isRecord(value.user) &&
    typeof value.user.id === 'string' &&
    (typeof value.user.nickname === 'string' || value.user.nickname === null) &&
    (typeof value.user.avatarUrl === 'string' || value.user.avatarUrl === null) &&
    value.user.role === 'user'
  )
}

function ensureResponse<T>(
  value: unknown,
  guard: (candidate: unknown) => candidate is T,
  message: string,
): T {
  if (!guard(value)) {
    throw new Error(message)
  }
  return value
}

export const userApi = Object.freeze({
  async loginWithWechat(payload: WechatLoginRequest): Promise<UserTokenResponse> {
    const response = await request({
      url: '/auth/wechat/login',
      method: 'POST',
      data: payload,
    })
    return ensureResponse(response, isUserTokenResponse, '登录响应格式无效')
  },

  async loginForDevelopment(payload: DevelopmentLoginRequest = {}): Promise<UserTokenResponse> {
    const response = await request({
      url: '/auth/dev/login',
      method: 'POST',
      data: payload,
    })
    return ensureResponse(response, isUserTokenResponse, '登录响应格式无效')
  },

  async getCurrentUser(): Promise<UserProfile> {
    const response = await request({
      url: '/user/me',
      method: 'GET',
    })
    return ensureResponse(response, isUserProfile, '用户信息响应格式无效')
  },

  logout(refreshToken: string): Promise<null> {
    return request<null>({
      url: '/auth/user/logout',
      method: 'POST',
      data: { refreshToken },
    })
  },
})
