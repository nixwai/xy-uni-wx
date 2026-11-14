import type { AppConfig, PublicEnv } from '@/shared/types/config'

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const MIN_REQUEST_TIMEOUT_MS = 1_000
const MAX_REQUEST_TIMEOUT_MS = 120_000
const HTTP_URL_PATTERN = /^https?:\/\/[^/\s?#]+(?:[/?#][^\s]*)?$/i

function normalizeBaseUrl(value: string | undefined): string {
  const baseUrl = value?.trim() ?? ''
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL 未配置')
  }

  if (!HTTP_URL_PATTERN.test(baseUrl)) {
    throw new Error('VITE_API_BASE_URL 必须是合法的 http 或 https 绝对 URL')
  }

  return baseUrl.replace(/\/+$/, '')
}

function parseRequestTimeout(value: string | undefined): number {
  if (!value) {
    return DEFAULT_REQUEST_TIMEOUT_MS
  }

  const timeoutMs = Number(value)
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < MIN_REQUEST_TIMEOUT_MS ||
    timeoutMs > MAX_REQUEST_TIMEOUT_MS
  ) {
    throw new Error(
      `VITE_REQUEST_TIMEOUT 必须是 ${MIN_REQUEST_TIMEOUT_MS} 到 ${MAX_REQUEST_TIMEOUT_MS} 之间的整数`,
    )
  }

  return timeoutMs
}

export function createAppConfig(env: PublicEnv): AppConfig {
  return Object.freeze({
    apiBaseUrl: normalizeBaseUrl(env.VITE_API_BASE_URL),
    requestTimeoutMs: parseRequestTimeout(env.VITE_REQUEST_TIMEOUT),
  })
}

export const appConfig = createAppConfig({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_REQUEST_TIMEOUT: import.meta.env.VITE_REQUEST_TIMEOUT,
})
