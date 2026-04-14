'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Edit2, Trash2, Search, Check, X } from 'lucide-react';

interface EngineItem {
  id: string;
  name: string;
  enabled: boolean;
  category: string;
}

export default function EnginesPage() {
  const router = useRouter();
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 模拟数据
    setEngines([
      { id: 'piratebay', name: 'PirateBay', enabled: true, category: 'magnet' },
      { id: '1337x', name: '1337x', enabled: true, category: 'magnet' },
      { id: 'yts', name: 'YTS', enabled: true, category: 'movie' },
    ]);
  }, []);

  const toggleEngine = (id: string) => {
    setEngines(engines.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-xl">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">搜索引擎管理</h1>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索引擎..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加引擎
          </button>
        </div>

        <div className="space-y-2">
          {engines.map(engine => (
            <div
              key={engine.id}
              className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-200">{engine.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    engine.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'
                  }`}>
                    {engine.enabled ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">ID: {engine.id} · 分类: {engine.category}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => toggleEngine(engine.id)} className="p-2 hover:bg-slate-800 rounded-lg">
                  {engine.enabled ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-slate-600" />}
                </button>
                <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-yellow-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
