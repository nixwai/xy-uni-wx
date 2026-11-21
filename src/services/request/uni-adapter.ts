import { RequestError } from './types'
import type { AdapterResponse, RequestAdapter } from './types'
import { isTimeoutFailure, normalizeHeaders } from './helpers'

/** 将平台请求封装为统一的请求适配器。 */
export function createUniRequestAdapter(): RequestAdapter {
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
