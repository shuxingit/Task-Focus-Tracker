
---

# 📂 Total-Task-Tracker 项目全文件功能解析

## 1. 根目录 (Root)
根目录主要负责项目配置、环境搭建和整体管理。

| 文件名 | 功能描述 |
| :--- | :--- |
| `start-dev.bat` | **一键启动脚本**。同时启动前端和后端开发环境。 |
| `package.json` | 项目元数据。包含项目依赖包列表和运行脚本（如 `npm run dev`）。 |
| `bun.lockb` | Bun 运行时的依赖锁定文件（确保所有人的库版本一致）。 |
| `docker-compose.yml` | 定义容器化服务，用于一键部署生产环境（含数据库卷挂载）。 |
| `Dockerfile` | 构建 Docker 镜像的说明书。 |
| `AGENTS.md` | AI 代理指南（你刚才汉化的文件），定义代码公约和规则。 |
| `README.md` | 项目自述文件。包含安装说明、功能列表和截图。 |
| `tsconfig.json` | TypeScript 编译配置文件。 |
| `vite.config.ts` | 前端构建工具 Vite 的配置（如端口设置、插件等）。 |

---

## 2. 后端目录 (`/server`)
后端负责数据存储、业务逻辑处理和 API 接口提供。

| 目录/文件 | 功能描述 |
| :--- | :--- |
| `index.ts` / `app.ts` | **后端入口**。初始化服务器（Elysia.js），监听端口，挂载路由。 |
| `repositories/` | **数据仓库层**。直接与数据库（SQLite）交互，写 SQL/ORM 语句。 |
| `services/` | **业务逻辑层**。处理复杂的业务逻辑（如：计算复习算法、处理重复任务逻辑）。 |
| `schemas/` | **数据库模型**。定义 SQLite 表结构（使用 Drizzle ORM）。 |
| `migrations/` | **数据库迁移**。存储数据库表结构的版本记录。 |
| `middleware/` | **中间件**。处理日志记录、错误捕获、请求限流（Rate-limit）等。 |
| `scripts/` | 辅助脚本（如初始化数据库、清理缓存）。 |
| `data/` | **数据库文件存放处**。`.sqlite` 文件通常保存在这里。 |

---

## 3. 前端目录 (`/src`)
前端负责用户界面展示、状态管理和与后端通信。

| 目录/文件 | 功能描述 |
| :--- | :--- |
| `main.tsx` | **前端总入口**。挂载 React 应用到 HTML 页面上。 |
| `App.tsx` | **主组件**。定义路由跳转逻辑（React Router）和全局布局。 |
| `pages/` | **页面级组件**。每个文件夹对应一个页面（Dashboard, Tasks, Settings 等）。 |
| `components/` | **通用 UI 组件**。如按钮、导航栏 (`Navbar.tsx`)、弹窗、进度条等。 |
| `hooks/` | **自定义 Hooks**。处理异步请求（React Query）或共享逻辑。 |
| `stores/` | **全局状态管理**。管理跨页面的数据（如：当前选中的主题、全局任务列表）。 |
| `locales/` | **多语言翻译**。存放 `en.json` 和 `de.json`，**汉化工作的主战场**。 |
| `providers/` | **全局上下文**。包裹整个应用的 Provider（如主题提供者、QueryClient 容器）。 |
| `types/` | **TS 类型定义**。定义任务、分类等数据的 TypeScript 接口。 |
| `utils/` | **工具函数**。格式化日期、计算百分比等通用的 JS 函数。 |
| `shared/` | 前后端共享的类型或常量定义。 |
| `App.css` / `index.css` | 全局样式表（基于 Tailwind CSS）。 |

---

## 4. 关键功能逻辑流 (以“完成任务”为例)

如果你想修改“点击勾选任务”这个功能，你需要关注以下路径：

1.  **UI 触发：** `src/pages/Tasks/` 下的任务组件捕获点击事件。
2.  **前端 Hook：** 调用 `src/hooks/useTasks.ts` 中的更新方法。
3.  **前端通信：** 通过 `src/lib/apiClient.ts` 向后端发送 `PATCH` 请求。
4.  **后端路由：** `server/index.ts` 接收请求并分发给对应的逻辑。
5.  **业务逻辑：** `server/services/task.service.ts` 处理任务状态变更逻辑。
6.  **写入数据：** `server/repositories/task.repository.ts` 执行 SQL 更新 SQLite 数据库。
7.  **实时更新：** 后端通过 SSE（服务器发送事件）通知前端，前端 `src/stores/` 更新状态，页面重新渲染。

---

## 💡 给你的汉化/修改建议：
