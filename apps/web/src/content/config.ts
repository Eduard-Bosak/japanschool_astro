import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(3),
    description: z.string().default(''),
    date: z.coerce.date(),
    modified: z.coerce.date().optional(),
    slug: z.string().optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    categories: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { blog };
