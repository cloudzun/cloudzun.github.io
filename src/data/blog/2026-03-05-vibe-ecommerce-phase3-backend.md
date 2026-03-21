---
title: '从原型到产品：vibe-ecommerce 迭代系列（二）— 引入后端，第一跳'
date: 2026-03-05T01:24:00+00:00
tags: ['OpenCode', 'Vibe Coding', '后端', 'Node.js', 'SQLite', '架构设计', 'LAB-14']


# 从原型到产品：vibe-ecommerce 迭代系列（二）

## 引入后端，第一跳

这是 vibe-ecommerce 迭代系列的第二篇。

[上一篇](https://blog.huaqloud.com/posts/2026-03-04-vibe-ecommerce-iteration-phase2/)记录了 Phase 2 的前端打磨——搜索、排序、商品详情跳转、订单确认页。Phase 2 结束时，这个应用已经"看起来像"一个真实的电商网站。

但它不是。

所有商品数据硬编码在 `js/data.js`，购物车存在 localStorage，订单数据存在 sessionStorage——关掉浏览器就消失。没有服务器，没有数据库，没有任何服务端状态。

Phase 3 要做的，是**第一跳**：从纯前端静态应用，跳到有真实后端的全栈应用。

---

## 一、为什么这一跳最难

Phase 1 到 Phase 2 是在同一个技术层面迭代——都是前端，都是 Vanilla JS，改动有限，风险可控。

Phase 3 不一样。它引入了一个全新的技术层：

```
Phase 1-2                    Phase 3
┌──────────────────┐         ┌──────────────────┐    ┌──────────────────┐
│  Vercel          │   →     │  Vercel          │───▶│  Linux Server    │
│  Vanilla JS SPA  │         │  Vanilla JS SPA  │    │  Node.js Express │
│  localStorage    │         │  fetch() API     │    │  SQLite          │
└──────────────────┘         └──────────────────┘    └──────────────────┘
```

这意味着：
- **部署变复杂**：前端在 Vercel，后端在 Azure Linux 服务器，需要反向代理、SSL、CORS
- **调试变困难**：问题可能出在前端、网络、代理、后端、数据库任何一层
- **架构决策变多**：用什么数据库？用什么 ORM？怎么管理进程？怎么处理跨域？

每一个决策都有连锁反应。这就是为什么"引入后端"这一步需要认真规划，而不是随手开始写代码。

---

## 二、技术选型：不只是选工具，是选未来

### 数据库选型的三个选项

我们有三个现成的选项：

| 选项 | 可用性 | 容器化友好 | 迁移成本 |
|------|--------|-----------|---------|
| SQLite（本地文件） | 零配置 | ⚠️ 需挂载 volume | 低 |
| Vercel Postgres（Neon） | 免费额度 | ❌ 锁定 Vercel | 高 |
| Azure SQL DB（已有实例） | 现成 | ✅ 优秀 | 中 |

最终选择 **SQLite**，但这个决策背后有一个关键原则：

> **不要在 Phase 3 解决 Phase 5 的问题。**

Azure SQL DB 是生产级数据库，适合 Phase 5/6 的容器化场景。但 Phase 3 的目标是验证 API 层，不是验证数据库层。SQLite 把连接字符串管理、防火墙规则、网络延迟全部从调试面中移除——让我们专注在真正要验证的东西上。

**但有一个前提**：必须用 Knex.js 作为 Query Builder，而不是裸 SQL。

### 为什么 Knex 是关键决策

Knex 支持多种数据库方言：SQLite、PostgreSQL、MSSQL（Azure SQL DB）、MySQL。

```javascript
// Phase 3：SQLite
const knex = require('knex')({
  client: 'better-sqlite3',
  connection: { filename: './data/shop.db' }
});

// Phase 5/6 迁移到 Azure SQL DB：只改这里
const knex = require('knex')({
  client: 'mssql',
  connection: {
    server: 'xxx.database.windows.net',
    database: 'vibe-ecommerce',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
});
```

业务代码（routes/products.js、routes/orders.js）**一行不改**。

这不是过度设计——这是在 Phase 3 做一个 10 分钟的决策，换取 Phase 5/6 零迁移成本。

### 进程管理：pm2 + systemd

后端服务需要：崩溃自动重启、开机自启、日志管理。pm2 一个工具全部解决：

```bash
pm2 start app.js --name vibe-shop-api
pm2 startup   # 生成 systemd 单元文件
pm2 save      # 保存当前进程列表
```

不需要手写 systemd service 文件，不需要 cron job 监控进程存活。

---

## 三、架构设计：三层分离

### API 设计原则

4 个端点，覆盖完整购物流程：

```
GET  /api/products              → 商品列表（支持 category/search/sort 参数）
GET  /api/products/:id          → 单个商品
POST /api/orders                → 创建订单（事务写入）
GET  /api/orders/:id            → 订单详情
```

**为什么这样设计而不是更多端点？**

Phase 3 的原则是最小化后端表面积。购物车仍然在 localStorage（Phase 4 再迁移），用户认证不在 Phase 3 范围内。4 个端点覆盖当前需求，不多不少。

### 数据库 Schema：快照价格

订单表设计有一个细节值得记录：

```sql
CREATE TABLE order_items (
    order_id   TEXT REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    price      REAL NOT NULL    -- ← 快照价格，不是外键引用
);
```

`price` 字段存的是**下单时的价格快照**，不是通过 `product_id` 关联查询的当前价格。

原因：商品价格会变。如果订单确认页通过 JOIN 查询当前价格，用户看到的订单金额可能和下单时不一致。快照价格是电商系统的标准做法，Phase 3 就应该做对，而不是等 Phase 5 来修。

### 网络层：Docker + NPM + iptables

这是 Phase 3 最意外的技术挑战。

架构是这样的：

```
Internet → NPM (Docker, port 443) → 宿主机 port 3001 → Node.js
```

NPM（Nginx Proxy Manager）运行在 Docker 容器里，需要访问宿主机的 3001 端口。DNS 解析正确，NPM 配置正确，但 HTTPS 请求超时。

排查过程：

```bash
# 从 NPM 容器内部测试
docker exec npm curl -s http://172.17.0.1:3001/health
# → failed

# 检查宿主机防火墙
sudo iptables -L INPUT -n
# → Chain INPUT (policy DROP)  ← 问题在这里
```

**INPUT chain 默认 DROP**，Docker 容器的请求被防火墙拦截了。

```bash
# 只允许 Docker 网络访问 3001，不对公网开放
sudo iptables -I INPUT -p tcp --dport 3001 -s 172.17.0.0/16 -j ACCEPT
```

**经验**：当服务运行在 Docker 反代后面时，调试顺序应该是：
1. 先从容器内部 curl 宿主机端口
2. 再检查 iptables INPUT 规则
3. 最后才看代理配置

大多数情况下，代理配置是对的，防火墙才是问题。

---

## 四、前端改造：最小化变更原则

前端改造遵循一个原则：**只改必须改的，不动其他的**。

改动范围：
- `js/data.js`：完全重写为 `ProductAPI` + `OrderAPI`
- `js/components/products.js`：同步渲染 → 异步 fetch + loading 状态
- `js/components/product-detail.js`：同步查找 → 异步 fetch by ID
- `js/components/checkout.js`：sessionStorage 写入 → POST API
- `js/components/order-confirmation.js`：sessionStorage 读取 → GET API

**不动的**：`router.js`、`store.js`、`utils.js`、`header.js`、`cart.js`、所有 CSS。

这不是懒惰，是有意为之。每一个不必要的改动都是潜在的回归风险。Phase 3 的目标是引入后端，不是重构前端。

### 搜索防抖

一个小但重要的改动：搜索从前端过滤变成了 API 查询，需要防抖避免每次击键都发请求：

```javascript
let searchTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        this.searchQuery = e.target.value;
        this.fetchAndRender();  // 300ms 后才发请求
    }, 300);
});
```

Phase 2 的搜索是纯前端过滤，不需要防抖。Phase 3 接了 API，防抖是必须的。这是"引入后端"带来的隐性改动——不是功能，但不做会有性能问题。

---

## 五、流程价值：上下文文档的作用

Phase 3 的上下文文档（BRIEF）里有一条：

> **失败红线**：sessionStorage 的订单数据必须被替换（不是补充）

这条约束在执行时发挥了作用。如果没有明确写下来，很容易变成"API 调用失败时降级到 sessionStorage"——看起来更健壮，实际上是在维护两套数据路径，增加复杂度。

明确写下"替换而不是补充"，让执行时的决策变得清晰：API 失败就显示错误，不要降级。

**这是上下文文档最重要的价值**：不是帮你想清楚要做什么，而是帮你想清楚**不能做什么**。

---

## 六、技术债记录

Phase 3 创造了一些技术债，全部记录在案：

| 债务 | 位置 | 计划 |
|------|------|------|
| `node_modules` 被 commit 进 git | git 历史 | 加 .gitignore，接受历史债务 |
| 购物车仍在 localStorage | `js/store.js` | Phase 4：登录用户迁移到服务端 |
| API 无认证 | `server/app.js` | Phase 4：JWT 中间件 |
| 无限流 | `server/app.js` | Phase 5：express-rate-limit |
| iptables 规则持久化方式不规范 | `/etc/network/if-up.d/` | Phase 5/6：迁移到 ufw |

记录技术债不是为了让自己难受，是为了让未来的自己（或者接手的人）知道：**这里是有意为之的妥协，不是遗漏**。

---

## 七、思考与收获

### 收获 1：分阶段决策的价值

Phase 3 用 SQLite，Phase 5/6 迁移 Azure SQL DB。这不是"先凑合再说"，而是**把决策推迟到信息最充分的时候**。

Phase 3 时，我们还不知道容器化的具体形态，不知道并发量，不知道是否需要多实例。用 SQLite + Knex 先把 API 层跑通，等 Phase 5/6 有了更多信息再做数据库决策，是更理性的工程选择。

### 收获 2：调试顺序比工具更重要

iptables 问题花了一些时间，但不是因为问题难，而是因为调试顺序错了——先看了 NPM 配置，再看了 DNS，最后才想到防火墙。

正确的调试顺序应该是**从最底层开始**：网络可达性 → 防火墙 → 代理配置 → 应用层。这个顺序在任何分布式系统调试中都适用。

### 收获 3：最小化变更是一种工程素养

Phase 3 改了 5 个前端文件，没动其他 10 个文件。这不是因为其他文件不需要改进，而是因为 Phase 3 的目标不包括改进它们。

**每一个不必要的改动都是风险**。工程素养的一部分，就是克制住"顺手重构"的冲动。

---

## 当前状态

```
✅ Phase 1: Vibe Coding 原型（927行，完整购物流程）
✅ Phase 2: 前端打磨（搜索/排序/详情/订单确认）
✅ Phase 3: 引入后端（Express + Knex + SQLite，4个API端点）
🔜 Phase 4: 用户认证（JWT，订单历史，登录注册）
🔜 Phase 5: 性能+安全加固
🔜 Phase 6: SDD 重构（容器化 + 微服务教学演练）
```

**线上演示**：https://vibe-ecommerce-seven.vercel.app  
**API**：https://shop-api.huaqloud.com/api/products  
**GitHub**：https://github.com/cloudzun/vibe-ecommerce

---

## 资源

- **系列上一篇**：[Phase 2 — 规划框架与前端迭代](https://blog.huaqloud.com/posts/2026-03-04-vibe-ecommerce-iteration-phase2/)
- **7 Gate 质量流程**：[Vibe Coding 的质量陷阱](https://blog.huaqloud.com/posts/2026-03-04-vibe-coding-qa-gates/)
- **架构文档**：[ARCHITECTURE.md](https://github.com/cloudzun/vibe-ecommerce/blob/master/docs/ARCHITECTURE.md)
- **完整路线图**：[ROADMAP.md](https://github.com/cloudzun/vibe-ecommerce/blob/master/docs/ROADMAP.md)
- **Phase 3 复盘**：[retrospective](https://github.com/cloudzun/vibe-ecommerce/blob/master/docs/retrospectives/2026-03-05-phase3-retrospective.md)
