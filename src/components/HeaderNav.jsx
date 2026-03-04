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
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            className={
              item.highlight
                ? 'px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm'
                : 'px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors'
            }
          >
            {item.label}
            {item.external && !item.highlight && (
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
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  item.highlight
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
                {item.external && (
                  <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
