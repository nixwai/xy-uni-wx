export type QueryValue = string | number | boolean
export type Query = Readonly<Record<string, QueryValue | null | undefined>>

export type RoutePath = `pages/${string}` | `/pages/${string}`
