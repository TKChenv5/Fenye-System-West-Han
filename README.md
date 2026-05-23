# 西汉分野体系

一个基于静态前端实现的交互式可视化项目，用来展示西汉分野体系、二十八宿映射关系、州郡对应关系，以及天球与地图的联动浏览体验。

## 在线访问

- GitHub Pages: https://tkchenv5.github.io/Fenye-System-Western-Han/

## 项目内容

- 以长安为观测中心展示星宿与州郡的方向关系
- 提供地图、连线、州郡标签与信息面板交互
- 集成 VirtualSky 天球视图，支持地图与天穹联动
- 提供中英双语界面切换
- 使用 GitHub Actions 自动部署到 GitHub Pages

## 技术结构

- `index.html`: 站点主入口
- `css/`: 页面样式
- `js/main.js`: 地图交互、数据处理、联动逻辑
- `js/translate.js`: 中英双语文案
- `data/`: GeoJSON、底图和辅助图片资源
- `.github/workflows/deploy-pages.yml`: GitHub Pages 自动部署工作流

## 本地预览

项目依赖静态资源请求，不能直接双击 HTML 文件预览，建议使用任意静态文件服务器启动项目目录，例如：

- VS Code Live Server
- 其他本地静态服务工具

## 部署方式

仓库默认通过 GitHub Actions 自动部署：

- 推送到 `main` 分支后会触发 Pages 工作流
- Pages 构建方式为 `workflow`
- 发布内容为仓库根目录中的静态站点文件

## 当前仓库说明

- 当前线上主入口是 `index.html`
- 站点资源均通过相对路径加载，适合 GitHub Pages 子路径托管