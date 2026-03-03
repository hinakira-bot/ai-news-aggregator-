'use client';

import { CATEGORIES } from '../config/sources';

export default function CategoryFilter({ selected, onSelect, categoryCounts }) {
  const totalCount = Object.values(categoryCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
          !selected
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All ({totalCount})
      </button>
      {CATEGORIES.map(cat => {
        const count = categoryCounts?.[cat.slug] || 0;
        if (count === 0) return null;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelect(cat.slug === selected ? null : cat.slug)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
              selected === cat.slug
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label} ({count})
          </button>
        );
      })}
    </div>
  );
}
