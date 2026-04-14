/**
 * 排序算法：多条件排序、权重计算、自定义排序规则、预设策略
 * 支持种子数、大小、时间、质量、相关度等多维度智能排序
 */

import { TorrentResult } from '@/lib/types';

export interface SortConfig {
  field: 'seeds' | 'leechs' | 'size' | 'date' | 'quality' | 'relevance' | 'name';
  order: 'asc' | 'desc';
  weight?: number;
}

export interface SortResult {
  sorted: TorrentResult[];
  stats: {
    total: number;
    sortedBy: string;
    order: string;
    timeMs: number;
  };
}

export function sortResults(
  results: TorrentResult[],
  configs: SortConfig[]
): SortResult {
  const startTime = Date.now();
  
  if (results.length === 0) {
    return {
      sorted: [],
      stats: { total: 0, sortedBy: 'none', order: 'none', timeMs: 0 },
    };
  }

  const sorted = [...results].sort((a, b) => {
    for (const config of configs) {
      const comparison = compareByField(a, b, config.field);
      if (comparison !== 0) {
        return config.order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  return {
    sorted,
    stats: {
      total: sorted.length,
      sortedBy: configs.map(c => c.field).join(', '),
      order: configs[0]?.order || 'desc',
      timeMs: Date.now() - startTime,
    },
  };
}

function compareByField(a: TorrentResult, b: TorrentResult, field: string): number {
  switch (field) {
    case 'seeds':
      return (b.maxSeeds || b.seeds || 0) - (a.maxSeeds || a.seeds || 0);
    case 'leechs':
      return (b.maxLeechs || b.leechs || 0) - (a.maxLeechs || a.leechs || 0);
    case 'size':
      return b.sizeBytes - a.sizeBytes;
    case 'date':
      return (b.timestamp || 0) - (a.timestamp || 0);
    case 'quality':
      return compareQuality(a, b);
    case 'relevance':
      return calculateRelevanceScore(b) - calculateRelevanceScore(a);
    case 'name':
      return a.title.localeCompare(b.title, 'zh-CN', { sensitivity: 'base' });
    default:
      return 0;
  }
}

function compareQuality(a: TorrentResult, b: TorrentResult): number {
  const qualityOrder: Record<string, number> = {
    '4k': 10, '2160p': 10, 'uhd': 10,
    '1440p': 9, '2k': 9,
    '1080p': 8, 'fhd': 8,
    '720p': 7, 'hd': 7,
    '480p': 6, 'sd': 6,
    '360p': 5,
    '240p': 4,
    'bluray': 9, 'remux': 10, 'web-dl': 8, 'webrip': 7, 'hdtv': 6,
  };

  const getQualityScore = (item: TorrentResult): number => {
    const title = item.title.toLowerCase();
    for (const [key, score] of Object.entries(qualityOrder)) {
      if (title.includes(key)) return score;
    }
    if (item.quality) {
      return qualityOrder[item.quality.toLowerCase()] || 5;
    }
    return 5; // 默认中等质量
  };

  return getQualityScore(b) - getQualityScore(a);
}

function calculateRelevanceScore(item: TorrentResult): number {
  let score = 0;
  
  // 种子数权重 40%
  score += (item.maxSeeds || item.seeds || 0) * 0.4;
  
  // 验证状态权重 30%
  if (item.verified) score += 30;
  if (item.engines && item.engines.length > 1) score += item.engines.length * 5;
  
  // 质量权重 20%
  score += compareQuality(item, { title: '', sizeBytes: 0, seeds: 0, leechs: 0, date: '', timestamp: 0, magnet: '', infoHash: '', engine: '', engineId: '', category: '', verified: false, source: '', url: '' }) * 2;
  
  // 时间权重 10%
  const daysOld = (Date.now() - (item.timestamp || 0)) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 100 - daysOld) * 0.1;
  
  // 文件大小合理性加分
  if (item.sizeBytes > 100 * 1024 * 1024 && item.sizeBytes < 50 * 1024 * 1024 * 1024) {
    score += 5; // 100MB - 50GB 为合理范围
  }
  
  return score;
}

export function createSorter(configs: SortConfig[]) {
  return (results: TorrentResult[]): SortResult => {
    return sortResults(results, configs);
  };
}

export function getSortPresets(): Record<string, SortConfig[]> {
  return {
    popularity: [
      { field: 'seeds', order: 'desc', weight: 1 },
      { field: 'date', order: 'desc', weight: 0.5 },
      { field: 'quality', order: 'desc', weight: 0.3 },
    ],
    newest: [
      { field: 'date', order: 'desc', weight: 1 },
      { field: 'seeds', order: 'desc', weight: 0.3 },
    ],
    largest: [
      { field: 'size', order: 'desc', weight: 1 },
      { field: 'seeds', order: 'desc', weight: 0.2 },
    ],
    smallest: [
      { field: 'size', order: 'asc', weight: 1 },
      { field: 'seeds', order: 'desc', weight: 0.2 },
    ],
    quality: [
      { field: 'quality', order: 'desc', weight: 1 },
      { field: 'seeds', order: 'desc', weight: 0.5 },
      { field: 'date', order: 'desc', weight: 0.2 },
    ],
    relevance: [
      { field: 'relevance', order: 'desc', weight: 1 },
    ],
    alphabetical: [
      { field: 'name', order: 'asc', weight: 1 },
    ],
    custom: (configs: SortConfig[]) => configs,
  };
}

export function applySortPreset(results: TorrentResult[], presetName: string): SortResult {
  const presets = getSortPresets();
  const configs = presets[presetName] || presets.popularity;
  return sortResults(results, configs);
}

export function getAvailableSortFields(): Array<{ field: string; label: string; description: string }> {
  return [
    { field: 'seeds', label: '种子数', description: '做种用户数量，越高下载越快' },
    { field: 'leechs', label: '下载数', description: '正在下载的用户数量' },
    { field: 'size', label: '文件大小', description: '资源总体积' },
    { field: 'date', label: '收录时间', description: '资源被索引的时间' },
    { field: 'quality', label: '画质/质量', description: '视频分辨率或音频码率' },
    { field: 'relevance', label: '相关度', description: '综合种子、验证、质量、时间的智能评分' },
    { field: 'name', label: '名称', description: '按标题字母/拼音排序' },
  ];
}
