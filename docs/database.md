# 数据库指南

后端使用位于 `server/data/data.db` 的 SQLite 数据库。模式由 [`server/lib/db.ts`](../server/lib/db.ts) 在服务器启动时创建和验证。

## 核心表

- **`tasks`** - 存储单个任务，包含优先级、截止日期和重复信息等元数据。
- **`recurring`** - 生成即将到来实例的模板任务。
- **`notes`** - 自由格式笔记，可选分类和置顶。
- **`decks`/`flashcards`** - 间隔重复学习数据。
- **`habits`** - 带有完成跟踪的重复习惯。

`tasks` 表定义展示了描述单个任务可用的广泛字段：

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  priority TEXT,
  color INTEGER,
  completed INTEGER,
  status TEXT,
  categoryId TEXT,
  parentId TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  dueDate TEXT,
  isRecurring INTEGER,
  recurrencePattern TEXT,
  lastCompleted TEXT,
  nextDue TEXT,
  dueOption TEXT,
  dueAfterDays INTEGER,
  startOption TEXT,
  startWeekday INTEGER,
  startDate TEXT,
  startTime TEXT,
  endTime TEXT,
  orderIndex INTEGER,
  pinned INTEGER,
  recurringId TEXT,
  template INTEGER,
  titleTemplate TEXT,
  customIntervalDays INTEGER,
  visible INTEGER
);
```

## 迁移

迁移位于 [`server/migrations`](../server/migrations) 中，由 [`MigrationRunner`](../server/migrations/migrationRunner.ts) 管理。新的迁移脚本向运行器注册自己，并在启动时按顺序执行。运行器还在 `server/data/migrations.json` 中记录应用的版本，以避免重新运行迁移。

## 备份和数据文件

在 `server/data` 下创建 `backups` 目录用于数据快照。保留旧的 JSON 数据文件以保持兼容性，但新开发应通过仓库层与 SQLite 数据库交互。