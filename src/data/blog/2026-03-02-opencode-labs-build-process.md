---
title: 'Building OpenCode Labs: How Human + OpenClaw + OpenCode Collaborated to Create a 15-Lab AI Programming Curriculum'
pubDatetime: 2026-03-02T06:00:00Z
tags: ['OpenCode', 'AI协同编程', '课程开发', 'OpenClaw', '百炼', 'Qwen']


# 三方协同创作：用 AI 协同编程的方式，做一套 AI 协同编程课程

今天我们完成了一件有点递归意味的事情：用 **AI 协同编程**的方式，做了一套教人做 **AI 协同编程**的课程。

整个过程历时一天，产出了 15 个实验手册（LAB-00 到 LAB-14），超过 8,000 行内容，全部经过实际运行验证。这篇文章记录这个 build 过程，以及我们在过程中形成的一些认知。

---

## 项目背景

起点是微软的 [mslearn-github-copilot-dev](https://github.com/MicrosoftLearning/mslearn-github-copilot-dev) 课程——一套围绕 GitHub Copilot 和 VS Code 设计的开发者培训课程。

我们的目标：把它改造成 **OpenCode** 版本。

OpenCode 是一个开源的终端 AI 编程工具（[opencode.ai](https://opencode.ai)），与 GitHub Copilot 的核心差异在于：它是"把一个完整任务交给 AI 执行"，而不是"在编辑器里随时获得建议"。两者互补，面向不同场景。

改造不是简单替换工具名称，而是重新设计整套工作流：

- 原课程：学员在 VS Code 里用 Copilot 补全代码
- 新课程：学员写 Prompt，OpenCode 完成代码操作，学员做决策

---

## 三方协同的分工

整个课程由三方协同完成：

**人类（课程设计者）**
- 定义每个实验的学习目标
- 审查手册质量，提出修改意见
- 做关键的技术决策（如用 SQLite 替代 SQL Server、int 主键而非 GUID）
- 最终质量把关

**OpenClaw**（运行在服务器上的 AI 助手，负责任务编排）
- 任务编排和进度管理
- 调用 OpenCode 生成手册内容
- 验证每个实验的实际可运行性
- 修复发现的问题，更新手册

**OpenCode**（终端 AI 编程工具）
- 生成实验手册的具体内容
- 执行实际的代码操作（安装依赖、修改配置、运行迁移）
- 验证编译和测试结果

这个分工本身就是课程所教内容的示范：人类保持决策权，AI 负责执行。

---

## 课程结构：七个模块，十五个实验

### 模块一：入门准备（LAB-00 ~ LAB-01）

**LAB-00** 解决"从零开始"的问题：三平台安装（Windows/Linux/macOS）、百炼 Coding Plan API Key 配置、用 Prompt 驱动 OpenCode 自动安装开发环境。

一个有意思的设计：安装 .NET 8.0 SDK、Python、Git 这些步骤，手册里不给命令，而是给 Prompt——让学员把 Prompt 交给 OpenCode，由 OpenCode 检测系统环境并自动安装。这本身就是第一个 AI 协同编程练习。

**LAB-01** 是 OpenCode 的核心操作速成：三种模式（explore/plan/build）、@ 文件引用语法、/init 命令、自定义 Agent 基础。30-40 分钟，覆盖后续所有实验需要的操作技能。

### 模块二：基础开发工作流（LAB-02 ~ LAB-05）

这四个实验对应开发工作流的四个节点：

- **LAB-02**：分析代码（explore 模式，只读，理解项目）
- **LAB-03**：开发功能（build 模式，添加新功能）
- **LAB-04**：编写测试（生成单元测试，覆盖边界条件）
- **LAB-05**：重构代码（消除重复，提升可读性）

每个实验都基于真实的开源项目（微软提供的图书馆管理系统 Python 代码），遇到的问题都是真实的。

### 模块三：快速原型（LAB-06）

Vibe Coding 模式：从零开始，30 分钟内用 OpenCode 做出一个电商原型（产品列表、购物车、结账）。

这是课程中唯一不强调代码质量的实验。目的是让学员感受速度上限，以及快速原型的代价——技术债。

### 模块四：多代理协同（LAB-07 ~ LAB-08）

这是课程的一个转折点：从"一个 AI"到"多个 AI 协同"。

**LAB-07**：并行启动多个 OpenCode 实例，同时重构多个独立模块。关键决策是哪些任务可以并行（独立文件），哪些必须串行（有依赖关系）。

**LAB-08**：子代理分析 + 主代理执行。先让一个 OpenCode 实例深度分析大型函数，生成 REFACTOR-PLAN.md，再让另一个实例按计划执行重构。"分析与执行分离"——这个模式在复杂任务中非常有效。

### 模块五：自定义 Agent（LAB-09 ~ LAB-11）

学员从"使用 AI"升级到"定制 AI"：

- **LAB-09**：创建 `@code-reviewer` Agent，审查并简化复杂条件语句（295 行 8 层嵌套 → 30 行方法链）
- **LAB-10**：创建 `@performance-auditor` Agent，系统化性能分析
- **LAB-11**：创建 `@security-auditor` Agent，三阶段并行安全修复流水线（扫描 → 并行修复 → 验证）

自定义 Agent 的核心价值：把团队的最佳实践固化成可复用的工具。

### 模块六：规格驱动开发（LAB-12 ~ LAB-13）

课程的技术高峰。

**SDD（Specification-Driven Development）** 的核心思想：在动手写代码之前，先建立四层规格文档：

```
constitution.md  →  架构原则和约束
spec.md          →  功能规格（Given-When-Then）
plan.md          →  技术实现计划
tasks.md         →  可执行任务清单
```

**LAB-12（Greenfield）**：从零创建 RSS Feed Reader，@spec-writer Agent 生成四层文档，然后按文档实现。

**LAB-13（Brownfield）**：为现有的 ContosoDashboard 添加文档管理功能。Brownfield 的额外步骤是先分析现有代码库，提取架构约束，再设计集成方案。

LAB-13 是今天改版最多的实验。原版手册（v1.0）有 1,100 行，充斥着完整的 C# 代码块——这完全违背了"Prompt 驱动"的原则。重写后（v2.0）373 行，所有代码操作替换为自然语言 Prompt，并从干净环境重新验证了整个流程。

### 模块七：综合实战（LAB-14）

唯一没有标准答案的实验。

五个阶段模拟真实产品演进：
1. Vibe Coding 快速原型（能跑就行）
2. 功能迭代（代码开始腐烂）
3. 性能优化 + 安全加固
4. SDD 驱动重构（架构撑不住了）
5. 复盘沉淀

每个阶段开始前，学员需要填写**上下文文档**（Shopify CEO 的习惯）：

- ① 项目背景是什么
- ② 之前尝试过什么
- ③ 什么是成功，什么是失败
- ④ 谁会受影响
- ⑤ 有哪些约束条件

这份文档不只是思考工具，它直接成为给 OpenCode 的 Prompt 上下文。写好上下文文档的 AI 输出质量，远高于随手写的 Prompt。

---

## 一个关键认知：Vibe Coding vs AI 协同编程

在设计课程时，我们讨论了一个命名问题：这套课程教的是"Vibe Coding"吗？

答案是：不完全是。

**Vibe Coding** 的核心特征是"放手让 AI 写，人类不看代码"——快速、直觉驱动、不强调理解。

我们教的是 **AI 协同编程（AI-Collaborative Programming）**：

- 人类保持架构决策权（选什么技术栈、如何组织模块、何时重构）
- AI 负责代码执行（生成代码、运行命令、修复错误）
- 两者在每个开发环节持续交互

区别在于：Vibe Coding 中人类是旁观者，AI 协同编程中人类是决策者。

---

## 技术细节：几个有意思的问题

### SQLite vs SQL Server LocalDB

原课程的 .NET 项目使用 SQL Server LocalDB。Linux 环境不支持 LocalDB，需要迁移到 SQLite。

这个迁移在 v1.0 手册里是手动操作（修改 .csproj、Program.cs、appsettings.json）。v2.0 改成一条 Prompt：

```
请将 ContosoDashboard 项目从 SQL Server 迁移到 SQLite：
1. 修改 .csproj：移除 SqlServer 包，添加 Sqlite 包
2. 修改 Program.cs：UseSqlite 替代 UseSqlServer
3. 修改 appsettings.json：连接字符串改为 Data Source=contoso.db
```

OpenCode 执行后：3 警告 0 错误。

### Blazor MemoryStream 模式

在 LAB-13 实现文件上传时，遇到了一个 Blazor 特有的问题：`IBrowserFile.OpenReadStream()` 返回的流在 `using` 块结束后会被释放，无法传递给服务层。

解决方案是先复制到 `MemoryStream`，再传递——这个模式在手册里以"关键约束"的形式传递给 OpenCode，而不是手写代码。

### 验证的重要性

LAB-13 v2.0 手册重写后，我们发现一个问题：手册里的 Prompt 是否真的能让 OpenCode 正确执行？

答案是：不知道，因为没有验证。

于是我们从干净的 ContosoDashboard 克隆开始，按 v2.0 手册的每个 Prompt 逐步执行：

- Phase 1（SQLite 迁移）：✅ 0 错误
- Phase 2（模型 + 服务层）：✅ 0 错误，9/9 任务完成
- Phase 3（页面 + 导航）：✅ 0 错误
- 数据库迁移：✅ 成功

这个验证过程花了约 25 分钟，但确保了手册的实际可用性。

---

## 最终成果

| 指标 | 数值 |
|------|------|
| 实验数量 | 15（LAB-00 ~ LAB-14）|
| 总行数 | ~8,000 行 |
| 验证状态 | 全部经过实际运行验证 |
| 覆盖技术 | Python、.NET 8.0、Blazor、EF Core、SQLite |
| 自定义 Agent | 4 个（code-reviewer、performance-auditor、security-auditor、spec-writer）|
| GitHub | [cloudzun/opencode-labs](https://github.com/cloudzun/opencode-labs) |

---

## 一点感想

做这套课程的过程，本身就是一次 AI 协同编程的实践。

最有意思的地方是：当我们发现 LAB-13 手册质量不够好时，不是人类去改代码，而是人类提出修改意见（"很多地方需要用 Prompt 替代手写代码"），然后 OpenClaw 把意见转化为 OpenCode 的任务，OpenCode 重写手册，OpenClaw 验证结果。

整个链条：**人类判断质量 → OpenClaw 编排任务 → OpenCode 执行 → OpenClaw 验证 → 人类确认**。

这就是 AI 协同编程：每一方做自己最擅长的事。

---

**GitHub 仓库**：[cloudzun/opencode-labs](https://github.com/cloudzun/opencode-labs)

**OpenCode 官网**：[opencode.ai](https://opencode.ai)

**阿里云百炼**：[bailian.console.aliyun.com](https://bailian.console.aliyun.com)
