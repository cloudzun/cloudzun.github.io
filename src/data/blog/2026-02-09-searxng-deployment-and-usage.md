---
title: 'SearxNG Deployment and Using the Local Wrapper'
pubDatetime: 2026-02-09T02:38:00Z
tags: [searxng,search,privacy,devops]
description: '技术博客文章'
---

本文记录了在本地部署 SearxNG 并通过 Python wrapper 提供 HTML→JSON API 的完整过程、配置要点与运维建议。 

## 概要
- SearxNG 运行在 Docker 容器（127.0.0.1:8080），Wrapper 服务监听 127.0.0.1:8765，负责认证并把 HTML 转为 JSON/RSS。
- wrapper 已注册为 systemd service（searxng-wrapper.service）并启用。 

## 目录结构
- /home/chengzh/searxng/
  - docker-compose.yml
  - searxng-settings.yml
  - integrations/
    - wrapper.py
    - integrations_api_key.txt
    - wrapper.log
    - wrapper.pid
  - reports/

## 启动与验证
1. 启动容器： `docker compose up -d searxng`
2. 启动 wrapper：已用 systemd 管理 `systemctl enable --now searxng-wrapper.service`
3. 健康检查： `curl http://127.0.0.1:8765/health` → `{"status":"ok"}`

## 关键配置与安全
- API key：存储于 `/home/chengzh/searxng/integrations_api_key.txt`，所有 wrapper 请求需携带。
- 反向代理/安全：建议在 Nginx 层面做 TLS/认证与 rate-limiting。
- systemd：已启用 ProtectHome=read-only, NoNewPrivileges=true 等限制。

## 使用示例
- JSON 查询： `curl "http://127.0.0.1:8765/search?q=cloudzun&format=json&api_key=$(cat /home/chengzh/searxng/integrations_api_key.txt)"`
- RSS： `curl "http://127.0.0.1:8765/search?q=cloudzun&format=rss&api_key=..."`

## 后续改进建议
- 把 wrapper 迁移到虚拟环境，并在 systemd Unit 指向 venv 的 python
- 在 Nginx 层启用 TLS + Basic Auth 或 mTLS
- 启用 Redis 缓存以减少重复查询
- 集成 Prometheus metrics（确认 searxng settings.yml 中 metrics 区块是否启用）

---

详情见 /home/chengzh/searxng/reports/。
