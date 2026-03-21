---
title: '从原型到产品：vibe-ecommerce 迭代系列（一）— 规划框架与 Phase 2 实施'
date: 2026-03-04T11:55:00+00:00
tags: ['OpenCode', 'Vibe Coding', '迭代', '工程规范', '电商', 'LAB-14']


# 从原型到产品：vibe-ecommerce 迭代系列（一）

## 规划框架与 Phase 2 实施实录

这是 vibe-ecommerce 项目迭代系列的第一篇。

上一篇我们记录了用 OpenCode + Superpowers 从零构建电商原型的过程，也总结了 7 Gate 质量流程。原型跑通了，但它只是一个 demo——商品图片是随机占位图，没有搜索，没有订单确认，没有后端。

这篇文章记录的是：**我们如何把一个 demo 系统性地演进成一个真实产品**。重点不是功能本身，而是**我们用什么框架来规划演进路径，以及流程本身在迭代中如何优化**。

---

## 一、为什么需要一个演进框架

Vibe Coding 的原型阶段有一个特点：**速度快，但方向感弱**。

你可以在 40 分钟内生成 900 行代码，但这 900 行代码的技术债在哪里？下一步该加什么功能？什么时候该引入后端？什么时候该重构？这些问题，Vibe Coding 本身不回答。

我们参照 [LAB-14 Capstone Project](https://github.com/cloudzun/opencode-labs/blob/main/LAB-14-capstone-project.md) 的五阶段框架，为 vibe-ecommerce 制定了完整的演进路线。

---

## 二、演进路线图

### 整体架构演进

```
Phase 1（当前）          Phase 3 之后              Phase 4 之后
Vercel（前端）    →     Vercel（前端）      →     Vercel（前端）
localStorage          API 请求                   API 请求（JWT）
                       Linux 服务器（后端）        Linux 服务器
                       SQLite/PostgreSQL           PostgreSQL（用户/订单）
```

### 六个阶段规划

| 阶段 | 目标 | 关键产出 |
|------|------|----------|
| **Phase 1** ✅ | Vibe Coding 快速原型 | 927 行代码，完整购物流程，已部署 |
| **Phase 2** ✅ | 前端功能完善 | 搜索/排序/详情跳转/订单确认 |
| **Phase 3** | 引入后端 | Node.js + Express + SQLite，商品/订单 API |
| **Phase 4** | 用户认证 | JWT 登录注册，订单历史，权限控制 |
| **Phase 5** | 性能优化 + 安全加固 | 图片懒加载，API 限流，HTTPS |
| **Phase 6** | SDD 重构 | 四层文档，模块边界清晰化 |

### 技术选型决策记录

Phase 3 后端选型我们选择 **Node.js + Express + SQLite**，理由：

- 与前端同语言，上下文切换成本低
- SQLite 零配置，适合当前规模（< 1000 用户）
- 部署到现有 Linux 服务器，无额外成本
- 未来可无缝迁移到 PostgreSQL

> 决策原则：**哪个更简单用哪个**。过早引入复杂技术栈是 Phase 1 的典型陷阱。

---

## 三、流程升级：从 7 Gate 到上下文文档驱动

### 上一版流程的问题

我们在[上一篇文章](https://blog.huaqloud.com/posts/2026-03-04-vibe-coding-qa-gates/)建立了 7 Gate 流程，核心是：**Gate 由架构师把关，不依赖模型自觉遵守**。

但 7 Gate 流程有一个隐性问题：**Gate 是检查点，不是上下文**。AI 在执行时仍然缺乏足够的项目背景，容易产生"功能正确但不符合项目约束"的代码。

### LAB-14 带来的新工具：上下文文档

LAB-14 引入了 Shopify CEO 风格的**上下文文档**概念，五个维度：

| 维度 | 核心问题 |
|------|---------|
| ① 项目背景 | 当前状态是什么？ |
| ② 之前尝试过什么 | 上一阶段做了什么？遇到了什么问题？ |
| ③ 成功与失败的定义 | 本阶段结束时，什么算成功？什么算失败？ |
| ④ 谁会受影响 | 这次改动影响哪些功能/用户/模块？ |
| ⑤ 约束条件 | 技术约束、时间约束、不能破坏什么？ |

**关键认知**：上下文文档不只是思考工具，它直接成为给 OpenCode 的 Prompt 上下文。写好上下文文档的 AI 输出质量，远高于随手写的 Prompt。

### 升级后的流程

```
[上下文文档] → [GATE 0 BRIEF 确认]
      ↓
[GATE 1 实现计划]
      ↓
[GATE 2 执行（每 task 验证）]
      ↓
[GATE 3 结构验收] → [GATE 4 Spec Review] → [GATE 5 Quality Review]
      ↓
[GATE 6 修复验证] → [GATE 7 部署]
```

上下文文档在 GATE 0 之前完成，它是整个流程的"地基"——让后续所有 Gate 都在同一个认知框架下运行。

---

## 四、Phase 2 实施过程

### Step 1：写上下文文档（GATE 0）

在动任何代码之前，先写 `docs/briefs/2026-03-04-phase2-frontend.md`：

```markdown
## 项目背景
纯前端 Vanilla JS SPA，hash-based 路由，10 个电子产品，localStorage 购物车。
已修复：XSS、localStorage 崩溃、路由 404、负数数量。

## 之前尝试过什么
Phase 1 完成了完整购物流程，但存在：
- 产品列表卡片没有点击进入详情页的入口
- Mechanical Keyboard 图片链接无效
- 没有搜索功能，没有排序，没有订单确认页

## 成功与失败的定义
- 成功：商品卡片可点击、搜索实时过滤、排序正常、订单确认页显示
- 失败红线：不能破坏现有购物车逻辑，不能引入新的 XSS 漏洞

## 约束条件
- 纯 Vanilla JS，无框架，无构建工具
- 不能动：router.js 核心逻辑、CartStore 接口
- 所有用户输入必须经过 escapeHtml()
```

这份文档的价值在于：**它把"不能破坏什么"和"什么算完成"同等重要地写下来**。大多数 Prompt 只说要做什么，不说不能做什么。

### Step 2：生成实现计划（GATE 1）

5 个 Task，每个 2-10 分钟，每个有明确验证方法：

| Task | 内容 | 验证方法 |
|------|------|----------|
| 1 | 修复 Mechanical Keyboard 图片 | curl 图片 URL 返回 200 |
| 2 | 商品卡片点击进入详情页 | 点击卡片非按钮区域能跳转 |
| 3 | 搜索框实时过滤 | 输入 "head" 只显示 2 个商品 |
| 4 | 商品排序 | 选价格升序后商品按价格排列 |
| 5 | 订单确认页 | 结账后跳转确认页，购物车清空 |

### Step 3：执行细节

**Task 1：验证命令先行**

修复图片 URL 的第一步不是改代码，而是先验证新 URL 是否有效：

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop"
# 200 ✓ 再写进 data.js
```

这是 Gate 2 "每 task 完成后立即运行验证命令"的具体体现——**先验证，再提交**。看起来多了一步，但它防止了"图片 URL 写进去了但 404"这类低级错误在后续 review 才被发现。

---

**Task 2：事件冒泡陷阱**

商品卡片整体可点击，但 "Add to Cart" 按钮不能触发跳转。解法是 `event.stopPropagation()`：

```javascript
// 卡片整体点击 → 进入详情
<div class="product-card" onclick="Router.goTo('product-detail', {id: ${product.id}})">
    ...
    // 按钮阻止事件冒泡，只触发加购
    <button onclick="event.stopPropagation(); ProductsPage.addToCart(${product.id})">
        Add to Cart
    </button>
</div>
```

这是一个典型的"功能正确但交互细节容易遗漏"的场景。上下文文档里写了"不能破坏现有购物车逻辑"，这个约束让我们在设计时就主动考虑了这个细节，而不是等 bug 出现再修。

---

**Task 3+4：计划 vs 执行的合理偏差**

计划里 T3（搜索）和 T4（排序）是两个独立 Task，执行时合并成了一个。原因是它们共用同一套状态：

```javascript
const ProductsPage = {
    currentCategory: 'all',  // 分类过滤
    searchQuery: '',          // 搜索关键词
    sortOrder: 'default',     // 排序方式

    getFilteredProducts() {
        let products = /* 按分类过滤 */;
        if (this.searchQuery) products = /* 按关键词过滤 */;
        if (this.sortOrder !== 'default') products = /* 排序 */;
        return products;
    }
}
```

**为什么合并状态而不是分开管理？** 因为合并后 `mount()` 成为唯一的渲染入口——无论是搜索、分类还是排序触发的更新，都走同一个渲染路径，不会出现"搜索后分类状态丢失"这类状态不同步问题。

这也说明：**计划是指导，不是教条**。当执行时发现两个 Task 有天然的合并理由，合并是正确决策——但要记录理由，不是随意跳过。

---

**Task 5：存储方案的架构决策**

订单确认页需要在页面刷新后仍然可访问（用户可能想截图保存）。有三种方案：

| 方案 | 问题 |
|------|------|
| URL 参数传递订单数据 | 订单信息暴露在浏览器历史记录和服务器日志 |
| localStorage 持久化 | 数据永久保留，用户清理购物车后订单仍在，语义混乱 |
| **sessionStorage** | Tab 关闭后自动清除，符合"临时查看"语义，不跨 session 持久化 |

选 sessionStorage 的核心理由：**语义匹配**。订单确认页是一次性的临时状态，sessionStorage 的生命周期和这个语义完全吻合。这个决策记录在上下文文档里，Phase 4 引入后端后，这里会替换成真实的订单 API——到时候不需要重新推导，直接看记录就知道当初为什么这样设计。

### Step 4：验收（GATE 3）

```bash
# 语法检查
node --check js/components/order-confirmation.js  # OK
node --check js/components/checkout.js            # OK
node --check js/components/products.js            # OK

# 路由注册检查
grep -c "Router.register" js/components/*.js
# 每个组件都有且只有一个 register ✓

# 串联检查
grep "order-confirmation" index.html              # script 标签存在 ✓
grep "order-confirmation" js/components/checkout.js  # Router.goTo 存在 ✓
```

---

## 五、流程本身的优化：这次学到了什么

### 优化 1：上下文文档让"失败红线"和"成功标准"同等重要

传统 Prompt 只说"做什么"，上下文文档强制你同时思考"不能破坏什么"。这个改变让 Phase 2 的执行过程中没有出现任何回归问题——因为约束在执行前就已经明确。

### 优化 2：计划粒度决定验证质量

Phase 1 的任务粒度是"实现购物车模块"（太大），Phase 2 的任务粒度是"商品卡片点击进入详情页，验证：点击非按钮区域能跳转"（刚好）。

粒度越细，验证越具体，越不容易出现"功能实现了但边界条件没处理"的问题。

### 优化 3：技术决策要记录理由，不只记录结论

我们在上下文文档里记录了"为什么选 sessionStorage 而不是 URL 参数"。这不是给 AI 看的，是给未来的自己看的——下次迭代时，你能快速理解当时的约束，而不是重新推导一遍。

### 优化 4：Qwen 模型的 HARD-GATE 遵守问题有了新解法

上一篇文章提到 Qwen 会跳过 Superpowers 的 review 步骤。这次我们的解法是：**把 review 步骤内化到上下文文档的"失败红线"里**，而不是依赖模型自觉触发 skill。

效果：Gate 5（Code Quality Review）这次没有发现新的 CRITICAL 问题，说明上下文文档的约束条件确实在执行阶段起了作用。

---

## 六、当前状态与下一步

### Phase 2 交付物

- ✅ 商品卡片整体可点击进入详情页
- ✅ 搜索框实时过滤（按商品名称）
- ✅ 排序功能（默认/价格低→高/价格高→低/评分高→低）
- ✅ 订单确认页（含订单号、商品清单、总价）
- ✅ Mechanical Keyboard 图片修复
- ✅ 代码规模：~1200 行，12 个文件

### Phase 3 预告

下一篇将记录**引入后端**的过程：Node.js + Express + SQLite，把商品数据从硬编码迁移到 API，购物车状态迁移到服务端，订单写入数据库。

这是整个演进路线中**最关键的一跳**——从纯前端静态应用变成有状态的全栈应用。架构变了，部署方式变了，测试方式也变了。上下文文档在这个阶段的价值会更加凸显。

---

## 资源

- **GitHub 仓库**：https://github.com/cloudzun/vibe-ecommerce
- **线上演示**：https://vibe-ecommerce-seven.vercel.app
- **系列上一篇**：[Vibe Coding with OpenCode + Superpowers](https://blog.huaqloud.com/posts/2026-03-04-vibe-coding-opencode-superpowers/)
- **7 Gate 质量流程**：[Vibe Coding 的质量陷阱](https://blog.huaqloud.com/posts/2026-03-04-vibe-coding-qa-gates/)
- **LAB-14 参考文档**：https://github.com/cloudzun/opencode-labs/blob/main/LAB-14-capstone-project.md
