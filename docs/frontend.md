# 前端指南

前端位于 `src` 目录中，使用 React 18、TypeScript 和 Vite 构建。Tailwind CSS 和 Shadcn UI 组件提供样式和 UI 原语。

## 入口点

- [`src/main.tsx`](../src/main.tsx) 引导应用并挂载 `<App />`。
- [`src/App.tsx`](../src/App.tsx) 设置路由和共享布局元素。

## 关键文件夹

- [`src/components`](../src/components) - 可重用的 UI 组件，如 [`Navbar.tsx`](../src/components/Navbar.tsx) 和 [`MarkdownEditor.tsx`](../src/components/MarkdownEditor.tsx)。
- [`src/pages`](../src/pages) - 路由组件；每个页面代表一个顶级功能，如任务、笔记或番茄钟。
- [`src/hooks`](../src/hooks) - 用于共享逻辑的自定义 React hooks。
- [`src/providers`](../src/providers) - 用于主题或查询客户端等状态的上下文提供者。
- [`src/stores`](../src/stores) - 用于全局状态的 Zustand 存储。
- [`src/locales`](../src/locales) - `react-i18next` 消费的德语和英语翻译文件。
- [`src/utils`](../src/utils) 和 [`src/lib`](../src/lib) - 辅助函数和抽象。
- [`src/shared`](../src/shared) - 共享工具和类型。

## 路由

路由在 [`src/App.tsx`](../src/App.tsx) 中使用 `react-router-dom` 配置。顶级页面位于 [`src/pages`](../src/pages)，导航链接在 [`src/components/Navbar.tsx`](../src/components/Navbar.tsx) 中定义。

## 状态管理

本地状态由 Zustand 存储处理。例如，[timers store](../src/stores/timers.ts) 将计时器状态持久化到本地存储，并通过 [TimersProvider](../src/providers/TimersProvider.tsx) 同步到服务器。服务器状态和缓存由 `@tanstack/react-query` 通过 [`src/providers`](../src/providers) 中的上下文提供者提供。

## 样式和主题

Tailwind CSS 提供实用类和设计令牌。Shadcn UI 组件提供可访问的原语。主题定义位于 [`src/lib/themes.ts`](../src/lib/themes.ts)，并通过设置提供者公开，以便用户可以在运行时切换外观。

## 国际化

所有面向用户的文本来自 [`src/locales`](../src/locales) 下的翻译文件。`react-i18next` 加载德语和英语 JSON 字典，并提供 `useTranslation` 等 hooks。

## 测试

Vitest 与 `@testing-library/react` 一起覆盖单元和组件测试。测试文件位于 [`tests`](../tests) 目录中，通过 `npm test` 运行。

要更全面地了解前端如何与服务器通信，请参阅 [架构概述](architecture.md) 或跳转到 [后端指南](backend.md)。