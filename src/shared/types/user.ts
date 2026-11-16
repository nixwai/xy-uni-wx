/** 小程序用户公开资料。 */
export interface UserProfile {
  id: string
  nickname: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** 微信登录接口请求参数。 */
export interface WechatLoginRequest {
  code: string
  nickname?: string
  avatarUrl?: string
}

/** H5 开发登录接口请求参数。 */
export interface DevelopmentLoginRequest {
  nickname?: string
}

/** 用户登录接口返回的令牌和公开身份。 */
export interface UserTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
    role: 'user'
  }
}
