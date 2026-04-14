'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Download, Star, Filter, TrendingUp, 
  Plus, Check, Loader2, Globe, Code, Shield,
  Zap, Database, Activity, AlertCircle
} from 'lucide-react';
import GlassCard from './GlassCard';

interface EngineTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  popularity: number;
  tags: string[];
  url: string;
  verified: boolean;
  addedCount?: number;
}

interface Props {
  onAddEngine: (template: EngineTemplate) => void;
  existingEngines: string[];
}

export default function EngineMarket({ onAddEngine, existingEngines }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'newest'>('popularity');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // 引擎模板库（真实可用的配置）
  const engineTemplates: EngineTemplate[] = [
    // 磁力搜索类
    {
      id: 'bt1207',
      name: 'BT1207',
      category: 'magnet',
      description: '专业 BT 种子搜索引擎，资源丰富，更新及时',
      popularity: 95,
      tags: ['热门', '磁力', '种子', '中文'],
      url: 'https://bt1207.com/search?keyword=#KEY#',
      verified: true,
    },
    {
      id: 'btsow',
      name: 'BTSow',
      category: 'magnet',
      description: '老牌磁力搜索引擎，支持 DHT 网络，资源全面',
      popularity: 90,
      tags: ['热门', '磁力', 'DHT', '老牌'],
      url: 'https://btsow.in/search/?keyword=#KEY#',
      verified: true,
    },
    {
      id: 'ciliduo',
      name: '磁力多',
      category: 'magnet',
      description: '简洁高效的磁力搜索工具，界面友好',
      popularity: 85,
      tags: ['磁力', '简洁', '快速'],
      url: 'https://ciliduo.net/s/?keyword=#KEY#',
      verified: true,
    },
    {
      id: 'btdig',
      name: 'BTDigg',
      category: 'magnet',
      description: '基于 DHT 协议的 BitTorrent 搜索引擎',
      popularity: 82,
      tags: ['磁力', 'DHT', '开源'],
      url: 'https://btdig.com/search?q=#KEY#',
      verified: true,
    },
    {
      id: 'knaben',
      name: 'Knaben',
      category: 'magnet',
      description: '综合 BT 搜索引擎，支持多站点聚合',
      popularity: 78,
      tags: ['磁力', '聚合', '欧美'],
      url: 'https://knaben.eu/?q=#KEY#',
      verified: true,
    },
    
    // 综合搜索类
    {
      id: 'google',
      name: 'Google',
      category: 'general',
      description: '全球使用最广泛的搜索引擎',
      popularity: 100,
      tags: ['综合', '国际', '热门', '全能'],
      url: 'https://www.google.com/search?q=#KEY#',
      verified: true,
    },
    {
      id: 'bing',
      name: 'Bing',
      category: 'general',
      description: '微软搜索引擎，国际化程度高',
      popularity: 85,
      tags: ['综合', '国际', '微软'],
      url: 'https://www.bing.com/search?q=#KEY#',
      verified: true,
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      category: 'general',
      description: '注重隐私保护的搜索引擎',
      popularity: 75,
      tags: ['综合', '隐私', '安全'],
      url: 'https://duckduckgo.com/?q=#KEY#',
      verified: true,
    },
    
    // 影视类
    {
      id: 'yts',
      name: 'YTS',
      category: 'movie',
      description: '高质量电影种子，专注于 720p/1080p/4K',
      popularity: 92,
      tags: ['电影', '高清', '4K', '欧美'],
      url: 'https://yts.mx/api/v2/list_movies.json?query_term=#KEY#',
      verified: true,
    },
    {
      id: 'rarbg',
      name: 'RARBG',
      category: 'movie',
      description: '知名影视资源站，画质优秀',
      popularity: 88,
      tags: ['电影', '剧集', '高清'],
      url: 'https://rarbg.to/torrents.php?search=#KEY#',
      verified: true,
    },
    
    // 动漫类
    {
      id: 'nyaa',
      name: 'Nyaa.si',
      category: 'anime',
      description: '亚洲最大的动漫资源站',
      popularity: 96,
      tags: ['动漫', '日漫', '字幕', '热门'],
      url: 'https://nyaa.si/?page=search&c=0_0&q=#KEY#',
      verified: true,
    },
    {
      id: 'dmhy',
      name: '动漫花园',
      category: 'anime',
      description: '中文动漫资源社区',
      popularity: 90,
      tags: ['动漫', '中文', '字幕组'],
      url: 'https://share.dmhy.org/topics/list?keyword=#KEY#',
      verified: true,
    },
    
    // 软件类
    {
      id: 'github',
      name: 'GitHub',
      category: 'software',
      description: '全球最大的代码托管平台',
      popularity: 98,
      tags: ['软件', '开发', '开源', '代码'],
      url: 'https://github.com/search?q=#KEY#',
      verified: true,
    },
    {
      id: 'sourceforge',
      name: 'SourceForge',
      category: 'software',
      description: '开源软件下载平台',
      popularity: 70,
      tags: ['软件', '开源', '下载'],
      url: 'https://sourceforge.net/search?q=#KEY#',
      verified: true,
    },
  ];

  const categories = [
    { id: 'all', label: '全部', icon: Globe },
    { id: 'magnet', label: '磁力搜索', icon: Database },
    { id: 'general', label: '综合搜索', icon: Search },
    { id: 'movie', label: '影视', icon: Activity },
    { id: 'anime', label: '动漫', icon: Star },
    { id: 'software', label: '软件', icon: Code },
  ];

  const filteredTemplates = engineTemplates
    .filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory && !existingEngines.includes(template.id);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return b.verified ? 1 : -1;
        default:
          return 0;
      }
    });

  const handleAdd = async (template: EngineTemplate) => {
    setAddingId(template.id);
    await new Promise(resolve => setTimeout(resolve, 800));
    onAddEngine(template);
    setAddingId(null);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const Icon = category?.icon || Globe;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* 顶部搜索栏 */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索引擎名称、描述或标签..."
            className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">排序:</span>
          {[
            { id: 'popularity', label: '热度', icon: TrendingUp },
            { id: 'name', label: '名称', icon: Search },
            { id: 'newest', label: '已验证', icon: Check },
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === sort.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <sort.icon className="w-3 h-3" />
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>找到 {filteredTemplates.length} 个可用引擎</span>
        <span>已添加 {existingEngines.length} 个引擎</span>
      </div>

      {/* 引擎列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-5 hover:border-blue-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{template.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="capitalize">{template.category}</span>
                        {template.verified && (
                          <span className="flex items-center gap-1 text-green-400">
                            <Check className="w-3 h-3" />
                            已验证
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{template.popularity}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDetails(showDetails === template.id ? null : template.id)}
                    className="flex-1 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
                  >
                    查看详情
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAdd(template)}
                    disabled={addingId === template.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      addingId === template.id
                        ? 'bg-blue-500/20 text-blue-400 cursor-wait'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {addingId === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        添加中
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        添加
                      </>
                    )}
                  </motion.button>
                </div>

                {/* 详细信息展开 */}
                <AnimatePresence>
                  {showDetails === template.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800/50 overflow-hidden"
                    >
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span>流行度评分: {template.popularity}/100</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span>安全状态: {template.verified ? '已验证安全' : '未验证'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 break-all">
                          <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-xs">{template.url}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">没有找到匹配的引擎</h3>
          <p className="text-slate-500">尝试更换搜索关键词或分类筛选</p>
        </div>
      )}
    </div>
  );
        }
