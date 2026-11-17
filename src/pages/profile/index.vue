<template>
  <AppPage>
    <view class="profile-page">
      <view class="profile-content">
        <ProfileLoading v-if="authStore.status === 'loading'" />
        <ProfileUserInfo v-else-if="authStore.isAuthenticated" />
        <ProfileGuest v-else />
      </view>

      <ProfileLogoutButton v-if="authStore.isAuthenticated" />
    </view>
  </AppPage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppPage from '@/components/layout/AppPage.vue'
import { useAuthStore } from '@/stores'
import ProfileGuest from './components/profile-guest.vue'
import ProfileLoading from './components/profile-loading.vue'
import ProfileLogoutButton from './components/profile-logout-button.vue'
import ProfileUserInfo from './components/profile-user-info.vue'

const authStore = useAuthStore()

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
</style>
