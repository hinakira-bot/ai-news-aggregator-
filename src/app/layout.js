import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata = {
  title: "AI News Daily - 個人向けAI最新情報まとめ",
  description: "最新AIツール、LLMモデル、プロンプト活用術、バイブコーディングなど、個人クリエイター・副業者向けのAI情報を毎日自動収集",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">AI</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">AI News Daily</h1>
                <p className="text-xs text-gray-500">個人向けAI最新情報</p>
              </div>
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-5xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            AI News Daily - 毎朝自動更新
          </div>
        </footer>
      </body>
    </html>
  );
}
