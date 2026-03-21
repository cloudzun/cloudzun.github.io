---
title: 'CloudZun 每日速递：从原型到上线的构建实录'
description: '一、项目起点 目标很简单：每天自动聚合 AI 和科技领域的重要资讯，生成一份中文速递，发布到公开页面。
'
pubDatetime: 2026-03-01T00:00:00Z
tags: ['ai', 'github-pages', 'jekyll', '自动化', '新闻聚合']
---

一、项目起点
目标很简单：
每天自动聚合 AI 和科技领域的重要资讯，生成一份中文速递，发布到公开页面
。
选用了开源项目
Horizon
作为基础原型——它具备多源抓取、AI 评分、报告生成的完整流水线，但需要针对实际环境做大量适配。
二、核心架构
数据源 (RSS / GitHub / HN)
        ↓
    内容抓取层
        ↓
    AI 评分过滤 (score ≥ 7.0)
        ↓
    AI 内容摘要生成
        ↓
    Markdown 报告 → GitHub Pages
AI 层使用阿里云百炼
qwen3.5-plus
，通过 OpenAI 兼容接口接入。
三、适配过程与踩坑记录
3.1 AI 分析性能瓶颈
问题
：原始代码对每条资讯串行调用 AI API，25 条内容需要等待很长时间。
解决
：将
analyzer.py
改为 8 路并发（
asyncio.Semaphore(8)
），处理时间大幅压缩。
1
2
3
4
5
6
7
# 改造前：串行
for
item
in
items
:
result
=
await
analyze
(
item
)
# 改造后：并发
semaphore
=
asyncio
.
Semaphore
(
8
)
results
=
await
asyncio
.
gather
(
*
[
analyze
(
item
)
for
item
in
items
])
3.2 数据源大面积失效
问题
：配置的数据源中，多个在 GitHub Actions 环境下完全不可用：
数据源
问题
Reddit (多个子版块)
403 — CI 环境 IP 被封
OpenAI Blog
403 — 主动屏蔽爬虫
The Batch (deeplearning.ai)
404 — URL 已变更
Anthropic News
无 RSS — 纯 Next.js 渲染，数据走 Sanity CMS JSON API
解决
：移除全部失效源，替换为稳定可用的 RSS：
✅ Ars Technica AI
✅ VentureBeat AI
✅ The Verge AI
✅ 保留：HuggingFace Blog、Simon Willison、MIT Technology Review、HackerNews、GitHub
3.3 GitHub Pages 部署踩坑
这是整个过程中坑最多的环节，连续遇到三个独立问题：
坑 1：
_posts/
目录没有同步到 gh-pages 分支
用
git subtree split
提取
docs/
时，报告文件是在 subtree 提取之后才写入的，导致
_posts/
目录缺失。
解决：改用
git worktree
直接操作 gh-pages 分支，手动完整同步。
坑 2：Jekyll 不识别
_posts
文件
Jekyll 对
_posts
目录下的文件名有严格要求，必须以
YYYY-MM-DD-
开头，否则不会被识别为文章。
❌ horizon-2026-03-01-zh.md
✅ 2026-03-01-horizon-zh.md
同步修改了
orchestrator.py
中的文件名生成逻辑，确保后续自动生成的报告格式正确。
坑 3：
.gitignore
排除了
docs/_posts/*.md
原始仓库的
.gitignore
把
docs/_posts/*.md
列为忽略项（可能是为了防止本地测试文件污染仓库），导致 GitHub Actions 生成报告后无法提交。移除该规则后恢复正常。
3.4 资源优化
原始设计生成中英双语报告，每次运行需要两轮完整的 AI 摘要生成。
考虑到目标读者和实际需求，去掉英文版：
config.json
：
languages: ["zh"]
orchestrator.py
：移除多语言循环，固定生成中文版
效果
：每次运行 AI 调用量减少约 50%
四、前端界面迭代
GitHub Pages 使用 Jekyll Cayman 主题，经过几轮调整：
迭代
改动
v1
默认主题，有大量项目介绍文档
v2
去掉文档链接，首页只保留文章列表
v3
首页直接内嵌当日完整报告，历史归档显示最近 6 天链接
v4
压缩 banner 高度到原来 1/4，标题字号缩小
v5
banner 改为水平布局：标题+副标题左对齐，GitHub 链接右对齐
v6
品牌名从 “Horizon” 改为 “CloudZun 每日速递”
v7
报告摘要行加入日期戳
📅 2026-03-01 · 从 N 条资讯中精选出 M 条
五、最终状态
自动运行
：每天 UTC 00:00 via GitHub Actions
数据源
：7 个 RSS + HackerNews + GitHub，约 25-50 条/天
AI 过滤
：评分 ≥ 7.0，精选 10-15 条
输出
：中文速递 Markdown，自动发布到 GitHub Pages
访问地址
：https://cloudzun.github.io/Horizon/
六、经验沉淀
CI 环境与本地环境差异大
：Reddit、部分博客的反爬策略只针对数据中心 IP，本地测试通过不代表 CI 能跑通，需要实际触发 workflow 验证。
静态站点生成器有隐性约定
：Jekyll 的文件名格式、front matter 格式都是硬性要求，不符合规范的文件会被静默忽略，排查起来不直观。
原型适配 > 从零构建
：基于成熟原型快速验证，遇到问题针对性修改，比从头搭建效率高得多——整个项目从 fork 到上线不到一天。