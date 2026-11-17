import { createPinia } from 'pinia'

export function createStore() {
  return createPinia()
}

export { useAuthStore } from './auth'
