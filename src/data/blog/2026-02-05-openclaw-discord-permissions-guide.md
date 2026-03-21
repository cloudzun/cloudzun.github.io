---
title: 'OpenClaw Discord权限配置详解'
pubDatetime: 2026-02-05T03:48:00Z
tags: ['openclaw', 'discord', 'permissions', 'configuration', 'troubleshooting']
description: '技术博客文章'
---

# OpenClaw Discord权限配置详解

在使用OpenClaw与Discord集成时，权限配置是一个常见的挑战。最近我们遇到了一个典型问题：用户无法在Discord频道中执行命令，总是收到"You are not authorized to use this command."的错误提示。

## 问题现象

用户在Discord频道中尝试执行`/new`或其他命令时，机器人返回权限不足的错误。经过调试，我们发现问题根源在于OpenClaw的权限配置。

## 解决方案

通过深入研究OpenClaw文档，我们发现需要在配置文件中正确设置用户授权。以下是完整的解决方案：

### 1. 正确的配置结构

在`~/.openclaw/openclaw.json`中，需要在服务器(guild)配置中添加`users`字段：

```json
{
  "channels": {
```
"discord": {
  "enabled": true,
  "token": "YOUR_BOT_TOKEN",
  "groupPolicy": "allowlist",
  "guilds": {
    "YOUR_GUILD_ID": {
      "requireMention": false,
      "users": ["USER_ID_1", "USER_ID_2"],  // 指定允许的用户ID
      "channels": {
        "CHANNEL_ID_1": {
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

### 2. 权限策略说明

- `groupPolicy: "open"` - 允许所有用户在配置的频道中执行命令（安全性较低）
- `groupPolicy: "allowlist"` - 仅允许在`users`数组中指定的用户执行命令（安全性较高）
- `groupPolicy: "disabled"` - 完全禁用群组访问

### 3. 多层级权限配置

OpenClaw支持多层级的权限配置：

- **服务器级别**: 在`guilds.<guild_id>.users`中指定整个服务器的允许用户
- **频道级别**: 在`guilds.<guild_id>.channels.<channel_id>.users`中指定特定频道的允许用户

## 实施步骤

1. 确定需要授权的用户Discord ID
2. 编辑OpenClaw配置文件，添加对应的`users`数组
3. 将`groupPolicy`设置为`"allowlist"`
4. 重启OpenClaw服务使配置生效：`openclaw gateway restart`

## 注意事项

- 配置修改后必须重启服务才能生效
- 使用`allowlist`策略比`open`策略更安全
- 确保用户ID格式正确（纯数字字符串）
- 可以同时配置服务器级别和频道级别的权限，频道级别会覆盖服务器级别的设置

## 总结

通过正确配置用户授权，我们可以精确控制谁能在Discord频道中使用OpenClaw的功能，既保证了功能性又确保了安全性。这个配置方法对于管理多人协作的Discord服务器特别有用。