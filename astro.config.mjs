import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';
import footnotes from 'remark-footnotes';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { fileURLToPath } from 'node:url';
import siteConfig from './site.config.json' with { type: 'json' };

const siteFromEnv = process.env.SITE_URL?.trim();
const fallbackSite = siteConfig.siteUrl?.trim() || 'https://example.com';
const site = (siteFromEnv || fallbackSite).replace(/\/+$/, '');

// Portal URL for API calls
const portalUrl = process.env.PUBLIC_PORTAL_URL?.trim() || siteConfig.portalUrl?.trim() || '';

const alias = {
  '@scripts': fileURLToPath(new URL('./src/scripts', import.meta.url)),
  '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
  '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
};

export default defineConfig({
  site,
  srcDir: './src',
  outDir: './dist',
  prefetch: {
    defaultStrategy: 'viewport'
  },
  image: {
    domains: [],
    remotePatterns: [],
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  integrations: [
    sitemap(),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          minifyCSS: true,
          minifyJS: true
        }
      },
      Image: false, // Already optimized by Astro
      JavaScript: true,
      SVG: true
    })
  ],
  vite: {
    resolve: { alias },
    define: {
      'import.meta.env.PUBLIC_PORTAL_URL': JSON.stringify(portalUrl)
    }
  },
  markdown: {
    remarkPlugins: [[footnotes, { inlineNotes: true }]],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          content: {
            type: 'text',
            value: '#',
            properties: { class: 'h-anchor', 'aria-hidden': 'true' }
          }
        }
      ]
    ]
  }
});
