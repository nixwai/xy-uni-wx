# xy-uni-wx AI 协作规则

## 项目事实

- 这是一个面向微信小程序与 H5 的 uni-app Vue 3 + TypeScript 前端项目，运行目标为 `mp-weixin` 与 `h5`。
- 使用 pnpm；Node.js `>=22.12.0`，项目锁定 `pnpm@12.16.1`。
- H5 开发命令为 `pnpm dev:h5`，固定使用端口 `5173`；微信小程序开发命令为 `pnpm dev:mp-weixin`。
- `@dcloudio/*` 必须保持同一编译器版本 `3.0.0-alpha-5030620261112001`；Vite `5.2.8`、Vue `3.4.21` 不要单独升级。

## 修改约束

- 页面和原生 tabBar 的配置源是 `src/config/pages.ts`，`src/pages.json` 是生成文件；修改页面后运行 `pnpm pages:generate`，不要只改生成文件。
- 路径统一从 `src/router/routes.ts` 获取，页面跳转使用 `src/router/index.ts`，不要在业务代码散落路径字符串或直接调用底层 `uni` 路由 API。
- 底层请求只能经 `src/services/request`；业务 API 按领域扩展，不要在页面直接调用 `uni.request`。
- `.env.*` 中只能放客户端公开配置；`VITE_*` 会进入构建产物，禁止写入密钥、令牌、密码和私钥。
- 当前首页、个人页保持空白；没有真实业务需求时不要添加 UI、模拟数据、状态或示例接口。
- 保持不可变数据流；新增公共能力先写行为测试，再实现和重构；不要通过扩大忽略范围或关闭规则来绕过检查。

## 验证命令

```bash
pnpm install
pnpm check
pnpm dev:h5
pnpm build:h5
pnpm build:mp-weixin
```

`pnpm check` 必须同时通过类型检查、OXC lint、OXC format 和测试覆盖率（80%）。构建产物在 `dist/`，仅供本地验证或平台工具导入，不得提交。

若 pnpm 12 拦截依赖构建脚本，确认依赖来源后执行 `pnpm approve-builds --all`，再执行 `pnpm install`。
