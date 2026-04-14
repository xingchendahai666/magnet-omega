'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import AuroraBackground from './components/AuroraBackground';
import ParticleNetwork from './components/ParticleNetwork';
import LiveResults from './components/LiveResults';
import GlassCard from './components/GlassCard';
import { useSSESearch } from './hooks/useSSESearch';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const { query, isSearching, search, cancel } = useSSESearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      search(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
    cancel();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      <AuroraBackground />
      <ParticleNetwork />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            MAGNET OMEGA
          </h1>
          <p className="text-slate-400 text-lg">聚合全球磁力搜索引擎 · 实时流式推送</p>
        </motion.div>

        {/* 搜索框 */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="relative mb-8"
        >
          <GlassCard className="flex items-center gap-4 p-2">
            <Search className="w-6 h-6 text-slate-400 ml-4" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入关键词搜索..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder:text-slate-500"
              autoFocus
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!inputValue.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              搜索
            </motion.button>
          </GlassCard>
        </motion.form>

        {/* 实时结果 */}
        {query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <LiveResults query={query} isSearching={isSearching} />
          </motion.div>
        )}

        {/* 空状态 */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {['电影', '剧集', '音乐', '软件', '游戏', '动漫', '图书', '纪录片'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setInputValue(cat); search(cat); }}
                  className="p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
                       }
