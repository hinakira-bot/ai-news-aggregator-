import { NextResponse } from 'next/server';
import { initializeDatabase, insertArticle } from '../../../lib/db.js';
import { fetchAllFeeds, fetchOgImages } from '../../../lib/feeds.js';
import { deduplicateArticles } from '../../../lib/deduplicator.js';
import { enrichArticles } from '../../../lib/enricher.js';

export const maxDuration = 300; // Vercel Fluid Compute: 最大5分

export async function GET(request) {
  // Vercel Cron認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('=== AI News Collection Started ===');
    const startTime = Date.now();

    // Step 0: DB初期化（テーブルがなければ作成）
    await initializeDatabase();

    // Step 1: フィード取得
    console.log('Step 1: Fetching feeds...');
    const rawArticles = await fetchAllFeeds();
    console.log(`Fetched ${rawArticles.length} raw articles`);

    if (rawArticles.length === 0) {
      return NextResponse.json({
        message: 'No articles found',
        collected: 0,
        duplicates: 0,
        excluded: 0,
        errors: 0,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
    }

    // Step 2-3: 重複排除
    console.log('Step 2-3: Deduplicating...');
    const uniqueArticles = await deduplicateArticles(rawArticles);
    const duplicateCount = rawArticles.length - uniqueArticles.length;

    if (uniqueArticles.length === 0) {
      return NextResponse.json({
        message: 'All articles are duplicates',
        collected: 0,
        duplicates: duplicateCount,
        excluded: 0,
        errors: 0,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
    }

    // Step 3.5: OG画像取得（サムネイルがない記事）
    console.log('Step 3.5: Fetching OG images...');
    await fetchOgImages(uniqueArticles, 5);

    // Step 4: AI要約・分類
    console.log('Step 4: Enriching with Gemini...');
    const enrichedArticles = await enrichArticles(uniqueArticles);
    const excludedCount = uniqueArticles.length - enrichedArticles.length;

    // Step 5: DB保存
    console.log('Step 5: Saving to database...');
    let savedCount = 0;
    let errorCount = 0;

    for (const article of enrichedArticles) {
      const id = await insertArticle(article);
      if (id !== null) {
        savedCount++;
      } else {
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`=== Collection Complete: ${savedCount} saved, ${duplicateCount} duplicates, ${excludedCount} excluded, ${errorCount} errors (${duration}s) ===`);

    return NextResponse.json({
      message: 'Collection completed',
      collected: savedCount,
      duplicates: duplicateCount,
      excluded: excludedCount,
      errors: errorCount,
      duration: `${duration}s`,
    });
  } catch (error) {
    console.error('Collection pipeline error:', error);
    return NextResponse.json(
      { error: 'Collection failed', details: error.message },
      { status: 500 }
    );
  }
}
