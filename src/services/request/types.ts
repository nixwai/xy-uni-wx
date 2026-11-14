export interface ApiEnvelope<T> {
  code: number
  data: T
  message?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: UniNamespace.RequestOptions['data']
  headers?: Readonly<Record<string, string>>
  timeoutMs?: number
}

export interface AdapterOptions {
  url: string
  method: HttpMethod
  data?: UniNamespace.RequestOptions['data']
  headers: Record<string, string>
  timeout: number
}

export interface AdapterResponse {
  statusCode: number
  data: unknown
  headers: Readonly<Record<string, string>>
}

export type RequestAdapter = (options: AdapterOptions) => Promise<AdapterResponse> | AdapterResponse
export type RequestInterceptor = (
  options: RequestOptions,
) => RequestOptions | Promise<RequestOptions>
export type ResponseInterceptor = <T>(data: T, response: AdapterResponse) => T | Promise<T>

export type RequestErrorKind = 'network' | 'timeout' | 'http' | 'business' | 'unknown'

export interface RequestClientOptions {
  baseUrl: string
  timeoutMs: number
  adapter: RequestAdapter
  getToken?: () => string | undefined
  onUnauthorized?: (error: RequestError) => void
  requestInterceptors?: readonly RequestInterceptor[]
  responseInterceptors?: readonly ResponseInterceptor[]
}

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
