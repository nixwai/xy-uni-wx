<template>
  <view class="profile-card profile-card--guest">
    <view class="profile-avatar profile-avatar--placeholder" aria-hidden="true">
      <view class="profile-avatar__head" />
      <view class="profile-avatar__body" />
    </view>
    <view class="profile-actions">
      <!-- #ifdef MP-WEIXIN -->
      <AppButton :loading="authStore.isBusy" @tap="handleWechatLogin">
        {{ authStore.isBusy ? '登录中...' : '登录/注册' }}
      </AppButton>
      <!-- #endif -->
      <AppButton
        v-if="showDevelopmentLogin"
        variant="secondary"
        :loading="authStore.isBusy"
        @tap="handleDevelopmentLogin"
      >
        {{ authStore.isBusy ? '登录中...' : '开发登录' }}
      </AppButton>
    </view>
    <text v-if="authStore.errorMessage" class="profile-error">{{ authStore.errorMessage }}</text>
  </view>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { isDevelopment } from '@/shared/utils/platform'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const showDevelopmentLogin = isDevelopment()

async function handleWechatLogin(): Promise<void> {
  try {
    await authStore.loginForWechat()
  } catch {
    // 错误已由认证状态统一转换并展示。
  }
}

async function handleDevelopmentLogin(): Promise<void> {
  try {
    await authStore.loginForDevelopment()
  } catch {
    // 错误已由认证状态统一转换并展示。
  }
}
</script>

<style lang="scss" scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  min-height: 360rpx;
  padding: 58rpx 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24rpx 70rpx rgba(35, 55, 90, 0.08);
  backdrop-filter: blur(24rpx);
}

.profile-card--guest {
  min-height: 520rpx;
}

.profile-avatar {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  background: var(--app-primary-soft-color);
}

.profile-avatar--placeholder {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #e4edff, #d3e0ff);
}

.profile-avatar__head {
  position: absolute;
  top: 30rpx;
  left: 50%;
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: var(--app-primary-color);
  transform: translateX(-50%);
}

.profile-avatar__body {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  width: 94rpx;
  height: 70rpx;
  border-radius: 52rpx 52rpx 0 0;
  background: var(--app-primary-color);
  transform: translateX(-50%);
}

.profile-actions {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20rpx;
  margin-top: 38rpx;
}

.profile-error {
  margin-top: 24rpx;
  color: var(--app-danger-color);
  font-size: 24rpx;
  line-height: 1.5;
  text-align: center;
}
</style>
