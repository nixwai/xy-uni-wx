import { defineConfig } from 'vite'
import uniPluginModule from '@dcloudio/vite-plugin-uni'

const uni =
  (uniPluginModule as unknown as { default?: typeof uniPluginModule }).default ??
  (uniPluginModule as unknown as typeof uniPluginModule)

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
