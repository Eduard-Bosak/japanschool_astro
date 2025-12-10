import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { buildSlug } from '../lib/blog';
import siteConfig from '../../site.config.json' with { type: 'json' };

export async function GET(context: APIContext) {
  const site = context.site?.href ?? siteConfig.siteUrl;
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `Блог — ${siteConfig.siteName}`,
    description: 'Материалы школы японского языка: методика, JLPT, культура.',
    site,
    trailingSlash: false,
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${buildSlug(post)}/`
    }))
  });
}
