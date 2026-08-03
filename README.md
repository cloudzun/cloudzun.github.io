# CloudZun Blog

![cloudzun-og](public/cloudzun-og.jpg)

[![Live Site](https://img.shields.io/badge/site-www.cloudzun.com-006cac?style=for-the-badge)](https://www.cloudzun.com)
![Astro](https://img.shields.io/badge/Astro-7-FF5D01?style=for-the-badge&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/github/license/cloudzun/cloudzun.github.io?color=%232F3741&style=for-the-badge)

CloudZun 的个人技术博客，分享 AI 协同编程、Agentic AI 工作流与自动化实践。
基于 [AstroPaper](https://github.com/satnaing/astro-paper) v5.5.1 主题构建，保持原版的简洁视觉，运行在 Astro 7 + Tailwind CSS 4 之上。

## ✨ 特性

- 浅色 / 深色主题，跟随系统偏好
- 全文搜索（Pagefind，支持 `?q=` 直达搜索结果）
- RSS、Sitemap、SEO 与结构化数据
- 品牌化社交分享图（1200×630，可用脚本重新生成）
- 归档页、标签页、分页文章列表
- shiki 代码高亮与文件名标注
- 中英双语内容，115+ 篇文章
- GitHub Pages 自动部署 + 自定义域名

## 🧰 技术栈

| 用途      | 技术                                                  |
| --------- | ----------------------------------------------------- |
| 框架      | [Astro](https://astro.build) 7（静态生成）            |
| 样式      | Tailwind CSS 4                                        |
| 语言      | TypeScript                                            |
| 搜索      | [Pagefind](https://pagefind.app)                      |
| 代码高亮  | shiki + @shikijs/transformers                         |
| OG 图生成 | satori + @resvg/resvg-js（`scripts/generate-og.mjs`） |
| 部署      | GitHub Actions → GitHub Pages                         |

## 📁 项目结构

```text
/
├── public/          # 静态资源（favicon、OG 图）
├── src/
│   ├── components/  # UI 组件（Header、Card、Tag 等）
│   ├── data/blog/   # 博客文章（Markdown + frontmatter）
│   ├── layouts/     # 页面布局（Layout、PostDetails、Main 等）
│   ├── pages/       # 路由页面（首页、文章、标签、归档、搜索等）
│   ├── styles/      # 全局样式（Tailwind 主题变量）
│   └── config.ts    # 站点配置
└── astro.config.ts
```

## 🚀 本地开发

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器（http://localhost:4321）
pnpm build         # 生产构建（astro check + build + pagefind）
pnpm preview       # 预览生产构建
pnpm lint          # ESLint
pnpm format        # Prettier 格式化
```

## ✍️ 写文章

在 `src/data/blog/` 下新建 Markdown 文件，frontmatter 支持以下字段：

```yaml
---
title: 文章标题
description: 文章描述
pubDatetime: 2026-08-03T10:00:00Z
modDatetime: 2026-08-04T10:00:00Z # 可选
tags: ["AI", "自动化"] # 可选，默认 ["others"]
featured: true # 可选，首页置顶
draft: true # 可选，草稿不发布
ogImage: /path/to/image.png # 可选，覆盖默认分享图
---
```

## ⚙️ 配置

站点名称、简介、社交链接等都在 `src/config.ts` 中维护；标签与主题切换沿用原版 AstroPaper 的设计。

## 🛡️ 质量与安全

- CI（`lint` / `format` / `astro check` / `build`）运行在 Node 22
- Dependabot 自动安全更新已启用，所有已知告警均已清零
- HTML 内置 Content-Security-Policy，Actions 保持最新版本
- GitHub Actions 权限遵循最小化原则

## 📄 致谢

本站基于 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT，[Sat Naing](https://satnaing.dev)）主题构建。
