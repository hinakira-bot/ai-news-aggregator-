import { initializeDatabase, insertArticle } from '../src/lib/db.js';
import { fetchAllFeeds, fetchOgImages } from '../src/lib/feeds.js';
import { deduplicateArticles } from '../src/lib/deduplicator.js';
import { enrichArticles } from '../src/lib/enricher.js';

const MAX_ARTICLES_PER_DAY = 10;

async function main() {
  console.log('=== Hinakira AI News - Collection Started ===');
  const startTime = Date.now();

  // Step 0: DB初期化
  await initializeDatabase();

  // Step 1: フィード取得
  console.log('Step 1: Fetching feeds...');
  const rawArticles = await fetchAllFeeds();
  console.log(`Fetched ${rawArticles.length} raw articles`);

  if (rawArticles.length === 0) {
    console.log('No articles found. Exiting.');
    process.exit(0);
  }

  // Step 2-3: 重複排除
  console.log('Step 2-3: Deduplicating...');
  const uniqueArticles = await deduplicateArticles(rawArticles);
  const duplicateCount = rawArticles.length - uniqueArticles.length;
  console.log(`${uniqueArticles.length} unique articles (${duplicateCount} duplicates removed)`);

  if (uniqueArticles.length === 0) {
    console.log('All articles are duplicates. Exiting.');
    process.exit(0);
  }

  // Step 3.5: OG画像取得
  console.log('Step 3.5: Fetching OG images...');
  await fetchOgImages(uniqueArticles, 5);

  // Step 4: AI要約・分類・考察
  console.log('Step 4: Enriching with Gemini (summary + commentary)...');
  const enrichedArticles = await enrichArticles(uniqueArticles);
  const excludedCount = uniqueArticles.length - enrichedArticles.length;
  console.log(`${enrichedArticles.length} articles enriched, ${excludedCount} excluded (relevance=0)`);

  // Step 4.5: 上位10件に厳選
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  const sorted = enrichedArticles.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (importanceOrder[a.importance] || 1) - (importanceOrder[b.importance] || 1);
  });
  const topArticles = sorted.slice(0, MAX_ARTICLES_PER_DAY);
  // 1位の記事に★PickOf The Dayフラグ
  if (topArticles.length > 0) {
    topArticles[0].isPick = true;
    console.log(`★ Pick of the Day: ${topArticles[0].title}`);
  }
  console.log(`Selected top ${topArticles.length} articles (from ${enrichedArticles.length} candidates)`);

  // Step 5: DB保存
  console.log('Step 5: Saving to database...');
  let savedCount = 0;
  let errorCount = 0;

  for (const article of topArticles) {
    const id = await insertArticle(article);
    if (id !== null) {
      savedCount++;
    } else {
      errorCount++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`=== Collection Complete ===`);
  console.log(`  Saved: ${savedCount}`);
  console.log(`  Duplicates: ${duplicateCount}`);
  console.log(`  Excluded: ${excludedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Duration: ${duration}s`);
}

main().catch(err => {
  console.error('Collection failed:', err);
  process.exit(1);
});
