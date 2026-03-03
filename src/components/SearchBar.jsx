'use client';

import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(query.trim() || null);
  }

  function handleClear() {
    setQuery('');
    onSearch(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            x
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-1.5 rounded bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
