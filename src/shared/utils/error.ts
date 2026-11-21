export function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error && value.message) {
    return value
  }

  if (typeof value === 'object' && value !== null && 'errMsg' in value) {
    const message = value.errMsg
    if (typeof message === 'string' && message.length > 0) {
      return new Error(message)
    }
  }

  return new Error(fallback)
}
