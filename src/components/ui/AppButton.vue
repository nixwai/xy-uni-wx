<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, { 'app-button--block': block }]"
    :disabled="disabled || loading"
    :hover-class="hoverClass"
    @tap="emit('tap')"
  >
    <view v-if="loading" class="app-button__loading" aria-hidden="true" />
    <text><slot /></text>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    block?: boolean
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    block: true,
    loading: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  tap: []
}>()

const hoverClass = 'app-button--hover'
</script>

<style lang="scss" scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 92rpx;
  padding: 0 36rpx;
  border: 0;
  border-radius: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
  transition:
    transform 160ms ease,
    opacity 160ms ease,
    background-color 160ms ease;

  &::after {
    border: 0;
  }

  &--block {
    width: 100%;
  }

  &--primary {
    color: #ffffff;
    background: var(--app-primary-color);
    box-shadow: 0 16rpx 32rpx rgba(53, 109, 255, 0.2);
  }

  &--secondary {
    color: var(--app-primary-color);
    background: var(--app-primary-soft-color);
  }

  &--ghost {
    color: var(--app-danger-color);
    background: #fff2f0;
  }

  &--hover {
    opacity: 0.78;
    transform: translateY(2rpx);
  }

  &[disabled] {
    opacity: 0.55;
    box-shadow: none;
  }
}

.app-button__loading {
  width: 28rpx;
  height: 28rpx;
  margin-right: 14rpx;
  border: 3rpx solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: app-button-spin 680ms linear infinite;
}

@keyframes app-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
