'use client';

import Link from 'next/link';
import { CATEGORIES } from '../config/sources';

const CATEGORY_COLORS = {
  'ai-tools': 'bg-purple-100 text-purple-700 border-purple-200',
  'llm-models': 'bg-blue-100 text-blue-700 border-blue-200',
  'prompts': 'bg-green-100 text-green-700 border-green-200',
  'marketing': 'bg-pink-100 text-pink-700 border-pink-200',
  'side-business': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'vibe-coding': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'workflow': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'media-ai': 'bg-red-100 text-red-700 border-red-200',
};

const CATEGORY_ACCENT = {
  'ai-tools': 'group-hover:border-l-purple-500',
  'llm-models': 'group-hover:border-l-blue-500',
  'prompts': 'group-hover:border-l-green-500',
  'marketing': 'group-hover:border-l-pink-500',
  'side-business': 'group-hover:border-l-yellow-500',
  'vibe-coding': 'group-hover:border-l-cyan-500',
  'workflow': 'group-hover:border-l-indigo-500',
  'media-ai': 'group-hover:border-l-red-500',
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
  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-700 border-gray-200';
  const accentColor = CATEGORY_ACCENT[article.category] || 'group-hover:border-l-gray-500';
  const isHot = article.relevance_score >= 8;

  return (
    <Link
      href={`/articles/${article.id}/`}
      className={`block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-4 sm:p-5 group border-l-4 border-l-transparent ${accentColor}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          {/* カテゴリ + メタ情報 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${categoryColor}`}>
              {getCategoryLabel(article.category)}
            </span>
            {isHot && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold border border-orange-200">
                🔥 HOT
              </span>
            )}
            <span className="text-[11px] text-gray-400 ml-auto hidden sm:inline">
              {article.source_name} | {formatDate(article.published_at)}
            </span>
          </div>

          {/* タイトル */}
          <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-1.5">
            {article.title}
          </h3>

          {/* 考察プレビュー（冒頭2行） */}
          {article.commentary && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
              {article.commentary}
            </p>
          )}

          {/* モバイル用メタ情報 */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-[11px] text-gray-400">
              {article.source_name} | {formatDate(article.published_at)}
            </span>
          </div>
        </div>

        {/* 矢印アイコン（PC表示のみ） */}
        <div className="hidden sm:flex items-center self-center text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
