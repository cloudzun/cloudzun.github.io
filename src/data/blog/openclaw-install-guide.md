---
title: 'OpenClaw AI Assistant 完整安装指南（2026 版）'
pubDatetime: 2026-03-10T15:55:00Z
tags: ['OpenClaw', 'AI Assistant', 'Installation', 'Tutorial', 'Claude Code', 'Setup Guide']
mermaid: true---


# OpenClaw AI Assistant 完整安装指南（2026 版）

> **最后更新**: 2026 年 3 月 10 日 | **适用版本**: OpenClaw v2026.3.3+  
> **预计时间**: 30-60 分钟 | **难度**: ⭐⭐⭐☆☆（中等）

---

## 引言：为什么选择 OpenClaw？

OpenClaw 是一个开源的 AI 助手框架，灵感来源于 Anthropic 的 Claude Code。它允许你：

- ✅ **多平台接入** - Discord、Telegram、WhatsApp、微信等
- ✅ **技能扩展** - 自定义技能，连接各种 API 和服务
- ✅ **本地部署** - 数据可控，隐私保护
- ✅ **多模型支持** - Claude、GPT、Qwen、DeepSeek 等
- ✅ **高度定制** - 从配置到代码完全可控

**与商业产品对比**：

| 特性 | OpenClaw | Claude Code | GitHub Copilot |
|------|---------|-------------|---------------|
| 开源 | ✅ 完全开源 | ❌ 闭源 | ❌ 闭源 |
| 自部署 | ✅ 本地运行 | ❌ 云端 | ❌ 云端 |
| 多平台 | ✅ 任意平台 | ⚠️ 仅 VSCode | ⚠️ 仅 IDE |
| 定制化 | ✅ 完全定制 | ❌ 有限 | ❌ 有限 |
| 成本 | 💰 Token 费用 | 💰 $20/月+Token | 💰 $10/月 |
| 上手难度 | ⭐⭐⭐ | ⭐ | ⭐⭐ |

---

## 一、安装前准备

### 1.1 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| 操作系统 | Linux/macOS/WSL2 | Ubuntu 22.04+ / macOS 13+ |
| Node.js | v22.0+ | v22.x LTS |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 500MB | 2GB+ |
| 网络 | 可访问 API | 稳定的国际网络（可选） |

### 1.2 检查当前环境

```bash
# 检查 Node.js 版本
node --version
# 应该看到：v22.x.x

# 检查 npm
npm --version
# 应该看到：10.x.x

# 检查 Git
git --version
# 应该看到：git version 2.x.x
```

**如果 Node.js 版本低于 22**，需要升级（见下文）。

---

## 二、安装步骤

### 2.1 安装 Node.js 22

#### 方式 A：Linux（Ubuntu/Debian）

```bash
# 使用 NodeSource 官方源
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# 验证
node --version  # 应该显示 v22.x.x
npm --version   # 应该显示 10.x.x
```

#### 方式 B：macOS（使用 Homebrew）

```bash
# 如果没有 Homebrew，先安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js 22
brew install node@22

# 验证
node --version
```

#### 方式 C：Windows（使用 WSL2）

```powershell
# 1. 启用 WSL2（管理员 PowerShell）
wsl --install

# 2. 重启电脑，然后打开 Ubuntu

# 3. 在 WSL2 中按 Linux 步骤安装
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

#### 方式 D：使用 NVM（推荐开发者）

```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端或执行
source ~/.bashrc

# 安装 Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# 验证
node --version
```

**国内镜像加速**：
```bash
# NVM 镜像
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node' >> ~/.bashrc
source ~/.bashrc

# npm 镜像
npm config set registry https://registry.npmmirror.com
```

---

### 2.2 安装 OpenClaw

```bash
# 全局安装 OpenClaw
npm install -g openclaw@latest

# 验证安装
openclaw --version
# 应该显示：v2026.3.3 或更新版本
```

**如果安装失败**：

```bash
# 清理 npm 缓存
npm cache clean --force

# 使用 sudo（如果权限不足）
sudo npm install -g openclaw@latest

# 或者检查 npm 权限
npm config get prefix
# 确保你有该目录的写权限
```

---

### 2.3 初始化配置

```bash
# 运行配置向导（会自动启动 Gateway）
openclaw onboard --install-daemon
```

**向导步骤**：

```
1. 安全确认 → 选择 Yes
2. 配置模式 → 选择 QuickStart
3. 模型提供商 → 选择 Custom Provider
4. 输入 API 信息（见下文）
5. 渠道配置 → 暂时跳过（后续配置）
6. 技能配置 → 暂时跳过（后续配置）
```

---

## 三、配置 AI 模型

OpenClaw 本身不包含 AI 模型，需要连接外部 API。以下是常见配置：

### 3.1 推荐：OpenRouter（免费模型，零成本入门）

**优势**：
- ✅ 注册即送免费额度
- ✅ 支持多种免费模型
- ✅ 无需国际信用卡
- ✅ 支持银联/支付宝充值

**步骤**：

#### 第一步：注册账号
1. 访问 [OpenRouter 官网](https://openrouter.ai)
2. 点击 Sign In，支持 Google、GitHub、邮箱注册

#### 第二步：创建 API Key
1. 登录后点击右上角头像 → Settings
2. 左侧菜单选择 API Keys
3. 点击 Create 创建新密钥
4. **立即复制**（只显示一次）

#### 第三步：配置到 OpenClaw

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-你的密钥"
  },
  "models": {
    "mode": "merge",
    "providers": {
      "openrouter": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "apiKey": "${OPENROUTER_API_KEY}",
        "api": "openai-completions",
        "models": [
          { "id": "stepfun/step-3.5-flash:free", "name": "Step 3.5 Flash (Free)" },
          { "id": "deepseek-ai/DeepSeek-V3", "name": "DeepSeek V3" }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/stepfun/step-3.5-flash:free" }
    }
  }
}
```

**推荐免费模型**：
- `stepfun/step-3.5-flash:free` - 阶跃星辰，快速响应
- `google/gemma-2-9b-it:free` - Google Gemma
- `meta-llama/llama-3-8b-instruct:free` - Meta Llama 3

---

### 3.2 备选：硅基流动（国内提供商）

**优势**：
- ✅ 国内访问速度快
- ✅ 新注册送 16 元免费算力
- ✅ 支持支付宝/微信充值

**步骤**：

1. 访问 [硅基流动官网](https://cloud.siliconflow.cn)
2. 手机号注册
3. 进入 [控制台](https://cloud.siliconflow.cn/account/ak) 创建 API Key
4. 配置到 OpenClaw：

```json
{
  "env": {
    "SILICONFLOW_API_KEY": "sk-你的密钥"
  },
  "models": {
    "providers": {
      "siliconflow": {
        "baseUrl": "https://api.siliconflow.cn/v1",
        "apiKey": "${SILICONFLOW_API_KEY}",
        "api": "openai-completions",
        "models": [
          { "id": "deepseek-ai/DeepSeek-V3", "name": "DeepSeek V3" },
          { "id": "Qwen/Qwen2.5-72B-Instruct", "name": "Qwen 2.5 72B" }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "siliconflow/deepseek-ai/DeepSeek-V3" }
    }
  }
}
```

**费用参考**：
- DeepSeek V3：16 元约 800-1500 次对话
- Qwen 2.5 72B：约 0.5 元/千 tokens

---

### 3.3 其他模型提供商

| 提供商 | 官网 | 特点 | 免费额度 |
|-------|------|------|---------|
| 阶跃星辰 | https://platform.stepfun.com | 快速、便宜 | ✅ 有免费模型 |
| 深度求索 | https://platform.deepseek.com | 中文能力强 | ⚠️ 需充值 |
| 通义千问 | https://dashscope.console.aliyun.com | 阿里生态 | ✅ 有免费额度 |
| 月之暗面 | https://platform.moonshot.cn | Kimi 大模型 | ⚠️ 需充值 |
| 腾讯混元 | https://cloud.tencent.com/product/tclm | 腾讯生态 | ✅ hunyuan-lite 免费 |
| OpenAI | https://platform.openai.com | GPT-4 | ❌ 需国际卡 |
| Anthropic | https://console.anthropic.com | Claude | ❌ 需国际卡 |
| Google | https://aistudio.google.com | Gemini | ✅ 有免费额度 |

---

## 四、验证与测试

### 4.1 检查运行状态

```bash
# 查看 Gateway 状态
openclaw status

# 深度健康检查
openclaw status --deep

# 系统诊断
openclaw doctor
```

**预期输出**：
```
✅ Gateway: Running (pid 12345)
✅ Models: 1 provider configured
✅ Channels: 0 configured
✅ Skills: 23 eligible
```

### 4.2 访问控制面板

```bash
openclaw dashboard
```

浏览器会自动打开 http://localhost:18789

**面板功能**：
- 📊 查看运行状态
- 🔧 配置管理
- 📝 查看日志
- 🧪 测试对话

### 4.3 第一次对话

```bash
# 使用 CLI 直接对话
openclaw agent --message "你好，请介绍一下你自己"

# 或者使用交互式模式
openclaw chat
```

**预期响应**：
```
你好！我是你的 AI 助手，基于 OpenClaw 框架运行。
我可以帮你：
- 回答问题
- 编写代码
- 分析文档
- 自动化任务
...
```

---

## 五、配置聊天渠道（可选）

OpenClaw 支持多种聊天平台，以下是常见配置：

### 5.1 Discord（推荐开发者）

```bash
# 1. 创建 Discord Bot
# 访问 https://discord.com/developers/applications
# 创建应用 → Bot → 复制 Token

# 2. 配置到 openclaw.json
{
  "channels": {
    "discord": {
      "accounts": {
        "default": {
          "token": "你的 Discord Bot Token",
          "guilds": {
            "你的服务器 ID": {
              "channels": {
                "你的频道 ID": { "allow": true }
              }
            }
          }
        }
      }
    }
  }
}

# 3. 重启 Gateway
openclaw gateway restart
```

### 5.2 Telegram

```bash
# 1. 联系 @BotFather 创建 Bot
# 发送 /newbot → 设置名称 → 复制 Token

# 2. 配置到 openclaw.json
{
  "channels": {
    "telegram": {
      "accounts": {
        "default": {
          "botToken": "你的 Telegram Bot Token",
          "dmPolicy": "pairing"
        }
      }
    }
  }
}

# 3. 重启 Gateway
openclaw gateway restart
```

### 5.3 微信（需要额外配置）

微信需要第三方桥接服务，参考：
- [WeChatFerry](https://github.com/lich0821/WeChatFerry)
- [Gewechat](https://github.com/Devo919/Gewechat)

---

## 六、常用命令速查

```bash
# ===== 状态检查 =====
openclaw status              # 查看运行状态
openclaw status --deep       # 深度健康检查
openclaw doctor              # 系统诊断和修复
openclaw dashboard           # 打开控制面板

# ===== Gateway 管理 =====
openclaw gateway start       # 启动 Gateway
openclaw gateway stop        # 停止 Gateway
openclaw gateway restart     # 重启 Gateway
openclaw gateway uninstall   # 卸载服务

# ===== 配置管理 =====
openclaw configure           # 重新配置
openclaw onboard             # 运行配置向导
openclaw config.get          # 查看当前配置

# ===== 日志查看 =====
openclaw logs --follow       # 实时查看日志
openclaw logs --tail 100     # 查看最近 100 行

# ===== 对话测试 =====
openclaw agent --message "你好"  # 发送消息
openclaw chat                # 交互式对话

# ===== 技能管理 =====
openclaw skills list         # 列出可用技能
openclaw skills install      # 安装技能

# ===== 其他 =====
openclaw --version           # 查看版本
openclaw --help              # 查看帮助
openclaw uninstall           # 卸载 OpenClaw
```

---

## 七、常见问题与解决方案

### Q1: 提示 "API key not found"

**原因**：配置文件中的 API Key 未正确设置

**解决方案**：
```bash
# 1. 编辑配置文件
nano ~/.openclaw/openclaw.json

# 2. 确保 env 部分有正确的 Key
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-xxxxx"
  }
}

# 3. 重启 Gateway
openclaw gateway restart
```

---

### Q2: Gateway 启动失败

**可能原因**：
1. 端口被占用（18789）
2. 配置文件语法错误
3. Node.js 版本不兼容

**解决方案**：
```bash
# 1. 检查端口占用
lsof -i :18789
# 如果有进程，kill 掉

# 2. 验证配置文件
cat ~/.openclaw/openclaw.json | jq .
# 如果报错，说明 JSON 格式有问题

# 3. 查看详细日志
openclaw logs --tail 200

# 4. 重新安装
npm install -g openclaw@latest --force
openclaw gateway uninstall
openclaw onboard --install-daemon
```

---

### Q3: 模型响应慢或超时

**原因**：
- 网络延迟（国际 API）
- 模型负载高
- Token 过多（上下文太长）

**解决方案**：
1. **切换更快的模型**：
   ```json
   {
     "agents": {
       "defaults": {
         "model": { "primary": "siliconflow/deepseek-ai/DeepSeek-V3" }
       }
     }
   }
   ```

2. **启用 Prompt Caching**（如果支持）：
   ```json
   {
     "models": {
       "providers": {
         "siliconflow": {
           "enablePromptCaching": true,
           "cacheControl": { "type": "ephemeral", "ttlSeconds": 3600 }
         }
       }
     }
   }
   ```

3. **使用国内提供商**：硅基流动、通义千问等

---

### Q4: npm 安装失败

**错误信息**：`EACCES: permission denied`

**解决方案**：
```bash
# 方式 1：使用 sudo
sudo npm install -g openclaw@latest

# 方式 2：修复 npm 权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 然后重新安装
npm install -g openclaw@latest
```

---

### Q5: 国内访问慢

**解决方案**：

1. **使用国内镜像**：
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

2. **使用国内模型提供商**：
   - 硅基流动（深圳）
   - 通义千问（杭州）
   - 腾讯混元（深圳）

3. **配置代理**（如果有）：
   ```bash
   export https_proxy=http://127.0.0.1:7890
   export http_proxy=http://127.0.0.1:7890
   ```

---

## 八、性能优化建议

### 8.1 降低 Token 消耗

```json
{
  "models": {
    "providers": {
      "siliconflow": {
        "enablePromptCaching": true
      }
    }
  },
  "agents": {
    "defaults": {
      "thinking": "off"  // 关闭深度思考（节省 Token）
    }
  }
}
```

### 8.2 提升响应速度

1. **选择更快的模型**：
   - DeepSeek V3 > Qwen 2.5 > Claude Sonnet
   - 免费模型通常较慢

2. **减少上下文**：
   - 定期清理对话历史
   - 使用 `openclaw chat --reset` 重置会话

3. **本地缓存**：
   - 配置 Redis 缓存（进阶）
   - 使用本地模型（Ollama）

### 8.3 生产环境部署

```bash
# 使用 systemd 管理
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway

# 配置 Nginx 反向代理
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 九、下一步学习

安装完成后，建议继续学习：

1. **[技能开发](https://docs.openclaw.ai/tools/skills)** - 自定义技能
2. **[渠道配置](https://docs.openclaw.ai/channels/)** - 接入更多平台
3. **[多 Agent 配置](https://docs.openclaw.ai/tools/multi-agent-sandbox-tools)** - 隔离环境
4. **[安全加固](https://docs.openclaw.ai/gateway/sandboxing)** - 生产部署

**推荐资源**：
- 官方文档：https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- 社区：https://discord.gg/clawd
- 技能市场：https://clawhub.com

---

## 十、总结

### 安装检查清单

- [ ] Node.js 22+ 已安装
- [ ] OpenClaw CLI 已安装
- [ ] Gateway 正在运行
- [ ] 模型 API Key 已配置
- [ ] 能够成功对话
- [ ] （可选）聊天渠道已配置

### 成本估算

| 项目 | 免费方案 | 付费方案 |
|------|---------|---------|
| OpenClaw | ✅ 免费开源 | ✅ 免费开源 |
| 模型 API | ✅ OpenRouter 免费模型 | 💰 $5-20/月 |
| 服务器 | ✅ 本地运行 | 💰 $5-10/月（VPS） |
| 聊天渠道 | ✅ Discord/Telegram 免费 | - |
| **总计** | **$0/月** | **$10-30/月** |

### 时间投入

- **安装配置**：30-60 分钟
- **学习基础**：2-4 小时
- **掌握进阶**：1-2 周
- **开发技能**：持续学习

---

## 附录：完整配置示例

### ~/.openclaw/openclaw.json（硅基流动）

```json
{
  "env": {
    "SILICONFLOW_API_KEY": "sk-xxxxxxxxxxxxx"
  },
  "models": {
    "mode": "merge",
    "providers": {
      "siliconflow": {
        "baseUrl": "https://api.siliconflow.cn/v1",
        "apiKey": "${SILICONFLOW_API_KEY}",
        "api": "openai-completions",
        "enablePromptCaching": true,
        "models": [
          { "id": "deepseek-ai/DeepSeek-V3", "name": "DeepSeek V3" },
          { "id": "Qwen/Qwen2.5-72B-Instruct", "name": "Qwen 2.5 72B" },
          { "id": "Pro/Qwen/Qwen2.5-7B-Instruct", "name": "Qwen 2.5 7B (Fast)" }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "siliconflow/deepseek-ai/DeepSeek-V3",
        "fallback": ["siliconflow/Qwen/Qwen2.5-72B-Instruct"]
      },
      "thinking": "off",
      "sandbox": {
        "mode": "off"
      }
    }
  },
  "channels": {
    "discord": {
      "groupPolicy": "allowlist",
      "accounts": {
        "default": {
          "token": "${DISCORD_BOT_TOKEN}",
          "guilds": {
            "你的服务器 ID": {
              "channels": {
                "你的频道 ID": { "allow": true, "requireMention": false }
              }
            }
          }
        }
      }
    }
  },
  "tools": {
    "elevated": {
      "mode": "allow-once",
      "allowFrom": ["你的 Discord 用户 ID"]
    }
  }
}
```

---

*本文基于官方文档和实际部署经验编写。由于技术快速发展，部分细节可能随版本变化。建议参考 [官方文档](https://docs.openclaw.ai) 获取最新信息。*

*如有问题，欢迎在 GitHub 提 Issue 或加入 Discord 社区讨论。*
