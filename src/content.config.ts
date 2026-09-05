import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

// AWS SAA 题库：由 tools/aws-saa-questions-scrape.js 抓取，每题一个 JSON 文件，
// 文件名即题号（1.json ~ 1018.json）。原始 JSON 用中文键名，这里在 schema 里
// 统一转成英文字段，页面组件就不用写 data.answer['正确答案'] 这种取值了。
const awsSaa = defineCollection({
	loader: glob({ base: './src/content/aws/saa', pattern: '**/*.json' }),
	schema: z.object({
		qid: z.string().optional(),
		index: z.number(),
		total: z.number(),
		type: z.string(),
		question: z.string(),
		options: z.array(z.string()),
		answer: z
			.object({
				正确答案: z.string(),
				解析: z.string().nullable(),
				AI解析: z.string().nullable(),
			})
			.transform((answer) => ({
				correct: answer.正确答案,
				explanation: answer.解析,
				aiExplanation: answer.AI解析,
			})),
	}),
});

export const collections = { blog, awsSaa };
