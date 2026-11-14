export type RuntimeMode = 'development' | 'test' | 'production'

export interface AppConfig {
  apiBaseUrl: string
  requestTimeoutMs: number
}

export interface PublicEnv {
  VITE_API_BASE_URL?: string
  VITE_REQUEST_TIMEOUT?: string
}
