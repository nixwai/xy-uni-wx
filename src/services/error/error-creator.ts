import type { AdapterResponse } from '../request/types'
import { RequestError } from '../request/types'

export function createNetworkError(cause: unknown): RequestError {
  return new RequestError('网络请求失败', {
    kind: 'network',
    cause,
  })
}

export function createHttpError(response: AdapterResponse): RequestError {
  return new RequestError(`HTTP 请求失败：${response.statusCode}`, {
    kind: 'http',
    statusCode: response.statusCode,
    cause: response.data,
  })
}

export function createBusinessError(payload: { code: number; message?: string }): RequestError {
  return new RequestError(payload.message ?? '业务请求失败', {
    kind: 'business',
    code: payload.code,
    cause: payload,
  })
}
