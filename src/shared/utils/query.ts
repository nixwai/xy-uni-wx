/** 过滤空值并将查询参数编码为 URL 查询字符串。 */
export function serializeQuery(query: Readonly<Record<string, unknown>>): string {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}
