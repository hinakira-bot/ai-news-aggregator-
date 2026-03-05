'use client';

import { useState } from 'react';

export default function HeaderNav({ menuItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (menuItems.length === 0) return null;

  return (
    <>
      {/* デスクトップメニュー */}
      <nav className="hidden md:flex items-center gap-2">
        {menuItems.map(item => (
          <a
            key={item.id}
            href={item.url}
            target={item.external !== false ? '_blank' : undefined}
            rel={item.external !== false ? 'noopener noreferrer' : undefined}
            className={
              item.highlight
                ? 'group relative inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden'
                : 'px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors'
            }
            style={item.highlight ? {
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite',
            } : undefined}
          >
            {item.highlight && (
              <>
                {/* shimmer effect */}
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </span>
                {/* sparkle icon */}
                <svg className="w-4 h-4 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </>
            )}
            <span className="relative z-10">{item.label}</span>
            {item.external !== false && !item.highlight && (
              <svg className="inline-block w-3 h-3 ml-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            )}
          </a>
        ))}
      </nav>

      {/* モバイルハンバーガー */}
      <button
        className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニュー"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        )}
      </button>

      {/* モバイルドロップダウン */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50">
          <div className="max-w-[1200px] mx-auto px-4 py-3 space-y-1">
            {menuItems.map(item => (
              <a
                key={item.id}
                href={item.url}
                target={item.external !== false ? '_blank' : undefined}
                rel={item.external !== false ? 'noopener noreferrer' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  item.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-center rounded-xl'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.highlight && (
                  <svg className="inline-block w-4 h-4 mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                )}
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
