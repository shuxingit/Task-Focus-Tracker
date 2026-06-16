# 架构概述

Total-Task-Tracker 由 TypeScript/React 前端和 Node.js 后端组成，通过 HTTP 进行通信。

- **前端 (`/src`)** - 使用 Vite 和 React 18 构建。样式使用 Tailwind CSS 和 Shadcn UI 组件。
- **后端 (`/server`)** - 一个用 TypeScript 编写的 Express 应用。数据通过 `better-sqlite3` 库持久化到 SQLite。
- **静态资源 (`/public`)** - 直接由服务器提供的图像、图标和其他文件。

后端通过 [`server/controllers`](../server/controllers) 中的控制器模块公开 REST 端点。`server/app.ts` 将这些控制器注册到 Express，而 `server/index.ts` 启动服务器并配置同步和设置加载等服务。

前端使用标准的 `fetch` 请求与后端通信，并使用 Zustand 存储管理状态。导航链接在 [`src/components/Navbar.tsx`](../src/components/Navbar.tsx) 中定义，并通过 React Router 进行路由。

数据库文件位于 `server/data` 下，模式变更通过 [`server/migrations`](../server/migrations) 中的迁移文件管理。

## 数据流

浏览器中的用户交互触发组件状态更新和 `fetch` 请求。
后端将这些请求路由到控制器，控制器在访问 SQLite 数据库之前委托给服务层和仓库层。
更改被持久化，并且在需要时，`syncService` 等后台服务通知客户端刷新其状态。

## 构建与部署

开发期间运行 `npm run dev` 启动 Vite 服务器，运行 `npm start` 启动 Express API。
`npm run build` 生成生产就绪的捆绑包，后端可以提供服务。
提供了 `Dockerfile` 和 `docker-compose.yml` 用于容器部署。

## 相关指南

有关堆栈各方面的详细信息，请参阅 [前端指南](frontend.md)、[后端指南](backend.md) 和 [数据库指南](database.md)。