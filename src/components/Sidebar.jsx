'use client';

import { CATEGORIES } from '../config/sources';

const CATEGORY_ICONS = {
  'ai-tools': '🛠',
  'llm-models': '🤖',
  'prompts': '💡',
  'marketing': '📈',
  'side-business': '💰',
  'vibe-coding': '👨‍💻',
  'workflow': '⚡',
  'media-ai': '🎨',
};

export default function Sidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  currentDate,
  availableDates,
  onDateChange,
  searchQuery,
  onSearch,
  total,
}) {
  const totalCount = Object.values(categoryCounts || {}).reduce((a, b) => a + b, 0);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const val = e.target.elements.search.value.trim();
    onSearch(val || null);
  }

  function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <aside className="w-full lg:w-56 flex-shrink-0 space-y-4">
      {/* 検索 */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search</h2>
        <form onSubmit={handleSearchSubmit}>
          <input
            name="search"
            type="text"
            defaultValue={searchQuery || ''}
            placeholder="キーワード検索..."
            className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>
      </div>

      {/* 日付選択 */}
      {availableDates && availableDates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</h2>
          <select
            value={currentDate || ''}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-sm"
          >
            {availableDates.map(d => {
              const dateStr = typeof d.date === 'string' ? d.date.split('T')[0] : new Date(d.date).toISOString().split('T')[0];
              return (
                <option key={dateStr} value={dateStr}>
                  {formatDisplayDate(dateStr)} ({d.count}件)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* カテゴリ */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categories</h2>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📋 All</span>
              <span className="text-xs text-gray-400">{totalCount}</span>
            </button>
          </li>
          {CATEGORIES.map(cat => {
            const count = categoryCounts?.[cat.slug] || 0;
            return (
              <li key={cat.slug}>
                <button
                  onClick={() => onSelectCategory(selectedCategory === cat.slug ? null : cat.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : count > 0
                        ? 'text-gray-600 hover:bg-gray-50'
                        : 'text-gray-300'
                  }`}
                  disabled={count === 0}
                >
                  <span>{CATEGORY_ICONS[cat.slug] || '📄'} {cat.label}</span>
                  {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 統計 */}
      <div className="bg-white rounded-lg shadow-sm p-3 text-center">
        <div className="text-2xl font-bold text-gray-800">{total}</div>
        <div className="text-[10px] text-gray-400 uppercase">articles today</div>
      </div>
    </aside>
  );
}
