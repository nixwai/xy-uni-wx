/** 应用支持的运行模式。 */
export type RuntimeMode = 'development' | 'test' | 'production'

/** 运行时配置中供应用读取的字段。 */
export interface AppConfig {
  apiBaseUrl: string
  requestTimeoutMs: number
}

/** 可从客户端构建产物读取的公开环境变量。 */
export interface PublicEnv {
  VITE_API_BASE_URL?: string
  VITE_REQUEST_TIMEOUT?: string
}
