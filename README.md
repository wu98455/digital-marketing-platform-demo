# 数字营销平台（digital-marketing）

Ant Design Pro（Umi Max）数字营销管理端 **演示 / 原型**。本仓库是**已落地的客户项目**（工程在 `web/`），不是 Vue 母版，也不是「从模板再新建」的说明书。

跨项目对话可参考 `D:\IDE\Cursor\常用\docs\antd-prototype-starter-工作流备忘.md`。

**演示账号：** `admin / 123456`（另有 `demo` 等，见 `web/README.md`）

元数据以 [项目对照表.md](./项目对照表.md) 为准。交给开发：**只交 `web/`**。

---

## 给 AI 的硬规则

1. **工程与 Git 主体在 `web/`。** 需求、对照分析、测试材料、表格等放根目录本地夹（当前多用 `doc/`），**不要写进 `web/`，默认不进 Git**。
2. **文件夹已是英文 slug：** `digital-marketing`。系统标题可用中文「数字营销平台」。GitHub 仓库名 / `PUBLIC_PATH` 以对照表为准（`digital-marketing-platform-demo`），**不要**为对齐本地文件夹名去改线上路径。
3. 改完在 `web/` 执行 `pnpm start` 预览；**禁止**未要求就 `git commit` / `git push`。
4. 不动母版 `antd-prototype-starter`、也不要把多客户塞进本仓库；**不要**在本仓执行「复制模板 / 再造新项目」。
5. 列表用 ProTable，表单用 ProForm；分页与查询区遵循本仓约定（`listPagination` / `listSearchProps`）。
6. **禁止拷贝 `node_modules`**；用 pnpm + 共享 store（`D:\dev\pnpm-store`）在 `web/` 安装。

---

## 目录与 Git 边界

```text
digital-marketing/                 ← Cursor 打开的仓库根
├── README.md                      # 进 Git（本文 · 日常总说明）
├── 项目对照表.md                   # 进 Git（元数据真源）
├── .gitignore
├── .github/                       # 进 Git（Pages，working-directory = web）
├── web/                           # 【进 Git · 唯一交付工程】
└── doc/                           # 本地：需求 / 打标分析 / xlsx 等（不进 Git）
```

| 放哪里 | 举例 | Git |
|--------|------|-----|
| `web/` | 页面、路由、Mock、配置、`package.json` | **进**（不含 `node_modules` / `dist` / `.umi*`） |
| 根目录固定文件 | `README.md`、`项目对照表.md`、`.github` | **进** |
| 根目录本地夹 | `doc/`（及你自建的分类夹） | **不进** |

做项目产生新材料时：放根目录本地夹；**禁止**把需求 / 用例 / 表格堆进 `web/src`。

`.gitignore` 采用「根下默认全忽略 + 白名单」。

| 项 | 路径 |
|----|------|
| 本仓库 | `D:\dev\projects\digital-marketing` |
| 交付工程 | `...\digital-marketing\web` |
| Demo | https://wu98455.github.io/digital-marketing-platform-demo/ |

---

## 本地开发

```powershell
cd D:\dev\projects\digital-marketing\web
pnpm install
pnpm start
```

http://localhost:8000  

局域网访问：

```powershell
pnpm start -- --host 0.0.0.0
```

可选统一 store：

```powershell
pnpm config set store-dir D:\dev\pnpm-store
pnpm config set cache-dir D:\dev\pnpm-cache
```

Windows 上偶发 `esbuild` rename `EPERM`：保持**英文路径**、**单进程** `pnpm install`，勿拷贝别人的 `node_modules`；失败可删 `web/node_modules` 后重装。本仓库路径已是英文。

---

## 改业务入口（`web/`）

| 改什么 | 路径 |
|--------|------|
| 菜单 / 路由 | `web/config/routes.ts` |
| 布局默认 | `web/config/defaultSettings.ts` |
| Umi 主配置 | `web/config/config.ts` |
| 页面 | `web/src/pages/` |
| Mock | `web/mock/` |

列表参考既有 ProTable 页；表单用 ProForm。组件文档：[Ant Design](https://ant.design/components/overview-cn/)、[ProTable](https://procomponents.ant.design/components/table)。

---

## 部署 GitHub Pages

仅当用户明确说「推到 GitHub / 部署」时：

1. 开代理（国内常见端口 **7892**）后 `push main`
2. Actions：`.github/workflows/deploy-pages.yml`（`working-directory: web`）→ `pnpm install` → `max setup` → `pnpm run build:pages` → 发布 `web/dist` 到 `gh-pages`
3. 仓库 **Settings → Pages**：Deploy from branch → **gh-pages** → **/ (root)**（首次启用时）

`PUBLIC_PATH` / 仓库名必须与 [项目对照表.md](./项目对照表.md)、CI、`web/package.json` 的 `build:pages` **一致**。

本地预构建（可选）：

```powershell
cd web
pnpm run build:pages
# 或：pnpm build && pnpm preview
```

---

## 换机 / 给后人

1. 打开本仓库根 → 读本文 + [项目对照表.md](./项目对照表.md)。  
2. 只在 `web/` 里 `pnpm install` / `pnpm start`。  
3. 业务在 `web/config`、`web/src`、`web/mock`。

---

## 粘贴模板

```
请按本仓库 README.md 与 项目对照表.md 工作（Ant Design Pro / web/）。

当前项目：D:\dev\projects\digital-marketing
任务：[页面/功能]

约束：
- 工程只改 web/
- 需求/对照分析/表格放根目录 doc/（或自建分类夹），不进 web、默认不进 Git
- 本地 pnpm start 预览，不要自动 push
- 列表 ProTable，表单 ProForm
- 本仓是成熟客户项目，不要在本仓复制模板/再造新项目
```
