// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
//
// `site` 必须指向你博客部署后的最终地址，Astro 用它生成 sitemap、RSS 和
// canonical URL 等绝对链接。
//
// - 使用自定义域名：把下面的地址换成你自己的域名（如 'https://blog.example.com'），
//   不需要设置 `base`。同时记得在 `public/CNAME` 里填入同一个域名，
//   并在你的域名服务商那里把 DNS 解析到 GitHub Pages（参考
//   https://docs.astro.build/en/guides/deploy/github/#deploying-to-a-custom-domain）。
// - 使用 GitHub Pages 默认项目地址（不是自定义域名）：
//   把 site 改成 'https://xiayy860612.github.io'，并额外加上
//   `base: '/amos'`，同时删除 public/CNAME 文件。
export default defineConfig({
	site: 'https://amos.s2u2m.com', // TODO: 替换成你自己的域名
	integrations: [sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
