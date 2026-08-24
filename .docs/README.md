# `.docs` · 本项目操作手册（先读这里）

换电脑、换项目根目录、或 Git / 对话历史清空后：**从本目录恢复「该怎么做」**，不要猜、不要从别的客户项目硬拷配置。

| 文档 | 用途 |
|------|------|
| [项目对照表.md](./项目对照表.md) | 本仓库中文名 / 英文仓库名 / Demo / `PUBLIC_PATH`（改配置以它为准） |
| [工程手册.md](./工程手册.md) | 目录约定、安装启动、**禁止拷贝 node_modules**、Windows 踩坑、部署步骤 |
| [Windows-pnpm-esbuild-EPERM.md](./Windows-pnpm-esbuild-EPERM.md) | 本机装依赖几乎完成却卡在 `esbuild` rename（EPERM）的现象与处理 |
| [原型指南.md](./原型指南.md) | 从 Ant Design Pro 母版新建客户原型的完整流程（给 AI / 后人） |

## 30 秒结论

1. **唯一工程目录是 `web/`**，安装与启动都在里面做。  
2. **Git 只关心** `web/` + `.docs/` + `.github/`（外加根 `README.md` / `.gitignore`）。`文档/` 等本地资料不进仓库。  
3. **日常只本地改**；只有你明确说「部署 / 推到 GitHub」才 `push main`。  
4. **`node_modules` 是装出来的，禁止整目录拷贝**；用 pnpm + 共享 store。
