/** 统一接口响应的业务包装结构。 */
export interface ApiEnvelope<T> {
  code: number
  data: T
  message?: string
}

/** 请求客户端支持的 HTTP 方法。 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** 业务层发起请求时使用的参数。 */
export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: UniNamespace.RequestOptions['data']
  headers?: Readonly<Record<string, string>>
  timeoutMs?: number
  /** 关闭登录态失效后的自动令牌刷新。 */
  skipTokenRefresh?: boolean
}

/** 适配器收到的已归一化请求参数。 */
export interface AdapterOptions {
  url: string
  method: HttpMethod
  data?: UniNamespace.RequestOptions['data']
  headers: Record<string, string>
  timeout: number
}

/** 平台请求适配器返回的统一响应结构。 */
export interface AdapterResponse {
  statusCode: number
  data: unknown
  headers: Readonly<Record<string, string>>
}

/** 执行平台请求并返回统一响应的适配器。 */
export type RequestAdapter = (options: AdapterOptions) => Promise<AdapterResponse> | AdapterResponse

/** 修改请求参数的拦截器。 */
export type RequestInterceptor = (
  options: RequestOptions,
) => RequestOptions | Promise<RequestOptions>

/** 修改响应数据的拦截器。 */
export type ResponseInterceptor = <T>(data: T, response: AdapterResponse) => T | Promise<T>

/** 请求失败的分类。 */
export type RequestErrorKind = 'network' | 'timeout' | 'http' | 'business' | 'unknown'

/** 请求客户端的运行时依赖和扩展点。 */
export interface RequestClientOptions {
  baseUrl: string
  timeoutMs: number
  adapter: RequestAdapter
  getToken?: () => string | undefined
  refreshAccessToken?: () => Promise<boolean>
  onUnauthorized?: (error: RequestError) => void
  requestInterceptors?: readonly RequestInterceptor[]
  responseInterceptors?: readonly ResponseInterceptor[]
}

/** 对外暴露统一错误分类、状态码和业务码的请求错误。 */
export class RequestError extends Error {
  readonly kind: RequestErrorKind
  readonly statusCode?: number
  readonly code?: number
  readonly cause?: unknown

  constructor(
    message: string,
    details: {
      kind: RequestErrorKind
      statusCode?: number
      code?: number
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'RequestError'
    this.kind = details.kind
    this.statusCode = details.statusCode
    this.code = details.code
    this.cause = details.cause
  }
}
