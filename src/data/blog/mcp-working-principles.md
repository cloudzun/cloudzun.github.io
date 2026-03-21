---
title: 'MCP Working Principles: A Deep Dive into Model Context Protocol'
pubDatetime: 2026-02-22T04:00:00Z
tags: ['MCP', 'AI', 'Protocol', 'Claude', 'Architecture']


# MCP 工作原理：深入浅出的技术解析

> 本文深入讲解 Model Context Protocol (MCP) 的底层工作机制，帮助你理解 MCP 如何实现 AI 工具的标准化集成。

## 🎯 为什么要了解 MCP 工作原理？

在使用 MCP 之前，你可能会问：为什么要花时间了解这些技术细节？

**三个关键原因：**

1. **排查问题更快** - 知道哪里可能出错，快速定位根因
2. **开发自定义 MCP 时必需** - 理解协议才能正确实现
3. **理解限制** - 知道什么能做、什么不能做

> 💡 **可跳过提示**：如果你只是想使用 MCP，不打算开发自定义服务器，可以跳过本文直接使用现成的 MCP 服务器。

---

## 1️⃣ 传输层：信息怎么传递？

MCP 支持两种传输方式，就像寄快递有两种选择：**面对面交付**和**邮寄**。

### STDIO（标准输入输出）- 面对面交流

**工作原理：**

```
┌──────────────────┐         ┌──────────────────┐
│   MCP Client     │         │   MCP Server     │
│  (Claude Code)   │         │  (subprocess)    │
├──────────────────┤         ├──────────────────┤
│                  │ stdin   │                  │
│  发送请求 ────────┼────────►│  接收并处理      │
│                  │         │                  │
│                  │ stdout  │                  │
│  接收响应 ◄───────┼─────────│  发送响应        │
│                  │         │                  │
│                  │ stderr  │                  │
│  查看日志 ◄───────┼─────────│  输出日志        │
└──────────────────┘         └──────────────────┘
```

**生活类比：**
- STDIO 就像两个人面对面对话
- `stdin` = 听（接收信息）
- `stdout` = 说（发送回复）
- `stderr` = 旁白（日志信息）

**优势：**
- ✅ 简单直接，无需网络配置
- ✅ 性能最优，无网络开销
- ✅ 安全性高，进程级隔离
- ✅ 最适合单客户端场景

**适用场景：**
- 本地工具（filesystem、sqlite）
- 单用户使用
- 不需要远程访问

---

### Streamable HTTP 传输 - 远程通信

**工作原理：**

```
┌──────────────────┐   HTTP   ┌──────────────────┐
│   MCP Client     │  POST    │   MCP Server     │
│                  │────────►│   (Remote)       │
│                  │         │                  │
│                  │  SSE    │                  │
│  接收流式响应 ◄───┼─────────│  流式返回        │
└──────────────────┘         └──────────────────┘
```

**生活类比：**
- HTTP 传输就像打电话
- 可以在不同地点通话
- 但需要电话线（网络）连接

**优势：**
- ✅ 支持远程访问
- ✅ 可多客户端共享
- ✅ 适合分布式部署

**适用场景：**
- 远程服务器
- 多用户共享
- 分布式系统

---

### 传输方式对比

| 特性 | STDIO | HTTP |
|------|-------|------|
| **部署位置** | 本地 | 本地或远程 |
| **网络需求** | 无 | 需要 HTTP |
| **性能** | 最优 | 略有开销 |
| **安全性** | 进程隔离 | 需要认证 |
| **适用场景** | 单客户端本地工具 | 分布式/远程服务 |
| **复杂度** | 简单 | 中等 |
| **推荐度** | ⭐⭐⭐⭐⭐（本地） | ⭐⭐⭐⭐（远程） |

---

## 2️⃣ JSON-RPC：对话的格式

MCP 使用 JSON-RPC 协议通信，就像**对讲机的标准话术**。

### 三种消息类型

#### 1. 请求（Request）- "我要做某事"

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

**字段说明：**
- `jsonrpc`: 协议版本，必须是 "2.0"
- `id`: 请求标识符，用于匹配响应
- `method`: 要调用的方法名
- `params`: 方法参数（可选）

**人话翻译：**
- `id: 1` - 这是第 1 个请求（方便对应回复）
- `method: "read_file"` - 我要读文件
- `params` - 文件路径是这个

---

#### 2. 响应（Response）- "好的，结果是这样"

**成功响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "文件内容..."
      }
    ]
  }
}
```

**错误响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": "详细错误信息"
  }
}
```

**人话翻译：**
- `id: 1` - 这是对第 1 个请求的回复
- `result` - 成功的结果
- `error` - 失败的原因

---

#### 3. 通知（Notification）- "顺便告诉你一声"

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "token-123",
    "progress": 50,
    "total": 100
  }
}
```

**人话翻译：**
- 没有 `id` 字段 - 不需要回复
- 只是告知进度（50/100）

> 💡 **通知 vs 请求**：通知没有 `id` 字段，不需要响应

---

### 标准错误码

| 错误码 | 含义 | 说明 |
|--------|------|------|
| -32700 | Parse error | JSON 解析失败 |
| -32600 | Invalid Request | 请求格式无效 |
| -32601 | Method not found | 方法不存在 |
| -32602 | Invalid params | 参数无效 |
| -32603 | Internal error | 服务器内部错误 |

---

## 3️⃣ 三大组件：MCP 能提供什么？

### Tools（工具）- 可以执行的操作

**类比：**
```
工具箱里的工具
- 锤子 → read_file（读文件）
- 螺丝刀 → write_file（写文件）
- 扳手 → create_issue（创建 Issue）
```

**工具定义示例：**

```json
{
  "name": "read_file",
  "description": "读取指定路径的文件内容",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "文件的绝对路径"
      }
    },
    "required": ["path"]
  }
}
```

**AI 怎么使用工具：**
1. 看到工具列表
2. 选择合适的工具
3. 传入参数
4. 获得结果

---

### Resources（资源）- 可以读取的数据

**类比：**
```
图书馆的书
- 只能看，不能改
- 提供参考信息
```

**资源定义示例：**

```json
{
  "uri": "file:///project/README.md",
  "name": "项目说明文档",
  "mimeType": "text/markdown"
}
```

**AI 怎么使用资源：**
- 读取项目文档
- 获取配置信息
- 查看数据表结构

---

### Prompts（提示词模板）- 预设的交互方式

**类比：**
```
填空表格
- 预先设计好结构
- AI 按模板填写
```

**提示词定义示例：**

```json
{
  "name": "code_review",
  "description": "代码审查提示词模板",
  "arguments": [
    {
      "name": "code",
      "description": "要审查的代码",
      "required": true
    }
  ]
}
```

---

## 4️⃣ 连接生命周期：从启动到关闭

```
1. 初始化阶段（握手）
   Client → Server: initialize 请求（发送客户端能力）
   Server → Client: initialize 响应（发送服务器能力）
   Client → Server: initialized 通知（确认初始化完成）

2. 操作阶段
   Client → Server: 发送各种请求（tools/call, resources/read 等）
   Server → Client: 返回响应或错误
   Server → Client: 可选发送通知（进度更新等）

3. 关闭阶段
   Client/Server: 关闭连接
   Server: 清理资源
```

**人话版本：**

```
1. 初始化（握手）
   Client: "你好，我是 Claude Code，我能做 A、B、C"
   Server: "你好，我是 GitHub MCP，我能提供 X、Y、Z"
   Client: "收到，开始工作吧"

2. 工作阶段
   Client: "帮我读取 README.md"
   Server: "好的，内容是..."
   Client: "帮我创建一个 Issue"
   Server: "已创建，链接是..."

3. 关闭
   Client: "工作完成，再见"
   Server: "再见，清理资源"
```

---

## 💡 实际例子：读取文件的完整流程

让我们通过一个完整的例子，看看 MCP 是如何工作的：

```
1. Claude Code 启动 Filesystem MCP Server
   → 通过 STDIO 建立连接

2. 初始化握手
   Client → Server: "你有什么工具?"
   Server → Client: "我有 read_file、write_file、list_directory"

3. 用户说："读取 package.json"
   
4. Claude Code 调用工具
   Client → Server:
   {
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "read_file",
       "arguments": {"path": "./package.json"}
     }
   }

5. MCP Server 执行并返回
   Server → Client:
   {
     "id": 1,
     "result": {
       "content": [
         {
           "type": "text",
           "text": "{ \"name\": \"my-app\", ... }"
         }
       ]
     }
   }

6. Claude Code 展示结果给用户
   "package.json 内容如下：..."
```

---

## 🎯 关键要点总结

| 概念 | 通俗理解 | 重要性 |
|------|----------|:------:|
| **STDIO** | 面对面对话（本地） | ⭐⭐⭐⭐⭐ |
| **HTTP** | 打电话（远程） | ⭐⭐⭐ |
| **JSON-RPC** | 标准对话格式 | ⭐⭐⭐⭐ |
| **Tools** | 可执行的操作 | ⭐⭐⭐⭐⭐ |
| **Resources** | 可读取的数据 | ⭐⭐⭐ |
| **Prompts** | 预设模板 | ⭐⭐ |

---

## 🔧 为什么这样设计？

### 1. 为什么选择 JSON-RPC？

- ✅ **简单易懂** - JSON 是通用数据格式
- ✅ **跨语言支持** - 几乎所有语言都支持 JSON
- ✅ **易于调试** - 可读性强，方便排查问题
- ✅ **标准化** - JSON-RPC 是成熟的协议标准

### 2. 为什么需要两种传输方式？

- **STDIO** - 满足本地工具的高性能需求
- **HTTP** - 满足远程服务的分布式需求
- 两者互补，覆盖所有使用场景

### 3. 为什么分 Tools、Resources、Prompts？

- **Tools** - 执行操作（写）
- **Resources** - 读取数据（读）
- **Prompts** - 标准化交互（模板）

清晰的职责划分，降低复杂度。

---

## 🚀 下一步

理解了 MCP 工作原理后，你可以：

1. **更好地排查问题** - 知道哪里可能出错
2. **开发自定义 MCP 服务器** - 理解协议才能正确实现
3. **优化 MCP 配置** - 知道如何选择合适的传输方式

**推荐阅读：**
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP 规范](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 📚 参考资源

- **MCP 官方文档**: https://modelcontextprotocol.io/
- **MCP 规范**: https://modelcontextprotocol.io/specification/2025-11-25
- **Claude Code MCP 文档**: https://code.claude.com/docs/en/mcp
- **官方服务器仓库**: https://github.com/modelcontextprotocol/servers

---

**作者**: HuaQloud  
**更新日期**: 2026-02-22  
**版本**: V1.0
