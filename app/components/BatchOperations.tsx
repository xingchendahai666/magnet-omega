'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, Square, Trash2, Download, Upload, 
  RefreshCw, Check, X, Filter, Zap, AlertTriangle,
  Activity, Database, Shield
} from 'lucide-react';
import GlassCard from './GlassCard';

interface Engine {
  id: string;
  name: string;
  enabled: boolean;
  category: string;
  lastTested?: number;
  testStatus?: 'success' | 'failed' | 'testing' | null;
  responseTime?: number;
}

interface Props {
  engines: Engine[];
  onBatchEnable: (ids: string[]) => void;
  onBatchDisable: (ids: string[]) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchTest: (ids: string[]) => void;
  onExport: (ids: string[]) => void;
}

export default function BatchOperations({ 
  engines, 
  onBatchEnable, 
  onBatchDisable, 
  onBatchDelete, 
  onBatchTest, 
  onExport 
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === filteredEngines.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEngines.map(e => e.id)));
    }
    setSelectAll(!selectAll);
  };

  const selectedEngines = engines.filter(e => selectedIds.has(e.id));
  
  const filteredEngines = engines.filter(engine => {
    const matchesCategory = filterCategory === 'all' || engine.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'enabled' && engine.enabled) ||
      (filterStatus === 'disabled' && !engine.enabled) ||
      (filterStatus === 'tested' && engine.testStatus === 'success') ||
      (filterStatus === 'failed' && engine.testStatus === 'failed');
    return matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(engines.map(e => e.category)));

  return (
    <div className="space-y-4">
      {/* 批量选择栏 */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {selectAll ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-300">
                已选择 <span className="text-blue-400 font-bold">{selectedIds.size}</span> 个引擎
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">
                共 {filteredEngines.length} 个
              </span>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">批量操作</span>
            </motion.button>
          )}
        </div>

        {/* 筛选器 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">分类:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">全部</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">状态:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">全部</option>
              <option value="enabled">已启用</option>
              <option value="disabled">已禁用</option>
              <option value="tested">测试通过</option>
              <option value="failed">测试失败</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 批量操作菜单 */}
      <AnimatePresence>
        {showActions && selectedIds.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">批量操作面板</h3>
                <button
                  onClick={() => setShowActions(false)}
                  className="p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    onBatchEnable(Array.from(selectedIds)); 
                    setSelectedIds(new Set());
                    setShowActions(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/30"
                >
                  <Check className="w-4 h-4" />
                  启用选中 ({selectedIds.size})
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    onBatchDisable(Array.from(selectedIds)); 
                    setSelectedIds(new Set());
                    setShowActions(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/30"
                >
                  <X className="w-4 h-4" />
                  禁用选中
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    onBatchTest(Array.from(selectedIds)); 
                    setSelectedIds(new Set());
                    setShowActions(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  测试选中
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    onExport(Array.from(selectedIds)); 
                    setSelectedIds(new Set());
                    setShowActions(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/30"
                >
                  <Download className="w-4 h-4" />
                  导出选中
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    if (confirm(`确定要删除选中的 ${selectedIds.size} 个引擎吗？此操作不可恢复！`)) {
                      onBatchDelete(Array.from(selectedIds)); 
                      setSelectedIds(new Set());
                      setShowActions(false);
                    }
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/30 col-span-2 md:col-span-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中
                </motion.button>
              </div>

              {/* 操作统计 */}
              <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>启用: {selectedEngines.filter(e => e.enabled).length}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="w-4 h-4 text-green-400" />
                  <span>测试通过: {selectedEngines.filter(e => e.testStatus === 'success').length}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span>待测试: {selectedEngines.filter(e => !e.testStatus).length}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 引擎列表（带复选框） */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredEngines.map(engine => (
            <motion.div
              key={engine.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                selectedIds.has(engine.id)
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-slate-900/30 border-slate-800/50 hover:border-slate-700'
              }`}
              onClick={() => toggleSelect(engine.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(engine.id); }}
                className="flex-shrink-0"
              >
                {selectedIds.has(engine.id) ? (
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-600" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-200 truncate">{engine.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    engine.enabled 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-700/50 text-slate-500'
                  }`}>
                    {engine.enabled ? '启用' : '禁用'}
                  </span>
                  {engine.testStatus === 'success' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                      测试通过
                    </span>
                  )}
                  {engine.testStatus === 'failed' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                      测试失败
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>ID: {engine.id}</span>
                  <span>分类: {engine.category}</span>
                  {engine.responseTime && (
                    <span>响应: {engine.responseTime}ms</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEngines.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>没有符合条件的引擎</p>
          </div>
        )}
      </div>
    </div>
  );
}
