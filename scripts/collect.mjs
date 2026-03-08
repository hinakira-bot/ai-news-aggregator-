import { initializeDatabase, insertArticle, getRecentArticlesByCategory } from '../src/lib/db.js';
import { fetchAllFeeds, fetchOgImages } from '../src/lib/feeds.js';
import { deduplicateArticles } from '../src/lib/deduplicator.js';
import { scoreArticles, enrichArticles } from '../src/lib/enricher.js';
import { extractArticleContent } from '../src/lib/extractor.js';

const MAX_ARTICLES_PER_DAY = 10;
const TOP_CANDIDATES = 20; // Stage 2 に進める候補数
const MAX_PER_SOURCE = 3;  // 1ソースあたりの最大記事数
const MAX_PER_TOPIC = 2;   // 同一トピックの最大記事数
const MIN_OFFICIAL_MEDIA = 5; // 公式・メディアの最低確保枠（10記事中5記事以上）

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

  // === Stage 1: 軽量スコアリング（全記事、タイトル+descのみ） ===
  console.log('');
  console.log('=== Stage 1: Lightweight Scoring (all articles) ===');
  const scoredArticles = await scoreArticles(uniqueArticles);
  const excludedCount = uniqueArticles.length - scoredArticles.length;
  console.log(`${scoredArticles.length} articles scored, ${excludedCount} excluded (relevance=0)`);

  // Stage 1 結果をソートして上位候補を選出
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  const sorted = scoredArticles.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (importanceOrder[a.importance] || 1) - (importanceOrder[b.importance] || 1);
  });
  const candidates = sorted.slice(0, TOP_CANDIDATES);
  console.log(`Top ${candidates.length} candidates selected for full processing`);

  // === Stage 2: フル処理（上位候補のみ） ===
  console.log('');
  console.log('=== Stage 2: Full Processing (top candidates only) ===');

  // Step A: OG画像取得（候補のみ）
  console.log('Step A: Fetching OG images for candidates...');
  await fetchOgImages(candidates, 5);

  // Step B: 記事本文抽出（候補のみ）
  console.log('Step B: Extracting article content for candidates...');
  await extractArticleContent(candidates, 3);
  const contentCount = candidates.filter(a => a.bodyText).length;
  console.log(`Content extracted for ${contentCount}/${candidates.length} candidates`);

  // Step C: 過去記事コンテキスト読み込み
  console.log('Step C: Loading historical context...');
  const categories = ['ai-tools', 'llm-models', 'prompts', 'marketing', 'side-business', 'vibe-coding', 'workflow', 'media-ai'];
  const historicalContext = {};
  for (const cat of categories) {
    try {
      const recent = await getRecentArticlesByCategory(cat, 7, 5);
      if (recent.length > 0) {
        historicalContext[cat] = recent;
      }
    } catch (err) {
      console.warn(`Historical context for ${cat} failed:`, err.message);
    }
  }
  console.log(`Historical context: ${Object.keys(historicalContext).length} categories with past articles`);

  // Step D: AI要約・分類・考察（本文＋過去記事コンテキスト付き、候補のみ）
  console.log('Step D: Enriching candidates with Gemini (summary + commentary + context)...');
  const enrichedArticles = await enrichArticles(candidates, historicalContext);
  console.log(`${enrichedArticles.length} articles fully enriched`);

  // === 最終選出: 上位10件（ソース・トピック多様性 + 公式/メディア枠確保） ===
  console.log('');
  console.log('=== Final Selection (with diversity + source type balance) ===');
  const finalSorted = enrichedArticles.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (importanceOrder[a.importance] || 1) - (importanceOrder[b.importance] || 1);
  });

  // ソースタイプ別に分類
  const isOfficialOrMedia = (a) => ['official', 'media'].includes(a.sourceType);
  const officialMediaPool = finalSorted.filter(isOfficialOrMedia);
  const otherPool = finalSorted.filter(a => !isOfficialOrMedia(a));

  console.log(`  Source type breakdown: official/media=${officialMediaPool.length}, individual/ugc=${otherPool.length}`);

  // 選出ヘルパー
  const topArticles = [];
  const sourceCount = {};
  const topicCount = {};
  const skippedSource = [];
  const skippedTopic = [];

  function tryAdd(article) {
    const source = article.sourceName || 'unknown';
    const topic = article.topicId || `unique-${topArticles.length}`;

    if ((sourceCount[source] || 0) >= MAX_PER_SOURCE) {
      skippedSource.push(`${article.title} (${source})`);
      return false;
    }
    if ((topicCount[topic] || 0) >= MAX_PER_TOPIC) {
      skippedTopic.push(`${article.title} (topic: ${topic})`);
      return false;
    }

    topArticles.push(article);
    sourceCount[source] = (sourceCount[source] || 0) + 1;
    topicCount[topic] = (topicCount[topic] || 0) + 1;
    return true;
  }

  // Phase 1: 公式/メディアから最低枠を確保
  const addedIds = new Set();
  for (const article of officialMediaPool) {
    if (topArticles.length >= MIN_OFFICIAL_MEDIA) break;
    if (tryAdd(article)) {
      addedIds.add(article.url);
    }
  }
  const officialCount = topArticles.length;
  console.log(`  Phase 1: ${officialCount} official/media articles secured`);

  // Phase 2: 残り枠をスコア順で埋める（全プールから）
  for (const article of finalSorted) {
    if (topArticles.length >= MAX_ARTICLES_PER_DAY) break;
    if (addedIds.has(article.url)) continue;
    if (tryAdd(article)) {
      addedIds.add(article.url);
    }
  }

  // 1位の記事に★PickOf The Dayフラグ
  if (topArticles.length > 0) {
    topArticles[0].isPick = true;
    console.log(`★ Pick of the Day: ${topArticles[0].title}`);
  }
  const finalOfficialMedia = topArticles.filter(isOfficialOrMedia).length;
  const finalIndividual = topArticles.length - finalOfficialMedia;
  console.log(`Selected top ${topArticles.length} articles (official/media: ${finalOfficialMedia}, individual/ugc: ${finalIndividual})`);
  if (skippedSource.length > 0) {
    console.log(`  Skipped by source limit (max ${MAX_PER_SOURCE}): ${skippedSource.length} articles`);
    skippedSource.forEach(s => console.log(`    - ${s}`));
  }
  if (skippedTopic.length > 0) {
    console.log(`  Skipped by topic limit (max ${MAX_PER_TOPIC}): ${skippedTopic.length} articles`);
    skippedTopic.forEach(s => console.log(`    - ${s}`));
  }

  // Step 5: DB保存
  console.log('');
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
  console.log(`  Total fetched: ${rawArticles.length}`);
  console.log(`  Duplicates removed: ${duplicateCount}`);
  console.log(`  Stage 1 scored: ${scoredArticles.length} (${excludedCount} excluded)`);
  console.log(`  Stage 2 candidates: ${candidates.length}`);
  console.log(`  Fully enriched: ${enrichedArticles.length}`);
  console.log(`  Saved: ${savedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Duration: ${duration}s`);
}

main().catch(err => {
  console.error('Collection failed:', err);
  process.exit(1);
});
