'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Clock, BarChart3, RefreshCw, Shield,
  Zap, Database, AlertCircle
} from 'lucide-react';
import GlassCard from './GlassCard';

interface HealthStats {
  uptime: number;
  avgResponseTime: number;
  successRate: number;
  lastCheck: number;
  history: Array<{
    timestamp: number;
    status: 'success' | 'failed';
    responseTime: number;
  }>;
}

interface Props {
  engineId: string;
  engineName: string;
}

export default function EngineHealthMonitor({ engineId, engineName }: Props) {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealthStats();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadHealthStats, 30000); // 每30秒刷新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [engineId, autoRefresh]);

  const loadHealthStats = async () => {
    setLoading(true);
    try {
      // 模拟健康检查数据（实际应调用 API）
      const mockStats: HealthStats = {
        uptime: 95 + Math.random() * 5,
        avgResponseTime: 200 + Math.random() * 400,
        successRate: 90 + Math.random() * 10,
        lastCheck: Date.now(),
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          status: Math.random() > 0.1 ? 'success' : 'failed',
          responseTime: 150 + Math.random() * 500,
        })),
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load health stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="h-32 bg-slate-800 rounded-xl" />
        </div>
      </GlassCard>
    );
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-400';
    if (rate >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 95) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (rate >= 80) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const maxResponseTime = Math.max(...stats.history.map(h => h.responseTime));

  return (
    <GlassCard className="p-6 space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">{engineName} 健康监控</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            自动刷新
          </button>
          <button
            onClick={loadHealthStats}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">可用性</span>
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(stats.uptime)}`}>
            {stats.uptime.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">过去24小时</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs">平均响应</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(stats.avgResponseTime)}ms
          </div>
          <div className="text-xs text-slate-500 mt-1">上次检测</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Database className="w-4 h-4" />
            <span className="text-xs">成功率</span>
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(stats.successRate)}`}>
            {stats.successRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">请求成功</div>
        </motion.div>
      </div>

      {/* 24小时趋势图 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <BarChart3 className="w-4 h-4" />
            <span>24小时响应时间趋势</span>
          </div>
          <span className="text-xs text-slate-500">
            最后更新: {new Date(stats.lastCheck).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="relative h-32 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          {/* Y轴标签 */}
          <div className="absolute left-2 top-0 bottom-4 flex flex-col justify-between text-xs text-slate-500">
            <span>{Math.round(maxResponseTime)}ms</span>
            <span>{Math.round(maxResponseTime / 2)}ms</span>
            <span>0ms</span>
          </div>
          
          {/* 柱状图 */}
          <div className="ml-12 flex items-end gap-1 h-full pb-6">
            {stats.history.map((point, index) => {
              const height = (point.responseTime / maxResponseTime) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={`flex-1 rounded-t min-w-[2px] ${
                    point.status === 'success' 
                      ? 'bg-green-500/60 hover:bg-green-400' 
                      : 'bg-red-500/60 hover:bg-red-400'
                  } transition-colors cursor-pointer`}
                  title={`${new Date(point.timestamp).toLocaleTimeString()}: ${point.responseTime}ms`}
                />
              );
            })}
          </div>
          
          {/* X轴标签 */}
          <div className="ml-12 flex justify-between text-xs text-slate-500 mt-2">
            <span>24小时前</span>
            <span>12小时前</span>
            <span>现在</span>
          </div>
        </div>
      </div>

      {/* 健康状态提示 */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        stats.successRate >= 95 
          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
          : stats.successRate >= 80
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      }`}>
        {getStatusIcon(stats.successRate)}
        <div className="flex-1">
          <div className="font-medium">
            {stats.successRate >= 95 ? '引擎运行正常' :
             stats.successRate >= 80 ? '引擎性能下降' :
             '引擎可能存在故障'}
          </div>
          <div className="text-sm opacity-80">
            {stats.successRate >= 95 ? '所有指标正常，可以放心使用' :
             stats.successRate >= 80 ? '建议检查网络连接或考虑使用备用引擎' :
             '建议暂时禁用此引擎并联系管理员'}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">评分</div>
          <div className="text-2xl font-bold">
            {Math.round(stats.successRate)}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
