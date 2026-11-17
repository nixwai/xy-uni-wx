import { RequestError } from '@/services/request'

/** 将请求、平台或未知异常转换为可直接展示的中文提示。 */
export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof RequestError) {
    if (error.kind === 'timeout') {
      return '请求超时，请稍后重试'
    }
    if (error.kind === 'network') {
      return '网络连接失败，请检查网络后重试'
    }
    if (error.kind === 'http') {
      return error.statusCode === 401 ? '登录状态已失效，请重新登录' : '服务暂时不可用，请稍后重试'
    }
    if (error.kind === 'business' && error.message) {
      return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'errMsg' in error) {
    const message = error.errMsg
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return '操作失败，请稍后重试'
}
