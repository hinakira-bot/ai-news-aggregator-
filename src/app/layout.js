import localFont from "next/font/local";
import "./globals.css";
import { getSiteConfig } from '../lib/site-config';
import HeaderNav from '../components/HeaderNav';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata = {
  title: "Hinakira AI News - 個人向けAI最新情報まとめ",
  description: "最新AIツール、LLMモデル、プロンプト活用術、バイブコーディングなど、個人クリエイター・副業者向けのAI情報を毎日自動収集・考察",
  metadataBase: new URL('https://hinakira.com'),
  openGraph: {
    title: "Hinakira AI News",
    description: "個人向けAI最新情報を毎日自動収集・AIで要約・考察",
    url: "https://hinakira.com/ai-news/",
    siteName: "Hinakira AI News",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hinakira AI News",
    description: "個人向けAI最新情報を毎日自動収集・AIで要約・考察",
  },
  alternates: {
    canonical: "https://hinakira.com/ai-news/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const config = getSiteConfig();

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased bg-gray-50 min-h-screen`}>
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
            <a href="/ai-news/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">Hinakira AI News</h1>
                <p className="text-[10px] text-gray-400 leading-tight">個人向けAI最新情報まとめ</p>
              </div>
            </a>
            <HeaderNav menuItems={config.header?.menuItems || []} />
          </div>
        </header>
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-200/80 bg-white mt-8">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
            <p>Hinakira AI News - 個人向けAI最新情報を毎日自動収集</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
