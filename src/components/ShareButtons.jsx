'use client';

import { useState } from 'react';

export default function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pt-2 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-3">この記事をシェアする</p>
      <div className="flex items-center gap-2 flex-wrap">
        {/* X (Twitter) */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Post
        </a>
        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-xs font-medium hover:bg-[#166FE5] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Share
        </a>
        {/* はてなブックマーク */}
        <a
          href={`https://b.hatena.ne.jp/entry/s/${url.replace('https://', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00A4DE] text-white rounded-lg text-xs font-medium hover:bg-[#0093C4] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.47 21.22H3.53A1.52 1.52 0 012 19.69V4.31A1.52 1.52 0 013.53 2.78h16.94A1.52 1.52 0 0122 4.31v15.38a1.52 1.52 0 01-1.53 1.53zM8.87 17.19h1.39V6.81H8.87zm5.07-3.68a2.76 2.76 0 00.64-1.86c0-1.7-1.21-2.86-3.21-2.86h-2.5v3.72h1.39V10.1h.75a1.47 1.47 0 011.55 1.49 1.49 1.49 0 01-1.55 1.52h-.75v1.1h.75a1.67 1.67 0 011.8 1.7 1.69 1.69 0 01-1.8 1.72h-.75v-1.77H9.87v3.33h2.5c2 0 3.21-1.2 3.21-2.97a2.93 2.93 0 00-1.64-2.71z"/></svg>
          Bookmark
        </a>
        {/* LINE */}
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#06C755] text-white rounded-lg text-xs font-medium hover:bg-[#05B64D] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.629.629 0 01-.199.031c-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595a.64.64 0 01.194-.033c.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          LINE
        </a>
        {/* Threads */}
        <a
          href={`https://www.threads.net/intent/post?text=${encodeURIComponent(title + ' ' + url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 192 192" fill="currentColor"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.673-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.681 22.231-5.574 29.049-14.54 5.182-6.813 8.458-15.473 9.876-26.126 5.921 3.576 10.313 8.302 12.742 14.06 4.15 9.834 4.39 25.988-7.335 37.725-10.26 10.28-22.588 14.725-41.16 14.862-20.597-.15-36.187-6.747-46.32-19.604C46.072 137.468 40.49 117.845 40.323 96c.166-21.845 5.749-41.468 16.598-58.297C67.054 25.046 82.644 18.448 103.24 18.299c20.742.15 36.508 6.775 46.876 19.69 5.042 6.28 8.742 13.85 11.087 22.595l14.88-3.985c-2.875-10.737-7.549-20.08-13.994-27.923C149.34 13.155 129.362 4.15 103.287 4 77.07 4.16 56.906 13.205 43.803 29.833 29.696 47.835 22.465 72.628 22.277 96l.002.11c.188 23.372 7.42 48.165 21.526 66.167 13.103 16.628 33.267 25.673 59.487 25.833h.11c22.472-.159 38.847-6.14 51.558-18.836 17.086-17.08 16.125-38.637 10.377-52.256-4.124-9.758-12.003-17.56-22.777-22.634l-.023-.01ZM109.2 141.405c-10.452.574-21.307-4.129-22.218-16.19-.667-8.81 5.956-18.721 24.708-19.8 2.159-.124 4.274-.184 6.35-.184 6.28 0 12.168.7 17.524 2.066-1.994 28.472-14.877 33.505-26.364 34.108Z"/></svg>
          Threads
        </a>
        {/* URLコピー */}
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              コピー済み
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              URLコピー
            </>
          )}
        </button>
      </div>
    </div>
  );
}
