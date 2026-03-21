---
title: 'M7 Stock Analysis Skill - Installation and Usage Guide'
description: 'M7 Stock Analysis Skill - 安装和使用指南 🎯 概述 M7 Stock Analysis Skill 已完全集成到 OpenClaw 生态系统中，可以直接使用。这个 Skill 提供了一个完整的、可重复使用的 M7 股票分析自动化流程。
'
pubDatetime: 2026-03-21T00:00:00Z
tags: ['m7', 'skill', 'automation', 'stock-analysis', 'installation-guide']
---

M7 Stock Analysis Skill - 安装和使用指南
🎯 概述
M7 Stock Analysis Skill 已完全集成到 OpenClaw 生态系统中，可以直接使用。这个 Skill 提供了一个完整的、可重复使用的 M7 股票分析自动化流程。
✅ 安装状态
✅ Skill 已安装
   位置: /home/chengzh/clawd/skills/m7-stock-analysis/
   
✅ 文件结构完整
   - SKILL.md (Skill 标准文档)
   - README.md (完整使用文档)
   - m7_analysis.sh (Bash 包装脚本)
   - scripts/m7_analysis.py (Python 核心脚本)
   - references/ (参考文档)
   - templates/ (报告模板)

✅ 权限已配置
   - m7_analysis.sh (可执行)
   - m7_analysis.py (可执行)
🚀 快速开始
方式 1: 使用 Bash 脚本（最简单）
1
2
3
4
5
6
7
8
# 进入 Skill 目录
cd
/home/chengzh/clawd/skills/m7-stock-analysis
# 运行分析
./m7_analysis.sh
# 查看帮助
./m7_analysis.sh --help
方式 2: 直接运行 Python
1
2
3
4
5
# 今天的分析
python3 /home/chengzh/clawd/skills/m7-stock-analysis/scripts/m7_analysis.py
# 指定日期
python3 /home/chengzh/clawd/skills/m7-stock-analysis/scripts/m7_analysis.py --date 2026-02-20
方式 3: 从 OpenClaw 调用
1
2
# 在 OpenClaw 中直接调用
sessions_spawn
task
=
"Run M7 stock analysis"
--agentId main
📋 使用示例
示例 1: 今天的完整分析
1
./m7_analysis.sh
预期输出
:
╔════════════════════════════════════════════════════════════════╗
║          M7 Stock Analysis Skill - Starting                   ║
╚════════════════════════════════════════════════════════════════╝

【第一步】采集 Yahoo Finance 数据...
✅ AAPL (Apple) - 价格: $261.73, 1年收益: +8.84%
✅ MSFT (Microsoft) - 价格: $401.84, 1年收益: -1.40%
✅ GOOG (Alphabet) - 价格: $309.37, 1年收益: +65.30%
...

【第二步】采集 SearxNG 新闻...
✅ AAPL - 找到 9 条新闻
✅ MSFT - 找到 10 条新闻
...

【第三步】生成分析报告...
✅ 英文报告已保存: /tmp/m7_weekly_analysis_2026-02-13.md
✅ 中文报告已保存: /tmp/m7_detailed_analysis_cn_2026-02-13.md

【第四步】发布报告到 Hugo 博客...
✅ 英文报告发布成功
✅ 中文报告发布成功
✅ Git 提交成功
✅ GitHub 推送成功

✅ M7 分析流程完成！

📊 访问报告:
  内网: http://localhost:1313/posts/
  外网: https://blog.huaqloud.com/posts/
示例 2: 指定日期分析
1
./m7_analysis.sh --date 2026-02-20
示例 3: 仅生成报告，不发布
1
./m7_analysis.sh --skip-publish
用途
:
测试报告内容
手动审核后再发布
调试和开发
示例 4: 定时运行
1
2
3
4
5
6
7
8
# 编辑 crontab
crontab -e
# 添加定时任务（每周五下午 3 点）
0
15
* *
5
/home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>
&
1
# 保存并退出
# Ctrl+X, Y, Enter
示例 5: 查看日志
1
2
3
4
5
6
7
8
9
# 实时查看日志
tail -f /tmp/m7_analysis.log
# 查看特定日期的日志
grep
"2026-02-13"
/tmp/m7_analysis.log
# 统计成功/失败
echo
"成功次数:
$(
grep
'✅'
/tmp/m7_analysis.log
|
wc -l
)
"
echo
"失败次数:
$(
grep
'❌'
/tmp/m7_analysis.log
|
wc -l
)
"
📊 输出和访问
生成的报告文件
/tmp/m7_weekly_analysis_2026-02-13.md         (英文版)
/tmp/m7_detailed_analysis_cn_2026-02-13.md    (中文版)
发布位置
内网 (Local Hugo):
  http://localhost:1313/posts/m7_weekly_analysis_2026-02-13/

外网 (Vercel):
  https://blog.huaqloud.com/posts/m7_weekly_analysis_2026-02-13/
Git 提交
1
2
3
4
5
6
7
8
# 查看最新提交
cd
/home/chengzh/clean-vercel-blog
git log --oneline -5
# 输出示例
c9eb373 Publish: M7 Weekly Stock Performance Analysis
c677725 Publish: M7 最近一周股票表现分析报告 - 深度分析
...
🔧 配置检查
检查依赖
1
2
3
4
5
6
# 检查 Python 依赖
pip list
|
grep -E
"yfinance|requests"
# 输出应该显示:
# yfinance          0.2.X
# requests          2.X.X
检查服务
1
2
3
4
5
6
7
8
9
# 检查 SearxNG Wrapper
curl http://127.0.0.1:8765/
# 检查 Hugo 博客目录
ls -l /home/chengzh/myblog/content/posts/
|
tail -3
ls -l /home/chengzh/clean-vercel-blog/content/posts/
|
tail -3
# 检查 blog-publish 脚本
python3 /home/chengzh/clawd/skills/blog-publish/scripts/publish_blog.py --help
📚 文件结构
/home/chengzh/clawd/skills/m7-stock-analysis/
├── SKILL.md                          # Skill 标准文档
├── README.md                         # 完整使用文档
├── INSTALLATION_GUIDE.md             # 安装和使用指南
├── m7_analysis.sh                    # Bash 包装脚本
├── scripts/
│   └── m7_analysis.py               # Python 核心脚本
├── references/
│   ├── M7_STOCKS.json               # M7 公司列表
│   └── INVESTMENT_FRAMEWORK.md      # 投资分析框架
└── templates/
    ├── english_report_template.md
    └── chinese_report_template.md
📚 文档导航
文档
用途
位置
SKILL.md
Skill 标准文档
本目录
README.md
完整使用文档
本目录
INSTALLATION_GUIDE.md
安装和使用指南
本文件
INVESTMENT_FRAMEWORK.md
投资分析框架
references/
M7_STOCKS.json
M7 公司列表
references/
🎓 学习路径
初级用户
阅读本文档的"快速开始"部分
运行
./m7_analysis.sh
进行第一次分析
查看生成的报告
阅读 README.md 了解更多
中级用户
学习使用
--date
和
--skip-publish
选项
设置 Cron 定时运行
查看日志和调试
阅读 INVESTMENT_FRAMEWORK.md 理解分析方法
高级用户
修改 Python 脚本以自定义分析
集成到其他工作流
扩展报告模板
贡献改进和新功能
🐛 常见问题
Q1: 如何修改分析日期?
1
./m7_analysis.sh --date 2026-02-20
Q2: 如何仅生成报告不发布?
1
./m7_analysis.sh --skip-publish
Q3: 如何定时运行?
1
2
3
4
5
# 编辑 crontab
crontab -e
# 添加:
0
15
* *
5
/home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh >> /tmp/m7_analysis.log 2>
&
1
Q4: 如何查看日志?
1
tail -f /tmp/m7_analysis.log
Q5: 如何修改 SearxNG API Key?
1
2
3
4
5
# 编辑 Python 脚本
nano /home/chengzh/clawd/skills/m7-stock-analysis/scripts/m7_analysis.py
# 找到并修改:
SEARXNG_API_KEY
=
"NEW_KEY_HERE"
🔄 更新和维护
检查更新
1
2
3
4
5
# 查看 Skill 目录
ls -lh /home/chengzh/clawd/skills/m7-stock-analysis/
# 查看最新的分析报告
ls -lh /tmp/m7_*.md
|
tail -5
定期维护
1
2
3
4
5
6
7
8
# 每月检查一次依赖
pip list
|
grep -E
"yfinance|requests"
# 检查服务状态
curl http://127.0.0.1:8765/
# 清理旧报告（可选）
find /tmp -name
"m7_*.md"
-mtime +30 -delete
💡 提示和技巧
技巧 1: 批量分析
1
2
3
4
5
# 分析多个日期
for
date in 2026-02-13 2026-02-20 2026-02-27
;
do
./m7_analysis.sh --date
$date
sleep
60
# 等待 60 秒
done
技巧 2: 后台运行
1
2
3
4
5
# 后台运行分析
nohup ./m7_analysis.sh > /tmp/m7_analysis_
$(
date +%Y%m%d
)
.log 2>
&
1
&
# 查看进程
ps aux
|
grep m7_analysis
技巧 3: 发送通知
1
2
# 分析完成后发送通知
./m7_analysis.sh
&&
echo
"M7 分析完成！"
|
mail -s
"M7 Analysis Done"
your@email.com
技巧 4: 集成到其他脚本
1
2
3
4
5
6
7
8
# 在 Bash 脚本中调用
#!/bin/bash
/home/chengzh/clawd/skills/m7-stock-analysis/m7_analysis.sh
if
[
$?
-eq
0
]
;
then
echo
"分析成功"
else
echo
"分析失败"
fi
🎯 下一步
✅ 运行第一次分析:
./m7_analysis.sh
✅ 查看生成的报告
✅ 阅读 README.md 了解更多
✅ 设置定时运行
✅ 根据需要自定义配置
📞 获取帮助
📖 查看 SKILL.md 了解 Skill 功能
📚 查看 README.md 了解详细用法
🔍 查看 INVESTMENT_FRAMEWORK.md 了解分析方法
🐛 查看日志文件
/tmp/m7_analysis.log
调试问题
🚀 立即开始
1
2
cd
/home/chengzh/clawd/skills/m7-stock-analysis
./m7_analysis.sh
就这么简单！10-20 分钟后，你就会得到专业级的 M7 分析报告。
版本
: 1.0
最后更新
: 2026-02-13
作者
: HuaQloud AI Assistant
维护
: OpenClaw Ecosystem
免责声明: 本指南仅供参考。使用本 Skill 生成的分析报告不构成投资建议。投资有风险，请谨慎决策。