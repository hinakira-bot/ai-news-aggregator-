'use client';

import { CATEGORIES } from '../config/sources';

const IMPORTANCE_STYLES = {
  high: 'border-l-4 border-l-orange-400 bg-orange-50',
  medium: 'border-l-4 border-l-blue-300',
  low: 'border-l-4 border-l-gray-200',
};

const CATEGORY_COLORS = {
  'ai-tools': 'bg-purple-100 text-purple-800',
  'llm-models': 'bg-blue-100 text-blue-800',
  'prompts': 'bg-green-100 text-green-800',
  'marketing': 'bg-pink-100 text-pink-800',
  'side-business': 'bg-yellow-100 text-yellow-800',
  'vibe-coding': 'bg-cyan-100 text-cyan-800',
  'workflow': 'bg-indigo-100 text-indigo-800',
  'media-ai': 'bg-red-100 text-red-800',
};

function getCategoryLabel(slug) {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.label : slug;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ArticleCard({ article }) {
  const importanceStyle = IMPORTANCE_STYLES[article.importance] || IMPORTANCE_STYLES.medium;
  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-800';

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${importanceStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
              {getCategoryLabel(article.category)}
            </span>
            <span className="text-xs text-gray-400">
              {article.source_name}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(article.published_at)}
            </span>
            {article.relevance_score >= 8 && (
              <span className="text-xs text-orange-500 font-medium">HOT</span>
            )}
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 block"
          >
            {article.title}
          </a>

          {article.original_title && article.original_title !== article.title && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {article.original_title}
            </p>
          )}

          {article.summary && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
              {article.summary}
            </p>
          )}
        </div>

        {article.thumbnail_url && (
          <img
            src={article.thumbnail_url}
            alt=""
            className="w-20 h-20 rounded object-cover flex-shrink-0 hidden sm:block"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );
}
