import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { CATEGORIES } from '../../../config/sources';

export const dynamicParams = false;

export async function generateStaticParams() {
  const idsPath = path.join(process.cwd(), 'public', 'data', 'all-ids.json');
  try {
    const ids = JSON.parse(fs.readFileSync(idsPath, 'utf-8'));
    if (ids.length === 0) {
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

const CATEGORY_COLORS = {
  'ai-tools': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', accent: 'border-purple-500' },
  'llm-models': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', accent: 'border-blue-500' },
  'prompts': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', accent: 'border-green-500' },
  'marketing': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700', accent: 'border-pink-500' },
  'side-business': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', accent: 'border-yellow-500' },
  'vibe-coding': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700', accent: 'border-cyan-500' },
  'workflow': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', accent: 'border-indigo-500' },
  'media-ai': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', accent: 'border-red-500' },
};

function getCategoryLabel(slug) {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.label : slug;
}

export default async function ArticlePage({ params }) {
  const { id } = await params;

  if (id === '_placeholder') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
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
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">記事が見つかりません</h1>
        <Link href="/" className="text-blue-600 hover:underline">← TOPに戻る</Link>
      </div>
    );
  }

  const colors = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['ai-tools'];
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const isHot = article.relevance_score >= 8;

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

      {/* 戻るリンク */}
      <div className="max-w-4xl mx-auto px-4 pt-2 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 記事一覧に戻る
        </Link>
      </div>

      <article className="max-w-4xl mx-auto px-4 pb-12">
        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* ヘッダー部分 */}
          <div className={`px-6 sm:px-8 pt-6 sm:pt-8 pb-5 ${colors.bg} border-b ${colors.border}`}>
            {/* カテゴリ + メタ情報 */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${colors.badge}`}>
                {getCategoryLabel(article.category)}
              </span>
              {isHot && (
                <span className="text-xs px-2 py-1 rounded-full font-bold bg-orange-100 text-orange-600">
                  🔥 注目
                </span>
              )}
            </div>

            {/* タイトル */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
              {article.title}
            </h1>

            {/* ソース + 日付 */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                {article.source_name}
              </span>
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {publishedDate}
                </span>
              )}
            </div>
          </div>

          {/* コンテンツ部分 */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-8">
            {/* 元記事リンク（上部） */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span className="group-hover:underline">元記事を読む</span>
            </a>

            {/* 要約セクション */}
            {article.summary && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-gray-400 rounded-full"></div>
                  <h2 className="text-base font-bold text-gray-700">要約</h2>
                </div>
                <div className="text-[15px] text-gray-700 leading-[1.85] whitespace-pre-wrap bg-gray-50 rounded-xl p-5">
                  {article.summary}
                </div>
              </section>
            )}

            {/* 考察セクション */}
            {article.commentary && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1 h-5 rounded-full ${colors.accent} bg-current`} style={{color: 'transparent', borderLeftWidth: '4px'}}></div>
                  <div className={`w-1 h-5 rounded-full`} style={{background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)'}}></div>
                  <h2 className="text-base font-bold text-gray-700">ヒナキラの考察</h2>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="absolute top-4 left-4 text-blue-200 text-4xl leading-none font-serif">&ldquo;</div>
                  <div className="text-[15px] text-gray-700 leading-[1.85] whitespace-pre-wrap pl-4">
                    {article.commentary}
                  </div>
                </div>
              </section>
            )}

            {/* 元記事リンク（下部・CTA風） */}
            <div className="pt-4">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                元記事を読む
              </a>
            </div>
          </div>
        </div>

        {/* TOPに戻る（下部） */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← 記事一覧に戻る
          </Link>
        </div>
      </article>
    </>
  );
}
