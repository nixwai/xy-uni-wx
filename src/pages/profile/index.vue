<template>
  <AppPage>
    <view class="profile-page">
      <view v-if="profile" class="profile-card">
        <image
          v-if="profile.avatarUrl"
          class="profile-avatar"
          :src="profile.avatarUrl"
          mode="aspectFill"
        />
        <view v-else class="profile-avatar profile-avatar--placeholder">👤</view>
        <text class="profile-nickname">{{ profile.nickname || '微信用户' }}</text>
        <text class="profile-status">状态：{{ profile.isActive ? '正常' : '已停用' }}</text>
      </view>

      <view v-else class="profile-login">
        <text class="profile-title">登录后查看个人信息</text>
        <button :disabled="isLoggingIn" @tap="handleLogin">
          {{ isLoggingIn ? '登录中...' : '微信登录' }}
        </button>
        <!-- #ifdef H5 -->
        <button
          v-if="showDevelopmentLogin"
          class="development-login-button"
          :disabled="isLoggingIn"
          @tap="handleDevelopmentLogin"
        >
          {{ isLoggingIn ? '登录中...' : '开发登录（H5）' }}
        </button>
        <!-- #endif -->
        <text v-if="errorMessage" class="profile-error">{{ errorMessage }}</text>
      </view>
    </view>
  </AppPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppPage from '@/components/layout/AppPage.vue'
import { userApi } from '@/services/api/user'
import { getAccessToken, clearAccessToken } from '@/shared/utils/storage'
import type { UserProfile } from '@/shared/types/user'
import { isH5Development, loginWithDevelopment, loginWithWechat } from './login'

const profile = ref<UserProfile | null>(null)
const isLoggingIn = ref(false)
const errorMessage = ref('')
const showDevelopmentLogin = isH5Development()

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'errMsg' in error) {
    const message = error.errMsg
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return '登录失败，请稍后重试'
}

async function loadCurrentUser(): Promise<void> {
  if (!getAccessToken()) {
    return
  }

  try {
    profile.value = await userApi.getCurrentUser()
  } catch {
    clearAccessToken()
  }
}

async function handleLogin(): Promise<void> {
  if (isLoggingIn.value) {
    return
  }

  isLoggingIn.value = true
  errorMessage.value = ''
  try {
    profile.value = await loginWithWechat()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoggingIn.value = false
  }
}

async function handleDevelopmentLogin(): Promise<void> {
  if (isLoggingIn.value) {
    return
  }

  isLoggingIn.value = true
  errorMessage.value = ''
  try {
    profile.value = await loginWithDevelopment()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoggingIn.value = false
  }
}

onMounted(() => {
  void loadCurrentUser()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 48rpx 32rpx;
}

.profile-card,
.profile-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 24rpx;
  padding: 64rpx 32rpx;
  background: #ffffff;
}

.profile-avatar {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 24rpx;
  border-radius: 50%;
}

.profile-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  font-size: 64rpx;
}

.profile-nickname,
.profile-title {
  color: var(--app-text-color);
  font-size: 36rpx;
  font-weight: 600;
}

.profile-status {
  margin-top: 16rpx;
  color: var(--app-muted-text-color);
  font-size: 28rpx;
}

.profile-login button {
  width: 100%;
  margin-top: 40rpx;
}

.development-login-button {
  margin-top: 20rpx !important;
}

.profile-error {
  margin-top: 24rpx;
  color: #f53f3f;
  font-size: 26rpx;
  text-align: center;
}
</style>
