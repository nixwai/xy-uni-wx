<template>
  <view class="profile-footer">
    <AppButton variant="ghost" @tap="handleLogout">退出登录</AppButton>
  </view>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

function handleLogout(): void {
  authStore.logout()
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
