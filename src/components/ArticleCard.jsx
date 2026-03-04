'use client';

import Link from 'next/link';
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
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ArticleCard({ article }) {
  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-700';
  const isHot = article.relevance_score >= 8;

  return (
    <Link
      href={`/articles/${article.id}/`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-4 group"
    >
      {/* カテゴリ + メタ情報 */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${categoryColor}`}>
          {getCategoryLabel(article.category)}
        </span>
        {isHot && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-orange-100 text-orange-600 font-bold">HOT</span>
        )}
        <span className="text-[11px] text-gray-400 ml-auto">
          {article.source_name} | {formatDate(article.published_at)}
        </span>
      </div>

      {/* タイトル */}
      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
        {article.title}
      </h3>

      {/* 考察プレビュー（冒頭2行） */}
      {article.commentary && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {article.commentary}
        </p>
      )}
    </Link>
  );
}
