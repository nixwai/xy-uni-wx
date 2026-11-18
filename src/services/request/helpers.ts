import { RequestError } from './types'

export function isApiEnvelope(
  value: unknown,
): value is { code: number; data: unknown; message?: string } {
  return (
    typeof value === 'object' && value !== null && 'code' in value && typeof value.code === 'number'
  )
}

export function isBusinessFailure(value: unknown): value is { code: number; message?: string } {
  return isApiEnvelope(value) && ![0, 200].includes(value.code)
}

export function normalizeHeaders(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

export function isTimeoutFailure(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || !('errMsg' in value)) {
    return false
  }

  return typeof value.errMsg === 'string' && value.errMsg.toLowerCase().includes('timeout')
}

/** 判断请求错误是否为登录态失效：HTTP 401 或业务码 40100。 */
export function isUnauthorizedError(error: unknown): error is RequestError {
  if (!(error instanceof RequestError)) {
    return false
  }

  return (
    (error.kind === 'http' && error.statusCode === 401) ||
    (error.kind === 'business' && error.code === 40100)
  )
}
