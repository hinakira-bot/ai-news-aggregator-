import { getExistingUrls } from './db.js';

export function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    // クエリパラメータを除去（utm_*, ref, source等のトラッキングパラメータ）
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
    trackingParams.forEach(p => parsed.searchParams.delete(p));
    // トレイリングスラッシュ除去
    let normalized = parsed.origin + parsed.pathname.replace(/\/+$/, '') + parsed.search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\s\u3000]+/g, ' ')
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .trim();
}

function titleSimilarity(a, b) {
  const tokensA = new Set(normalizeTitle(a).split(' '));
  const tokensB = new Set(normalizeTitle(b).split(' '));
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export async function deduplicateArticles(articles) {
  // 1. URL正規化で重複除去
  const urlMap = new Map();
  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.url);
    if (!urlMap.has(normalizedUrl)) {
      urlMap.set(normalizedUrl, { ...article, url: normalizedUrl });
    }
  }
  let unique = [...urlMap.values()];

  // 2. DB内の既存URLと照合
  const urls = unique.map(a => a.url);
  const existingUrls = await getExistingUrls(urls);
  unique = unique.filter(a => !existingUrls.has(a.url));

  // 3. タイトル類似度で重複除去（Jaccard係数 0.7以上）
  const deduplicated = [];
  for (const article of unique) {
    const isDuplicate = deduplicated.some(
      existing => titleSimilarity(existing.title, article.title) > 0.7
    );
    if (!isDuplicate) {
      deduplicated.push(article);
    }
  }

  console.log(`Deduplication: ${articles.length} → ${deduplicated.length} articles (${articles.length - deduplicated.length} duplicates removed)`);
  return deduplicated;
}
