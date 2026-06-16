# 后端指南

后端位于 `server` 目录中，使用 Express 应用和 SQLite 进行持久化。

## 入口点

- [`server/index.ts`](../server/index.ts) 启动服务器、加载用户设置并启动同步等后台服务。
- [`server/app.ts`](../server/app.ts) 配置 Express、注册中间件并附加各种路由控制器。

## 结构

- [`server/controllers`](../server/controllers) - 功能的路由处理器，如任务、笔记、闪卡等。
- [`server/services`](../server/services) - 业务逻辑工具，包括 `syncService.ts` 中的同步逻辑和 `dataService.ts` 中的数据助手。
- [`server/repositories`](../server/repositories) - 包装 SQLite 查询的数据访问模块。
- [`server/migrations`](../server/migrations) - 启动时执行的模式迁移。
- [`server/middleware`](../server/middleware) - 安全功能，如请求限制和清理。
- [`server/lib`](../server/lib) - 共享库，如用于 API 文档的 `swagger.js` 和日志助手。

## 控制器和路由

[`server/controllers`](../server/controllers) 中的每个模块注册一组 REST 端点。例如，`notes.ts` 管理笔记的 CRUD 操作，而 `timers.ts` 公开计时器同步。`server/app.ts` 将这些控制器挂载在 `/api` 路径下。

## 服务和仓库

`server/services` 包含特定领域的逻辑，如 [`syncService.ts`](../server/services/syncService.ts) 中的同步引擎。数据访问通过仓库模块抽象，这些模块通过 `better-sqlite3` 发出 SQL 查询。

## 数据库和迁移

SQLite 数据库位于 `server/data` 中，并由 [`server/lib/db.ts`](../server/lib/db.ts) 初始化。模式迁移位于 [`server/migrations`](../server/migrations) 中，并在启动时自动运行。有关表的详细信息，请参阅 [数据库指南](database.md)。

## 后台任务

后台服务处理同步和清理等周期性任务。它们在 Express 应用初始化后在 [`server/index.ts`](../server/index.ts) 中启动。

## 测试

后端逻辑由 Vitest 测试覆盖，与 [`tests`](../tests) 目录中的前端测试一起。运行 `npm test` 执行测试套件。

要了解此服务器如何与客户端集成，请查看 [架构概述](architecture.md) 或 [前端指南](frontend.md)。