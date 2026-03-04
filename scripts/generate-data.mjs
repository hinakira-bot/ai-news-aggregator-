import fs from 'fs';
import path from 'path';
import { getArticles, getAvailableDates } from '../src/lib/db.js';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const DATES_DIR = path.join(DATA_DIR, 'dates');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');

async function main() {
  console.log('=== Generating static data files ===');

  // ディレクトリ作成
  fs.mkdirSync(DATES_DIR, { recursive: true });
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });

  // 利用可能な日付一覧を取得
  const availableDates = await getAvailableDates(30);
  console.log(`Found ${availableDates.length} dates with articles`);

  const dateCounts = {};
  const dateList = [];
  let totalArticles = 0;

  // 日付ごとのJSON生成
  for (const dateEntry of availableDates) {
    const dateStr = typeof dateEntry.date === 'string'
      ? dateEntry.date.split('T')[0]
      : new Date(dateEntry.date).toISOString().split('T')[0];

    dateList.push(dateStr);
    dateCounts[dateStr] = parseInt(dateEntry.count);

    // この日付の全記事を取得
    const result = await getArticles({ date: dateStr, page: 1, limit: 200 });

    const dateData = {
      date: dateStr,
      articles: result.articles,
      total: result.total,
      categories: result.categories,
    };

    // 日付JSONファイル出力
    fs.writeFileSync(
      path.join(DATES_DIR, `${dateStr}.json`),
      JSON.stringify(dateData)
    );

    // 個別記事JSONファイル出力（関連記事を含む）
    for (const article of result.articles) {
      // 同じカテゴリの他記事から最大5件を関連記事に
      const related = result.articles
        .filter(a => a.id !== article.id && a.category === article.category)
        .slice(0, 5)
        .map(a => ({ id: a.id, title: a.title, category: a.category, source_name: a.source_name, published_at: a.published_at }));

      // 同カテゴリが足りない場合、他の日付の同カテゴリ記事で補完はしない（静的生成の制約）
      // 代わりに同日の他カテゴリ記事を追加
      if (related.length < 3) {
        const others = result.articles
          .filter(a => a.id !== article.id && a.category !== article.category)
          .slice(0, 5 - related.length)
          .map(a => ({ id: a.id, title: a.title, category: a.category, source_name: a.source_name, published_at: a.published_at }));
        related.push(...others);
      }

      fs.writeFileSync(
        path.join(ARTICLES_DIR, `${article.id}.json`),
        JSON.stringify({ ...article, relatedArticles: related })
      );
    }

    totalArticles += result.articles.length;
    console.log(`  ${dateStr}: ${result.total} articles`);
  }

  // index.json（日付一覧）
  const indexData = {
    dates: dateList,
    dateCounts,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(DATA_DIR, 'index.json'), JSON.stringify(indexData));

  // 全記事IDリスト（generateStaticParams用）
  const allArticleIds = [];
  for (const dateEntry of availableDates) {
    const dateStr = typeof dateEntry.date === 'string'
      ? dateEntry.date.split('T')[0]
      : new Date(dateEntry.date).toISOString().split('T')[0];
    const result = await getArticles({ date: dateStr, page: 1, limit: 200 });
    for (const article of result.articles) {
      allArticleIds.push(article.id);
    }
  }
  fs.writeFileSync(
    path.join(DATA_DIR, 'all-ids.json'),
    JSON.stringify(allArticleIds)
  );

  // sitemap.xml 生成
  const SITE_URL = 'https://hinakira.com/ai-news';
  const today = new Date().toISOString().split('T')[0];
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  for (const articleId of allArticleIds) {
    try {
      const articleData = JSON.parse(
        fs.readFileSync(path.join(ARTICLES_DIR, `${articleId}.json`), 'utf-8')
      );
      const pubDate = articleData.published_at
        ? new Date(articleData.published_at).toISOString().split('T')[0]
        : today;
      sitemap += `  <url>
    <loc>${SITE_URL}/articles/${articleId}/</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>Hinakira AI News</news:name>
        <news:language>ja</news:language>
      </news:publication>
      <news:publication_date>${articleData.published_at || today}</news:publication_date>
      <news:title>${(articleData.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</news:title>
    </news:news>
  </url>
`;
    } catch (e) {
      // スキップ
    }
  }

  sitemap += `</urlset>`;

  // out/ ディレクトリが存在する場合はそこにも出力（ビルド後用）
  const publicDir = path.join(process.cwd(), 'public');
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log(`  sitemap.xml: ${allArticleIds.length + 1} URLs`);

  console.log(`=== Generated: ${dateList.length} date files, ${totalArticles} article files, index.json, all-ids.json, sitemap.xml ===`);
}

main().catch(err => {
  console.error('Data generation failed:', err);
  process.exit(1);
});
