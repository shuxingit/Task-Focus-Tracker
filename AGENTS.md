# 🧠 AGENTS.md – AI 代理指南

此文件用作自动化代理（例如 Codex）如何与本项目交互的指南。它描述了公约、工作流程和无缝集成的关键要求。

---

## 1. 项目概览

- **前端**: React + Vite, TypeScript, Tailwind CSS, Shadcn UI
- **后端**: Node.js (ES Modules) 以及 SQLite
- **结构**:
  - `/src` → 前端 (React/TS)
  - `/server` → 后端 (Node.js + SQLite)
  - `/public` → 静态资源
  - `Dockerfile`, `docker-compose.yml` → 容器设置

- **主要功能**:
  - 任务管理，包含分类、子任务和重复执行
  - 任务和笔记可以被置顶（主页最多三个）
  - 日历视图和任务统计
  - 带有 Markdown 预览和拖放功能的笔记
  - 带有间隔重复（Spaced-Repetition）、卡组管理和统计页面的闪卡（Lernkarten）
  - 通过命令面板 (`Strg+K`) 进行全局搜索
  - 带有历史记录和独立统计的番茄钟
  - 数据导出/导入和多个主题预设

---

## 2. 设置与开发

```bash
npm run dev           # 前端 (Vite) 位于端口 8080
npm start             # 后端 (Node.js) 位于端口 3002
```

---

## 3. Docker 支持

```bash
docker-compose up --build
```

- SQLite 数据存储在 `./server/data` 下并作为卷（Volume）挂载。

---

## 4. 代码公约

- **前端**: TypeScript (`.tsx`, `.ts`)
- **后端**: JavaScript (ES Modules, `.js`)
- **格式化**: 2 个空格，结尾加分号。提交前运行 `npm run format`，并使用 `npm run format:check` 进行检查。

---

## 5. 导航与功能集成

- 新功能如果足够大，**应当**集成到**导航栏**中。
- 导航栏位于 `src/components/Navbar.tsx`。
- 链接通过 React Router 配置。
- 如果产生新文本，**必须**在 `translation.json` 文件中以德语 (de) 和英语 (en) 两种语言创建并引入。
- 功能和特性应当是可配置的，因此调整项应当在设置页面中获得设置项。
- 新的图形元素应当与主题关联，从而使用现有颜色，或者在有全新事物的情况下，在设置的主题选项下创建新的调整设置。

---

## 6. 文档与 README

- 发生**重大变更**时（例如新功能、API 结构、新命令），请**更新 README.md**。
- 应当记录新的环境变量和安装指南。

---

## 7. Commit 与 PR 指南

- 提交信息使用**英语**，清晰且有意义。
- 描述修改了**什么**以及**为什么**修改。
- Pull Requests 应当包含可追溯的更改（包括 UI 更新时的截图）。

---

## 8. 维护与扩展

- 此文件可根据需要进行扩展。
- 子目录可以使用各自的 AGENTS.md 来设置特定规则。