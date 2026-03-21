---
title: '从 Next.js 到 Hugo：一次技术选型的反思与教训'
pubDatetime: 2026-02-06T00:00:00Z
tags: ['Hugo', 'Next.js', '技术选型', '重构', '反思']
description: '技术博客文章'
---

## 前言

这是一个关于"绕了一大圈才发现最简单的方案就在眼前"的真实故事。如果你也曾在技术选型上犹豫不决，在自己造轮子和使用成熟方案之间纠结，那么这篇文章或许能给你一些启发。

## 项目背景

最初的目标很简单：搭建一个个人博客，内容用 Markdown 编写，能部署到 Vercel 上。看起来是个再普通不过的需求。

## 第一阶段：Next.js + 手工样式

### 初始方案

我选择了 Next.js 14 + App Router，理由是：
- 现代化的 React 框架
- 支持静态生成（SSG）
- Vercel 原生支持，部署方便
- 可以用 Tailwind CSS 自定义样式

### 开始的困境

很快就遇到了第一个问题：样式。我之前有一个用 Hugo Paper 主题的博客，视觉效果很不错。于是我决定"迁移"样式到 Tailwind CSS。

这个决定让我陷入了一个漫长的坑：

1. **手工复刻 CSS**: 尝试用 Tailwind 工具类重写 Hugo Paper 的样式
2. **细节调整无穷无尽**: 间距、字号、行高、颜色...每个细节都需要反复调试
3. **代码膨胀**: `app/globals.css` 膨胀到 370+ 行自定义样式
4. **效果不理想**: 
   - 文章内容没有居中
   - 代码块样式简陋（只有阴影，没有语法高亮）
   - 标签显示不美观
   - 导航逻辑不够优雅

### 第一次"灵机一动"

失望之余，我想："既然手工写这么麻烦，为什么不用成熟的框架？"于是决定使用：

- **@tailwindcss/typography**: Tailwind 官方的排版插件
- **rehype-prism-plus**: 专业的语法高亮
- **Prism Night Owl 主题**: 精美的代码配色

这次重构让情况好转了不少：
- CSS 从 370 行减少到 130 行
- 代码块终于有了专业的语法高亮
- 排版更加规范

但还是有问题...

## 第二阶段：深度定制的陷阱

### 永无止境的调整

即使用了成熟插件，我还是在不断调整：

- 修改 `tailwind.config.js` 自定义颜色系统
- 调整 typography 插件的配置
- 写自定义 CSS 覆盖默认样式
- 创建视觉回归测试工具（`tools/visual-check.js`）
- 反复对比截图，调整像素级差异

Git 提交记录里满是这样的消息：
- "Tailwind: revert article sizing/spacing towards Hugo defaults"
- "Complete Tailwind article body migration: enhanced typography..."
- "Major refactor: Use Tailwind Typography and Prism..."

### 代码仓库的膨胀

项目逐渐变得臃肿：
- `app/` 目录：Next.js 页面和组件
- `components/`：自定义 React 组件
- `lib/`：工具函数
- `tools/`：各种调试工具脚本
- `screenshots/`：视觉回归测试截图
- 备份文件：`tailwind.config.js.backup`, `app/globals.css.backup`

### 触底反弹的时刻

当我看着自己写的近千行代码，对比着 Hugo Paper 主题反复调试时，内心开始质疑：

> "我为什么要这么做？我真正需要的是什么？"

## 第三阶段：推倒重来

### 真正的顿悟

答案其实一直在那里：

**我不需要自己开发主题，也不需要写任何定制 CSS。我需要的只是一个现成的、好看的博客主题。**

既然我喜欢 Hugo Paper 的样式，为什么不直接用 Hugo 呢？为什么要用 Next.js 去模仿 Hugo 呢？

### 决定性的转折

我决定彻底改变方向：

1. **放弃 Next.js**：虽然是好框架，但对于静态博客来说过重
2. **拥抱 Hugo**：专门为静态网站设计的生成器
3. **使用 FixIt 主题**：成熟的现成主题，功能丰富，开箱即用

### 迁移过程

令人惊讶的是，真正的迁移过程非常顺利：

1. **安装 Hugo Extended** v0.147.7
```bash
wget https://github.com/gohugoio/hugo/releases/download/v0.147.7/hugo_extended_0.147.7_linux-amd64.tar.gz
```

2. **创建 Hugo 目录结构**
```bash
mkdir -p themes archetypes static layouts data
```

3. **添加 FixIt 主题**（作为 git submodule）
```bash
git submodule add https://github.com/hugo-fixit/FixIt.git themes/FixIt
```

4. **创建配置文件** `hugo.toml`
```toml
title = "My Hugo Blog"
baseURL = "http://localhost:1313/"
theme = "FixIt"
languageCode = "zh-cn"

[params]
  version = "0.3.X"
  defaultTheme = "auto"
  
[params.page.toc]
  enable = true
  auto = true
```

5. **现有 Markdown 内容完全兼容**：无需修改任何文章！

6. **配置 Vercel 部署** `vercel.json`
```json
{
  "build": {
    "env": {
      "HUGO_VERSION": "0.147.7"
    }
  },
  "buildCommand": "hugo --gc --minify",
  "outputDirectory": "public",
  "installCommand": "git submodule update --init --recursive"
}
```

7. **启动服务器**
```bash
hugo server -D
```

**就这样，完成了。**

## 结果对比

### 投入时间

- **Next.js + 自定义方案**: 数天的持续调试和优化
- **Hugo + FixIt**: 不到 1 小时完成迁移

### 代码量

- **Next.js 方案**:
  - 自定义 CSS: 370+ 行 → 130 行（重构后）
  - React 组件: 多个文件
  - 工具脚本: 7 个调试工具
  - 配置文件: 复杂的 Tailwind/Next.js 配置
  
- **Hugo 方案**:
  - 自定义 CSS: 0 行
  - 配置文件: 1 个简洁的 `hugo.toml`（129 行）
  - Markdown 内容: 完全复用

### 功能对比

| 功能 | Next.js 自定义 | Hugo + FixIt |
|------|---------------|--------------|
| 语法高亮 | 需要配置 rehype-prism | ✅ 内置 |
| 响应式设计 | 需要自己写 | ✅ 内置 |
| 暗色模式 | 需要实现 | ✅ 内置 |
| TOC 目录 | 需要实现 | ✅ 内置 |
| 阅读时间 | 需要计算 | ✅ 内置 |
| SEO | 需要配置 | ✅ 内置 |
| RSS/Sitemap | 需要手动生成 | ✅ 自动生成 |
| 社交分享 | 需要开发 | ✅ 内置 |
| 评论系统 | 需要集成 | ✅ 支持多种 |

### 性能对比

- **构建速度**: Hugo 快得惊人（毫秒级）
- **页面体积**: 纯静态 HTML，无 JS 框架负担
- **SEO**: Hugo 生成的页面更加搜索引擎友好

## 反思与教训

### 为什么会绕这么大的圈？

1. **技术栈惯性**: "我熟悉 React，所以用 Next.js"
2. **过度工程化**: "我可以自己实现"的自信
3. **忽视成本**: 没有充分评估定制开发的时间成本
4. **目标模糊**: 混淆了"学习技术"和"完成项目"两个目标

### 正确的思考方式

在开始项目前，应该问自己：

1. **核心需求是什么？**
   - 我需要的是一个博客，不是一个 React 应用
   
2. **最简单的方案是什么？**
   - Hugo + 现成主题就能满足所有需求
   
3. **定制开发的价值在哪？**
   - 如果只是为了"和别人不一样"，成本太高
   
4. **时间和精力的最佳分配？**
   - 应该花在写内容上，而不是调样式

### 什么时候应该自己造轮子？

造轮子不是坏事，但要有明确的理由：

✅ **适合自己造轮子**：
- 现有方案无法满足特殊需求
- 作为学习项目，明确目标是学习
- 有充足的时间和资源投入
- 需要深度定制化的功能

❌ **不适合造轮子**：
- 只是为了"显得专业"
- 低估了实现的复杂度
- 忽视了维护成本
- 现成方案已经很成熟

## 给其他开发者的建议

### 1. 明确项目目标

区分"写博客"和"开发博客系统"：
- 如果目标是分享内容 → 用现成方案
- 如果目标是学习技术 → 可以自己开发，但要有心理准备

### 2. 评估真实成本

定制开发的成本包括：
- 初始开发时间
- 调试和优化时间
- 后期维护成本
- 机会成本（本可以做其他事）

### 3. 拥抱成熟方案

优秀的开源项目凝聚了社区的智慧：
- **Hugo**: 10 年的发展，极致的性能优化
- **FixIt**: 精心设计的主题，良好的文档
- 站在巨人的肩膀上，不丢人

### 4. 渐进式定制

即使用现成方案，也可以逐步定制：
1. 先用默认配置，确保能跑起来
2. 通过配置文件调整（`hugo.toml`）
3. 需要时再添加自定义 CSS
4. 最后才考虑修改主题源码

### 5. 记录决策过程

这篇文章本身就是一个例子：
- 记录为什么做某个决定
- 记录遇到的问题和解决方案
- 反思可以避免的弯路
- 帮助未来的自己和他人

## 技术债的清理

迁移到 Hugo 后，我还做了一些清理工作：

### 保留的文件
- `content/posts/`: Markdown 文章（完全兼容）
- `.gitignore`: 更新以忽略 Hugo 构建输出
- `vercel.json`: 配置 Hugo 部署
- `README.md`: 更新项目文档

### 可以删除的文件（未来）
- `app/`, `components/`, `lib/`: Next.js 相关代码
- `tools/`: 调试工具脚本
- `screenshots/`: 视觉回归测试截图
- `*.backup`: 备份文件
- `package.json`, `package-lock.json`: Node.js 依赖

为什么没立即删除？
- 作为历史记录，提醒自己走过的弯路
- 可能有些工具脚本未来还有用
- 给其他人一个完整的对比视角

## 最终的项目结构

现在的项目结构简洁清晰：

```
├── content/posts/      # Markdown 文章
├── themes/FixIt/       # 主题（submodule）
├── hugo.toml          # 配置文件
├── static/            # 静态资源
├── layouts/           # 自定义模板（空）
├── data/              # 数据文件（空）
└── public/            # 构建输出（自动生成）
```

没有多余的代码，没有复杂的配置，一切都是必要的。

## 结语

这次经历让我深刻理解了一个道理：

> **技术选型的本质不是选择最新、最酷的技术，而是选择最适合项目需求的技术。**

有时候，最简单的方案就是最好的方案。绕了一大圈回到起点，虽然浪费了时间，但收获了宝贵的经验。

如果你也在类似的选择中纠结，希望这篇文章能给你一些启发：

1. **明确目标** - 你到底要解决什么问题？
2. **调研充分** - 现有方案能满足需求吗？
3. **评估成本** - 自己做要花多少时间？
4. **果断决策** - 不要在已经证明低效的路上继续走
5. **及时调整** - 发现方向错了，立即改正

现在，我终于可以专注于真正重要的事情：写作和分享。

而这篇文章，就是新博客的第一篇内容。完美的开始。

---

**项目地址**: [https://github.com/cloudzun/clean-vercel-blog](https://github.com/cloudzun/clean-vercel-blog)

**技术栈**: Hugo v0.147.7 Extended + FixIt Theme + Vercel

**教训**: 别和自己过不去，用现成的！😄
