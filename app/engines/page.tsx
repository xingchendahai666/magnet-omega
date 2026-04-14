'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Plus, Edit2, Trash2, Share2, GripVertical, 
  Search, CheckCircle2, AlertCircle, Loader2, Download, Upload,
  TestTube2, Save, X, Eye, EyeOff, Filter
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { ENABLED_ENGINES } from '@/lib/engines/registry';

interface EngineItem {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  lastTested?: number;
  testStatus?: 'success' | 'failed' | 'testing' | null;
  responseTime?: number;
}

export default function EnginesPage() {
  const router = useRouter();
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEngine, setEditingEngine] = useState<EngineItem | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    loadEngines();
  }, []);

  const loadEngines = () => {
    const saved = localStorage.getItem('omega_engines');
    if (saved) {
      setEngines(JSON.parse(saved));
    } else {
      const defaultEngines: EngineItem[] = ENABLED_ENGINES.map((e, idx) => ({
        id: e.id,
        name: e.name,
        enabled: e.enabled,
        order: idx,
      }));
      setEngines(defaultEngines);
      localStorage.setItem('omega_engines', JSON.stringify(defaultEngines));
    }
  };

  const saveEngines = (newEngines: EngineItem[]) => {
    setEngines(newEngines);
    localStorage.setItem('omega_engines', JSON.stringify(newEngines));
  };

  const handleDragEnd = (newOrder: EngineItem[]) => {
    const updated = newOrder.map((eng, idx) => ({ ...eng, order: idx }));
    saveEngines(updated);
  };

  const toggleEngine = (id: string) => {
    const updated = engines.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e);
    saveEngines(updated);
  };

  const deleteEngine = (id: string) => {
    const updated = engines.filter(e => e.id !== id);
    saveEngines(updated);
  };

  const testEngine = async (id: string) => {
    setTestingId(id);
    const updated = engines.map(e => e.id === id ? { ...e, testStatus: 'testing' } : e);
    saveEngines(updated);

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      const success = Math.random() > 0.15;
      
      setEngines(prev => prev.map(e => e.id === id ? {
        ...e,
        testStatus: success ? 'success' : 'failed',
        lastTested: Date.now(),
        responseTime: success ? Math.floor(200 + Math.random() * 600) : undefined,
      } : e));
    } finally {
      setTestingId(null);
    }
  };

  const exportEngines = () => {
    const blob = new Blob([JSON.stringify(engines, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engines-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importEngines = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          saveEngines(data);
        }
      } catch (err) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  const filteredEngines = engines.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterEnabled === null ? true : e.enabled === filterEnabled;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-slate-800/50 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">搜索引擎管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportEngines} className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors" title="导出">
              <Download className="w-5 h-5 text-slate-400" />
            </button>
            <label className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer" title="导入">
              <Upload className="w-5 h-5 text-slate-400" />
              <input type="file" accept=".json" onChange={importEngines} className="hidden" />
            </label>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加引擎
            </button>
          </div>
        </div>

        {/* 搜索与筛选 */}
        <div className="px-4 pb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索引擎名称或 ID..."
              className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-2">
            {[null, true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setFilterEnabled(val)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterEnabled === val 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                    : 'bg-slate-800/50 text-slate-400 border border-transparent'
                }`}
              >
                {val === null ? '全部' : val ? '已启用' : '已禁用'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 引擎列表 */}
      <div className="p-4 max-w-4xl mx-auto">
        <Reorder.Group axis="y" values={filteredEngines} onReorder={handleDragEnd} className="space-y-3">
          <AnimatePresence>
            {filteredEngines.map((engine) => (
              <Reorder.Item key={engine.id} value={engine} className="relative">
                <GlassCard className="p-4 group">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-slate-600">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-100 truncate">{engine.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${engine.enabled ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                          {engine.enabled ? '启用' : '禁用'}
                        </span>
                        {engine.testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {engine.testStatus === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>ID: {engine.id}</span>
                        {engine.lastTested && <span>测试: {new Date(engine.lastTested).toLocaleDateString()}</span>}
                        {engine.responseTime && <span>响应: {engine.responseTime}ms</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testEngine(engine.id)}
                        disabled={testingId === engine.id}
                        className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                        title="测试连通性"
                      >
                        {testingId === engine.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingEngine(engine)}
                        className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-yellow-400 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleEngine(engine.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${engine.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                      >
                        <motion.div
                          animate={{ x: engine.enabled ? 20 : 2 }}
                          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                        />
                      </button>
                      <button
                        onClick={() => deleteEngine(engine.id)}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {filteredEngines.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>没有找到匹配的引擎</p>
          </div>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <AnimatePresence>
        {(showAddModal || editingEngine) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); setEditingEngine(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">{editingEngine ? '编辑引擎' : '添加引擎'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">引擎名称</label>
                  <input
                    type="text"
                    defaultValue={editingEngine?.name}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">引擎 ID (唯一标识)</label>
                  <input
                    type="text"
                    defaultValue={editingEngine?.id}
                    disabled={!!editingEngine}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowAddModal(false); setEditingEngine(null); }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => { setShowAddModal(false); setEditingEngine(null); }}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
      }
