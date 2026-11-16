import { request } from '@/services/request'
import type {
  DevelopmentLoginRequest,
  UserProfile,
  UserTokenResponse,
  WechatLoginRequest,
} from '@/shared/types/user'

export const userApi = Object.freeze({
  loginWithWechat(payload: WechatLoginRequest): Promise<UserTokenResponse> {
    return request<UserTokenResponse>({
      url: '/auth/wechat/login',
      method: 'POST',
      data: payload,
    })
  },

  loginForDevelopment(payload: DevelopmentLoginRequest = {}): Promise<UserTokenResponse> {
    return request<UserTokenResponse>({
      url: '/auth/dev/login',
      method: 'POST',
      data: payload,
    })
  },

  getCurrentUser(): Promise<UserProfile> {
    return request<UserProfile>({
      url: '/user/me',
      method: 'GET',
    })
  },
})
