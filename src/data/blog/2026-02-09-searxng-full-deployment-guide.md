---
title: 'Building a Self-Hosted SearxNG Search Engine with JSON API Wrapper'
pubDatetime: 2026-02-09T02:48:00Z
tags: [searxng,search,docker,privacy,devops,api]


# SearxNG 生产部署指南：从 Docker 容器到 systemd service + JSON API

本文档记录了在本地构建自托管 SearxNG 搜索引擎、并通过 Python wrapper 提供 JSON/RSS API 的完整过程，涵盖架构设计、配置要点、测试验证与运维强化。

## 为什么选择 SearxNG？

- **隐私优先**：不记录用户查询，支持代理，可完全本地部署
- **多引擎聚合**：同时查询 DuckDuckGo、Brave、Qwant 等，综合排名更好
- **可定制**：支持自定义引擎清单、语言、分类、图片代理等
- **开源**：完全透明，可审计代码与配置

## 部署架构

```
┌─────────────────────────────────┐
│  用户 / 应用层                   │
│  (client application)            │
└────────────┬──────────────────────┘
             │ HTTP JSON/RSS
             ▼
┌─────────────────────────────────┐
│  Wrapper (Python HTTP Server)    │
│  127.0.0.1:8765                  │
│  - 认证 (API key)                │
│  - HTML→JSON 解析                │
│  - RSS 生成                       │
│  - systemd 管理                  │
└────────────┬──────────────────────┘
             │ HTTP HTML (POST)
             ▼
┌─────────────────────────────────┐
│  SearxNG (Docker 容器)           │
│  127.0.0.1:8080                  │
│  - 元搜索聚合                     │
│  - 多分类支持                     │
│  - 图片/视频代理                 │
│  - restart: always               │
└─────────────────────────────────┘
```

## 文件树

```
/home/chengzh/searxng/
├── docker-compose.yml              # Docker 编排（restart: always）
├── searxng-settings.yml            # SearxNG 生产配置（关键）
├── integrations/
│   ├── wrapper.py                  # HTML→JSON 转换器（核心）
│   ├── integrations_api_key.txt    # API 密钥（保密）
│   ├── wrapper.log                 # systemd 管理的日志
│   └── comprehensive_test.py       # 测试脚本
└── reports/
    ├── DEPLOYMENT_COMPLETE.md      # 部署完成报告
    ├── SUMMARY.md                  # 测试摘要
    └── comprehensive_test_*.txt    # 测试结果时间戳
```

## 逐步部署指南

### 前置条件

```bash
- Docker & Docker Compose 已安装
- Python 3.8+
- sudo 权限（systemd 配置）
```

### 步骤 1：准备 SearxNG 配置

搜索引擎清单（生产级）：
- duckduckgo
- brave
- qwant
- wikipedia
- arxiv
- github
- stack_overflow

关键配置项（searxng-settings.yml）：

```yaml
server:
  method: POST               # 减少被识别为 bot 的概率
  limiter: false            # 在反向代理层面处理限流
  image_proxy: true         # 启用图片代理
  
engines:
  - name: duckduckgo
  - name: brave
  - name: qwant
  # ... 更多引擎
```

### 步骤 2：启动 Docker 容器

```bash
cd /home/chengzh/searxng
docker compose up -d searxng
```

验证：
```bash
curl -sS http://127.0.0.1:8080/search?q=test | head -c 200
# 应返回 HTML，包含搜索结果
```

### 步骤 3：部署 Wrapper

wrapper.py 的核心逻辑：
1. 接收查询请求（GET/POST），验证 API key
2. 转发给 SearxNG 的 HTML 响应
3. 根据 format 参数：
   - format=html → 原始 HTML（无转换）
   - format=json → 用正则表达式与 BeautifulSoup 解析为 JSON
   - format=rss → 生成 RSS 2.0 feed

启动 wrapper（已用 systemd 管理）：
```bash
sudo systemctl start searxng-wrapper.service
sudo systemctl enable searxng-wrapper.service
```

验证：
```bash
curl -sS http://127.0.0.1:8765/health
# {"status": "ok"}
```

### 步骤 4：测试功能

```bash
API_KEY=$(cat /home/chengzh/searxng/integrations_api_key.txt)

# JSON 查询
curl -sS "http://127.0.0.1:8765/search?q=python&format=json&api_key=$API_KEY" | jq '.results | length'

# RSS 查询
curl -sS "http://127.0.0.1:8765/search?q=kubernetes&format=rss&api_key=$API_KEY" | grep '<item' | wc -l

# 分类搜索
curl -sS "http://127.0.0.1:8765/search?q=cat&categories=images&format=json&api_key=$API_KEY" | jq '.number_of_results'

# 多语言
curl -sS "http://127.0.0.1:8765/search?q=test&language=de&format=json&api_key=$API_KEY" | jq '.query'
```

## 关键参数与 API

### 查询参数

| 参数 | 例值 | 说明 |
|------|------|------|
| q | `python` | 搜索关键词（必填）|
| format | `json`/`rss`/`html` | 输出格式（默认 html）|
| categories | `general`/`images`/`videos` | 搜索分类 |
| language | `en`/`de`/`fr`/`zh-CN` | 语言 |
| safesearch | `0`/`1`/`2` | 安全等级 |
| pageno | `1`, `2`, ... | 分页（从 1 开始）|
| api_key | `<KEY>` | API 密钥（必填）|

### JSON 响应格式

```json
{
  "query": "python",
  "results": [
    {
      "title": "Welcome to Python.org",
      "url": "https://www.python.org/",
      "domain": "www.python.org",
      "snippet": "Python is a versatile and easy-to-learn language..."
    }
  ],
  "number_of_results": 28
}
```

### RSS 响应格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SearxNG - python</title>
    <link>http://127.0.0.1:8080</link>
    <item>
      <title>Welcome to Python.org</title>
      <link>https://www.python.org/</link>
      <description>Python is a versatile and easy-to-learn language...</description>
    </item>
  </channel>
</rss>
```

## 测试验证报告

### 综合测试结果（2026-02-09 09:42）

✅ **健康检查**：Wrapper 健康响应  
✅ **分类搜索（10 类）**：全部通过（general=30, images=8009, videos=146, 等）  
✅ **格式支持**：HTML/JSON/RSS 均有效  
✅ **并发（5 并发请求）**：5/5 成功  
✅ **多语言**：en, de, fr, zh-CN, auto 全部返回 200  
✅ **性能**：5 次顺序查询平均 1.12s（min=0.56s, max=1.62s）  
✅ **错误处理**：无 API key 被拒绝，空查询被拒绝  
✅ **认证**：API key 验证有效  

详见 `/home/chengzh/searxng/reports/comprehensive_test_20260209T094244Z.txt`

## 生产化与强化

### 1. Docker 容器自动重启

已配置 `restart: always`（见 docker-compose.yml）：
- 容器崩溃时自动重启
- 宿主机重启时自动启动容器

检查日志：
```bash
docker logs searxng --tail 100
```

### 2. Wrapper 进程管理

已注册为 systemd service：
```bash
# 启动/停止
sudo systemctl start searxng-wrapper.service
sudo systemctl stop searxng-wrapper.service

# 重启与状态
sudo systemctl restart searxng-wrapper.service
sudo systemctl status searxng-wrapper.service

# 日志
sudo journalctl -u searxng-wrapper.service -f

# 开机自启
sudo systemctl enable searxng-wrapper.service
```

systemd unit 路径：`/etc/systemd/system/searxng-wrapper.service`

关键配置：
```ini
[Service]
Type=simple
User=chengzh
Restart=on-failure
RestartSec=5
StartLimitBurst=5
ProtectHome=read-only
NoNewPrivileges=true
```

### 3. 推荐后续强化（可选）

#### Nginx 反向代理 + TLS

```nginx
server {
    listen 443 ssl http2;
    server_name search.internal.local;
    
    ssl_certificate /etc/letsencrypt/live/...;
    ssl_certificate_key /etc/letsencrypt/live/...;
    
    location /search {
        auth_basic "SearxNG";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Rate limiting
        limit_req zone=api burst=10 nodelay;
    }
}
```

#### Redis 缓存（热门查询）

缓存 1 小时内的高频查询，减少 SearxNG 负载。

#### Prometheus 监控

启用 metrics 并集成告警：
```bash
curl -sS "http://127.0.0.1:8080/metrics?token=<METRICS_TOKEN>"
```

## 故障排除

### Wrapper 连接被拒

```bash
# 检查监听端口
sudo ss -ltnp | grep 8765

# 查看 systemd 日志
sudo journalctl -u searxng-wrapper.service -n 50
```

### SearxNG 返回 403

确认 settings.yml 中 `limiter: false`（已配置）。若仍失败，检查容器日志：
```bash
docker logs searxng | grep -i "bot\|limit\|403"
```

### JSON 解析失败

检查 wrapper 是否收到 HTML，且格式未变（SearxNG 可能修改 HTML 结构）：
```bash
curl -sS "http://127.0.0.1:8080/search?q=test" | head -c 500
```

## 总结与下一步

✅ **现在可用**：
- 本地隐私搜索（无 tracking）
- 多引擎聚合结果
- JSON/RSS API
- systemd 自动重启
- Docker 容器自动恢复

⏳ **推荐强化**（后续）：
- TLS + 认证（Nginx 反向代理）
- Redis 缓存
- Prometheus metrics + alerting
- 虚拟环境隔离
- systemd healthcheck timer

---

**部署时间**：2026-02-09  
**最后验证**：2026-02-09 10:48  
**技术栈**：Docker、Python、systemd、SearxNG  
**维护**: `/home/chengzh/searxng/`
