import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { userApi } from '@/services/api/user'
import { getErrorMessage } from '@/services/error/error-message'
import { requestWechatCode, requestWechatProfile } from '@/shared/third-party/wechat-api'
import type { UserProfile, UserTokenResponse } from '@/shared/types/user'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/shared/utils/token-storage'
import { isDevelopment } from '@/shared/utils/platform'

/** 认证状态机的当前状态。 */
type AuthStatus = 'idle' | 'loading' | 'anonymous' | 'authenticated'

/** 管理登录态恢复、登录、退出和当前用户资料的应用级 store。 */
export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null)
  const status = ref<AuthStatus>('idle')
  const errorMessage = ref('')
  const isBusy = ref(false)

  const isAuthenticated = computed(() => status.value === 'authenticated' && profile.value !== null)

  /** 清除当前用户资料并回到未登录状态。 */
  function resetLocalState(): void {
    profile.value = null
    status.value = 'anonymous'
    errorMessage.value = ''
  }

  /** 根据本地访问令牌恢复当前用户资料。 */
  async function hydrate(): Promise<void> {
    if (status.value === 'loading') {
      return
    }

    resetLocalState()

    if (!getAccessToken()) {
      return
    }

    status.value = 'loading'
    try {
      profile.value = await userApi.fetchUserMe()
      status.value = 'authenticated'
    } catch (error) {
      // 取不到用户资料即视为未登录，退出后保持 anonymous 并携带错误提示。
      logout()
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  /** 执行登录动作并在成功或失败后同步认证状态。 */
  async function login(action: () => Promise<UserTokenResponse>): Promise<void> {
    if (isBusy.value) {
      return
    }

    isBusy.value = true
    try {
      const tokenResponse = await action()
      setAuthTokens({
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
      })
    } catch (error) {
      resetLocalState()
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      isBusy.value = false
    }
  }

  /** 使用微信登录并更新当前认证状态。 */
  async function loginForWechat() {
    await login(async () => {
      const code = await requestWechatCode()
      const info = await requestWechatProfile()
      return userApi.fetchAuthWechatLogin({
        code: code,
        nickname: info?.nickname,
        avatarUrl: info?.avatarUrl,
      })
    })
    await hydrate()
  }

  /** 使用开发登录并更新当前认证状态。 */
  async function loginForDevelopment() {
    await login(() => {
      if (!isDevelopment()) {
        throw new Error('开发登录仅支持开发环境')
      }
      return userApi.fetchAuthDevLogin({ nickname: '开发环境用户' })
    })
    await hydrate()
  }

  /** 异步通知服务端撤销会话，并同步清理本地认证状态。 */
  function logout(): void {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      void userApi.fetchAuthUserLogout(refreshToken).catch(() => undefined) // 服务端退出失败不影响本地退出状态。
    }
    clearAuthTokens()
    resetLocalState()
  }

  return {
    profile,
    status,
    errorMessage,
    isBusy,
    isAuthenticated,
    hydrate,
    loginForWechat,
    loginForDevelopment,
    logout,
  }
})
