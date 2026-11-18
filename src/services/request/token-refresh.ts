import { getRefreshToken, setAuthTokens } from '@/shared/utils/token-storage'
import { request } from './client'

/** 正在进行中的令牌刷新，供并发 401 共享同一次刷新结果。 */
let pendingTokenRefresh: Promise<boolean> | undefined

/**
 * 单飞刷新访问令牌：服务端 refreshToken 为一次性轮换，并发刷新会被判定为重放并吊销整条会话链，
 * 因此同一时刻只允许存在一个刷新请求。刷新接口在此直接发起，避免请求层反向依赖 API 层。
 * 由 RequestClient 在登录态失效时直接调用，单例与 with*Interceptor 派生实例共用同一份单飞状态。
 */
export function refreshAuthTokens(): Promise<boolean> {
  if (pendingTokenRefresh) {
    return pendingTokenRefresh
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return Promise.resolve(false)
  }

  const refresh = request<{ accessToken: string; refreshToken: string }>({
    url: '/auth/user/refresh',
    method: 'POST',
    data: { refreshToken },
    skipTokenRefresh: true,
  })
    .then((response) => {
      if (!response?.accessToken || !response?.refreshToken) {
        return false
      }
      setAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken })
      return true
    })
    .catch(() => false)
    .finally(() => {
      pendingTokenRefresh = undefined
    })
  pendingTokenRefresh = refresh

  return refresh
}
