<template>
  <AppPage>
    <view class="profile-page">
      <view class="profile-content">

        <view v-if="authStore.status === 'loading'" class="profile-card profile-card--loading">
          <view class="profile-skeleton profile-skeleton--avatar" />
          <view class="profile-skeleton profile-skeleton--title" />
          <view class="profile-skeleton profile-skeleton--description" />
        </view>

        <view v-else-if="authStore.isAuthenticated && authStore.profile" class="profile-card">
          <image
            v-if="authStore.profile.avatarUrl"
            class="profile-avatar"
            :src="authStore.profile.avatarUrl"
            alt="用户头像"
            mode="aspectFill"
          />
          <view v-else class="profile-avatar profile-avatar--placeholder" aria-hidden="true">
            <view class="profile-avatar__head" />
            <view class="profile-avatar__body" />
          </view>
          <text class="profile-name">{{ displayName }}</text>
        </view>

        <view v-else class="profile-card profile-card--guest">
          <view class="profile-avatar profile-avatar--placeholder" aria-hidden="true">
            <view class="profile-avatar__head" />
            <view class="profile-avatar__body" />
          </view>
          <view class="profile-actions">
            <AppButton :loading="authStore.isBusy" @tap="handleWechatLogin">
              {{ authStore.isBusy ? '登录中...' : '微信一键登录' }}
            </AppButton>
            <!-- #ifdef H5 -->
            <AppButton
              v-if="showDevelopmentLogin"
              variant="secondary"
              :loading="authStore.isBusy"
              @tap="handleDevelopmentLogin"
            >
              {{ authStore.isBusy ? '登录中...' : '开发登录（H5）' }}
            </AppButton>
            <!-- #endif -->
          </view>
          <text v-if="authStore.errorMessage" class="profile-error">{{
            authStore.errorMessage
          }}</text>
        </view>
      </view>

      <view v-if="authStore.isAuthenticated" class="profile-footer">
        <AppButton variant="ghost" :loading="authStore.isBusy" @tap="handleLogout">
          {{ authStore.isBusy ? '退出中...' : '退出登录' }}
        </AppButton>
      </view>
    </view>
  </AppPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPage from '@/components/layout/AppPage.vue'
import { useAuthStore } from '@/stores'
import { isH5Development } from './login'

const authStore = useAuthStore()
const showDevelopmentLogin = isH5Development()
const displayName = computed(() => authStore.profile?.nickname?.trim() || '微信用户')

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

async function handleLogout(): Promise<void> {
  try {
    await authStore.logout()
  } catch {
    // 本地登录态已在 store 的 finally 中清理，页面继续展示未登录状态。
  }
}

onMounted(() => {
  void authStore.hydrate()
})
</script>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: calc(100vh - 2rpx);

  /* #ifdef H5 */
  min-height: calc(100vh - 94px);
  /* #endif */
  padding: 40rpx 32rpx calc(160rpx + env(safe-area-inset-bottom));
}

.profile-content {
  width: 100%;
  max-width: 960rpx;
  margin: 0 auto;
}

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

.profile-card--loading {
  justify-content: center;
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

.profile-name {
  margin-top: 28rpx;
  color: var(--app-text-color);
  font-size: 38rpx;
  font-weight: 700;
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

.profile-footer {
  width: 100%;
  max-width: 960rpx;
  margin: auto auto 0;
  padding-top: 48rpx;
}

.profile-skeleton {
  overflow: hidden;
  background: linear-gradient(90deg, #edf1f8 25%, #f8faff 50%, #edf1f8 75%);
  background-size: 200% 100%;
  animation: profile-skeleton-shimmer 1.4s ease-in-out infinite;
}

.profile-skeleton--avatar {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
}

.profile-skeleton--title {
  width: 220rpx;
  height: 38rpx;
  margin-top: 28rpx;
  border-radius: 19rpx;
}

.profile-skeleton--description {
  width: 280rpx;
  height: 26rpx;
  margin-top: 16rpx;
  border-radius: 13rpx;
}

@keyframes profile-skeleton-shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
