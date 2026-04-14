'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, TrendingUp, HardDrive, Clock, CheckCircle2, XCircle } from 'lucide-react';
import SearchResultCard from './SearchResultCard';
import { TorrentResult } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';

interface LiveResultsProps {
  query: string;
  isSearching: boolean;
  onResultClick?: (result: TorrentResult) => void;
}

export default function LiveResults({ query, isSearching, onResultClick }: LiveResultsProps) {
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [engineStatus, setEngineStatus] = useState<Record<string, { status: string; count?: number }>>({});
  const [total, setTotal] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setTotal(0);
      setIsDone(false);
      setEngineStatus({});
      return;
    }

    // 重置状态
    setResults([]);
    setTotal(0);
    setIsDone(false);
    setEngineStatus({});

    const controller = new AbortController();
    
    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    }).then(response => {
      if (!response.body) return;
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            setIsDone(true);
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              continue; // 忽略 event 头，我们在 data 里解析
            }
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.replace('data: ', '');
                const data = JSON.parse(jsonStr);
                
                if (data.phase === 'start') {
                  // 初始化
                } else if (data.id && data.status) {
                  // 引擎状态更新
                  setEngineStatus(prev => ({ ...prev, [data.id]: { status: data.status, count: data.count } }));
                } else if (data.results) {
                  // 接收结果流
                  setResults(data.results);
                  setTotal(data.total);
                  if (data.done) setIsDone(true);
                }
              } catch (e) {
                console.error('Parse SSE error:', e);
              }
            }
          }
          
          read();
        });
      };
      
      read();
    }).catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
      }
    });

    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <div className="space-y-6 relative z-10">
      {/* 引擎状态条 */}
      <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
        {Object.entries(engineStatus).map(([id, { status, count }]) => (
          <motion.div
            key={id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
              status === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              status === 'searching' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}
          >
            {status === 'searching' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
            {status === 'error' && <XCircle className="w-3 h-3" />}
            <span>{id}</span>
            {count !== undefined && <span className="opacity-70">({count})</span>}
          </motion.div>
        ))}
        {Object.keys(engineStatus).length === 0 && isSearching && (
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在连接搜索引擎...
          </div>
        )}
      </div>

      {/* 结果统计 */}
      <div className="flex items-center justify-between text-sm text-slate-400 mb-4 px-2">
        <span>共找到 <span className="text-blue-400 font-bold">{total}</span> 个结果</span>
        {!isDone && total > 0 && (
          <span className="flex items-center gap-1 text-xs bg-blue-500/10 px-2 py-1 rounded text-blue-300">
            <Loader2 className="w-3 h-3 animate-spin" /> 搜索中...
          </span>
        )}
      </div>

      {/* 结果列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {results.map((result, index) => (
            <SearchResultCard
              key={result.id}
              result={result}
              index={index}
              onClick={() => onResultClick?.(result)}
            />
          ))}
        </AnimatePresence>

        {results.length === 0 && isDone && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">未找到相关结果</h3>
            <p className="text-slate-500">尝试更换关键词或检查网络连接</p>
          </motion.div>
        )}
      </div>
    </div>
  );
              }
