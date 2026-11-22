import { request } from '@/services/request'
import type {
  DevelopmentLoginRequest,
  UserProfile,
  UserTokenResponse,
  WechatLoginRequest,
} from '@/shared/types/user'

export const userApi = Object.freeze({
  async fetchAuthWechatLogin(payload: WechatLoginRequest): Promise<UserTokenResponse> {
    const response = await request<UserTokenResponse>({
      url: '/auth/wechat/login',
      method: 'POST',
      data: payload,
    })
    if (!response?.accessToken || !response?.refreshToken || !response?.user?.id) {
      throw new Error('登录失败')
    }
    return response
  },

  async fetchAuthDevLogin(payload: DevelopmentLoginRequest = {}): Promise<UserTokenResponse> {
    const response = await request<UserTokenResponse>({
      url: '/auth/dev/login',
      method: 'POST',
      data: payload,
    })
    if (!response?.accessToken || !response?.refreshToken || !response?.user?.id) {
      throw new Error('登录失败')
    }
    return response
  },

  async fetchUserMe(): Promise<UserProfile> {
    const response = await request<UserProfile>({
      url: '/user/me',
      method: 'GET',
    })
    if (!response?.id) {
      throw new Error('用户信息获取失败')
    }
    return response
  },

  fetchAuthUserLogout(refreshToken: string): Promise<null> {
    return request<null>({
      url: '/auth/user/logout',
      method: 'POST',
      data: { refreshToken },
    })
  },
})
