import { describe, expect, it } from 'vitest'
import { requestWechatCode, requestWechatProfile } from '@/shared/third-party/wechat-api'
const validLogin = ({ success }: { success: (result: { code: string }) => void }) =>
  success({ code: ' code ' })

function installUni(overrides: Record<string, unknown> = {}): void {
  Object.assign(globalThis, { uni: overrides })
}
describe('微信平台适配', () => {
  it('获取有效登录凭证', async () => {
    installUni({ login: validLogin })
    await expect(requestWechatCode()).resolves.toBe(' code ')
  })
  it('平台未提供登录能力时返回失败提示', async () => {
    installUni({})
    await expect(requestWechatCode()).resolves.toBe('微信登录失败')
  })
  it('拒绝空凭证并转换平台失败', async () => {
    installUni({
      login: ({ success }: { success: (result: { code: string }) => void }) =>
        success({ code: ' ' }),
    })
    await expect(requestWechatCode()).rejects.toThrow('微信登录凭证无效')
    installUni({
      login: ({ fail }: { fail: (error: { errMsg: string }) => void }) =>
        fail({ errMsg: '登录失败' }),
    })
    await expect(requestWechatCode()).rejects.toThrow('登录失败')
  })
  it('读取公开资料并在用户拒绝时返回 undefined', async () => {
    installUni({
      getUserProfile: ({
        success,
      }: {
        success: (result: { userInfo: { nickName: string; avatarUrl: string } }) => void
      }) => success({ userInfo: { nickName: ' 昵称 ', avatarUrl: ' avatar ' } }),
    })
    await expect(requestWechatProfile()).resolves.toEqual({ nickname: '昵称', avatarUrl: 'avatar' })
    installUni({ getUserProfile: ({ fail }: { fail: () => void }) => fail() })
    await expect(requestWechatProfile()).resolves.toBeUndefined()
    installUni({})
    await expect(requestWechatProfile()).resolves.toBeUndefined()
  })
})
