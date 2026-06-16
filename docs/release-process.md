# 🚀 Total-Task-Tracker 发布流程

本指南说明如何为 Total-Task-Tracker 创建新的生产版本和测试版本（Beta）。

## 📋 概述

### 分支结构

- **`main`** - 开发分支（功能集成）
- **`beta`** - Beta 测试分支（稳定功能）
- **`production`** - 生产分支（仅包含生产就绪功能）

### 发布类型

- **🧪 Beta 发布** - 用于测试和反馈
- **🚀 生产发布** - 稳定的生产就绪版本

---

## 🧪 创建 Beta 发布

### 步骤 1：功能开发

```bash
# 创建功能分支
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 开发 + 测试
git add .
git commit -m "feat: 添加新功能"

# 推送到 main 的 Pull Request
git push -u origin feature/new-feature
gh pr create --base main --title "feat: 新功能"
```

### 步骤 2：合并到 Beta

```bash
# 功能合并到 main 后：
git checkout beta
git pull origin beta

# 创建从 main 到 beta 的 Pull Request
gh pr create --base beta --head main --title "feat: Beta Release - 新功能"
```

### 步骤 3：自动创建 Beta 发布

- 🤖 合并到 `beta` 时自动创建 **Beta 预发布版本**
- 🐳 构建 Docker 镜像：`ghcr.io/timbornemann/total-task-tracker:beta`
- 📋 从 `.github/release-notes.beta.md` 生成发布说明

### Beta 发布示例：

- **标签:** `v1.2.0-beta.1`
- **Docker:** `ghcr.io/timbornemann/total-task-tracker:beta-20241215123045-a1b2c3d`
- **状态:** 预发布（用于测试）

---

## 🚀 创建生产发布

### 步骤 1：Beta 测试通过且稳定

```bash
# 确保 Beta 稳定运行
# 收集反馈并修复 Bug
```

### 步骤 2：准备版本号

版本号自动基于以下规则计算：

#### Commit 消息（Conventional Commits）：

- `feat:` → **次要版本** (1.0.0 → 1.1.0)
- `fix:` → **补丁版本** (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → **主要版本** (1.0.0 → 2.0.0)

#### PR 标签（覆盖 Commit 消息）：

- 标签 `major` → 主要版本
- 标签 `minor` → 次要版本
- 标签 `patch` → 补丁版本

### 步骤 3：生产发布

```bash
# 从 beta 合并到 production
git checkout production
git pull origin production

# 创建从 beta 到 production 的 Pull Request
gh pr create --base production --head beta --title "feat: Production Release v1.2.0" --label minor
```

### 步骤 4：自动发布

合并到 `production` 时：

- 🤖 自动计算新版本号
- 📝 更新 `VERSION` 文件
- 🏷️ 创建 Git 标签（例如 `v1.2.0`）
- 📦 创建 GitHub Release
- 🐳 构建 Docker 镜像：
  - `ghcr.io/timbornemann/total-task-tracker:latest`
  - `ghcr.io/timbornemann/total-task-tracker:1.2.0`

---

## 🔧 热修复（关键修复）

### 针对生产环境中的关键 Bug：

```bash
# 从 production 创建热修复分支
git checkout production
git pull origin production
git checkout -b hotfix/critical-bug

# 实施修复
git add .
git commit -m "fix: 修复关键 Bug"

# 直接推送到 production 的 Pull Request
git push -u origin hotfix/critical-bug
gh pr create --base production --title "hotfix: 关键 Bug" --label patch
```

### 热修复合并后：

```bash
# 将热修复合并回其他分支
git checkout main
git merge production

git checkout beta
git merge production
```

---

## 📊 发布概述

### Beta 发布

| 用途 | 测试、反馈、实验性功能 |
| -------------- | ------------------------------------------ |
| **触发器** | 合并到 `beta` 分支 |
| **Docker 标签** | `beta`, `beta-YYYYMMDDHHMMSS-COMMIT` |
| **GitHub** | 预发布 |
| **稳定性** | ⚠️ 实验性 |

### 生产发布

| 用途 | 稳定的生产就绪版本 |
| ----------------- | ----------------------------------- |
| **触发器** | 合并到 `production` 分支 |
| **版本控制** | 语义化版本控制 (1.2.3) |
| **Docker 标签** | `latest`, `1.2.3` |
| **GitHub** | Release (最新) |
| **稳定性** | ✅ 生产就绪 |

---

## 🐳 使用 Docker 镜像

### 生产环境（推荐）

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:latest
docker run -d --name total-task-tracker -p 3002:3002 \
  -v total-task-tracker-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:latest
```

### 指定版本

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:1.2.0
docker run -d --name total-task-tracker -p 3002:3002 \
  -v total-task-tracker-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:1.2.0
```

### Beta 测试

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:beta
docker run -d --name total-task-tracker-beta -p 3003:3002 \
  -v total-task-tracker-beta-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:beta
```

---

## ⚙️ 工作流配置

### 自动工作流

- **`ci.yml`** - 测试、代码检查、构建（所有分支）
- **`release-on-merge.yml`** - 生产发布（合并到 production 时）
- **`release-on-merge-beta.yml`** - Beta 发布（合并到 beta 时）
- **`docker-build-release.yml`** - Docker 构建（所有发布）
- **`docker-on-beta-release.yml`** - Docker 构建（仅 Beta 发布）

### 自定义发布说明

- **生产:** 编辑 `.github/release-notes.md`
- **Beta:** 编辑 `.github/release-notes.beta.md`

### 手动版本控制

如有必要，可以手动编辑 `VERSION` 文件：

```bash
echo "2.0.0" > VERSION
git add VERSION
git commit -m "chore: manual version bump to 2.0.0"
```

---

## 🔍 故障排除

### 发布失败

1. **检查 CI 测试** - 所有测试必须通过
2. **分支保护** - PR 必须通过所有必需检查
3. **权限** - GitHub Actions 需要 "Read and write permissions"
4. **VERSION 文件** - 必须具有有效格式 (x.y.z)

### Docker 构建问题

1. **依赖项** - `npm ci` 和 `npm run build` 必须正常工作
2. **Dockerfile** - 检查语法和路径
3. **注册表登录** - GitHub Token 必须有效

### Beta/生产冲突

1. **分支同步** - 定期合并分支
2. **合并冲突** - 在发布前解决
3. **测试** - 在生产发布前充分测试 Beta

---

## 📈 最佳实践

### ✅ 应该做

- 功能先合并到 main，然后到 beta，最后到 production
- 在 Beta 阶段进行充分测试
- 使用有意义的 commit 消息
- 发布前更新发布说明
- 重大更新前备份

### ❌ 不应该做

- 绝不要直接推送到 production
- 不要在生产环境中使用未经测试的功能
- 不要在没有主要版本升级的情况下进行破坏性更改
- 不要在发布说明中包含敏感数据

---

## 🎯 发布检查清单

### Beta 发布

- [ ] 功能开发并测试完成
- [ ] PR 已合并到 main
- [ ] Beta 发布说明已更新
- [ ] 创建并合并到 beta 的 PR
- [ ] Beta Docker 镜像已测试
- [ ] 收集 Beta 测试人员的反馈

### 生产发布

- [ ] Beta 已充分测试
- [ ] 所有关键 Bug 已修复
- [ ] 生产发布说明已更新
- [ ] 设置正确的 PR 标签 (major/minor/patch)
- [ ] PR 已合并到 production
- [ ] 生产 Docker 镜像已验证
- [ ] 发布公告已准备

---

_📚 有关更多详细信息，请参阅 [分支策略](branching-strategy.md)_