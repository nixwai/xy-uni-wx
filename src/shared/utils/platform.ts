/** 判断当前构建是否为开发环境。 */
export function isDevelopment(): boolean {
  const isDev = import.meta.env.DEV
  return isDev
}
