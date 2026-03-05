import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { CATEGORIES } from '../../../config/sources';
import ShareButtons from '../../../components/ShareButtons';
import ArticleSidebar from '../../../components/ArticleSidebar';
import { getSiteConfig } from '../../../lib/site-config';

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

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default async function ArticlePage({ params }) {
  const { id } = await params;

  if (id === '_placeholder') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">記事が見つかりません</h1>
        <Link href="/" className="text-[#4a5a7a] hover:underline">← TOPに戻る</Link>
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
        <Link href="/" className="text-[#4a5a7a] hover:underline">← TOPに戻る</Link>
      </div>
    );
  }

  const config = getSiteConfig();
  const sidebarSections = config.sidebar?.sections || [];

  const colors = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['ai-tools'];
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const collectedDate = article.collected_at
    ? new Date(article.collected_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const isPick = article.is_pick;

  // key_points と faq を安全にパース（DBからはJSON文字列の場合がある）
  const keyPoints = Array.isArray(article.key_points) ? article.key_points
    : (typeof article.key_points === 'string' ? JSON.parse(article.key_points || '[]') : []);
  const faq = Array.isArray(article.faq) ? article.faq
    : (typeof article.faq === 'string' ? JSON.parse(article.faq || '[]') : []);
  const relatedArticles = article.relatedArticles || [];

  // === 構造化データ ===

  // 1. NewsArticle schema（公開日 + 更新日）
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.commentary || article.summary,
    author: {
      '@type': 'Person',
      name: 'ヒナキラ',
      url: 'https://hinakira.com/',
    },
    datePublished: article.published_at,
    dateModified: article.collected_at || article.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'Hinakira AI News',
      url: 'https://hinakira.com/ai-news/',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hinakira.com/ai-news/articles/${id}/`,
    },
  };

  // 2. BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Hinakira AI News',
        item: 'https://hinakira.com/ai-news/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: getCategoryLabel(article.category),
        item: `https://hinakira.com/ai-news/?category=${article.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://hinakira.com/ai-news/articles/${id}/`,
      },
    ],
  };

  // 3. FAQPage schema（FAQがある場合のみ）
  const faqJsonLd = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* ① パンくずリスト */}
      <nav className="pt-3 pb-4" aria-label="パンくずリスト">
        <ol className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <li>
            <Link href="/" className="hover:text-gray-600 transition-colors">TOP</Link>
          </li>
          <li><span className="mx-1">/</span></li>
          <li>
            <span className={`${colors.text}`}>{getCategoryLabel(article.category)}</span>
          </li>
          <li><span className="mx-1">/</span></li>
          <li className="text-gray-600 truncate max-w-[200px] sm:max-w-[400px]" title={article.title}>
            {article.title}
          </li>
        </ol>
      </nav>

      <div className="flex gap-6 flex-col lg:flex-row pb-12">
      {/* メインコンテンツ */}
      <article className="flex-1 min-w-0">
        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* ヘッダー部分 */}
          <div className={`px-6 sm:px-8 pt-6 sm:pt-8 pb-5 ${colors.bg} border-b ${colors.border}`}>
            {/* カテゴリ + メタ情報 */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${colors.badge}`}>
                {getCategoryLabel(article.category)}
              </span>
              {isPick && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm animate-pick-glow">
                  <svg className="w-3.5 h-3.5 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  PICK OF THE DAY
                </span>
              )}
            </div>

            {/* タイトル */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-3">
              {article.title}
            </h1>

            {/* ⑥ ソース + 公開日 + 更新日 */}
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                {article.source_name}
              </span>
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  公開: {publishedDate}
                </span>
              )}
              {collectedDate && collectedDate !== publishedDate && (
                <span className="text-xs text-gray-400">
                  (考察: {collectedDate})
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
              className="inline-flex items-center gap-2 text-sm text-[#4a5a7a] hover:text-[#3a4a68] transition-colors group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span className="group-hover:underline">元記事を読む</span>
            </a>

            {/* ③ ポイント3選セクション */}
            {keyPoints.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-amber-400 rounded-full"></div>
                  <h2 className="text-base font-bold text-gray-700">この記事のポイント</h2>
                </div>
                <ul className="space-y-2">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <span className="flex-shrink-0 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[15px] text-gray-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

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
                  <div className={`w-1 h-5 rounded-full`} style={{background: 'linear-gradient(to bottom, #4a5a7a, #c4a0a0)'}}></div>
                  <h2 className="text-base font-bold text-gray-700">当サイトの考察</h2>
                </div>
                <div className="relative bg-gradient-to-br from-[#f5eded] to-[#eef0f4] rounded-xl p-5 border border-[#c4a0a0]/20">
                  <div className="absolute top-4 left-4 text-[#c4a0a0]/40 text-4xl leading-none font-serif">&ldquo;</div>
                  <div className="text-[15px] text-gray-700 leading-[1.85] whitespace-pre-wrap pl-4">
                    {article.commentary}
                  </div>
                </div>
              </section>
            )}

            {/* ④ FAQセクション */}
            {faq.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-green-400 rounded-full"></div>
                  <h2 className="text-base font-bold text-gray-700">よくある質問</h2>
                </div>
                <div className="space-y-3">
                  {faq.map((item, i) => (
                    <details key={i} className="bg-green-50 rounded-xl border border-green-100 group">
                      <summary className="flex items-center gap-3 p-4 cursor-pointer select-none list-none">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">Q</span>
                        <span className="text-[15px] font-medium text-gray-800 flex-1">{item.question}</span>
                        <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </summary>
                      <div className="px-4 pb-4 pt-0 ml-9">
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">A</span>
                          <p className="text-[15px] text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* 元記事リンク（下部・CTA風） */}
            <div className="pt-4">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex px-6 py-3 bg-gradient-to-r from-[#4a5a7a] to-[#3a4a68] text-white rounded-xl hover:from-[#3a4a68] hover:to-[#2d3b52] transition-all shadow-sm hover:shadow text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                元記事を読む
              </a>
            </div>

            {/* SNSシェアボタン */}
            <ShareButtons
              title={article.title}
              url={`https://hinakira.com/ai-news/articles/${id}/`}
            />
          </div>
        </div>

        {/* ⑤ 著者プロフィール */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <img
              src="/ai-news/images/profile.jpg"
              alt="ヒナキラ"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">ヒナキラ</h3>
              <p className="text-xs text-gray-400 mb-2">Hinakira AI News 編集長</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                AIツール・LLM・プロンプト活用術を中心に、個人クリエイター・副業者向けのAI最新情報を毎日お届けしています。AI歴3年以上、いろんな用途に実際に使って試してきた知見をもとに、読者が「自分ごと」として活用できる考察を心がけています。
              </p>
            </div>
          </div>
        </div>

        {/* ② 関連記事セクション */}
        {relatedArticles.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              関連する記事
            </h3>
            <ul className="space-y-2">
              {relatedArticles.map(ra => (
                <li key={ra.id}>
                  <Link
                    href={`/articles/${ra.id}/`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      (CATEGORY_COLORS[ra.category] || CATEGORY_COLORS['ai-tools']).badge
                    }`}>
                      {getCategoryLabel(ra.category)}
                    </span>
                    <span className="text-sm text-gray-700 group-hover:text-[#4a5a7a] transition-colors flex-1 line-clamp-1">
                      {ra.title}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 hidden sm:inline">
                      {formatDateShort(ra.published_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* モバイル用サイドバー（lg未満で表示） */}
        <div className="mt-6 lg:hidden">
          <ArticleSidebar sections={sidebarSections} />
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

      {/* PC用サイドバー（lg以上で表示） */}
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-20">
          <ArticleSidebar sections={sidebarSections} />
        </div>
      </aside>
      </div>
    </>
  );
}
