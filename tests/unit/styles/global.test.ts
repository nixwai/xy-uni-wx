import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globalStyles = readFileSync(
  new URL('../../../src/styles/global.scss', import.meta.url),
  'utf8',
)

describe('全局样式的小程序兼容约束', () => {
  it('将主题变量声明在 page 作用域而不是 :root', () => {
    expect(globalStyles).not.toContain(':root')
    expect(globalStyles).toMatch(/page\s*\{[\s\S]*--app-background-color/)
  })
})
