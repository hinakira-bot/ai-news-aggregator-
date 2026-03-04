'use client';

import { CATEGORIES } from '../config/sources';

const CATEGORY_COLORS = {
  'ai-tools': 'bg-purple-100 text-purple-700',
  'llm-models': 'bg-blue-100 text-blue-700',
  'prompts': 'bg-green-100 text-green-700',
  'marketing': 'bg-pink-100 text-pink-700',
  'side-business': 'bg-yellow-100 text-yellow-700',
  'vibe-coding': 'bg-cyan-100 text-cyan-700',
  'workflow': 'bg-indigo-100 text-indigo-700',
  'media-ai': 'bg-red-100 text-red-700',
};

function getCategoryLabel(slug) {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.label : slug;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ArticleCard({ article }) {
  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-700';
  const isHot = article.relevance_score >= 8;
  const isHigh = article.importance === 'high';

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden group ${isHigh ? 'ring-1 ring-orange-300' : ''}`}
    >
      {/* サムネイル */}
      {article.thumbnail_url ? (
        <div className="w-full h-28 bg-gray-100 overflow-hidden">
          <img
            src={article.thumbnail_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      ) : (
        <div className={`w-full h-2 ${isHigh ? 'bg-gradient-to-r from-orange-400 to-amber-400' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`} />
      )}

      <div className="p-3">
        {/* カテゴリ + メタ */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColor}`}>
            {getCategoryLabel(article.category)}
          </span>
          {isHot && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold">HOT</span>
          )}
        </div>

        {/* タイトル */}
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1.5">
          {article.title}
        </h3>

        {/* 要約 */}
        {article.summary && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
            {article.summary}
          </p>
        )}

        {/* ソース + 日付 */}
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>{article.source_name}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
    </a>
  );
}
