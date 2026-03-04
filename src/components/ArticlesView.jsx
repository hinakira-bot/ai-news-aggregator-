'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from './ArticleCard';
import Sidebar from './Sidebar';

const BASE_PATH = '/ai-news';

export default function ArticlesView({ initialData }) {
  const [articles, setArticles] = useState(initialData.articles || []);
  const [total, setTotal] = useState(initialData.total || 0);
  const [categories, setCategories] = useState(initialData.categories || {});
  const [availableDates, setAvailableDates] = useState(initialData.availableDates || []);
  const [currentDate, setCurrentDate] = useState(initialData.date || null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);
  const [allArticlesForDate, setAllArticlesForDate] = useState(initialData.articles || []);
  const [loading, setLoading] = useState(false);

  // 日付変更時に対応するJSONファイルを取得
  const loadDateData = useCallback(async (dateStr) => {
    if (!dateStr) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/data/dates/${dateStr}.json`);
      if (!res.ok) throw new Error('Data not found');
      const data = await res.json();
      setAllArticlesForDate(data.articles || []);
      setCategories(data.categories || {});
    } catch (err) {
      console.error('Failed to load date data:', err);
      setAllArticlesForDate([]);
      setCategories({});
    } finally {
      setLoading(false);
    }
  }, []);

  // クライアント側フィルタリング（カテゴリ + 検索）
  useEffect(() => {
    let filtered = [...allArticlesForDate];

    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.summary && a.summary.toLowerCase().includes(q)) ||
        (a.commentary && a.commentary.toLowerCase().includes(q)) ||
        (a.original_title && a.original_title.toLowerCase().includes(q))
      );
    }

    setArticles(filtered);
    setTotal(filtered.length);
  }, [allArticlesForDate, selectedCategory, searchQuery]);

  // 日付切替
  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    setSelectedCategory(null);
    setSearchQuery(null);
    loadDateData(newDate);
  };

  return (
    <div className="flex gap-5 flex-col lg:flex-row">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categories}
        currentDate={currentDate}
        availableDates={availableDates}
        onDateChange={handleDateChange}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        total={total}
      />

      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-pulse text-lg">Loading...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">No articles</p>
            <p className="text-sm">
              {currentDate ? `${currentDate} has no articles.` : 'No data yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
