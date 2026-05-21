# 西汉分野体系在线站点

这个仓库已经整理为可直接发布到 GitHub Pages 的静态网站。

## 站点入口

- 根首页使用 `index.html`
- 地图数据与样式、脚本全部通过相对路径加载，适合直接托管在仓库子路径下

## 发布到 GitHub Pages

1. 将仓库推送到 GitHub。
2. 保持默认分支为 `main`，或按你的实际默认分支调整工作流触发分支。
3. 在 GitHub 仓库设置中打开 Pages，并将 Build and deployment 设为 `GitHub Actions`。
4. 推送后等待 `Deploy static site to Pages` 工作流完成。

## 本地预览

这个项目需要通过静态文件服务器预览，因为页面会请求 GeoJSON 与图片资源。

可任选一种方式：

- VS Code Live Server
- 任意本地静态服务器工具
- 自己常用的前端开发服务器

## 目录说明

- `index.html`: GitHub Pages 默认首页
- `css/`: 页面样式
- `js/`: 地图交互与中英双语文案
- `data/`: GeoJSON 数据和底图资源