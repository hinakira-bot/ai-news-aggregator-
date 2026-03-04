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
  // content内のimg srcも試行
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('tracking') && !imgMatch[1].includes('pixel')) {
      return imgMatch[1];
    }
  }
  return null;
}

/**
 * OG画像を記事ページから取得する
 * サムネイルがない記事のみ対象、並列実行で高速化
 */
export async function fetchOgImages(articles, concurrency = 5) {
  const needsImage = articles.filter(a => !a.thumbnailUrl && a.url);
  if (needsImage.length === 0) {
    console.log('All articles already have thumbnails');
    return articles;
  }

  console.log(`Fetching OG images for ${needsImage.length}/${articles.length} articles...`);

  // 並列数を制限して実行
  let fetched = 0;
  for (let i = 0; i < needsImage.length; i += concurrency) {
    const batch = needsImage.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(article => fetchOgImage(article.url))
    );

    for (let j = 0; j < batch.length; j++) {
      if (results[j].status === 'fulfilled' && results[j].value) {
        batch[j].thumbnailUrl = results[j].value;
        fetched++;
      }
    }
  }

  console.log(`OG images fetched: ${fetched}/${needsImage.length} successful`);
  return articles;
}

/**
 * 単一URLからOG画像を取得
 */
async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-News-Aggregator/1.0 (OG Image Fetcher)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    // HTMLの先頭部分だけ読む（<head>にog:imageがあるため全文不要）
    const reader = response.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    const maxBytes = 30000; // 先頭30KBのみ

    while (html.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      // </head>を見つけたら早期終了
      if (html.includes('</head>') || html.includes('</HEAD>')) break;
    }

    reader.cancel().catch(() => {}); // 残りを破棄

    return extractOgImage(html);
  } catch (error) {
    // タイムアウトやネットワークエラーは静かにスキップ
    return null;
  }
}

/**
 * HTMLからOG画像URLを抽出
 */
function extractOgImage(html) {
  // og:image を優先
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
  );
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // twitter:image フォールバック
  const twMatch = html.match(
    /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i
  );
  if (twMatch && twMatch[1]) return twMatch[1];

  return null;
}
