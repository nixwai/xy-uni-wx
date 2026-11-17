<template>
  <view class="profile-footer">
    <AppButton variant="ghost" :loading="authStore.isBusy" @tap="handleLogout">
      {{ authStore.isBusy ? '退出中...' : '退出登录' }}
    </AppButton>
  </view>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

async function handleLogout(): Promise<void> {
  try {
    await authStore.logout()
  } catch {
    // 本地登录态已在 store 的 finally 中清理，页面继续展示未登录状态。
  }
}
</script>

<style lang="scss" scoped>
.profile-footer {
  width: 100%;
  max-width: 960rpx;
  margin: auto auto 0;
  padding-top: 48rpx;
}
</style>
