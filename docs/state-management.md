# 状态管理

本项目评估了用于全局状态处理的不同库。Redux Toolkit 提供强大的工具，但会引入样板代码。Zustand 提供最小化的 API、较低的学习曲线，并且与 React 的 hooks 配合良好。

我们标准化使用 **Zustand** 进行客户端状态管理：

- 存储位于 [`src/stores`](../src/stores)。
- 持久化或同步数据的上下文提供者位于 [`src/providers`](../src/providers)。
- 组件和 hooks 直接导入存储，例如 `import { useTimers } from "@/stores/timers"`。

现有的本地存储已迁移到此结构中。新的全局状态应遵循相同的模式。