import fs from 'fs';
import path from 'path';
import ArticlesView from '../components/ArticlesView';

export default function Home() {
  // ビルド時にJSONデータを読み込み
  let initialData = { articles: [], total: 0, categories: {}, availableDates: [], date: null };

  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'index.json');
    const indexJson = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const latestDate = indexJson.dates[0];

    if (latestDate) {
      const datePath = path.join(process.cwd(), 'public', 'data', 'dates', `${latestDate}.json`);
      const dateData = JSON.parse(fs.readFileSync(datePath, 'utf-8'));
      initialData = {
        articles: dateData.articles,
        total: dateData.total,
        categories: dateData.categories,
        availableDates: indexJson.dates.map(d => ({ date: d, count: indexJson.dateCounts[d] || 0 })),
        date: latestDate,
      };
    }
  } catch (e) {
    console.warn('No data files found (first build?):', e.message);
  }

  return (
    <>
      {/* SEO: 検索エンジン用の記事一覧 */}
      <noscript>
        <div>
          <h2>AI News - Latest Articles</h2>
          <ul>
            {initialData.articles.map((a) => (
              <li key={a.id}>
                <a href={`/ai-news/articles/${a.id}/`}>
                  <strong>{a.title}</strong>
                </a>
                {a.summary && <p>{a.summary}</p>}
                <small>{a.source_name} - {a.category}</small>
              </li>
            ))}
          </ul>
        </div>
      </noscript>

      {/* JSON-LD 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Hinakira AI News",
            "description": "個人向けAI最新情報を毎日自動収集・AIで要約・考察",
            "url": "https://hinakira.com/ai-news/",
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": initialData.total,
              "itemListElement": initialData.articles.slice(0, 10).map((a, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                  "@type": "NewsArticle",
                  "headline": a.title,
                  "url": `https://hinakira.com/ai-news/articles/${a.id}/`,
                  "description": a.summary || "",
                  "publisher": { "@type": "Organization", "name": a.source_name },
                },
              })),
            },
          }),
        }}
      />

      {/* インタラクティブなクライアントコンポーネント */}
      <ArticlesView initialData={initialData} />
    </>
  );
}
