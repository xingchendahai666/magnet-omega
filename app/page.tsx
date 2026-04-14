'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, HardDrive, Clock, Users, Zap, Shield, Globe } from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';
import ParticleNetwork from '@/components/ParticleNetwork';
import GlassCard from '@/components/GlassCard';
import LiveResults from '@/components/LiveResults';
import { TorrentResult } from '@/lib/types';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<TorrentResult | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setActiveQuery(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
    setActiveQuery('');
    setSelectedResult(null);
  };

  const handleResultClick = (result: TorrentResult) => {
    setSelectedResult(result);
    setShowActionSheet(true);
  };

  const quickCategories = [
    { icon: TrendingUp, label: '热门影视', query: 'Avengers' },
    { icon: HardDrive, label: '开源软件', query: 'Ubuntu Linux' },
    { icon: Clock, label: '最新剧集', query: 'House of Dragon' },
    { icon: Users, label: '多人游戏', query: 'Cyberpunk 2077' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <AuroraBackground />
      <ParticleNetwork />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* 头部标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            MAGNET OMEGA
          </h1>
          <p className="text-slate-400 text-lg">全球磁力聚合 · 实时流式推送 · 智能去重</p>
        </motion.div>

        {/* 搜索框 */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="relative mb-8 max-w-2xl mx-auto"
        >
          <GlassCard className="flex items-center gap-3 p-2 md:p-3">
            <Search className="w-6 h-6 text-slate-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入关键词搜索磁力链接..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder:text-slate-500 min-w-0"
              autoFocus
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
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              搜索
            </motion.button>
          </GlassCard>
        </motion.form>

        {/* 快捷入口 */}
        {!activeQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12"
          >
            {quickCategories.map((cat, idx) => (
              <button
                key={cat.label}
                onClick={() => {
                  setInputValue(cat.query);
                  setActiveQuery(cat.query);
                }}
                className="p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all group flex flex-col items-center gap-2"
              >
                <cat.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* 特性展示 */}
        {!activeQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12"
          >
            <GlassCard className="p-6 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-200 mb-2">极速并行</h3>
              <p className="text-sm text-slate-400">同时搜索 8+ 个顶级引擎，毫秒级响应</p>
            </GlassCard>
            <GlassCard className="p-6 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-200 mb-2">智能验证</h3>
              <p className="text-sm text-slate-400">自动检测链接状态，过滤失效资源</p>
            </GlassCard>
            <GlassCard className="p-6 text-center">
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-200 mb-2">全球聚合</h3>
              <p className="text-sm text-slate-400">覆盖欧美日韩主流磁力站点</p>
            </GlassCard>
          </motion.div>
        )}

        {/* 实时搜索结果 */}
        <AnimatePresence>
          {activeQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LiveResults 
                query={activeQuery} 
                isSearching={true} 
                onResultClick={handleResultClick} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部操作面板 */}
        <AnimatePresence>
          {showActionSheet && selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowActionSheet(false)}
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
                    {selectedResult.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{selectedResult.size}</span>
                    {selectedResult.seeds && <span className="text-green-400">{selectedResult.seeds} seeds</span>}
                    <span>{selectedResult.engine}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <ActionButton 
                    icon={<Copy className="w-5 h-5" />} 
                    label="复制磁力链接" 
                    subtitle="magnet:?xt=urn:btih:..."
                    onClick={() => {
                      navigator.clipboard.writeText(selectedResult.magnet);
                      setShowActionSheet(false);
                    }}
                    primary
                  />
                  <ActionButton 
                    icon={<HardDrive className="w-5 h-5" />} 
                    label="离线下载" 
                    subtitle="保存到云端存储"
                  />
                  <ActionButton 
                    icon={<Download className="w-5 h-5" />} 
                    label="迅雷下载" 
                    subtitle="使用迅雷下载客户端"
                  />
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowActionSheet(false)}
                  className="w-full mt-6 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  取消
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
