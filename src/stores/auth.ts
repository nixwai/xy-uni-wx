import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { userApi } from '@/services/api/user'
import {
  loginWithDevelopment,
  loginWithWechat,
  logoutWithRefreshToken,
} from '@/pages/profile/login'
import type { UserProfile } from '@/shared/types/user'
import { clearAuthTokens, getAccessToken } from '@/shared/utils/token-storage'
import { getUserFacingErrorMessage } from '@/shared/utils/error'
import { RequestError } from '@/services/request'

/** 认证状态机的当前状态。 */
export type AuthStatus = 'idle' | 'loading' | 'anonymous' | 'authenticated' | 'error'

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
  }

  /** 根据本地访问令牌恢复当前用户资料。 */
  async function hydrate(): Promise<void> {
    if (isBusy.value || status.value === 'loading') {
      return
    }

    errorMessage.value = ''
    if (!getAccessToken()) {
      resetLocalState()
      return
    }

    status.value = 'loading'
    isBusy.value = true
    try {
      profile.value = await userApi.getCurrentUser()
      status.value = 'authenticated'
    } catch (error) {
      const unauthorized = isUnauthorizedError(error)
      if (unauthorized) {
        clearAuthTokens()
      }
      resetLocalState()
      errorMessage.value = unauthorized
        ? '登录状态已失效，请重新登录'
        : getUserFacingErrorMessage(error)
      if (!unauthorized) {
        status.value = 'error'
      }
    } finally {
      isBusy.value = false
    }
  }

  /** 执行登录动作并在成功或失败后同步认证状态。 */
  async function login(action: () => Promise<UserProfile>): Promise<void> {
    if (isBusy.value) {
      return
    }

    isBusy.value = true
    errorMessage.value = ''
    try {
      profile.value = await action()
      status.value = 'authenticated'
    } catch (error) {
      resetLocalState()
      errorMessage.value = getUserFacingErrorMessage(error)
      throw error
    } finally {
      isBusy.value = false
    }
  }

  /** 使用微信登录并更新当前认证状态。 */
  async function loginForWechat(): Promise<void> {
    return login(loginWithWechat)
  }

  /** 使用 H5 开发登录并更新当前认证状态。 */
  async function loginForDevelopment(): Promise<void> {
    return login(loginWithDevelopment)
  }

  /** 调用退出流程并无条件清理本地认证状态。 */
  async function logout(): Promise<void> {
    if (isBusy.value) {
      return
    }

    isBusy.value = true
    errorMessage.value = ''
    try {
      await logoutWithRefreshToken()
    } catch (error) {
      errorMessage.value = getUserFacingErrorMessage(error)
      throw error
    } finally {
      resetLocalState()
      isBusy.value = false
    }
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

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof RequestError && (error.statusCode === 401 || error.code === 40100)
}
