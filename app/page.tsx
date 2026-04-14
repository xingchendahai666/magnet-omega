'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, TrendingUp, Zap, Shield, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const { searchHistory, addToHistory } = useStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setActiveQuery(inputValue.trim());
      addToHistory(inputValue.trim(), 0);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setActiveQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 简单背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* 主内容 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            MAGNET OMEGA
          </h1>
          <p className="text-slate-400 text-lg">全球磁力聚合搜索引擎</p>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex items-center gap-3 p-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
            <Search className="w-6 h-6 text-slate-400 ml-3" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入关键词搜索..."              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder:text-slate-500"
            />
            {inputValue && (
              <button type="button" onClick={handleClear} className="p-2 hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50"
            >
              搜索
            </button>
          </div>
        </form>

        {/* 快捷分类 */}
        {!activeQuery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: TrendingUp, label: '热门影视', query: 'Avengers' },
              { icon: Shield, label: '开源系统', query: 'Ubuntu' },
              { icon: Zap, label: '最新剧集', query: 'House of Dragon' },
              { icon: Globe, label: '3A大作', query: 'Cyberpunk 2077' },
            ].map((cat) => (
              <button
                key={cat.label}
                onClick={() => { setInputValue(cat.query); handleSearch({ preventDefault: () => {} } as any); }}
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all flex flex-col items-center gap-3"
              >
                <cat.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 搜索结果提示 */}
        {activeQuery && (
          <div className="text-center py-20">
            <div className="animate-pulse text-slate-400 mb-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>正在搜索: {activeQuery}</p>
              <p className="text-sm mt-2">连接搜索引擎中...</p>
            </div>
          </div>
        )}

        {/* 特性展示 */}        {!activeQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-center">
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200 mb-2">极速并行</h3>
              <p className="text-sm text-slate-400">同时搜索多个引擎</p>
            </div>
            <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-center">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200 mb-2">智能验证</h3>
              <p className="text-sm text-slate-400">自动检测链接状态</p>
            </div>
            <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-center">
              <Globe className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200 mb-2">全球聚合</h3>
              <p className="text-sm text-slate-400">覆盖主流站点</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
        }
