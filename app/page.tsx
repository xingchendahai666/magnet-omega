'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Zap, Shield, Globe, ChevronDown } from 'lucide-react';

// 引入所有核心组件
import AuroraBackground from '@/components/AuroraBackground';
import ParticleNetwork from '@/components/ParticleNetwork';
import GlassCard from '@/components/GlassCard';
import LiveResults from '@/components/LiveResults';
import EnvelopeAnimation from '@/components/EnvelopeAnimation'; // 新增：信封特效
import DrivingCarFooter from '@/components/DrivingCarFooter';  // 新增：跑车底部
import { TorrentResult } from '@/lib/types';
import { useStore } from '@/store/useStore';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<TorrentResult | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // 状态管理 Hook
  const { searchHistory, addToHistory } = useStore();
  const resultsRef = useRef<HTMLDivElement>(null);

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setActiveQuery(inputValue.trim());
      addToHistory(inputValue.trim(), 0);
      setShowHistory(false);
      
      // 平滑滚动到结果区
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setActiveQuery('');
    setSelectedResult(null);
  };

  const handleResultClick = (result: TorrentResult) => {
    setSelectedResult(result);    setShowActionSheet(true);
  };

  // 快捷分类推荐
  const quickCategories = [
    { icon: TrendingUp, label: '热门影视', query: 'Avengers Endgame' },
    { icon: Shield, label: '开源系统', query: 'Ubuntu 24.04 LTS' },
    { icon: Zap, label: '最新剧集', query: 'House of the Dragon' },
    { icon: Globe, label: '3A 大作', query: 'Cyberpunk 2077' },
  ];

  // 点击外部关闭历史
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showHistory && !(e.target as HTMLElement).closest('.search-container')) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-blue-500/30">
      {/* 全局背景层 */}
      <AuroraBackground />
      <ParticleNetwork />
      
      {/* 主内容容器 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
        
        {/* 1. 顶部 Hero 区域 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-16 md:pt-24 text-center mb-12"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            MAGNET OMEGA
          </motion.h1>
          <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide">
            全球磁力聚合 · 实时流式推送 · 极致体验
          </p>
        </motion.div>
        {/* 2. 搜索框区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative max-w-3xl mx-auto mb-16 search-container"
        >
          <GlassCard className="flex items-center gap-3 p-2 md:p-3 shadow-2xl shadow-blue-500/10">
            <Search className="w-6 h-6 text-slate-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="输入关键词搜索磁力链接..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder:text-slate-500 min-w-0"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              搜索
            </motion.button>

            {/* 搜索历史下拉框 */}
            <AnimatePresence>
              {showHistory && searchHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between p-3 border-b border-slate-800/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">最近搜索</span>
                    <button                       onClick={() => { useStore.getState().clearHistory(); }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      清空
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setInputValue(item.query); setActiveQuery(item.query); setShowHistory(false); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 text-left transition-colors group"
                      >
                        <span className="text-slate-300 truncate group-hover:text-blue-400 transition-colors">{item.query}</span>
                        <span className="text-xs text-slate-600">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* 3. 快捷入口 (仅空状态显示) */}
        <AnimatePresence mode="wait">
          {!activeQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-24"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
                {quickCategories.map((cat, idx) => (
                  <button
                    key={cat.label}
                    onClick={() => { setInputValue(cat.query); handleSearch({ preventDefault: () => {} } as any); }}
                    className="p-6 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-2xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all group flex flex-col items-center gap-3"
                  >
                    <cat.icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* 特性展示 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <GlassCard className="p-8 text-center" hover={false}>
                  <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />                  <h3 className="font-bold text-slate-200 mb-2 text-lg">极速并行</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">同时搜索 8+ 个顶级引擎，SSE 实时流式推送，毫秒级响应。</p>
                </GlassCard>
                <GlassCard className="p-8 text-center" hover={false}>
                  <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-200 mb-2 text-lg">智能验证</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">自动检测链接状态，过滤失效资源，多源去重聚合。</p>
                </GlassCard>
                <GlassCard className="p-8 text-center" hover={false}>
                  <Globe className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-200 mb-2 text-lg">全球聚合</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">覆盖欧美日韩主流磁力站点，资源无死角覆盖。</p>
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. 搜索结果区域 */}
        <div ref={resultsRef}>
          <AnimatePresence>
            {activeQuery && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5 }}
                className="mb-24"
              >
                <LiveResults 
                  query={activeQuery} 
                  isSearching={true} 
                  onResultClick={handleResultClick} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. 引导滚动提示 (如果有内容时显示) */}
        {activeQuery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="flex flex-col items-center gap-2 text-slate-500 mb-12"
          >
            <span className="text-sm">向下滑动打开信封</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronDown className="w-6 h-6" />            </motion.div>
          </motion.div>
        )}

        {/* 6. 终极信封特效区 */}
        {/* 这个组件内部包含 h-[250vh] 的滚动空间，必须放在页面底部 */}
        <div className="relative z-20">
          <EnvelopeAnimation />
        </div>

      </div>

      {/* 7. 底部跑车页脚 */}
      <div className="relative z-30">
        <DrivingCarFooter />
      </div>

      {/* 8. 底部操作面板 (Action Sheet) */}
      <AnimatePresence>
        {showActionSheet && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowActionSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 shadow-2xl border-t border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-2">
                  {selectedResult.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{selectedResult.size}</span>
                  <span className="text-green-400">Seeds: {selectedResult.seeds}</span>
                  <span>{selectedResult.engine}</span>
                </div>
              </div>

              <div className="space-y-3">
                <ActionButton                   icon={<Search className="w-5 h-5" />} 
                  label="复制磁力链接" 
                  subtitle="magnet:?xt=urn:btih:..."
                  onClick={() => {
                    navigator.clipboard.writeText(selectedResult.magnet);
                    setShowActionSheet(false);
                  }}
                  primary
                />
                <div className="grid grid-cols-2 gap-3">
                  <ActionButton 
                    icon={<Shield className="w-5 h-5" />} 
                    label="离线下载" 
                    subtitle="云端保存"
                  />
                  <ActionButton 
                    icon={<Zap className="w-5 h-5" />} 
                    label="迅雷下载" 
                    subtitle="高速下载"
                  />
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowActionSheet(false)}
                className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition-colors"
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

// 辅助按钮组件
function ActionButton({ icon, label, subtitle, onClick, primary }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        primary 
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'      }`}
    >
      <div className={`${primary ? 'text-white' : ''}`}>{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-bold">{label}</div>
        {subtitle && <div className={`text-xs ${primary ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</div>}
      </div>
    </motion.button>
  );
      }
