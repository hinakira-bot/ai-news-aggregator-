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
  description: "最新AIツール、LLMモデル、プロンプト活用術、バイブコーディングなど、個人クリエイター・副業者向けのAI情報を毎日配信・考察",
  metadataBase: new URL('https://hinakira.com'),
  openGraph: {
    title: "Hinakira AI News",
    description: "個人向けAI最新情報を毎日配信・AIで要約・考察",
    url: "https://hinakira.com/ai-news/",
    siteName: "Hinakira AI News",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hinakira AI News",
    description: "個人向けAI最新情報を毎日配信・AIで要約・考察",
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
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative">
            <a href="/ai-news/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl rotate-3 group-hover:rotate-6 transition-transform opacity-80 blur-[2px]"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all">Hinakira</span>
                  <span className="text-gray-800 ml-1">AI News</span>
                </h1>
                <p className="text-[10px] text-gray-400 leading-tight tracking-wide hidden sm:block">{'\u301D'}個人向け{'\u301E'}に毎日最新のAI情報を配信</p>
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
            <p>Hinakira AI News - 個人向けAI最新情報を毎日配信</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
