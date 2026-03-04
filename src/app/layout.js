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
      <body className={`${geistSans.variable} antialiased bg-gray-100 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">AI News Daily</h1>
                <p className="text-[10px] text-gray-400 leading-tight">個人向けAI最新情報まとめ</p>
              </div>
            </a>
          </div>
        </header>
        <main className="max-w-[1400px] mx-auto px-4 py-5">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white mt-8">
          <div className="max-w-[1400px] mx-auto px-4 py-3 text-center text-xs text-gray-400">
            AI News Daily - 毎朝自動更新
          </div>
        </footer>
      </body>
    </html>
  );
}
