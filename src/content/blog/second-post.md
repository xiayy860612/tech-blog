---
title: '第二篇文章'
description: '关于如何自定义这个博客站点的一些说明。'
pubDate: 'Aug 09 2026'
heroImage: '../../assets/blog-placeholder-4.jpg'
---

这是第二篇示例文章，简单说明一下这个项目的结构，方便你之后自定义。

- `src/content/blog/`：所有文章的 Markdown 文件都放在这里。
- `src/pages/`：站点的页面，比如首页 `index.astro`、关于页 `about.astro`。
  在这里新建一个 `.astro` 文件就能新增一个自定义页面。
- `src/components/`：可复用的组件，比如顶部导航 `Header.astro` 和页脚
  `Footer.astro`。
- `src/layouts/BlogPost.astro`：文章详情页的排版布局。
- `src/consts.ts`：站点标题、简介等全局配置。
- `astro.config.mjs`：站点地址、集成插件等构建配置。

准备好之后，删除这两篇示例文章，开始写你自己的内容吧。
