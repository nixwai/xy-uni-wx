/** 允许序列化到 URL 查询字符串的值类型。 */
export type QueryValue = string | number | boolean
/** 页面跳转时允许携带的查询参数集合。 */
export type Query = Readonly<Record<string, QueryValue | null | undefined>>

/** uni 页面路径的相对或绝对形式。 */
export type RoutePath = `pages/${string}` | `/pages/${string}`
