---
title: 'OpenClaw与Discord集成完整指南'
featured: true
pubDatetime: 2026-02-04T12:01:00Z
tags: ['openclaw', 'discord', 'integration', 'tutorial']
description: '技术博客文章'
---

# OpenClaw与Discord集成完整指南

## 概述

本文档详细介绍了如何将OpenClaw与Discord进行集成，实现机器人在指定频道中自动响应消息的功能。我们将从初始设置到频道配置，提供一个完整的操作指南。

## 准备工作

在开始配置之前，您需要准备以下内容：

1. **Discord开发者账户**：用于创建机器人应用
2. **Discord服务器管理员权限**：用于邀请机器人并设置权限
3. **OpenClaw系统**：确保OpenClaw已正确安装并运行

## 第一步：创建Discord机器人

### 1. 在Discord开发者门户创建应用

首先访问 [Discord Developer Portal](https://discord.com/developers/applications)，创建一个新的应用程序：

- 点击"New Application"按钮
- 为应用命名（例如"OpenClaw-Bot"）
- 记下应用程序的Client ID，稍后会用到

### 2. 创建机器人

在应用页面中：

- 点击"Bot"选项卡
- 点击"Add Bot"按钮
- 确保"PUBLIC BOT"选项根据需要设置（通常关闭以限制邀请范围）

### 3. 配置机器人权限

在Bot选项卡中，确保启用以下权限：

- `MESSAGE CONTENT INTENT`（重要：这是OpenClaw读取消息所必需的）
- `SERVER MEMBERS INTENT`
- `GUILD MESSAGES INTENT`

## 第二步：获取机器人令牌

在Bot选项卡中：

- 找到"TOKEN"区域
- 点击"Copy"按钮复制令牌
- **注意**：这是敏感信息，请妥善保管

## 第三步：邀请机器人到服务器

使用以下URL格式邀请机器人到您的服务器：

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877992961&scope=bot
```

将`YOUR_CLIENT_ID`替换为您在第一步中记下的Client ID。

## 第四步：配置OpenClaw

### 1. 启用开发者模式

在Discord客户端中：

- 打开"User Settings"（用户设置）
- 进入"Advanced"（高级）
- 启用"Developer Mode"（开发者模式）

### 2. 获取服务器ID和频道ID

- 右键点击服务器图标 → "Copy ID" 获取服务器ID（Guild ID）
- 右键点击频道 → "Copy ID" 获取频道ID

### 3. 编辑OpenClaw配置文件

编辑 `~/.openclaw/openclaw.json` 文件，添加Discord配置：

```json
{
  "channels": {
```
"discord": {
  "enabled": true,
  "token": "YOUR_BOT_TOKEN_HERE",
  "groupPolicy": "allowlist",
  "guilds": {
    "YOUR_GUILD_ID_HERE": {
      "requireMention": false,
      "channels": {
        "YOUR_CHANNEL_ID_HERE": {
          "allow": true,
          "requireMention": false
        }
      }
    }
  }
}
```
  }
}
```

**重要说明**：
- 将`YOUR_BOT_TOKEN_HERE`替换为实际的机器人令牌
- 将`YOUR_GUILD_ID_HERE`替换为服务器ID
- 将`YOUR_CHANNEL_ID_HERE`替换为频道ID

## 第五步：验证配置

### 1. 检查配置语法

在终端中运行以下命令验证配置：

```bash
# 检查配置文件语法
jq empty ~/.openclaw/openclaw.json

# 检查OpenClaw服务状态
systemctl --user status openclaw-gateway
```

### 2. 重启OpenClaw服务

```bash
systemctl --user restart openclaw-gateway
```

## 第六步：测试连接

### 1. 检查频道列表

使用OpenClaw的消息工具检查可用频道：

```bash
# 获取频道列表
message action=channel-list channel=discord guildId=YOUR_GUILD_ID
```

### 2. 发送测试消息

在配置的Discord频道中发送一条消息，确认机器人能够接收到并响应。

## 常见问题排查

### 机器人不响应消息

- 检查`MESSAGE CONTENT INTENT`是否在开发者门户中启用
- 验证配置文件中的服务器ID和频道ID是否正确
- 确认机器人在频道中有读写权限

### 配置文件语法错误

- 使用`jq`工具验证JSON语法
- 确保所有引号、括号和逗号使用正确

### 频道ID错误

- 重新启用开发者模式并获取正确的频道ID
- 使用`message action=channel-list`命令验证频道ID

## 添加新频道

当您需要将机器人添加到新频道时：

1. 获取新频道的ID
2. 更新配置文件，在相应服务器下添加新的频道条目
3. 重启服务使配置生效

示例：

```json
"channels": {
  "YOUR_EXISTING_CHANNEL_ID": {
```
"allow": true,
"requireMention": false
```
  },
  "YOUR_NEW_CHANNEL_ID": {
```
"allow": true,
"requireMention": false
```
  }
}
```

## 安全注意事项

- 不要在公共场合暴露机器人令牌
- 定期检查频道访问权限
- 使用allowlist策略限制机器人仅在授权频道中响应

## 结论

通过以上步骤，您应该成功将OpenClaw与Discord集成了。机器人现在可以在指定的频道中自动响应消息，并可以根据需要扩展到更多频道。

这种集成提供了强大的自动化能力，让您可以从Discord直接与OpenClaw交互，提升了工作效率和便捷性。