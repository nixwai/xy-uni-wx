import { describe, expect, it, vi } from 'vitest'
import { userApi } from '@/services/api/user'
const request = vi.hoisted(() => vi.fn())
vi.mock('@/services/request', () => ({ request }))

describe('userApi', () => {
  it('发送微信登录、开发登录、获取用户和退出请求', async () => {
    request
      .mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1' } })
      .mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1' } })
      .mockResolvedValueOnce({ id: 'u1' })
      .mockResolvedValueOnce(null)
    await expect(userApi.loginWithWechat({ code: 'c' })).resolves.toMatchObject({
      accessToken: 'a',
    })
    await expect(userApi.loginForDevelopment({ nickname: 'dev' })).resolves.toMatchObject({
      refreshToken: 'r',
    })
    await expect(userApi.getCurrentUser()).resolves.toEqual({ id: 'u1' })
    await expect(userApi.logout('r')).resolves.toBeNull()
    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/auth/wechat/login',
      method: 'POST',
      data: { code: 'c' },
    })
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/auth/dev/login',
      method: 'POST',
      data: { nickname: 'dev' },
    })
    expect(request).toHaveBeenNthCalledWith(3, { url: '/user/me', method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(4, {
      url: '/auth/user/logout',
      method: 'POST',
      data: { refreshToken: 'r' },
    })
  })
  it('拒绝缺少关键字段的登录和用户响应', async () => {
    request.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: {} })
    await expect(userApi.loginWithWechat({ code: 'c' })).rejects.toThrow('登录失败')
    await expect(userApi.loginForDevelopment()).rejects.toThrow('登录失败')
    request.mockResolvedValue({})
    await expect(userApi.getCurrentUser()).rejects.toThrow('用户信息获取失败')
  })
})
