# CloudZun - Personal Website

🌐 **Live Site**: [www.cloudzun.com](https://www.cloudzun.com)

我的个人网站和博客，使用 Astro 构建，展示我的项目、技术栈和技术文章。

## 🛠️ 技术栈

- **Framework**: [Astro](https://astro.build/) - 现代化静态网站生成器
- **Hosting**: [GitHub Pages](https://pages.github.com/)
- **Language**: TypeScript
- **Content**: Markdown/MDX

## 📁 项目结构

```
├── public/              # 静态资源（favicon, CNAME 等）
├── src/
│   ├── components/      # Astro 组件
│   ├── content/blog/    # 博客文章
│   ├── layouts/         # 页面布局
│   ├── pages/           # 页面
│   │   ├── index.astro      # 首页
│   │   ├── about.astro      # 关于页面
│   │   ├── projects.astro   # 项目页面
│   │   └── blog/            # 博客列表和文章
│   ├── consts.ts        # 全局配置（SITE, PROJECTS 等）
│   └── styles/          # 全局样式
├── astro.config.mjs
└── package.json
```

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📝 添加博客文章

在 `src/content/blog/` 目录下创建新的 `.md` 文件：

```markdown
---
title: '文章标题'
description: '文章描述'
pubDate: 'Mar 21 2026'
heroImage: '../assets/cover.jpg'
---

文章内容...
```

## 🎨 自定义内容

编辑 `src/consts.ts` 来修改：

- 网站标题和描述
- 社交媒体链接
- 技术栈列表
- 精选项目

## 📄 License

MIT

---

Built with ❤️ using Astro
