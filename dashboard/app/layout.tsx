import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "GMO Coin 自動売買BOT 管理ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ConvexClientProvider>
          <div className="min-h-screen bg-gray-950 text-gray-100">
            <nav className="border-b border-gray-800 bg-gray-900">
              <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-8">
                <span className="font-bold text-lg">Trading BOT</span>
                <a href="/" className="text-sm text-gray-400 hover:text-white">
                  ダッシュボード
                </a>
                <a href="/trades" className="text-sm text-gray-400 hover:text-white">
                  取引履歴
                </a>
                <a href="/settings" className="text-sm text-gray-400 hover:text-white">
                  設定
                </a>
              </div>
            </nav>
            <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
