import type { CollectionEntry } from 'astro:content';

const WORDS_PER_MINUTE = 180;

export type BlogEntry = CollectionEntry<'blog'>;

export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  isoDate: string;
  modified?: string;
  readingTime: number;
  wordCount: number;
  categories: string[];
  keywords: string;
  cover?: string;
};

export function buildSlug(entry: BlogEntry): string {
  return entry.data.slug?.trim() || entry.slug;
}

export function formatDate(date: Date | string, locale = 'ru-RU'): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    return '';
  }
  return value
    .toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    .replace('.', '');
}

export function getReadingStats(body: string): { minutes: number; words: number } {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { minutes, words };
}

export function normalizeKeywords(raw?: string | string[]): string {
  if (!raw) {
    return '';
  }
  if (Array.isArray(raw)) {
    return raw.join(', ');
  }
  return raw;
}

export function normalizeCategories(raw?: string[] | string): string[] {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.map((c) => c.trim()).filter(Boolean);
  }
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

export function collectMeta(entry: BlogEntry): BlogMeta {
  const slug = buildSlug(entry);
  const isoDate = entry.data.date.toISOString();
  const modified = entry.data.modified?.toISOString();
  const { minutes, words } = getReadingStats(entry.body);
  return {
    slug,
    title: entry.data.title,
    description: entry.data.description,
    date: formatDate(entry.data.date),
    isoDate,
    modified,
    readingTime: minutes,
    wordCount: words,
    categories: normalizeCategories(entry.data.categories),
    keywords: normalizeKeywords(entry.data.keywords),
    cover: entry.data.cover
  };
}

export function sortByDateDesc(entries: BlogEntry[]): BlogEntry[] {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatIso(date?: string): string | undefined {
  if (!date) {
    return undefined;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}
