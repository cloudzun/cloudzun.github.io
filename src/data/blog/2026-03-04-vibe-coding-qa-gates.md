---
title: 'Vibe Coding 的质量陷阱：为什么你需要 7 个 Gate'
pubDatetime: 2026-03-04T09:00:00+00:00
tags: ['OpenCode', 'Superpowers', 'Vibe Coding', 'AI Engineering', '质量管理', '工作流']
description: '技术博客文章'
---

# Vibe Coding 的质量陷阱：为什么你需要 7 个 Gate

今天我们完成了一次 Vibe Coding 实验，用 OpenCode + Superpowers 框架从零构建了一个电商原型。项目本身不复杂，但过程中暴露出的**质量问题**让我们意识到：Vibe Coding 不是"描述需求，等待奇迹"，它需要一套严格的质量门控流程。

这篇文章不讲项目，讲**方法论**——我们踩了哪些坑，以及我们如何设计了一套 7 Gate 流程来系统性地解决这些问题。

---

## Vibe Coding 的质量幻觉

Vibe Coding 有一个危险的特性：**AI 生成的代码看起来总是很完整**。

它有正确的文件结构，有合理的函数命名，有看起来像样的注释。如果你只是快速扫一眼，很容易觉得"好像没问题"。

但我们这次的实验告诉我们，"看起来没问题"和"真的没问题"之间，有一个很深的沟：

**AI 生成的 927 行代码，经过系统性 review 后发现了 8 个真实问题：**

| 级别 | 问题 | 影响 |
|------|------|------|
| 🔴 Critical | XSS 漏洞：用户输入未转义直接 innerHTML | 安全漏洞，可被利用 |
| 🔴 Critical | localStorage 无异常处理 | 私密/无痕模式直接崩溃 |
| 🔴 Critical | 无效 productId 未验证 | URL 直接访问导致白屏 |
| 🟡 Important | 空购物车可直接访问 checkout | 逻辑错误 |
| 🟡 Important | 数量按钮可快速点击至负数 | 数据异常 |
| 🟡 Important | 未知路由静默失败，无 404 | 用户体验差 |

这些问题不是 AI 偷懒，是**结构性的**：AI 在生成代码时优先保证功能路径，边界条件和安全处理是次要的。如果你不主动检查，它不会主动告诉你。

---

## 我们用了什么工具

### OpenCode + Superpowers

[OpenCode](https://opencode.ai) 是一个本地运行的 AI 编码 agent，支持多模型。我们用的是阿里百炼的 qwen3.5-plus。

[Superpowers](https://github.com/obra/superpowers) 是专为 OpenCode/Claude Code 设计的工作流框架，提供 14 个强制性 skill，核心理念是：**用 HARD-GATE 强制 AI 遵守工作流纪律**。

关键 skill：
- `writing-plans`：生成 2-5 分钟粒度的实现计划
- `subagent-driven-development`：每个任务派发独立 subagent，两阶段 review
- `spec-reviewer`：对比 PRD 逐条验证，要求代码证据
- `code-quality-reviewer`：安全/崩溃/边界全面检查
- `systematic-debugging`：4 阶段根因分析，铁律：没找到根因不能提修复方案
- `verification-before-completion`：完成前必须运行验证命令

### oh-my-opencode（OmO）

我们还从 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) 移植了若干最佳实践到 `AGENTS.md`：IntentGate（意图确认）、Prometheus 规划模式、Anti-patterns 规则、Context 保护规则。

---

## 三个关键发现

### 发现 1：Superpowers 的 HARD-GATE 对不同模型效果不同

Superpowers 是为 Claude 设计的。Claude 对 HARD-GATE 的遵守非常严格——它会真的停下来，等你确认，再继续。

Qwen 不一样。Qwen 理解 HARD-GATE，但在执行压力下会走捷径。我们的 subagent-driven-development 应该在每个 task 后触发两阶段 review，但 Qwen 把它简化成了 `• Implement → ✓ Implement`，review 步骤消失了。

**结论**：不能依赖模型自觉遵守流程。Gate 需要由架构师（人）来把关。

### 发现 2：spec-reviewer 和 code-quality-reviewer 是两个完全不同的检查

很多人以为"功能验收"就够了。不够。

- **spec-reviewer** 回答的是：代码是否实现了需求？（功能层面）
- **code-quality-reviewer** 回答的是：代码是否安全、健壮、不会崩溃？（质量层面）

我们这次的 XSS 漏洞和 localStorage 崩溃，在 spec review 里不会出现——因为功能是"实现了"的。只有 code quality review 才能发现这类问题。

**这两个 Gate 缺一不可，而且顺序不能颠倒。**

### 发现 3：brainstorming skill 与 `opencode run` 不兼容，但这不是问题

Superpowers 的 brainstorming skill 设计的是交互式问答，但 `opencode run` 是单次执行，每次都是新 session，无法保持上下文连续性。

我们最初以为这是个大问题，后来发现：**对于架构师驱动的工作方式，这根本不是问题**。

brainstorming 的目的是帮你探索需求。但如果你是架构师，需求分析是你自己做的，你不需要 AI 来问你。你需要的是把你的分析结果固化为文档（BRIEF.md），然后让 AI 按文档执行。

这实际上是更好的工作方式：决策有文档记录，不会随 session 消失，也便于后续迭代时回溯。

---

## 7 Gate 标准流程

基于以上发现，我们设计了一套 7 Gate 流程，核心原则是：**Gate 由架构师把关，不依赖模型是否自觉遵守**。

```
[GATE 0] BRIEF 确认        ← 需求文档化，范围锁定
      ↓
[GATE 1] 实现计划确认      ← 2-5分钟粒度，每task有验证方法
      ↓
[GATE 2] 执行              ← 每task完成后立即运行验证命令
      ↓
[GATE 3] 结构验收          ← 文件存在、无语法错误、git历史
      ↓
[GATE 4] Spec Review       ← 逐条对比BRIEF，找代码证据
      ↓
[GATE 5] Code Quality      ← 安全/崩溃/边界，CRITICAL不能上线
      ↓
[GATE 6] 修复验证          ← 根因优先，修复后重验
      ↓
[GATE 7] 部署              ← 线上验证核心流程
```

### GATE 0 — BRIEF 确认

把需求分析结果固化为 `docs/briefs/YYYY-MM-DD-<feature>.md`：

```markdown
## 目标
[一句话描述]

## 功能范围
### 在范围内
- [ ] 功能 A
### 明确排除
- 不做 X（原因）

## 技术约束
- 语言/框架限制
- 不能动的文件/接口

## 验收标准
- [ ] 标准 1（可测量）
- [ ] 标准 2（可测量）
```

**Gate 通过条件**：你确认范围清晰，验收标准可测量。

---

### GATE 1 — 实现计划确认

```bash
opencode run "Read docs/briefs/BRIEF.md and use writing-plans skill. Output to docs/plans/PLAN.md"
```

每个 task 格式：
```markdown
## Task N: <动词 + 名词>
- 输入：依赖哪些文件/接口
- 输出：创建/修改哪些文件
- 验证：如何确认这个 task 完成了
- 预计时间：X 分钟
```

**Gate 通过条件**：每个 task ≤ 5 分钟，有明确验证方法，你确认计划覆盖了 BRIEF 所有功能。

---

### GATE 2 — 执行

```bash
opencode run "Execute Task N from PLAN.md. After completion, run the verification command and report results."
```

**铁律**：每个 task 完成后必须运行验证命令，不能说"应该好了"。

---

### GATE 3 — 结构验收（5 分钟）

```bash
opencode run "Use verification-before-completion skill. Check: all files exist, no syntax errors, git history correct. PASS/FAIL with evidence."
```

---

### GATE 4 — Spec Review ⭐

```bash
opencode run "Use spec-reviewer skill. Read BRIEF.md. For each requirement, find exact code evidence (file:line). Be skeptical — the implementer may have missed edge cases."
```

输出格式：
```
### REQ-1: [需求描述]
- Status: ✅ VERIFIED
- Evidence: js/router.js:45-67
- Notes: -

### REQ-2: [需求描述]
- Status: ❌ MISSING
- Action Required: Implement X
```

**Gate 通过条件**：所有需求都有代码证据，无 MISSING 项。

---

### GATE 5 — Code Quality Review ⭐⭐

```bash
opencode run "Use code-quality-reviewer skill. Focus on: security vulnerabilities (XSS, injection), crash scenarios (null/undefined, missing error handling), edge cases (empty state, invalid input). Rate CRITICAL/IMPORTANT/MINOR with file:line."
```

**必查清单**：

| 类别 | 检查点 |
|------|--------|
| 安全 | innerHTML 是否转义用户输入 |
| 安全 | 外部数据是否验证 |
| 崩溃 | localStorage 是否有 try/catch |
| 崩溃 | 数组/对象访问前是否检查存在性 |
| 崩溃 | 路由是否有 404 fallback |
| 边界 | 空状态是否处理 |
| 边界 | 数值输入是否有范围限制 |

**Gate 通过条件**：无 CRITICAL 问题。

---

### GATE 6 — 修复验证

```bash
opencode run "Use systematic-debugging skill. Fix: [issues]. Root cause first, then fix, then verify. Check for similar issues in related code."
```

**systematic-debugging 铁律**：没找到根因，不能提修复方案。

---

### GATE 7 — 部署

```bash
gh repo create <repo> --public --source=. --remote=origin --push
vercel --prod
# 手动验证线上核心流程
```

---

## 重构/迭代的额外要求

重构比新建更危险，因为有现有代码需要保护。额外要求：

1. **在 BRIEF 中明确列出"不能改变的行为"**（regression 基准）
2. **如果没有测试，在 BRIEF 中写出手动验证的核心流程**
3. **重构后额外检查**：所有"不能改变的行为"仍然正常，接口兼容性未破坏

---

## 什么时候可以跳过 Gate？

**可以跳过 Gate 0-1 的情况**：
- 单文件改动
- 需求明确，无歧义
- 无安全影响

**永远不能跳过的 Gate**：
- Gate 5（Code Quality Review）：任何涉及用户输入或外部数据的改动
- Gate 6（修复验证）：有 CRITICAL 问题时

---

## 总结

Vibe Coding 的本质变化是：**执行层交给了 AI，但架构层和质量层仍然是人的责任**。

这套 7 Gate 流程的核心不是限制 AI，而是**让架构师在正确的时间点介入**——在需求漂移之前确认 BRIEF，在代码生成后验证 Spec，在上线前检查 Quality。

AI 会生成看起来很完整的代码。你的工作是确认它真的完整。

---

## 资源

- **本文对应的项目**：[vibe-ecommerce](https://github.com/cloudzun/vibe-ecommerce) | [线上演示](https://vibe-ecommerce-seven.vercel.app)
- **7 Gate 完整规范**：[VIBE-WORKFLOW.md](https://github.com/cloudzun/vibe-ecommerce/blob/master/VIBE-WORKFLOW.md)（实际上在 clawd workspace，链接仅供参考）
- **Superpowers**：https://github.com/obra/superpowers
- **oh-my-opencode**：https://github.com/code-yeongyu/oh-my-opencode
- **OpenCode**：https://opencode.ai
