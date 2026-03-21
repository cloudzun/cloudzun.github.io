---
title: 'M7 Stock Analysis - Cron Job Setup Guide'
pubDatetime: 2026-02-13T01:00:00Z
tags: ['M7', 'cron', 'automation', 'scheduling', 'linux', 'setup-guide']


# M7 Stock Analysis - Cron Job Setup Guide

## 🎯 概述

本指南介绍如何设置 M7 Stock Analysis Skill 的定时任务，实现每周自动运行分析。

## ✅ 当前配置

**已成功设置的定时任务**:

```bash
0 6 * * 6 /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>&1
```

**运行时间**: 每周六北京时间早上 6 点  
**日志文件**: `/tmp/m7_analysis.log`  
**状态**: ✅ 已激活

## 📊 Cron 表达式详解

```
0 6 * * 6
│ │ │ │ └─ 星期几 (0=周日, 1=周一, ..., 6=周六)
│ │ │ └─── 月份 (1-12, * 表示每月)
│ │ └───── 日期 (1-31, * 表示每天)
│ └─────── 小时 (0-23, 6 表示早上 6 点)
└───────── 分钟 (0-59, 0 表示整点)
```

**结果**: 每周六早上 6 点运行

## 🔍 验证和管理

### 查看当前 Crontab 任务

```bash
crontab -l
```

**输出示例**:
```
# M7 Stock Analysis - Every Saturday 6 AM Beijing Time
# 每周六北京时间早上 6 点运行 M7 分析
0 6 * * 6 /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>&1
```

### 编辑 Crontab 任务

```bash
crontab -e
```

这会打开一个编辑器，允许你修改 crontab 任务。

### 删除 Crontab 任务

```bash
crontab -r
```

**警告**: 这会删除所有 crontab 任务！

## 📝 查看执行日志

### 实时查看日志

```bash
tail -f /tmp/m7_analysis.log
```

按 `Ctrl+C` 退出。

### 查看最近 50 行

```bash
tail -50 /tmp/m7_analysis.log
```

### 查看特定日期的日志

```bash
grep "2026-02-" /tmp/m7_analysis.log
```

### 统计成功和失败

```bash
echo "成功次数: $(grep '✅' /tmp/m7_analysis.log | wc -l)"
echo "失败次数: $(grep '❌' /tmp/m7_analysis.log | wc -l)"
```

## ⏰ 运行时间表

**北京时间 (UTC+8)**:

| 时间 | 事件 |
|------|------|
| 06:00 | M7 分析开始 |
| 06:00-06:10 | Yahoo Finance 数据采集 |
| 06:10-06:15 | SearxNG 新闻采集 |
| 06:15-06:17 | 报告生成 |
| 06:17-06:20 | 发布到博客 |
| 06:20 | 完成，报告已发布 |

**预期总耗时**: 10-20 分钟

## 📍 发布位置

每周六早上 6 点运行后，报告会自动发布到:

**内网博客**:
```
http://localhost:1313/posts/m7_weekly_analysis_YYYY-MM-DD/
```

**外网博客** (Vercel):
```
https://blog.huaqloud.com/posts/m7_weekly_analysis_YYYY-MM-DD/
```

## 🛠️ 常用的 Cron 时间表达式

### 每天运行

```bash
# 每天早上 9 点
0 9 * * * /path/to/script.sh

# 每天下午 3 点
0 15 * * * /path/to/script.sh

# 每天晚上 11 点
0 23 * * * /path/to/script.sh
```

### 每周运行

```bash
# 每周一早上 9 点
0 9 * * 1 /path/to/script.sh

# 每周五下午 3 点
0 15 * * 5 /path/to/script.sh

# 每周六早上 6 点 (当前配置)
0 6 * * 6 /path/to/script.sh

# 每周日晚上 8 点
0 20 * * 0 /path/to/script.sh
```

### 每月运行

```bash
# 每月 1 号早上 9 点
0 9 1 * * /path/to/script.sh

# 每月 15 号晚上 8 点
0 20 15 * * /path/to/script.sh

# 每月最后一天早上 9 点
0 9 L * * /path/to/script.sh
```

### 每 N 小时/分钟运行

```bash
# 每 6 小时运行一次
0 */6 * * * /path/to/script.sh

# 每 30 分钟运行一次
*/30 * * * * /path/to/script.sh

# 每 15 分钟运行一次
*/15 * * * * /path/to/script.sh

# 每小时运行一次
0 * * * * /path/to/script.sh
```

## 💡 提示和最佳实践

### 1. 日志管理

日志文件会持续增长，可以定期清理:

```bash
# 删除 30 天前的日志
find /tmp -name "m7_analysis.log" -mtime +30 -delete

# 或者定期清空日志
> /tmp/m7_analysis.log
```

### 2. 错误处理

如果脚本失败，检查日志:

```bash
tail -50 /tmp/m7_analysis.log
```

常见问题:
- SearxNG Wrapper 未运行
- Hugo 博客目录不存在
- 网络连接问题

### 3. 权限检查

确保脚本有执行权限:

```bash
ls -l /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh
```

输出应该显示 `x` 权限:
```
-rwxrwxr-x 1 chengzh chengzh 3.0K Feb 13 08:15 m7_analysis.sh
```

### 4. 依赖服务检查

确保所有依赖服务正常运行:

```bash
# 检查 SearxNG Wrapper
curl http://127.0.0.1:8765/

# 检查 Hugo 博客
ls -l /home/chengzh/myblog/content/posts/

# 检查 Git
cd /home/chengzh/clean-vercel-blog && git status
```

### 5. 测试运行

在设置 cron 之前，手动测试脚本:

```bash
cd /home/chengzh/clawd/skills/m7-stock-analysis
./m7_analysis.sh --skip-publish
```

这会生成报告但不发布，方便测试。

## 🔄 修改定时任务

### 修改运行时间

```bash
# 编辑 crontab
crontab -e

# 找到 M7 分析的行，修改时间
# 例如改为每周一早上 9 点:
0 9 * * 1 /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>&1

# 保存并退出
# Vim: :wq
# Nano: Ctrl+X, Y, Enter
```

### 添加额外的定时任务

```bash
crontab -e

# 添加新行
0 15 * * 5 /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>&1
```

现在脚本会在周六早上 6 点和周五下午 3 点各运行一次。

### 禁用定时任务

```bash
# 编辑 crontab
crontab -e

# 在任务前添加 # 注释
# 0 6 * * 6 /home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>&1
```

## 🐛 故障排除

### 问题 1: 任务没有执行

**检查清单**:
1. 确认 crontab 任务已设置: `crontab -l`
2. 检查系统时间是否正确: `date`
3. 检查 cron 守护进程是否运行: `ps aux | grep cron`
4. 查看系统日志: `tail -50 /var/log/syslog`

### 问题 2: 脚本执行失败

**检查步骤**:
1. 查看日志: `tail -50 /tmp/m7_analysis.log`
2. 手动运行脚本: `./m7_analysis.sh`
3. 检查依赖服务: SearxNG, Hugo, Git
4. 检查权限: `ls -l /path/to/script.sh`

### 问题 3: 日志文件过大

**解决方案**:
```bash
# 清空日志
> /tmp/m7_analysis.log

# 或者删除旧日志
find /tmp -name "m7_analysis.log" -mtime +30 -delete
```

## 📊 监控 Cron 任务

### 使用系统日志

```bash
# 查看 cron 日志
grep CRON /var/log/syslog | tail -20

# 或者
tail -f /var/log/syslog | grep CRON
```

### 创建监控脚本

```bash
#!/bin/bash
# 检查 M7 分析是否在指定时间运行

LOG_FILE="/tmp/m7_analysis.log"
LAST_RUN=$(stat -c %Y "$LOG_FILE" 2>/dev/null || echo 0)
NOW=$(date +%s)
DIFF=$((NOW - LAST_RUN))

# 如果 24 小时内没有运行，发送警告
if [ $DIFF -gt 86400 ]; then
  echo "警告: M7 分析在过去 24 小时内没有运行"
  # 可以发送邮件或通知
fi
```

## 📚 参考资源

- [Crontab 官方文档](https://linux.die.net/man/5/crontab)
- [Cron 表达式生成器](https://crontab.guru/)
- [Linux Cron 教程](https://www.cyberciti.biz/faq/how-to-use-crontab-in-linux/)

## 🎯 总结

✅ **已设置**: 每周六北京时间早上 6 点自动运行 M7 分析  
✅ **日志**: 所有执行日志保存到 `/tmp/m7_analysis.log`  
✅ **发布**: 报告自动发布到内外网博客  
✅ **完全自动**: 无需任何手动干预  

---

**版本**: 1.0  
**最后更新**: 2026-02-13  
**作者**: HuaQloud AI Assistant

*如有任何问题，请查看日志文件或参考本指南的故障排除部分。*
