import { createSSRApp } from 'vue'
import App from './App.vue'
import { createStore } from './stores'

/** 创建 uni-app 的 SSR 应用实例并注册全局 store。 */
export function createApp() {
  const app = createSSRApp(App)
  app.use(createStore())
  return {
    app,
  }
}
