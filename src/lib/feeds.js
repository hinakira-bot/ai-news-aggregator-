import Parser from 'rss-parser';
import { RSS_SOURCES, NEWSAPI_CONFIG } from '../config/sources.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-News-Aggregator/1.0',
  },
});

export async function fetchAllFeeds() {
  const results = [];

  // RSS feeds を並列取得
  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map(source => fetchRssFeed(source))
  );

  for (const result of rssResults) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      results.push(...result.value);
    } else if (result.status === 'rejected') {
      console.warn(`RSS fetch failed:`, result.reason?.message);
    }
  }

  // NewsAPI 取得
  if (process.env.NEWS_API_KEY) {
    try {
      const newsApiArticles = await fetchNewsApi();
      results.push(...newsApiArticles);
    } catch (error) {
      console.warn('NewsAPI fetch failed:', error.message);
    }
  }

  console.log(`Total raw articles fetched: ${results.length}`);
  return results;
}

async function fetchRssFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return feed.items
      .filter(item => {
        if (!item.title || !item.link) return false;
        const pubDate = item.pubDate ? new Date(item.pubDate) : now;
        return pubDate >= oneDayAgo;
      })
      .map(item => ({
        title: item.title.trim(),
        url: item.link.trim(),
        sourceName: source.name,
        sourceLang: source.lang,
        publishedAt: item.pubDate ? new Date(item.pubDate) : now,
        description: item.contentSnippet || item.content || '',
        thumbnailUrl: extractThumbnail(item),
      }));
  } catch (error) {
    console.warn(`Failed to fetch RSS from ${source.name} (${source.url}):`, error.message);
    return [];
  }
}

async function fetchNewsApi() {
  const articles = [];

  for (const queryConfig of NEWSAPI_CONFIG.queries) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];

    const params = new URLSearchParams({
      q: queryConfig.q,
      language: queryConfig.language,
      sortBy: queryConfig.sortBy,
      pageSize: String(queryConfig.pageSize),
      from: fromDate,
      apiKey: process.env.NEWS_API_KEY,
    });

    const response = await fetch(`${NEWSAPI_CONFIG.baseUrl}?${params}`);
    if (!response.ok) {
      console.warn(`NewsAPI request failed: ${response.status}`);
      continue;
    }

    const data = await response.json();
    if (data.articles) {
      for (const item of data.articles) {
        if (!item.title || !item.url || item.title === '[Removed]') continue;
        articles.push({
          title: item.title.trim(),
          url: item.url.trim(),
          sourceName: item.source?.name || 'NewsAPI',
          sourceLang: queryConfig.language,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
          description: item.description || '',
          thumbnailUrl: item.urlToImage || null,
        });
      }
    }
  }

  return articles;
}

function extractThumbnail(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$.url) return item['media:thumbnail'].$.url;
  return null;
}
