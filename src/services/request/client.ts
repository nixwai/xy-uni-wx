import { appConfig } from '@/config'
import { clearAuthTokens, getAccessToken } from '@/shared/utils/token-storage'
import { joinUrl } from '@/shared/utils/url'
import type {
  AdapterOptions,
  AdapterResponse,
  RequestAdapter,
  RequestClientOptions,
  RequestErrorKind,
  RequestInterceptor,
  RequestOptions,
  ResponseInterceptor,
} from './types'
import { RequestError } from './types'

function isApiEnvelope(value: unknown): value is { code: number; data: unknown; message?: string } {
  return typeof value === 'object' && value !== null && 'code' in value
}

function isBusinessFailure(value: unknown): value is { code: number; message?: string } {
  return isApiEnvelope(value) && ![0, 200].includes(value.code)
}

function createNetworkError(cause: unknown): RequestError {
  return new RequestError('网络请求失败', {
    kind: 'network',
    cause,
  })
}

function createHttpError(response: AdapterResponse): RequestError {
  return new RequestError(`HTTP 请求失败：${response.statusCode}`, {
    kind: 'http',
    statusCode: response.statusCode,
    cause: response.data,
  })
}

function createBusinessError(payload: { code: number; message?: string }): RequestError {
  return new RequestError(payload.message ?? '业务请求失败', {
    kind: 'business',
    code: payload.code,
    cause: payload,
  })
}

function normalizeHeaders(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

function isTimeoutFailure(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || !('errMsg' in value)) {
    return false
  }

  return typeof value.errMsg === 'string' && value.errMsg.toLowerCase().includes('timeout')
}

export class RequestClient {
  private readonly options: RequestClientOptions

  constructor(options: RequestClientOptions) {
    this.options = {
      ...options,
      requestInterceptors: [...(options.requestInterceptors ?? [])],
      responseInterceptors: [...(options.responseInterceptors ?? [])],
    }
  }

  withRequestInterceptor(interceptor: RequestInterceptor): RequestClient {
    return new RequestClient({
      ...this.options,
      requestInterceptors: [...(this.options.requestInterceptors ?? []), interceptor],
    })
  }

  withResponseInterceptor(interceptor: ResponseInterceptor): RequestClient {
    return new RequestClient({
      ...this.options,
      responseInterceptors: [...(this.options.responseInterceptors ?? []), interceptor],
    })
  }

  async get<TResponse = unknown>(
    url: string,
    options: Omit<RequestOptions, 'url' | 'method'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...options, url, method: 'GET' })
  }

  async post<TResponse = unknown>(
    url: string,
    options: Omit<RequestOptions, 'url' | 'method'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...options, url, method: 'POST' })
  }

  async put<TResponse = unknown>(
    url: string,
    options: Omit<RequestOptions, 'url' | 'method'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...options, url, method: 'PUT' })
  }

  async delete<TResponse = unknown>(
    url: string,
    options: Omit<RequestOptions, 'url' | 'method'> = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...options, url, method: 'DELETE' })
  }

  async request<TResponse = unknown>(input: RequestOptions): Promise<TResponse> {
    const options = await this.applyRequestInterceptors(input)
    const adapterOptions: AdapterOptions = {
      url: joinUrl(this.options.baseUrl, options.url),
      method: options.method ?? 'GET',
      data: options.data,
      headers: this.createHeaders(options.headers),
      timeout: options.timeoutMs ?? this.options.timeoutMs,
    }

    let response: AdapterResponse
    try {
      response = await this.options.adapter(adapterOptions)
    } catch (cause) {
      throw cause instanceof RequestError ? cause : createNetworkError(cause)
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      const error = createHttpError(response)
      if (error.statusCode === 401) {
        this.options.onUnauthorized?.(error)
      }
      throw error
    }
    if (isBusinessFailure(response.data)) {
      const error = createBusinessError(response.data)
      if (error.code === 40100) {
        this.options.onUnauthorized?.(error)
      }
      throw error
    }

    let data: unknown = isApiEnvelope(response.data) ? response.data.data : response.data
    for (const interceptor of this.options.responseInterceptors ?? []) {
      data = await interceptor(data, response)
    }

    // API 业务层应对外部响应做运行时校验，再声明具体响应类型。
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return data as TResponse
  }

  private async applyRequestInterceptors(input: RequestOptions): Promise<RequestOptions> {
    let options = { ...input }
    for (const interceptor of this.options.requestInterceptors ?? []) {
      options = await interceptor(options)
    }
    return options
  }

  private createHeaders(
    headers: Readonly<Record<string, string>> | undefined,
  ): Record<string, string> {
    const token = this.options.getToken?.()
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }
  }
}

function createUniRequestAdapter(): RequestAdapter {
  return (options) =>
    new Promise<AdapterResponse>((resolve, reject) => {
      uni.request({
        url: options.url,
        method: options.method,
        data: options.data,
        header: options.headers,
        timeout: options.timeout,
        success: (response) =>
          resolve({
            statusCode: response.statusCode,
            data: response.data,
            headers: normalizeHeaders(response.header),
          }),
        fail: (error) =>
          reject(
            isTimeoutFailure(error)
              ? new RequestError('请求超时', { kind: 'timeout', cause: error })
              : error,
          ),
      })
    })
}
export const requestClient = new RequestClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.requestTimeoutMs,
  adapter: createUniRequestAdapter(),
  getToken: getAccessToken,
  onUnauthorized: () => clearAuthTokens(),
})

export function request<TResponse = unknown>(options: RequestOptions): Promise<TResponse> {
  return requestClient.request<TResponse>(options)
}

export type { RequestErrorKind }
export { RequestError }
