import { userApi } from '@/services/api/user'
import { clearAuthTokens, getRefreshToken, setAuthTokens } from '@/shared/utils/token-storage'
import type { UserProfile, WechatLoginRequest } from '@/shared/types/user'

interface WechatProfile {
  nickname?: string
  avatarUrl?: string
}

const H5_DEVELOPMENT_NICKNAME = 'H5开发用户'

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error && value.message) {
    return value
  }

  if (typeof value === 'object' && value !== null && 'errMsg' in value) {
    const message = value.errMsg
    if (typeof message === 'string' && message.length > 0) {
      return new Error(message)
    }
  }

  return new Error(fallback)
}

function isDevelopmentLoginAllowed(): boolean {
  let allowed = false
  // #ifdef H5
  allowed = import.meta.env.DEV
  // #endif
  return allowed
}

function requestWechatCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      onlyAuthorize: true,
      success: (result) => {
        if (typeof result.code !== 'string' || result.code.trim().length === 0) {
          reject(new Error('微信登录凭证无效'))
          return
        }
        resolve(result.code)
      },
      fail: (error) => reject(toError(error, '微信登录失败')),
    })
  })
}

function requestWechatProfile(): Promise<WechatProfile | undefined> {
  if (typeof uni.getUserProfile !== 'function') {
    return Promise.resolve(undefined)
  }

  return new Promise((resolve) => {
    uni.getUserProfile({
      provider: 'weixin',
      desc: '用于完善个人资料',
      lang: 'zh_CN',
      success: (result) => {
        const nickname = result.userInfo?.nickName?.trim()
        const avatarUrl = result.userInfo?.avatarUrl?.trim()
        resolve({
          ...(nickname ? { nickname } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        })
      },
      fail: () => resolve(undefined),
    })
  })
}

function saveTokenAndLoadUser(tokenResponse: {
  accessToken: string
  refreshToken: string
}): Promise<UserProfile> {
  setAuthTokens({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
  })
  return userApi.getCurrentUser().catch((error: unknown) => {
    clearAuthTokens()
    throw error
  })
}

export function isH5Development(): boolean {
  return isDevelopmentLoginAllowed()
}

export async function loginWithWechat(): Promise<UserProfile> {
  const code = await requestWechatCode()
  const profile = await requestWechatProfile()
  const payload: WechatLoginRequest = {
    code,
    ...(profile?.nickname ? { nickname: profile.nickname } : {}),
    ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
  }
  return saveTokenAndLoadUser(await userApi.loginWithWechat(payload))
}

export async function loginWithDevelopment(): Promise<UserProfile> {
  if (!isDevelopmentLoginAllowed()) {
    throw new Error('开发登录仅支持 H5 开发环境')
  }

  return saveTokenAndLoadUser(
    await userApi.loginForDevelopment({ nickname: H5_DEVELOPMENT_NICKNAME }),
  )
}

export async function logoutWithRefreshToken(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await userApi.logout(refreshToken)
    }
  } finally {
    clearAuthTokens()
  }
}
