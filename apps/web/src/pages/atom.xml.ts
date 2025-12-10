import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { buildSlug } from '../lib/blog';
import siteConfig from '../../site.config.json' with { type: 'json' };

export async function GET(context: APIContext) {
  const site = (context.site?.href ?? siteConfig.siteUrl).replace(/\/+$/, '');
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const updated = sorted[0]?.data.date.toISOString() ?? new Date().toISOString();

  const entries = sorted
    .map((post) => {
      const slug = buildSlug(post);
      const categories = (post.data.categories || [])
        .map((cat) => `<category term="${cat.replace(/"/g, '&quot;')}" />`)
        .join('');
      return `<entry><id>${site}/blog/${slug}/</id><title><![CDATA[${post.data.title}]]></title><link href="${site}/blog/${slug}/" /><updated>${
        post.data.modified?.toISOString() ?? post.data.date.toISOString()
      }</updated><published>${post.data.date.toISOString()}</published>${categories}<summary type="html"><![CDATA[${
        post.data.description
      }]]></summary></entry>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <id>${site}/blog/</id>
    <title>Блог — ${siteConfig.siteName}</title>
    <updated>${updated}</updated>
    <link href="${site}/atom.xml" rel="self" />
    <link href="${site}/blog/" />
    ${entries}
  </feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8'
    }
  });
}
