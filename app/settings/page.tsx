'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Palette, Bell, Shield, Trash2, Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-xl">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* 外观 */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">外观</h3>
          <div className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-200">主题模式</div>
              <div className="text-sm text-slate-500">深色模式</div>
            </div>
          </div>
        </div>

        {/* 搜索与下载 */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">搜索与下载</h3>
          <div className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-200">搜索提醒</div>
              <div className="text-sm text-slate-500">新资源可用时通知</div>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">数据管理</h3>
          <div className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-200">清除搜索历史</div>
              <div className="text-sm text-slate-500">移除本地保存的搜索记录</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-200">导出配置</div>
              <div className="text-sm text-slate-500">备份历史记录与收藏夹</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
