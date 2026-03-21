// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'CloudZun';
export const SITE_DESCRIPTION = 'AI Engineer | Automation Expert | Tech Blogger';

export const SITE = {
  name: 'CloudZun',
  email: 'contact@cloudzun.com',
  github: 'https://github.com/cloudzun',
  twitter: '', // 可选
  linkedin: '', // 可选
};

// 技术栈
export const TECH_STACK = [
  { name: 'Python', icon: '🐍' },
  { name: 'JavaScript', icon: '📜' },
  { name: 'TypeScript', icon: '📘' },
  { name: 'AI/LLM', icon: '🤖' },
  { name: 'Azure', icon: '☁️' },
  { name: 'Kubernetes', icon: '⎈' },
  { name: 'OpenClaw', icon: '🦾' },
  { name: 'Astro', icon: '🚀' },
];

// 精选项目
export const FEATURED_PROJECTS = [
  {
    name: 'HN Daily Digest',
    description: '每日 Hacker News 深度分析摘要，AI 自动生成并发布到博客',
    tags: ['AI', 'Automation', 'Blog'],
    repo: 'https://github.com/cloudzun/clawd',
  },
  {
    name: 'M7 Stock Analysis',
    description: 'M7 科技巨头每周投资分析报告，自动采集数据 + AI 分析',
    tags: ['Finance', 'AI', 'Analysis'],
    repo: 'https://github.com/cloudzun/clawd',
  },
  {
    name: 'OpenCode Course',
    description: 'Microsoft OpenCode 课程开发 - 26 个实验 + 12 个 Agent',
    tags: ['Education', 'AI Agents', 'M365'],
    repo: 'https://github.com/cloudzun/ms-4004-opencode-course',
  },
  {
    name: 'Guard Trading System',
    description: '两阶段 ROE 追踪止损系统，用于 Hyperliquid 期货交易',
    tags: ['Trading', 'Automation', 'Finance'],
    repo: 'https://github.com/cloudzun/clawd',
  },
];
