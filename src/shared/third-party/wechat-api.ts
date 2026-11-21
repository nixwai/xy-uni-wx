import { toError } from '@/shared/utils/error'

interface WechatProfile {
  nickname?: string
  avatarUrl?: string
}

/** 获取微信登录凭证 */
export function requestWechatCode(): Promise<string> {
  if (typeof uni.login !== 'function') {
    return Promise.resolve('微信登录失败')
  }

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

/** 尝试读取微信公开资料；用户拒绝授权时返回为空 */
export function requestWechatProfile(): Promise<WechatProfile | undefined> {
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
        resolve({ nickname, avatarUrl })
      },
      fail: () => resolve(undefined),
    })
  })
}
