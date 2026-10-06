# SRM 前端技术结构

## 1. 项目定位

该目录当前是基于 Ant Design Pro v6 的 React 中后台前端模板工程，使用 Umi Max 管理路由、运行时和构建。仓库中可见的具体业务入口包括通用欢迎页/管理示例；多数页面为 Pro 模板示例。另有独立的 Cloudflare Worker（Hono）示例 API。不要仅凭目录名推断前后端已完成 SRM 业务联调。

## 2. 技术栈与常用命令

- Node.js ≥ 22，npm 与 `package-lock.json`。
- React 19、TypeScript 7、Umi Max 4、Ant Design 6、Pro Components 3、Ant Design X；Tailwind CSS v4、antd-style。
- Vitest + Testing Library；Biome 做 lint/格式检查，TypeScript 编译检查。
- `npm install` 安装依赖；`npm start` 启动开发环境；`npm run dev` 启动且禁用 mock；`npm run build` 构建；`npm run preview` 预览构建产物。
- `npm run lint` 运行 Biome 与 TypeScript 检查；`npm run test` 执行 Vitest。
- Worker 是独立 package（非 npm workspace）：在 `cloudflare-worker` 下安装依赖后使用 `npm run dev` 或 `npm run deploy`，`npm run typecheck` 类型检查。

## 3. 应用结构

| 路径 | 职责 |
| --- | --- |
| `config/config.ts` | Umi Max 总配置：路由、国际化、主题、请求、权限、React Query、OpenAPI、Tailwind、Mock、构建及版本定义。 |
| `config/routes.ts` | 主路由表，定义用户认证、欢迎页、管理、Dashboard、表单、列表、详情、异常、用户和 AI 助手等模板页面。 |
| `config/routes.simple.ts` | 精简模板的备用路由配置。 |
| `config/proxy.ts` | 本地环境 `/api/` 代理到 `http://localhost:9090`，并剥离 `/api` 前缀；构建部署不使用此代理。 |
| `src/app.tsx`, `access.ts`, `global.tsx`, `requestErrorConfig.ts` | Umi 运行时配置、访问控制、全局副作用及统一请求错误处理。 |
| `src/pages/` | 页面组件，按业务/模板域组织；页面特有的 service、mock、类型和样式宜与页面共置。 |
| `src/components/` | 可复用 UI 组件。 |
| `src/services/` | API 客户端代码；`config/oneapi.json` 是 OpenAPI 生成配置来源之一，生成代码需按仓库约定维护。 |
| `src/locales/` | 8 种语言资源（含简体/繁体中文、英语、日语等）。 |
| `mock/`、`src/pages/**/_mock.ts` | 本地 Mock 路由及页面 Mock。 |
| `public/`、`scripts/`、`types/`、`tests/` | 公共静态资源、辅助脚本、扩展类型和测试。 |
| `cloudflare-worker/` | 单独部署的 Hono 示例 API。 |

Umi 自动生成的 `src/.umi` 不应作为手写源代码；开发环境异常时可清理生成目录并重新启动。`dist` 为构建产物。

## 4. 页面运行与数据流

页面由 `config/routes.ts` 声明并映射到 `src/pages`。路由 `name` 通常对应菜单国际化键，`access` 使用 `src/access.ts` 中声明的权限判断。全局初始化状态和登录用户由 Umi Max runtime 配置管理；请求基于 `@umijs/max` 的 request，错误处理配置在 `src/requestErrorConfig.ts`。简单列表可用 ProTable `request`；复杂服务器状态可用已启用的 TanStack React Query 插件。

开发时前端默认地址由 Umi 提供，`/api/*` 代理至后端 9090 并去掉 `/api` 前缀，例如浏览器请求 `/api/auth/login` 会转发到后端 `/auth/login`。代理仅适用于本地开发；部署环境需由网关/平台单独配置 API 地址与跨域策略。`config.ts` 中开发/测试/预发布环境均配置本机 9090 代理，具体取值受 `UMI_ENV` 影响。

## 5. Cloudflare Worker 结构

`cloudflare-worker/src/index.ts` 创建 Hono app，配置 CORS、注册 `/api` 下的用户、Dashboard、表格、公告、监控、地理数据、列表、个人资料和设置等路由，并提供 404 JSON。路由实现位于 `src/routes/`，演示数据位于 `src/data/`，CORS 来源校验在 `src/utils/cors.ts`。Worker 包使用 Wrangler；`wrangler.toml` 当前声明入口、兼容日期和 `ENVIRONMENT` 变量。该 Worker 与 Spring Boot 是两个独立 API 实现，前端代理目前指向 Spring Boot，不能默认认为请求会自动切到 Worker。

## 6. 配置与工程约定

- 环境选择：`UMI_ENV` 控制 Umi 配置环境；`CI`、`COMMIT_HASH` 等由构建配置写入应用版本信息。
- 样式优先使用 Tailwind 做布局、antd-style/createStyles 使用主题 token；仓库保留 Less/CSS 等既有样式。
- 国际化通过 `src/locales` 维护；页面访问权限需同时考虑路由 `access` 和访问判断实现。
- Biome 是仓库配置的 lint 工具；提交规范由 commitlint/Husky 配置执行。
- `npm run simple` 会删减页面、Mock 和依赖，README 标明此脚本不可逆，执行前应检查并备份工作树。

## 7. 进一步核对

仓库带有多个模板页面、Mock 数据和独立 Worker 示例。接入真实 SRM API 前，需逐页确认接口字段、认证传递方式、环境变量及后端映射；不要把模板 Mock 或 Worker 示例数据当作生产数据契约。
