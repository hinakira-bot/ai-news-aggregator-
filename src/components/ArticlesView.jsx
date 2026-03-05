'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from './ArticleCard';
import Sidebar from './Sidebar';

const BASE_PATH = '/ai-news';
const ARTICLES_PER_PAGE = 30;

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
  const [currentPage, setCurrentPage] = useState(1);

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
    setCurrentPage(1);
  }, [allArticlesForDate, selectedCategory, searchQuery]);

  // 日付切替
  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    setSelectedCategory(null);
    setSearchQuery(null);
    setCurrentPage(1);
    loadDateData(newDate);
  };

  // ページネーション計算
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = articles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ページ番号リスト生成（最大5ページ表示）
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
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
        className="order-2 lg:order-none"
      />

      <div className="flex-1 min-w-0 order-1 lg:order-none">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-pulse text-lg">読み込み中...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">記事がありません</p>
            <p className="text-sm">
              {currentDate ? `${currentDate} の記事はまだありません。` : 'データがありません。'}
            </p>
          </div>
        ) : (
          <>
            {/* 件数表示 */}
            {totalPages > 1 && (
              <div className="text-xs text-gray-400 mb-3 px-1">
                {startIndex + 1}〜{Math.min(startIndex + ARTICLES_PER_PAGE, articles.length)}件 / 全{articles.length}件
              </div>
            )}

            <div className="space-y-2.5">
              {paginatedArticles.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1.5 mt-8 mb-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ← 前へ
                </button>

                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 text-sm rounded-xl border transition-colors font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  次へ →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
