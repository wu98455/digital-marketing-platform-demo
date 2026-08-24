# 数字营销平台 · Web 工程

本目录是 **唯一前端工程**（Umi Max + Ant Design Pro）。安装、启动、构建都在这里。

换机 / 清历史后的总说明：仓库根 [`.docs/`](../.docs/README.md)。

## 环境

| 项 | 版本 |
|----|------|
| Node.js | 22+ |
| pnpm | 9 |

## 安装与启动

```powershell
cd web
pnpm install
pnpm start
```

- http://localhost:8000  
- 稳定模式：`pnpm run start:stable`

**不要**从其他机器/目录拷贝 `node_modules`；用 pnpm 安装（store 可用 `D:\dev\pnpm-store`）。详见 [.docs/工程手册.md](../.docs/工程手册.md)。

## 演示账号

| 账号 | 密码 |
|------|------|
| `admin` | `123456` |
| `demo` | `123456` |

更多角色见系统用户表 / 登录页说明。

## 技术边界

- Mock + `localStorage` 演示数据，**非生产中台**
- 路由：`config/routes.ts`
- 页面：`src/pages/`
- Mock：`mock/`、`src/utils/demoApiRouter.ts` 等

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm start` | 本地开发 |
| `pnpm run build` | 普通构建 |
| `pnpm run build:pages` | GitHub Pages（带 `PUBLIC_PATH`） |
| `pnpm test` | 单元测试 |
| `pnpm run tsc` | 类型检查 |

## 部署

推送 `main` → Actions 在本目录构建并发布 `web/dist`。步骤与注意点见 [.docs/工程手册.md](../.docs/工程手册.md)；路径与账号见 [.docs/项目对照表.md](../.docs/项目对照表.md)。
