import { createSSRApp } from 'vue'
import App from './App.vue'
import { createStore } from './stores'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createStore())
  return {
    app,
  }
}
