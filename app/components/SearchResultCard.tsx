'use client';

import { motion } from 'framer-motion';
import { HardDrive, Clock, Users, Download, CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { TorrentResult } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';
import GlassCard from './GlassCard';

interface Props {
  result: TorrentResult;
  index: number;
  onClick: () => void;
}

export default function SearchResultCard({ result, index, onClick }: Props) {
  const engineColors: Record<string, string> = {
    'PirateBay': 'bg-blue-500',
    '1337x': 'bg-red-500',
    'YTS': 'bg-yellow-500',
    'Nyaa.si': 'bg-pink-500',
    'EZTV': 'bg-indigo-500',
    'TorLock': 'bg-purple-500',
    'Zooqle': 'bg-orange-500',
    'MagnetDL': 'bg-green-500',
  };

  const colorClass = engineColors[result.engine] || 'bg-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <GlassCard 
        onClick={onClick} 
        className="p-0 overflow-hidden cursor-pointer group"
      >
        {/* 顶部装饰条 */}
        <div className={`h-1 w-full ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
        
        <div className="p-5">
          {/* 标题区域 */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-100 text-lg leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                {result.title}
              </h3>
              
              {/* 引擎标签 */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                <span className="text-xs text-slate-400 font-medium">{result.engine}</span>
                {result.verified && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> 已验证
                  </span>
                )}
                {result.engines && result.engines.length > 1 && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    +{result.engines.length - 1} 源
                  </span>
                )}
              </div>
            </div>
            
            {/* 种子数/大小 (移动端隐藏部分) */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-green-400 font-bold text-lg">
                <Users className="w-5 h-5" />
                {result.maxSeeds || result.seeds}
              </div>
              <div className="text-xs text-slate-500">seeds</div>
            </div>
          </div>

          {/* 数据网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
            {/* 大小 */}
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400/70" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">大小</span>
                <span className="text-sm text-slate-200 font-medium">{formatBytes(result.sizeBytes)}</span>
              </div>
            </div>

            {/* 下载者 */}
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-orange-400/70" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">下载</span>
                <span className="text-sm text-slate-200 font-medium">{result.leechs || 0}</span>
              </div>
            </div>

            {/* 时间 */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400/70" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">时间</span>
                <span className="text-sm text-slate-200 font-medium">{formatDate(result.timestamp)}</span>
              </div>
            </div>

            {/* 分类/上传者 */}
            <div className="flex items-center gap-2 overflow-hidden">
              <ExternalLink className="w-4 h-4 text-slate-400/70 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 uppercase">分类</span>
                <span className="text-sm text-slate-200 font-medium truncate">{result.category || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
