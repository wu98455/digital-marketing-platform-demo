# 数字营销平台

基于 [Ant Design Pro v6](https://github.com/ant-design/ant-design-pro) **simple 精简版**（Umi Max 4 + ProComponents v3）的客户原型项目。

## 项目信息

| 项 | 值 |
|---|---|
| 本地路径 | `D:\dev\projects\数字营销平台` |
| GitHub 仓库名 | `digital-marketing-platform-demo` |
| Demo（部署后） | https://wu98455.github.io/digital-marketing-platform-demo/ |
| 演示账号 | `demo / 123456` 或 `admin / ant.design` |

详细对照见 `项目对照表.md`。

## 本地开发

```powershell
cd D:\dev\projects\数字营销平台
pnpm install
pnpm start
```

浏览器打开 http://localhost:8000

## 部署 GitHub Pages

仅在明确需要上线时执行：

```powershell
pnpm run build:pages
```

推送 `main` 分支后，GitHub Actions 会自动部署（需先创建远程仓库并开启 Pages）。
