---
title: 'Hugo博客标准部署手册'
pubDatetime: 2026-02-05T02:20:00Z
tags: ['hugo', 'deployment', 'nginx', 'tutorial', 'guide']
description: '本文档详细介绍如何部署和维护一个使用Hugo构建的博客系统，包括本地安装、配置、通过Nginx Proxy Manager发布以及常见问题的解决方法。'
---

# Hugo博客标准部署手册

## 概述
本文档详细介绍如何部署和维护一个使用Hugo构建的博客系统，包括本地安装、配置、通过Nginx Proxy Manager发布以及常见问题的解决方法。

## 一、本地安装Hugo

### 1.1 安装Hugo Extended版本

#### Ubuntu/Debian系统:
```bash
# 使用snap安装（推荐）
sudo snap install hugo --channel=extended

# 或使用包管理器安装
sudo apt update
sudo apt install hugo
```

#### CentOS/RHEL/Fedora系统:
```bash
# 使用dnf安装
sudo dnf install hugo

# 或使用snap
sudo snap install hugo --channel=extended --classic
```

### 1.2 验证安装
```bash
hugo version
```

确保安装的是Extended版本，这对于使用SCSS/SASS等功能很重要。

## 二、创建和配置博客

### 2.1 创建新站点
```bash
hugo new site myblog
cd myblog
```

### 2.2 添加主题
```bash
# 初始化git仓库（推荐）
git init
git submodule add https://github.com/adityatelange/hugo-paper.git themes/hugo-paper

# 或直接克隆主题
git clone https://github.com/adityatelange/hugo-paper.git themes/hugo-paper
```

### 2.3 配置站点
编辑 `hugo.toml` 文件：

```toml
baseURL = 'https://yourdomain.com'
languageCode = 'zh-cn'
title = '我的博客'
theme = 'hugo-paper'

[params]
  description = "欢迎来到我的个人博客"
  author = "Your Name"
  avatar = ""
  footerCopyright = '本博客使用 Hugo Paper 主题构建'
  showMenuItems = 2
  mainSections = ["posts"]

[[menu.main]]
```
name = "首页"
url = "/"
weight = 1
```
[[menu.main]]
```
name = "文章"
url = "/posts/"
weight = 2
```
[[menu.main]]
```
name = "关于"
url = "/about/"
weight = 3
```
```

## 三、Nginx Proxy Manager发布

### 3.1 启动Hugo服务器
```bash
# 在博客目录下执行
hugo server --bind 0.0.0.0 --baseURL https://yourdomain.com --appendPort=false --port 1313
```

**重要参数说明:**
- `--bind 0.0.0.0`: 允许外部访问
- `--baseURL https://yourdomain.com`: 使用你的实际域名
- `--appendPort=false`: 防止在URL后附加端口号
- `--port 1313`: 指定后端端口

### 3.2 Nginx Proxy Manager配置
在Nginx Proxy Manager中创建新代理主机:

**基本信息:**
- Domain Names: `yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `172.17.0.1` (Docker宿主机IP)
- Forward Port: `1313`

**SSL配置:**
- 启用SSL并申请Let's Encrypt证书

## 四、注意事项

### 4.1 配置要点
1. **baseURL设置**: 必须使用实际的公网域名，不能使用localhost
2. **端口绑定**: 使用 `--bind 0.0.0.0` 而非 `--bind 127.0.0.1`
3. **端口追加**: 使用 `--appendPort=false` 避免URL后附加端口号
4. **监听端口**: 选择未被占用的端口，避免冲突

### 4.2 避免常见陷阱
1. **服务冲突**: 检查是否有系统服务自动启动Hugo（如hugo.service）
2. **进程管理**: 使用 `pkill -f hugo` 彻底终止所有Hugo进程
3. **权限问题**: 确保对博客目录有读写权限

## 五、常见问题排查

### 5.1 端口被占用
**症状**: `listen tcp 0.0.0.0:1313: bind: address already in use`

**解决方法**:
```bash
# 查找占用端口的进程
sudo ss -tlnp | grep :1313

# 终止Hugo进程
sudo pkill -f hugo

# 或强制终止
sudo kill -9 $(sudo lsof -t -i:1313)
```

### 5.2 自动重启服务
**症状**: Hugo进程被自动重启，无法手动控制

**解决方法**:
```bash
# 检查系统服务
systemctl --user list-unit-files | grep hugo

# 停止并禁用服务
sudo systemctl stop hugo
sudo systemctl disable hugo
```

### 5.3 本地跳转问题
**症状**: 访问域名时跳转到localhost:端口

**解决方法**:
1. 确保baseURL使用公网域名而非localhost
2. 确保使用`--appendPort=false`参数
3. 检查Nginx Proxy Manager的Forward配置

### 5.4 链接跳转到错误地址
**症状**: 页面内的链接跳转到错误地址

**解决方法**:
1. 确保hugo.toml中的baseURL配置正确
2. 重新启动Hugo服务器使配置生效

## 六、维护与更新

### 6.1 日常启动脚本
创建启动脚本 `/home/user/start-hugo.sh`:

```bash
#!/bin/bash
cd /home/user/myblog
pkill -f "hugo server" 2>/dev/null
sleep 2
hugo server --bind 0.0.0.0 --baseURL https://yourdomain.com --appendPort=false --port 1313 &
```

### 6.2 监控脚本
创建监控脚本检查Hugo服务状态:

```bash
#!/bin/bash
if ! pgrep -f "hugo server" > /dev/null; then
```
cd /home/user/myblog
hugo server --bind 0.0.0.0 --baseURL https://yourdomain.com --appendPort=false --port 1313 &
echo "$(date): Hugo restarted" >> /var/log/hugo-monitor.log
```
fi
```

## 七、经验教训总结

### 7.1 今日案例回顾
- **问题**: Hugo服务器启动后仍跳转到localhost地址
- **原因**: baseURL配置不正确，或有系统服务自动重启Hugo
- **解决方案**: 确保baseURL使用公网域名，并停用自动重启服务

### 7.2 最佳实践
1. **操作前确认**: 在修改任何配置前，先确认服务器和域名的关系
2. **渐进式修改**: 避免一次性进行多项修改
3. **验证机制**: 每次修改后验证结果
4. **备份习惯**: 重要配置修改前保留备份
5. **文档记录**: 记录配置和故障排除过程

## 八、附录

### 8.1 常用命令速查
```bash
# 启动Hugo服务器
hugo server --bind 0.0.0.0 --baseURL https://yourdomain.com --appendPort=false --port 1313

# 构建静态文件
hugo

# 创建新文章
hugo new posts/article-name.md

# 查看运行进程
ps aux | grep hugo

# 终止所有Hugo进程
pkill -f hugo
```

### 8.2 故障排除清单
- [ ] 检查baseURL是否使用公网域名
- [ ] 检查是否使用`--bind 0.0.0.0`
- [ ] 检查是否使用`--appendPort=false`
- [ ] 检查端口是否被其他进程占用
- [ ] 检查是否有系统服务自动重启Hugo
- [ ] 检查Nginx Proxy Manager转发配置