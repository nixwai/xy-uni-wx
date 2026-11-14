/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />
/// <reference types="wechat-miniprogram" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
