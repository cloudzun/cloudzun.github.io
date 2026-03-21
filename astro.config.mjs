// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.cloudzun.com',
	integrations: [
		starlight({
			title: 'CloudZun',
			tagline: 'AI Engineer | Automation Expert | Tech Blogger',
			description: '个人网站和技术博客 - 分享 AI、自动化和开发经验',
			editLink: {
				baseUrl: 'https://github.com/cloudzun/cloudzun.github.io/edit/master/',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/cloudzun' },
				{ icon: 'email', label: 'Email', href: 'mailto:contact@cloudzun.com' },
			],
			sidebar: [
				{
					label: '📝 博客',
					items: [
						{ label: 'Hello World', slug: 'blog-backup/hello-world' },
						{ label: 'Markdown 样式指南', slug: 'blog-backup/markdown-style-guide' },
					],
				},
				{
					label: '📚 技术指南',
					autogenerate: { directory: 'guides' },
				},
				{
					label: '📖 参考文档',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: ['./src/custom.css'],
		}),
	],
});
