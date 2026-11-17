/** 合并 API 基础地址和接口路径，并去除重复斜杠。 */
export function joinUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return normalizedPath ? `${normalizedBaseUrl}/${normalizedPath}` : normalizedBaseUrl
}
