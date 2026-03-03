'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from '../components/ArticleCard';
import CategoryFilter from '../components/CategoryFilter';
import DatePicker from '../components/DatePicker';
import SearchBar from '../components/SearchBar';

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

  const highArticles = articles.filter(a => a.importance === 'high');
  const mediumArticles = articles.filter(a => a.importance === 'medium');
  const lowArticles = articles.filter(a => a.importance === 'low');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DatePicker
          currentDate={currentDate}
          availableDates={availableDates}
          onDateChange={(date) => {
            setCurrentDate(date);
            setSelectedCategory(null);
          }}
        />
        <SearchBar onSearch={setSearchQuery} />
      </div>

      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        categoryCounts={categories}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <button onClick={fetchArticles} className="text-sm text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No articles</p>
          <p className="text-sm">
            {currentDate
              ? `${currentDate} has no articles.`
              : 'No data found. Run /api/collect to start collecting.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {highArticles.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-3">
                Important ({highArticles.length})
              </h2>
              <div className="space-y-3">
                {highArticles.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            </section>
          )}

          {mediumArticles.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">
                News ({mediumArticles.length})
              </h2>
              <div className="space-y-3">
                {mediumArticles.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            </section>
          )}

          {lowArticles.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Other ({lowArticles.length})
              </h2>
              <div className="space-y-3">
                {lowArticles.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            </section>
          )}

          <div className="text-center text-sm text-gray-400 pt-4">
            {total} articles total
          </div>
        </div>
      )}
    </div>
  );
}
