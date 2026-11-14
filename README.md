# xy-uni-wx

面向微信小程序的 uni-app + Vue 3 + TypeScript 前端项目。

## 环境

- Node.js `>=22.12.0`
- pnpm `>=10.0.0`，项目锁定 `pnpm@12.16.1`
- 运行目标：微信小程序（`mp-weixin`）

## 常用命令

```bash
pnpm install
pnpm dev:mp-weixin
pnpm build:mp-weixin
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm test
pnpm test:coverage
pnpm check
```

首次安装若 pnpm 因安全策略拦截依赖构建脚本，确认依赖来源后执行：

```bash
pnpm approve-builds --all
pnpm install
```

## 关键约定

- `src/config/pages.ts` 是页面和原生 tabBar 的类型化配置源；`src/pages.json` 由 `pnpm pages:generate` 生成，不手工维护。
- 页面路径统一来自 `src/router/routes.ts`；uni-app 原生页面配置使用无前导 `/` 的路径，调用 `uni` 路由 API 时由路由函数统一转换。
- 页面当前只保留 `首页` 和 `个人` 两个 tab，不在初始化阶段加入业务 UI、模拟数据或业务状态。
- 请求统一通过 `src/services/request`；业务 API 按领域新增到 `src/services/api`，页面不得直接调用 `uni.request`。
- `.env.*` 只允许公开运行配置；`VITE_*` 会进入客户端，禁止放入密钥、令牌和个人凭据。
- 修改依赖时必须同时确认 uni-app alpha 编译器、Vite、Vue 版本的兼容性，不要单独升级其中一个核心包。
- 修改后至少执行 `pnpm typecheck`、`pnpm lint`、`pnpm format:check` 和 `pnpm test:coverage`；涉及页面或构建配置时再执行 `pnpm build:mp-weixin`。
