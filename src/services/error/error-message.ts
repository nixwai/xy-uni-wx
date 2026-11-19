import { RequestError } from '../request/types'

/** 将任意异常转换为全局可展示的错误信息。 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof RequestError) {
    switch (error.kind) {
      case 'timeout':
        return '请求超时，请稍后重试'
      case 'network':
        return '网络连接失败，请检查网络后重试'
      case 'http':
        return error.statusCode === 401
          ? '登录状态已失效，请重新登录'
          : '服务暂时不可用，请稍后重试'
      case 'business':
        return error.message || '业务请求失败'
      default:
        break
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
