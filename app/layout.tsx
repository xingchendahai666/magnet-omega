import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const meta Metadata = {
  title: 'MAGNET OMEGA | 聚合磁力搜索引擎',
  description: '并行搜索 84+ 真实引擎 · SSE 实时流式推送 · 智能去重聚合',
  keywords: ['magnet', 'torrent', 'search', 'bittorrent', '聚合搜索'],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
