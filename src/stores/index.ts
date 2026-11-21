import { createPinia } from 'pinia'

/** 创建应用级 Pinia 实例。 */
export function createStore() {
  return createPinia()
}

export { useAuthStore } from './auth'
