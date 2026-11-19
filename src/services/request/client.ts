import { appConfig } from '@/config'
import { clearAuthTokens, getAccessToken } from '@/shared/utils/token-storage'
import { joinUrl } from '@/shared/utils/url'
import { createBusinessError, createHttpError, createNetworkError } from '../error/error-creator'
import { createTokenRefresher } from './token-refresh'
import { isApiEnvelope, isBusinessFailure, isUnauthorizedError } from './helpers'
import type {
  AdapterOptions,
  AdapterResponse,
  RequestClientOptions,
  RequestErrorKind,
  RequestOptions,
} from './types'
import { RequestError } from './types'
import { createUniRequestAdapter } from './uni-adapter'

/** 负责组装请求、执行生命周期拦截器并归一化平台响应。 */
export class RequestClient {
  private readonly options: RequestClientOptions

  constructor(options: RequestClientOptions) {
    this.options = {
      ...options,
      requestInterceptors: [...(options.requestInterceptors ?? [])],
      responseInterceptors: [...(options.responseInterceptors ?? [])],
    }
  }

  /** 发起请求，并在登录态失效时刷新令牌后重放一次。 */
  async request<TResponse = unknown>(input: RequestOptions): Promise<TResponse> {
    const options = await this.applyRequestInterceptors(input)

    try {
      return await this.execute<TResponse>(options)
    } catch (error) {
      if (!isUnauthorizedError(error) || options.skipTokenRefresh) {
        this.notifyUnauthorized(error)
        throw error
      }

      const refreshed = await this.options.refreshAccessToken?.()
      if (!refreshed) {
        this.notifyUnauthorized(error)
        throw error
      }
    }

    try {
      return await this.execute<TResponse>(options)
    } catch (error) {
      this.notifyUnauthorized(error)
      throw error
    }
  }

  private async execute<TResponse>(options: RequestOptions): Promise<TResponse> {
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
      throw createHttpError(response)
    }
    if (isBusinessFailure(response.data)) {
      throw createBusinessError(response.data)
    }

    const data = await this.applyResponseInterceptors(response)
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

  private async applyResponseInterceptors(response: AdapterResponse): Promise<unknown> {
    let data: unknown = isApiEnvelope(response.data) ? response.data.data : response.data
    for (const interceptor of this.options.responseInterceptors ?? []) {
      data = await interceptor(data, response)
    }
    return data
  }

  private createHeaders(
    headers: Readonly<Record<string, string>> | undefined,
  ): Record<string, string> {
    const token = this.options.getToken?.()
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() !== 'authorization'),
    )

    return {
      ...normalizedHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  private notifyUnauthorized(error: unknown): void {
    if (isUnauthorizedError(error)) {
      this.options.onUnauthorized?.(error)
    }
  }
}

function createRequestClient(): RequestClient {
  const client: RequestClient = new RequestClient({
    baseUrl: appConfig.apiBaseUrl,
    timeoutMs: appConfig.requestTimeoutMs,
    adapter: createUniRequestAdapter(),
    getToken: getAccessToken,
    refreshAccessToken: createTokenRefresher((options) => client.request(options)),
    onUnauthorized: () => clearAuthTokens(),
  })

  return client
}

/** 使用当前应用配置的共享请求客户端。 */
export const requestClient = createRequestClient()

/** 使用应用默认配置发起请求。 */
export function request<TResponse = unknown>(options: RequestOptions): Promise<TResponse> {
  return requestClient.request<TResponse>(options)
}

export type { RequestErrorKind }
export { RequestError }
