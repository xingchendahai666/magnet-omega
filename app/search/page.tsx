'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Filter, ArrowUpDown, HardDrive, Clock, TrendingUp, 
  Check, Loader2, ExternalLink, Copy, AlertCircle, RefreshCw,
  Grid3x3, List, SlidersHorizontal, Eye, FolderOpen
} from 'lucide-react';
import LiveResults from '@/components/LiveResults';
import { TorrentResult } from '@/lib/types';
import GlassCard from '@/components/GlassCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [engineStatus, setEngineStatus] = useState<Record<string, { status: string; count?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TorrentResult | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeEngine, setActiveEngine] = useState('all');
  const [sortBy, setSortBy] = useState<'seeds' | 'size' | 'date'>('seeds');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const engines = ['all', 'piratebay', '1337x', 'yts', 'nyaa', 'eztv', 'torlock', 'zooqle', 'magnetdl'];

  useEffect(() => {
    if (query) {
      performSearch(query, activeEngine);
    }
  }, [query, activeEngine]);

  const performSearch = async (q: string, engine: string) => {
    setLoading(true);
    setError(null);
    setEngineStatus({});
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&engine=${engine}`);
      if (!response.ok) throw new Error('Search failed');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      let allResults: TorrentResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('event:')) continue;
          if (line.startsWith(' ')) {
            try {
              const data = JSON.parse(line.replace(' ', ''));
              if (data.id && data.status) {
                setEngineStatus(prev => ({ ...prev, [data.id]: { status: data.status, count: data.count } }));
              } else if (data.results) {
                allResults = data.results;
                setResults(allResults);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
      
      setResults(allResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyMagnet = () => {
    if (selectedItem?.magnet) {
      navigator.clipboard.writeText(selectedItem.magnet);
      setShowActions(false);
    }
  };

  const viewFileList = () => {
    setShowActions(false);
    setShowFileList(true);
  };

  // 排序逻辑
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'seeds':
        comparison = (b.seeds || 0) - (a.seeds || 0);
        break;
      case 'size':
        comparison = b.sizeBytes - a.sizeBytes;
        break;
      case 'date':
        comparison = b.timestamp - a.timestamp;
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* 顶部导航 */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50"
      >
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{query}</h2>
              <p className="text-xs text-slate-400">
                {sortedResults.length} 个结果 • {Object.keys(engineStatus).length} 个引擎
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                {viewMode === 'list' ? <Grid3x3 className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800/50'}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* 引擎切换 Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {engines.map((engine) => (
              <motion.button
                key={engine}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveEngine(engine)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeEngine === engine
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {engine === 'all' ? '全部' : engine.charAt(0).toUpperCase() + engine.slice(1)}
                {engineStatus[engine]?.count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {engineStatus[engine].count}
                  </span>
                )}
                {loading && engine === activeEngine && <Loader2 className="w-3 h-3 animate-spin" />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 筛选面板 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800/50 overflow-hidden"
            >
              <div className="p-4 bg-slate-900/50 space-y-4">
                {/* 排序方式 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-300">排序方式</span>
                    <button 
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      {sortOrder === 'desc' ? '降序' : '升序'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'seeds', label: '种子数', icon: TrendingUp },
                      { key: 'size', label: '大小', icon: HardDrive },
                      { key: 'date', label: '时间', icon: Clock },
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSortBy(item.key as any)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl text-sm transition-all ${
                          sortBy === item.key
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-slate-800/50 text-slate-400 border border-transparent'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {sortBy === item.key && <Check className="w-4 h-4 ml-auto" />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && sortedResults.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-slate-800 rounded w-3/4 mb-3" />
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-12 bg-slate-800 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">搜索失败</h3>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => performSearch(query, activeEngine)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
            <AnimatePresence>
              {sortedResults.map((result, idx) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => {
                    setSelectedItem(result);
                    setShowActions(true);
                  }}
                  className="cursor-pointer"
                >
                  <GlassCard className="p-5 hover:border-blue-500/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className={`w-1 h-12 rounded-full flex-shrink-0 bg-gradient-to-b ${
                        result.engine === 'PirateBay' ? 'from-blue-500 to-blue-700' :
                        result.engine === '1337x' ? 'from-red-500 to-red-700' :
                        result.engine === 'YTS' ? 'from-yellow-500 to-yellow-700' :
                        result.engine === 'Nyaa.si' ? 'from-pink-500 to-pink-700' :
                        result.engine === 'EZTV' ? 'from-indigo-500 to-indigo-700' :
                        result.engine === 'TorLock' ? 'from-purple-500 to-purple-700' :
                        result.engine === 'Zooqle' ? 'from-orange-500 to-orange-700' :
                        result.engine === 'MagnetDL' ? 'from-green-500 to-green-700' :
                        'from-slate-500 to-slate-700'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-100 text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {result.title}
                        </h3>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                            <HardDrive className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-slate-200">{result.size}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                            <Users className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">{result.seeds}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-slate-200">{new Date(result.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300">{result.engine}</span>
                          </div>
                        </div>

                        {result.engines && result.engines.length > 1 && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>多源:</span>
                            {result.engines.map(e => (
                              <span key={e} className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-300">{e}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {sortedResults.length === 0 && !loading && (
              <div className="text-center py-20 text-slate-500">
                <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p>未找到相关结果</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部操作弹窗 */}
      <AnimatePresence>
        {showActions && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowActions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 shadow-2xl border-t border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-2 line-clamp-2">
                  {selectedItem.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{selectedItem.size}</span>
                  {selectedItem.seeds && <span className="text-green-400">{selectedItem.seeds} seeds</span>}
                  <span>{selectedItem.engine}</span>
                </div>
              </div>

              <div className="space-y-2">
                <ActionButton 
                  icon={<FolderOpen className="w-5 h-5" />} 
                  label="查看文件列表" 
                  subtitle="查看包含的所有文件及大小"
                  onClick={viewFileList}
                  primary
                />
                <ActionButton 
                  icon={<Copy className="w-5 h-5" />} 
                  label="复制磁力链接" 
                  subtitle="magnet:?xt=urn:btih:..."
                  onClick={copyMagnet}
                />
                <ActionButton 
                  icon={<ExternalLink className="w-5 h-5" />} 
                  label="在新窗口打开" 
                  subtitle="在浏览器中打开"
                />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowActions(false)}
                className="w-full mt-6 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
              >
                取消
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ icon, label, subtitle, onClick, primary }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        primary 
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
      }`}
    >
      <div className={`${primary ? 'text-white' : ''}`}>{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-medium">{label}</div>
        {subtitle && <div className={`text-xs ${primary ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</div>}
      </div>
    </motion.button>
  );
        }
