<template>
  <view class="profile-card profile-card--loading" aria-label="正在加载个人信息">
    <view class="profile-skeleton profile-skeleton--avatar" />
    <view class="profile-skeleton profile-skeleton--title" />
    <view class="profile-skeleton profile-skeleton--description" />
  </view>
</template>

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

.profile-card--loading {
  justify-content: center;
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
