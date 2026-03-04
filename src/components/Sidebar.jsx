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
    <aside className="w-full lg:w-60 flex-shrink-0 space-y-3">
      {/* 検索 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Search</h2>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <input
              name="search"
              type="text"
              defaultValue={searchQuery || ''}
              placeholder="キーワード検索..."
              className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* 日付選択 */}
      {availableDates && availableDates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Date</h2>
          <select
            value={currentDate || ''}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Categories</h2>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                !selectedCategory ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📋 すべて</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{totalCount}</span>
            </button>
          </li>
          {CATEGORIES.map(cat => {
            const count = categoryCounts?.[cat.slug] || 0;
            return (
              <li key={cat.slug}>
                <button
                  onClick={() => onSelectCategory(selectedCategory === cat.slug ? null : cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : count > 0
                        ? 'text-gray-600 hover:bg-gray-50'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                  disabled={count === 0}
                >
                  <span className="truncate">{CATEGORY_ICONS[cat.slug] || '📄'} {cat.label}</span>
                  {count > 0 && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 統計 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-4 text-center">
        <div className="text-3xl font-bold text-white">{total}</div>
        <div className="text-[11px] text-blue-200 uppercase tracking-wide mt-0.5">articles</div>
      </div>
    </aside>
  );
}
