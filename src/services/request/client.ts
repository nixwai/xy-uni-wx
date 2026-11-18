import { appConfig } from '@/config'
import { clearAuthTokens, getAccessToken } from '@/shared/utils/token-storage'
import { joinUrl } from '@/shared/utils/url'
import type {
  AdapterOptions,
  AdapterResponse,
  RequestAdapter,
  RequestClientOptions,
  RequestErrorKind,
  RequestOptions,
} from './types'
import { RequestError } from './types'
import { refreshAuthTokens } from './token-refresh'
import { createNetworkError, createHttpError, createBusinessError } from '../error/error-creator'
import {
  isUnauthorizedError,
  isBusinessFailure,
  isApiEnvelope,
  normalizeHeaders,
  isTimeoutFailure,
} from './helpers'

/** 负责组装请求、执行拦截器并归一化平台响应的请求客户端。 */
export class RequestClient {
  private readonly options: RequestClientOptions

  constructor(options: RequestClientOptions) {
    this.options = {
      ...options,
      requestInterceptors: [...(options.requestInterceptors ?? [])],
      responseInterceptors: [...(options.responseInterceptors ?? [])],
    }
  }

  /** 执行请求；登录态失效时先刷新令牌并重放一次原请求。 */
  async request<TResponse = unknown>(input: RequestOptions): Promise<TResponse> {
    const options = await this.applyRequestInterceptors(input)

    try {
      return await this.execute<TResponse>(options)
    } catch (error) {
      const refreshable = isUnauthorizedError(error) && !options.skipTokenRefresh
      if (!refreshable || !(await refreshAuthTokens())) {
        if (isUnauthorizedError(error)) {
          this.options.onUnauthorized?.(error)
        }
        throw error
      }
    }

    try {
      // 刷新成功后重放原请求，请求头会重新读取新的访问令牌。
      return await this.execute<TResponse>(options)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        this.options.onUnauthorized?.(error)
      }
      throw error
    }
  }

  /** 执行一次平台请求并返回经过业务包装解包和响应拦截后的数据。 */
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

    const data = this.applyResponseInterceptors(response)

    // 请求客户端只负责解包，具体接口在 API 层校验响应字段。
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

  private async applyResponseInterceptors(response: AdapterResponse) {
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
    const normalizedHeaders = token
      ? Object.fromEntries(
          Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() !== 'authorization'),
        )
      : { ...headers }

    return {
      ...normalizedHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

/** 使用当前应用配置的共享请求客户端。 */
export const requestClient = new RequestClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.requestTimeoutMs,
  adapter: createUniRequestAdapter(),
  getToken: getAccessToken,
  onUnauthorized: () => clearAuthTokens(),
})

/** 使用应用默认配置发起请求。 */
export function request<TResponse = unknown>(options: RequestOptions): Promise<TResponse> {
  return requestClient.request<TResponse>(options)
}

export type { RequestErrorKind }
export { RequestError }
