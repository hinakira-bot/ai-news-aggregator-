'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentDate) params.set('date', currentDate);
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setCategories(data.categories || {});
      setAvailableDates(data.availableDates || []);
      if (!currentDate && data.date) {
        setCurrentDate(data.date);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="flex gap-5 flex-col lg:flex-row">
      {/* サイドバー */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categories}
        currentDate={currentDate}
        availableDates={availableDates}
        onDateChange={(date) => {
          setCurrentDate(date);
          setSelectedCategory(null);
        }}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        total={total}
      />

      {/* メインコンテンツ: 4列グリッド */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">Error: {error}</p>
            <button onClick={fetchArticles} className="text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">No articles</p>
            <p className="text-sm">
              {currentDate ? `${currentDate} has no articles.` : 'No data yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {articles.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
