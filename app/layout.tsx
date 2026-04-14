import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MAGNET OMEGA | 超级磁力聚合搜索引擎',
  description: '并行搜索 84+ 真实引擎 · SSE 实时流式推送 · 智能去重聚合 · 业界顶尖磁力搜索工具',
  keywords: ['magnet', 'torrent', 'search', 'bittorrent', '聚合搜索', '磁力链接', '种子搜索'],
  authors: [{ name: 'Magnet Omega Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 antialiased overflow-x-hidden`}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
    }
