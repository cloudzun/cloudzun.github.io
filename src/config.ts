export const SITE = {
  website: "https://www.cloudzun.com/",
  author: "CloudZun",
  profile: "https://github.com/cloudzun",
  desc: "AI Engineer | Automation Expert | Tech Blogger - 分享 AI、自动化和开发经验",
  title: "CloudZun",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "编辑此文章",
    url: "https://github.com/cloudzun/cloudzun.github.io/edit/master/",
  },
  dynamicOgImage: false, // 临时禁用，避免 Google Fonts 502 错误
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "UTC",
} as const;
