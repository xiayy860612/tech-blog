# amos

Amos 的个人博客 —— 基于 [Astro](https://astro.build/) 搭建，文章使用 Markdown（`.md`）撰写，构建为静态站点后部署到 GitHub Pages。

## 本地开发

```sh
npm install
npm run dev       # 本地预览，默认 http://localhost:4321
npm run build     # 构建静态文件到 ./dist/
npm run preview   # 本地预览构建产物
```

## 项目结构

```text
├── public/                  # 静态资源（favicon、CNAME 等），原样拷贝到构建产物
├── src/
│   ├── assets/               # 图片、字体等会被 Astro 处理的资源
│   ├── components/           # 可复用组件（Header、Footer 等）
│   ├── content/blog/          # 所有文章的 Markdown 文件
│   ├── layouts/BlogPost.astro  # 文章详情页布局
│   ├── pages/                # 页面与路由，一个 .astro 文件对应一个路由
│   └── consts.ts              # 站点标题、简介等全局配置
├── astro.config.mjs          # 站点地址、集成插件等构建配置
└── .github/workflows/deploy.yml  # GitHub Actions 自动部署工作流
```

## 写文章

在 `src/content/blog/` 下新建一个 `.md` 文件，例如 `src/content/blog/my-post.md`：

```md
---
title: '文章标题'
description: '文章简介'
pubDate: 'Aug 09 2026'
heroImage: '../../assets/blog-placeholder-1.jpg'  # 可选
---

正文内容，用标准 Markdown 语法书写。
```

保存后会自动出现在 `/blog` 列表页、文章详情页和 RSS 订阅（`/rss.xml`）里。
`src/content/blog/markdown-style-guide.md` 里有一份常用 Markdown 语法速查，可以参考。

## 新增自定义页面

在 `src/pages/` 下新建一个 `.astro` 文件即可新增一个页面，文件路径就是访问路径。
例如新建 `src/pages/projects.astro`，就会得到 `/projects` 这个页面。可以参考已有的
`src/pages/index.astro`（首页）和 `src/pages/about.astro`（关于页）两种写法。

## 部署到 GitHub Pages

这个仓库已经配置好 `.github/workflows/deploy.yml`：每次 push 到 `main` 分支，
GitHub Actions 会自动构建并把 `./dist/` 部署到 GitHub Pages，不需要手动操作。

首次启用需要在 GitHub 仓库里做一次性设置：

1. 打开仓库 Settings -> Pages。
2. 在 "Build and deployment" -> "Source" 里选择 **GitHub Actions**（而不是默认的分支部署）。
3. push 代码到 `main` 分支后，去 Actions 页面查看 "Deploy to GitHub Pages" 工作流的运行情况。

### 使用自定义域名

当前 `astro.config.mjs` 里的 `site` 是占位地址 `https://your-domain.example.com`，
`public/CNAME` 里也是占位域名 `your-domain.example.com`。正式使用前：

1. 把 `astro.config.mjs` 里的 `site` 改成你自己的域名。
2. 把 `public/CNAME` 文件内容改成同一个域名（文件里只能有这一行域名，不能有注释）。
3. 在你的域名服务商那里配置 DNS：
   - 根域名一般用 A 记录指向 GitHub Pages 的 IP（185.199.108.153 等，具体以
     [GitHub 官方文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)为准）。
   - 子域名（如 `blog.example.com`）一般用 CNAME 记录指向 `xiayy860612.github.io`。
4. 在仓库 Settings -> Pages 里的 "Custom domain" 填入同一个域名，并可以勾选
   "Enforce HTTPS"。

### 如果不用自定义域名，改用默认的 GitHub Pages 地址

把 `astro.config.mjs` 改成：

```js
export default defineConfig({
  site: 'https://xiayy860612.github.io',
  base: '/amos',
  // ...
});
```

并删除 `public/CNAME` 文件，然后在仓库 Settings -> Pages 里保持 "Custom domain" 为空。
