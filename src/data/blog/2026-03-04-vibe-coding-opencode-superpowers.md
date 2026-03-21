---
title: 'Vibe Coding with OpenCode + Superpowers: 一次完整的 AI 驱动电商原型开发实录'
pubDatetime: 2026-03-04T08:00:00+00:00
tags: ['OpenCode', 'Superpowers', 'Vibe Coding', 'AI', '电商', '开发实录']
description: '技术博客文章'
---

# Vibe Coding with OpenCode + Superpowers：一次完整的 AI 驱动电商原型开发实录

今天我们完成了一次完整的 Vibe Coding 实验：用 OpenCode + Superpowers 框架，从零构建一个电商原型应用。整个过程历时约 2 小时，中间踩了不少坑，也验证了一些有趣的结论。这篇文章是对这次实验的完整回顾。

---

## 背景：我们在做什么

**Vibe Coding** 是一种 AI 辅助编程范式——你描述你想要什么，AI 生成代码，你的角色从"写代码"变成"引导、审查、迭代"。

我们的工具链：
- **OpenCode**：本地运行的 AI 编码 agent，支持多模型（我们用的是阿里百炼的 qwen3.5-plus）
- **Superpowers**：一套专为 OpenCode/Claude Code 设计的工作流框架，提供 14 个强制性 skill（brainstorming、writing-plans、subagent-driven-development 等）
- **oh-my-opencode（OmO）**：另一个 OpenCode 增强框架，我们从中移植了若干最佳实践到 AGENTS.md

目标：参考 [Microsoft Learn 的 Vibe Coding Lab](https://github.com/MicrosoftLearning/mslearn-github-copilot-dev/blob/main/Instructions/Labs/LAB_AK_06_vibe_coding_prototype_ecommerce_app.md)，构建一个纯前端电商原型。

---

## 准备工作：增强 OpenCode

在开始写代码之前，我们花了相当时间**增强 OpenCode 的工作方式**。这一步往往被忽视，但它决定了后续开发质量的上限。

### 1. 从 oh-my-opencode 移植最佳实践

我们研究了 OmO 的架构，选择性地把以下内容移植到 `AGENTS.md`：

- **Anti-patterns 规则**：禁止 `as any`、空 catch 块、catch-all 文件等
- **Comment Checker 规范**：删除 AI 风格废话注释，只保留解释"为什么"的注释
- **IntentGate 意图确认**：模糊需求先问清楚，不盲目执行
- **Prometheus 规划模式**：复杂任务先访谈 + 出计划，确认后再动手
- **Context 保护规则**：长任务写检查点，防止 context 压缩丢失进度

同时增强了 `architect-coordinator`，加入了 Category-based 模型路由（quick/coding/deep-reasoning 三类任务对应不同模型）和 Todo Enforcer 监控逻辑。

### 2. 安装 Superpowers

```bash
# Clone 到 OpenCode 配置目录
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers

# 注册插件
mkdir -p ~/.config/opencode/plugins
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js \
      ~/.config/opencode/plugins/superpowers.js

# 链接 skills
mkdir -p ~/.config/opencode/skills
ln -s ~/.config/opencode/superpowers/skills \
      ~/.config/opencode/skills/superpowers
```

安装后 OpenCode 获得 14 个 skill，包括：
- `brainstorming`：需求探索，HARD-GATE 禁止在设计确认前写代码
- `writing-plans`：生成 2-5 分钟粒度的实现计划
- `subagent-driven-development`：每个任务派发独立 subagent，两阶段 review
- `systematic-debugging`：4 阶段根因分析，铁律：没找到根因不能提修复方案
- `verification-before-completion`：完成前必须运行验证命令，不能凭感觉说"好了"

---

## 开发过程：完整流程回顾

### Phase 1：需求确认（brainstorming）

项目基础规格：
- 纯前端：HTML + CSS + JavaScript，无框架，无构建工具
- 4 个页面：Products、ProductDetails、ShoppingCart、Checkout
- 页面间导航、示例数据集、基础样式
- 不含后端、认证、真实支付

我们通过 brainstorming skill 的问答流程确认了关键设计决策：

**Q：导航方式？**  
→ **SPA（单页应用）**。理由：MVP 后续要叠加功能，SPA 的集中状态管理比多页面更易扩展。

**Q：框架？**  
→ **Vanilla JS**。约束条件，无框架。

**Q：业务域？**  
→ 虚构电子/数码产品商店（TechShop）。

> **遇到的问题**：brainstorming skill 的问答模式与 `opencode run` 的单次执行不兼容——每次 run 是独立 session，没有上下文连续性。我们收集了足够信息后，直接跳过剩余问答，一次性把所有设计决策喂给 writing-plans。

### Phase 2：实现计划（writing-plans）

writing-plans skill 生成了一份 2-5 分钟粒度的计划，保存到 `docs/plans/2026-03-04-ecommerce-prototype.md`：

```
Task 1: Create Base HTML Structure
Task 2: Create Product Data (10 products)
Task 3: Create Cart Store with localStorage
Task 4: Create Hash Router
Task 5: Create Header Component
Task 6: Create CSS Styles
Task 7: Create Products Page Component
Task 8: Create Product Detail Component
Task 9: Create Cart Page Component
Task 10: Create Checkout Component
Task 11: Create Main App Initialization
Task 12: Verify All Pages and Navigation
```

文件结构设计：
```
vibe-ecommerce/
├── index.html
├── css/styles.css
├── js/
│   ├── data.js        # 10个商品的mock数据
│   ├── store.js       # 购物车状态 + localStorage
│   ├── router.js      # Hash-based路由
│   ├── utils.js       # 工具函数（escapeHtml等）
│   ├── app.js         # 入口初始化
│   └── components/
│       ├── header.js
│       ├── products.js
│       ├── product-detail.js
│       ├── cart.js
│       └── checkout.js
└── docs/plans/
```

### Phase 3：执行（subagent-driven-development）

OpenCode 按计划逐任务执行，每个任务派发独立 subagent，12 次 commit，927 行代码，约 40 分钟完成。

> **遇到的问题**：subagent-driven-development 规定每个 task 后要有两阶段 review（spec compliance → code quality），但 qwen3.5-plus 在执行时把 review 步骤简化掉了，直接 `• Implement → ✓ Implement`。这是模型执行 Superpowers 流程时的一个已知缺陷——它理解流程，但在资源压力下会跳过非强制步骤。

### Phase 4：验收（三轮检查）

**第一轮：结构验收（verification-before-completion）**

8 项检查全部 PASS：文件结构、HTML script 标签、商品数据、路由注册、localStorage 操作、组件导出、Git 历史、代码行数。

**第二轮：Spec Review（对比 PRD 逐条验证）**

这是 Superpowers 的核心价值之一。spec-reviewer 的铁律：

> "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic. You MUST verify everything independently."

10 项 PRD 需求逐条对比，每条附 file:line 证据，全部 PASS。

**第三轮：Code Quality Review**

这轮发现了真实问题：

| 级别 | 问题 | 位置 |
|------|------|------|
| 🔴 Critical | XSS 漏洞（用户输入未转义直接 innerHTML） | checkout.js:88-97, products.js:28 |
| 🔴 Critical | localStorage 无异常处理，私密模式崩溃 | store.js:5-6 |
| 🔴 Critical | 无效 productId 导致页面崩溃 | product-detail.js:39 |
| 🟡 Important | 空购物车可直接访问 checkout | - |
| 🟡 Important | 数量按钮可快速点击至负数 | cart.js |
| 🟡 Important | 未知路由静默失败，无 404 页面 | router.js |

**第四轮：修复（systematic-debugging）**

OpenCode 按 systematic-debugging skill 的流程修复了全部 8 个问题：
- 新建 `js/utils.js`，实现 `escapeHtml()` 工具函数
- 所有 innerHTML 渲染点统一使用 `escapeHtml()`
- localStorage 操作加 try/catch + 内存 fallback
- 路由加 404 处理，商品详情加存在性验证
- 购物车数量加 `Math.max(1, quantity)` 限制

---

## 部署

```bash
# 推到 GitHub
gh repo create vibe-ecommerce --public --source=. --remote=origin --push

# 部署到 Vercel
vercel --prod
```

- **GitHub**: https://github.com/cloudzun/vibe-ecommerce
- **线上演示**: https://vibe-ecommerce-seven.vercel.app

---

## 优势：Superpowers 真正解决了什么

### 1. 强制性工作流纪律

Superpowers 的每个 skill 都有 `HARD-GATE`——不完成上一步，不允许进入下一步。这不是建议，是强制。

传统 Vibe Coding 的最大问题是 AI 会直接跳进去写代码，然后你发现它理解错了需求，或者做了一堆你不需要的东西。brainstorming skill 的存在强制 AI 先理解需求，再动手。

### 2. spec-reviewer 是真正的质量门控

结构验收只能发现"文件在不在"，spec-reviewer 会逐行对比代码与 PRD——"代码是否真的实现了每一条需求"。这两者差距很大。

### 3. code-quality-reviewer 发现了 AI 自己不会主动报告的问题

XSS 漏洞、localStorage 崩溃、负数数量——这些问题在 spec review 里不会出现（功能是"实现了"的），但在 code quality review 里被发现了。没有这一步，这些 bug 会直接上线。

### 4. systematic-debugging 防止猜测性修复

铁律：没完成根因调查，不能提修复方案。这防止了 AI 最常见的反模式——遇到 bug 开始随机改代码，越改越乱。

---

## 问题与反思

### 问题 1：brainstorming 的问答模式与 opencode run 不兼容

`opencode run` 是单次执行，每次都是新 session。brainstorming skill 设计的是交互式问答，但在 run 模式下无法保持上下文。

**解法**：收集足够信息后，跳过剩余问答，直接把所有设计决策一次性传给 writing-plans。实际上这也更高效——与其一问一答，不如架构师直接做决策。

### 问题 2：subagent-driven-development 的两阶段 review 被跳过

qwen3.5-plus 理解 Superpowers 流程，但在执行时会省略 spec review 和 quality review 步骤。这需要手动补跑。

**根本原因**：Superpowers 是为 Claude 设计的，Claude 对 HARD-GATE 的遵守更严格。qwen3.5-plus 会理解指令但在执行压力下会走捷径。

**解法**：在 prompt 里显式要求"dispatch spec-reviewer subagent"，或者在主流程结束后手动触发 review。

### 问题 3：Vercel 登录的 device flow 问题

`vercel login` 的 device flow 需要进程保持运行等待回调。在后台进程模式下，授权完成但凭据没有写入。需要用 pty 交互模式运行。

### 问题 4：927 行代码，但没有测试

这是 prototype 的合理取舍，但 Superpowers 的 test-driven-development skill 我们完全没用到。对于后续迭代，TDD 应该成为标准流程——先写失败测试，再写实现。

---

## 结论

**Superpowers + OpenCode 的组合是可用的**，但需要理解它的边界：

1. **它是流程框架，不是能力增强**。它让 AI 更有纪律，不让 AI 更聪明。
2. **模型兼容性很重要**。Superpowers 为 Claude 优化，用 Qwen 时需要更显式地触发每个步骤。
3. **最有价值的是 review 流程**。spec-reviewer 和 code-quality-reviewer 发现了我们自己可能忽略的真实问题。
4. **Vibe Coding 不等于无脑生成**。架构师的角色（需求分析、技术决策、质量把关）依然不可替代，只是执行层交给了 AI。

这个电商原型还有很多问题——没有真实图片、UI 有瑕疵、缺少测试、没有后端。但作为 MVP，它验证了完整的开发流程，这才是这次实验的真正价值。

---

## 资源

- **GitHub 仓库**: https://github.com/cloudzun/vibe-ecommerce
- **线上演示**: https://vibe-ecommerce-seven.vercel.app
- **Superpowers**: https://github.com/obra/superpowers
- **oh-my-opencode**: https://github.com/code-yeongyu/oh-my-opencode
- **OpenCode**: https://opencode.ai
