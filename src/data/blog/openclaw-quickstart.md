---
title: 'OpenClaw 快速上手指南（国内用户版）'
pubDatetime: 2026-03-11T02:27:00Z
tags: ['OpenClaw', 'Quick Start', 'AI Assistant', 'Tutorial', '国内安装']
description: '技术博客文章'
---

# OpenClaw 快速上手指南（国内用户版）

> **5 分钟上手** | **零成本入门** | **专为国内用户优化**

---

## 一、安装（5 分钟）

### 1. 安装 Node.js 22

**Linux/WSL2：**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
node --version  # 验证：应显示 v22.x.x
```

**macOS：**
```bash
brew install node@22
node --version
```

**国内镜像加速（如果下载慢）：**
```bash
npm config set registry https://registry.npmmirror.com
```

---

### 2. 安装 OpenClaw

```bash
npm install -g openclaw@latest
openclaw --version  # 验证
```

---

## 二、配置 API Key（3 分钟）

### 方案 A：OpenRouter（免费，推荐）

**1. 注册获取 Key**
- 访问：https://openrouter.ai
- 登录（支持 Google/GitHub/邮箱）
- Settings → API Keys → Create → 复制 Key（`sk-or-v1-xxx`）

**2. 运行配置向导**
```bash
openclaw onboard --install-daemon
```

**3. 按提示输入：**
```
安全确认 → Yes
配置模式 → QuickStart
模型提供商 → Custom Provider

API Base URL → https://openrouter.ai/api/v1
API Key → sk-or-v1-你的密钥
Endpoint compatibility → OpenAI-compatible
Model ID → stepfun/step-3.5-flash:free  (免费模型)
```

**后续配置全部跳过**（按回车）

---

### 方案 B：硅基流动（国内，速度快）

**1. 注册获取 Key**
- 访问：https://cloud.siliconflow.cn
- 手机号注册 → 控制台 → API Keys → 创建 → 复制 Key（`sk-xxx`）

**2. 配置向导输入：**
```
API Base URL → https://api.siliconflow.cn/v1
API Key → sk-你的密钥
Model ID → deepseek-ai/DeepSeek-V3
```

---

## 三、验证（1 分钟）

```bash
# 检查状态
openclaw status

# 打开控制面板（浏览器）
openclaw dashboard
# 访问：http://localhost:18789

# 第一次对话
openclaw agent --message "你好"
```

---

## 四、常用命令

```bash
# 对话
openclaw chat                    # 交互式对话
openclaw agent --message "问题"   # 单次问答

# 管理
openclaw status                  # 查看状态
openclaw logs --follow           # 查看日志
openclaw gateway restart         # 重启服务

# 配置
openclaw configure               # 重新配置
openclaw doctor                  # 诊断修复
```

---

## 五、常见问题

### Q: 下载太慢？
```bash
npm config set registry https://registry.npmmirror.com
npm install -g openclaw@latest
```

### Q: 权限不足？
```bash
sudo npm install -g openclaw@latest
```

### Q: API Key 报错？
编辑配置文件：
```bash
nano ~/.openclaw/openclaw.json
```
确保 `env` 部分有正确的 Key，然后重启：
```bash
openclaw gateway restart
```

### Q: 响应慢？
换国内模型提供商（硅基流动、通义千问等）

---

## 六、下一步

- 接入 Discord/Telegram：https://docs.openclaw.ai/channels/
- 学习技能开发：https://docs.openclaw.ai/tools/skills/
- 官方文档：https://docs.openclaw.ai

---

## 附：模型提供商推荐

| 提供商 | 免费额度 | 速度 | 推荐度 |
|--------|---------|------|--------|
| OpenRouter | ✅ 免费模型 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 硅基流动 | ✅ 16 元券 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 腾讯混元 | ✅ 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 通义千问 | ✅ 免费额度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

**就这么简单！** 🎉
