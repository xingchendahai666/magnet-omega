'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Star, Clock, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-xl">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">个人中心</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* 用户信息 */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">已登录</h2>
              <p className="text-slate-400 text-sm">UID: 88492011</p>
            </div>
          </div>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-xs text-slate-500 mt-1">搜索次数</div>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-400">0</div>
            <div className="text-xs text-slate-500 mt-1">收藏资源</div>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-xs text-slate-500 mt-1">下载完成</div>
          </div>
        </div>

        {/* 菜单 */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="flex-1 text-left font-medium">我的收藏</span>
            <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
          </button>
          
          <button className="w-full flex items-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="flex-1 text-left font-medium">搜索历史</span>
            <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
          </button>

          <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span className="flex-1 text-left font-medium">设置</span>
            <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-red-500/50 transition-all text-red-400">
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
}
