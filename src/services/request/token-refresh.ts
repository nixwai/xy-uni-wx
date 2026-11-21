import { getRefreshToken, setAuthTokens } from '@/shared/utils/token-storage'
import type { RequestOptions } from './types'

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

type RequestSender = <TResponse>(options: RequestOptions) => Promise<TResponse>

/** 创建共享刷新任务，避免并发未授权请求重复轮换刷新令牌。 */
export function createTokenRefresher(sendRequest: RequestSender): () => Promise<boolean> {
  let pendingRefresh: Promise<boolean> | undefined

  return () => {
    if (pendingRefresh) {
      return pendingRefresh
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return Promise.resolve(false)
    }

    pendingRefresh = sendRequest<RefreshTokenResponse>({
      url: '/auth/user/refresh',
      method: 'POST',
      data: { refreshToken },
      skipTokenRefresh: true,
    })
      .then((response) => {
        if (!response.accessToken || !response.refreshToken) {
          return false
        }

        setAuthTokens(response)
        return true
      })
      .catch(() => false)
      .finally(() => {
        pendingRefresh = undefined
      })

    return pendingRefresh
  }
}
