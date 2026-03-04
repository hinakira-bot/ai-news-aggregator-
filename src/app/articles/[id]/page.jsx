import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const dynamicParams = false;

export async function generateStaticParams() {
  const idsPath = path.join(process.cwd(), 'public', 'data', 'all-ids.json');
  try {
    const ids = JSON.parse(fs.readFileSync(idsPath, 'utf-8'));
    if (ids.length === 0) {
      // Next.js requires at least one param for static export
      // Return a placeholder that will show a "not found" state
      return [{ id: '_placeholder' }];
    }
    return ids.map(id => ({ id: String(id) }));
  } catch {
    return [{ id: '_placeholder' }];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (id === '_placeholder') {
    return { title: 'Article Not Found - Hinakira AI News' };
  }

  const articlePath = path.join(process.cwd(), 'public', 'data', 'articles', `${id}.json`);
  try {
    const article = JSON.parse(fs.readFileSync(articlePath, 'utf-8'));
    return {
      title: `${article.title} - Hinakira AI News`,
      description: article.commentary ? article.commentary.substring(0, 160) : article.summary?.substring(0, 160),
      alternates: {
        canonical: `https://hinakira.com/ai-news/articles/${id}/`,
      },
      openGraph: {
        title: article.title,
        description: article.commentary ? article.commentary.substring(0, 160) : article.summary?.substring(0, 160),
        type: 'article',
        url: `https://hinakira.com/ai-news/articles/${id}/`,
      },
    };
  } catch {
    return { title: 'Hinakira AI News' };
  }
}

export default async function ArticlePage({ params }) {
  const { id } = await params;

  if (id === '_placeholder') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">記事が見つかりません</h1>
        <Link href="/" className="text-blue-600 hover:underline">← TOPに戻る</Link>
      </div>
    );
  }

  const articlePath = path.join(process.cwd(), 'public', 'data', 'articles', `${id}.json`);
  let article;
  try {
    article = JSON.parse(fs.readFileSync(articlePath, 'utf-8'));
  } catch {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">記事が見つかりません</h1>
        <Link href="/" className="text-blue-600 hover:underline">← TOPに戻る</Link>
      </div>
    );
  }

  const categoryColors = {
    'LLM': 'bg-purple-100 text-purple-800',
    '画像生成': 'bg-pink-100 text-pink-800',
    'ビジネス': 'bg-blue-100 text-blue-800',
    '研究': 'bg-green-100 text-green-800',
    'ツール': 'bg-orange-100 text-orange-800',
    'ロボティクス': 'bg-red-100 text-red-800',
    '規制・政策': 'bg-yellow-100 text-yellow-800',
    'その他': 'bg-gray-100 text-gray-800',
  };

  const colorClass = categoryColors[article.category] || 'bg-gray-100 text-gray-800';
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.commentary || article.summary,
    author: { '@type': 'Person', name: 'ヒナキラ' },
    datePublished: article.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'Hinakira AI News',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hinakira.com/ai-news/articles/${id}/`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto py-8 px-4">
        {/* 元記事リンク（上部） */}
        <div className="mb-6">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            📰 元記事を読む →
          </a>
        </div>

        {/* カテゴリタグ */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {article.category}
          </span>
          {article.relevance_score >= 8 && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              🔥 HOT
            </span>
          )}
          <span className="text-sm text-gray-500">
            {article.source_name} {publishedDate && `・ ${publishedDate}`}
          </span>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
          {article.title}
        </h1>

        {/* 要約セクション */}
        {article.summary && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
              📋 要約
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
              {article.summary}
            </div>
          </section>
        )}

        {/* 考察セクション */}
        {article.commentary && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
              💡 ヒナキラの考察
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              {article.commentary}
            </div>
          </section>
        )}

        {/* 元記事リンク（下部） */}
        <div className="mt-8 pt-6 border-t">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📰 元記事を読む →
          </a>
        </div>

        {/* TOPに戻る */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← TOPに戻る
          </Link>
        </div>
      </article>
    </>
  );
}
