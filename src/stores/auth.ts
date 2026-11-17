import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { userApi } from '@/services/api/user'
import {
  loginWithDevelopment,
  loginWithWechat,
  logoutWithRefreshToken,
} from '@/pages/profile/login'
import type { UserProfile } from '@/shared/types/user'
import { clearAuthTokens, getAccessToken } from '@/shared/utils/storage'
import { getUserFacingErrorMessage } from '@/shared/utils/error'
import { RequestError } from '@/services/request'

export type AuthStatus = 'idle' | 'loading' | 'anonymous' | 'authenticated' | 'error'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null)
  const status = ref<AuthStatus>('idle')
  const errorMessage = ref('')
  const isBusy = ref(false)

  const isAuthenticated = computed(() => status.value === 'authenticated' && profile.value !== null)

  function resetLocalState(): void {
    profile.value = null
    status.value = 'anonymous'
  }

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
    }
  }

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

  async function loginForWechat(): Promise<void> {
    return login(loginWithWechat)
  }

  async function loginForDevelopment(): Promise<void> {
    return login(loginWithDevelopment)
  }

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
