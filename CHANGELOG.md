# Changelog

本站基于 [astro-paper](https://github.com/satnaing/astro-paper) v5.5.1 fork，提交遵循 Conventional Commits。
v5.5.1 及之前的版本历史属于上游主题，见 [astro-paper CHANGELOG](https://github.com/satnaing/astro-paper/blob/main/CHANGELOG.md)。

## [2026-08-03] 大规模维护与视觉还原

### 安全（Dependabot 告警全部清零）

- 升级 Astro 5.18.1 → 7.1.1，同步升级 `@astrojs/rss`、`@astrojs/sitemap`、`@astrojs/markdown-remark`
- 升级 `sharp` 0.35.3（libvips CVE）、`eslint` 10 + `typescript-eslint` 8.65、`@shikijs/transformers` 4.4.1
- 通过 overrides 修复 postcss、fast-uri、js-yaml、lodash、flatted、mdast-util-to-hast、yaml 等传递依赖告警
- 修复 Astro 7 的 peer 依赖冲突（`@astrojs/markdown-remark` 7.2.1），恢复 GitHub Pages 部署

### 视觉还原

- 移除自定义字体（Google Sans Code）与自研主题脚本，恢复原版 `toggle-theme.js`
- 删除自定义 categories 页面与顶层 archives 页面（保留原版归档页）
- 还原 404、首页、标签页、文章详情页（移除相关文章 emoji 卡片）等视觉定制
- 全库 Prettier 格式化，恢复原版简洁风格

### 性能

- 标签页瘦身：移除每个标签的 view-transition 样式（约 724KB → 147KB）

### 基础设施

- CI 升级到 Node 22（Astro 6+ 的最低要求）
- Actions 升级：`checkout@v7`、`setup-node@v7`、`configure-pages@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`、`pnpm/action-setup@v6`
- 新增品牌 OG 图（`cloudzun-og.jpg`）与生成脚本（`scripts/generate-og.mjs`）
- Layout 内置 Content-Security-Policy
- 同步并统一 npm / pnpm 双锁文件

## [2026-03-29] 站点迭代

- 移除首页与 About 页的 emoji 装饰
- 修复分类 / 归档页面交互与类型错误
- 修复 npm 依赖安全漏洞

## [2026-02] 主题迁移与内容上线

- 从 Jekyll 迁移到 Astro（先后尝试 Starlight 文档主题，最终采用 AstroPaper）
- 迁移 115 篇博客文章
- 定制功能：标签词云、分类与归档页面、相关文章推荐、目录导航、作者侧边栏、自定义字体
- 配置 GitHub Actions 部署与自定义域名（www.cloudzun.com）
