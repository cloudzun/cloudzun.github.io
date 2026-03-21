---
title: '从原型到产品：vibe-ecommerce 迭代系列（五）— Docker 三容器本地开发环境'
pubDatetime: 2026-03-06T00:00:00Z
tags: ['vibe-coding', 'opencode', 'docker', 'nginx', 'postgresql', 'makefile']
description: '技术博客文章'
---

这是 vibe-ecommerce 迭代系列的第五篇。

[上一篇](https://blog.huaqloud.com/posts/2026-03-06-vibe-ecommerce-phase5-security/)记录了 Phase 5 的安全加固和性能优化——express-validator 输入校验、helmet CSP 定制、API 内存缓存、图片懒加载。

Phase 6 原本计划做 SDD 重构。但在动手之前，我改变了主意。

## 一、为什么改变计划

Phase 5 结束时，代码库一共 1,972 行。按照 LAB-14 的框架，SDD 的触发阈值是 5,000 行——「当你开始有『我不敢改这段代码』的感受时」。

这个项目还没到那个点。

更重要的是，这个项目的定位是**教学参考实现**，配套 [LAB-14 毕业项目](https://github.com/cloudzun/opencode-labs/blob/main/LAB-14-capstone-project.md)。对学员来说，「能快速在本地跑起来」比「代码架构更优雅」更有价值。

所以 Phase 6 的目标改成了：**让任何人都能用一条命令复现完整环境**。

```bash
git clone https://github.com/cloudzun/vibe-ecommerce.git
cd vibe-ecommerce
make up
```

三个容器自动启动，数据库自动初始化，访问 `http://localhost` 就能看到完整的电商应用。

## 二、架构设计

### 三容器分工

```
学员本地机器 (Docker Compose)
┌─────────────────────────────────────────────────────┐
│  Docker network: vibe-network                        │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  frontend    │  │  backend     │  │    db     │  │
│  │ nginx:alpine │  │ node:22-alpine│  │postgres:16│  │
│  │  port 80     │  │  port 3001   │  │ port 5432 │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                 │                │        │
│  学员访问 http://localhost  │  容器内通信     │        │
└─────────────────────────────────────────────────────┘
```

**frontend（nginx:alpine）**：服务静态文件，同时承担反向代理——把 `/api/*` 请求转发给 backend 容器。选 nginx 而不是 `node serve`，因为 nginx 是生产标准的静态文件服务器，镜像更小（~5MB vs ~50MB），且能同时承担代理角色。

**backend（node:22-alpine）**：Express API，不暴露端口到宿主机。所有流量经过 nginx 统一入口，更接近真实生产架构。

**db（postgres:16-alpine）**：PostgreSQL 数据库，同样不暴露端口。只有 backend 容器能访问。

### 关键约束：生产环境不动

这个设计有一个硬性约束：**生产环境（Azure VM + SQLite + pm2）完全不受影响**。

生产代码已经在跑，有真实用户。Phase 6 只能新增文件，不能修改任何现有逻辑。

这个约束带来了一个有趣的问题：前端 JS 里硬编码了生产 API 地址：

```javascript
const API_BASE = 'https://shop-api.huaqloud.com';
```

Docker 环境里，API 请求应该走 nginx 代理（`/api/*`），而不是直接打生产服务器。怎么在不修改源码的情况下解决这个问题？

## 三、nginx sub_filter：在传输层做 URL 重写

答案是 nginx 的 `sub_filter` 指令。

```nginx
location ~* \.js$ {
    sub_filter 'https://shop-api.huaqloud.com' '';
    sub_filter_once off;
}
```

这段配置的效果：当 nginx 向浏览器传输 `.js` 文件时，把 `https://shop-api.huaqloud.com` 替换成空字符串。

浏览器收到的 JS 变成了：

```javascript
const API_BASE = '';  // 原来是 'https://shop-api.huaqloud.com'
```

`API_BASE` 变成空字符串，`fetch(API_BASE + '/api/products')` 就变成了 `fetch('/api/products')`——相对路径，由 nginx 代理到 backend 容器。

**磁盘上的源文件没有任何改动**。Vercel 拿到的还是原始 JS，生产环境行为不变。只有经过 Docker nginx 传输的文件被实时改写。

这是「在正确的层做事」的典型案例：不改代码，在基础设施层解决环境差异。

完整的 nginx 配置：

```nginx
server {
    listen 80;

    # 传输 JS 文件时重写 API base URL
    location ~* \.js$ {
        root /usr/share/nginx/html;
        sub_filter 'https://shop-api.huaqloud.com' '';
        sub_filter_once off;
        add_header Cache-Control "no-cache";
    }

    # API 请求代理到 backend 容器
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 四、数据库双模式

`server/db.js` 需要同时支持 SQLite（生产）和 PostgreSQL（Docker）。Knex 的抽象层让这件事变得很简单：

```javascript
const isPg = !!process.env.DATABASE_URL;

const knex = require('knex')(isPg ? {
  client: 'pg',
  connection: process.env.DATABASE_URL,
} : {
  client: 'better-sqlite3',
  connection: { filename: './data/shop.db' },
  useNullAsDefault: true
});
```

一行判断，两种行为。`DATABASE_URL` 由 Docker Compose 注入，生产环境没有这个变量，永远走 SQLite。

所有路由代码（`routes/products.js`、`routes/orders.js`、`routes/auth.js`）完全不需要修改——它们只知道 `knex`，不知道底层是什么数据库。

这是 Phase 3 选择 Knex 而不是直接用 `better-sqlite3` 的回报。当时的决策理由是「Knex 抽象层保证未来迁移只需改配置」，Phase 6 验证了这个判断。

## 五、docker-compose.yml 设计

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./docker/backend
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./docker/frontend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

几个设计决策：

**healthcheck + depends_on**：PostgreSQL 启动后需要几秒才能接受连接。`condition: service_healthy` 确保 backend 在 db 真正就绪后才启动，避免连接失败。

**只有 frontend 暴露端口**：backend 和 db 只在 Docker 内部网络可访问。学员不需要直接访问这两个容器，统一走 nginx 入口。

**`FRONTEND_PORT:-80`**：端口默认 80，可以通过 `.env` 覆盖。在服务器上验证时，80 端口被 Nginx Proxy Manager 占用，8080 被 SearxNG 占用，用 8081 测试。学员本地机器通常 80 端口空闲，不需要改配置。

## 六、Makefile：学员操作入口

```makefile
.PHONY: up down logs reset ps help

up:
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@if command -v docker-compose > /dev/null 2>&1; then \
		docker-compose up -d --build; \
	else \
		docker compose up -d --build; \
	fi

down:
	@if command -v docker-compose > /dev/null 2>&1; then \
		docker-compose down; \
	else \
		docker compose down; \
	fi

reset:
	@if command -v docker-compose > /dev/null 2>&1; then \
		docker-compose down -v && docker-compose up -d --build; \
	else \
		docker compose down -v && docker compose up -d --build; \
	fi

logs:
	docker compose logs -f

ps:
	docker compose ps
```

`make up` 做了两件事：

1. 如果 `.env` 不存在，自动从 `.env.example` 复制——学员第一次运行不需要任何额外步骤
2. 自动检测 `docker-compose`（v1 独立安装）vs `docker compose`（v2 插件）——兼容不同环境

`make reset` 用于演示重置：`down -v` 清空 volume（包括数据库数据），然后重新构建启动，数据库会重新初始化并 seed。

## 七、验收结果

所有 7 个任务，OpenCode 一次性完成：

| 测试 | 预期 | 结果 |
|------|------|------|
| `make up` 启动三容器 | 全部 Up | ✅ |
| 前端页面 | HTTP 200 | ✅ |
| nginx sub_filter 生效 | `API_BASE = ''` | ✅ |
| 商品列表（nginx → backend → PostgreSQL）| 10 products | ✅ |
| 注册 → 登录 → 下单 → 订单历史 | 完整流程 | ✅ |
| `make reset` 清空重建 | 数据重新 seed | ✅ |
| 生产 API 回归 | status: ok | ✅ |
| 无 Docker 模式（SQLite）| 正常运行 | ✅ |
| npm audit | 0 vulnerabilities | ✅ |

验证 sub_filter 是否生效：

```bash
curl http://localhost:8081/js/data.js | grep API_BASE
# 输出：const API_BASE = '';
# 磁盘上的文件：const API_BASE = 'https://shop-api.huaqloud.com';
```

## 八、系列回顾

六个阶段，每个阶段回答一个核心问题：

| Phase | 核心问题 | 答案 |
|-------|----------|------|
| 1 | AI 能多快生成可用原型？ | 40 分钟，927 行，能跑 |
| 2 | 如何在 AI 代码上做有质量的迭代？ | 7-Gate 流程 |
| 3 | 如何引入后端而不破坏前端？ | 向后兼容设计 + Knex 抽象层 |
| 4 | 如何在 AI 协作中保持架构师控制权？ | 清晰的角色边界 + 约束头部 |
| 5 | 如何硬化安全而不降低性能？ | express-validator + 缓存 + lazy load |
| 6 | 如何让任何人都能一键复现？ | Docker 三容器 + nginx sub_filter + 双模式 |

最终交付的是一个从 Vibe Coding 原型演进到完整工程实践的全栈应用：完整购物流程、用户认证、后端安全、前端性能、双运行环境、完整文档。

这个系列本身也是一个工程决策的记录——哪些决策在后期得到了回报（Knex 抽象层），哪些计划在执行前被推翻（SDD 重构），以及为什么推翻是正确的。

---

项目地址：[github.com/cloudzun/vibe-ecommerce](https://github.com/cloudzun/vibe-ecommerce)  
Live Demo：[vibe-ecommerce-seven.vercel.app](https://vibe-ecommerce-seven.vercel.app)  
API：[shop-api.huaqloud.com](https://shop-api.huaqloud.com/api/products)
