import { TorrentResult } from '@/lib/types';

export interface MergeOptions {
  deduplicate?: boolean;
  sortField?: 'seeds' | 'size' | 'date' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  minSeeds?: number;
}

export function mergeResults(
  results: TorrentResult[],
  options: MergeOptions = {}
): TorrentResult[] {
  const {
    deduplicate = true,
    sortField = 'seeds',
    sortOrder = 'desc',
    minSeeds = 0,
  } = options;

  let processed = [...results];

  // 1. 过滤低质量种子
  if (minSeeds > 0) {
    processed = processed.filter(r => (r.maxSeeds || r.seeds) >= minSeeds);
  }

  // 2. 智能去重（基于 infoHash + 标题相似度）
  if (deduplicate) {
    const seen = new Map<string, TorrentResult>();
    
    for (const item of processed) {
      const key = item.infoHash.toLowerCase();
      
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        
        // 合并多源标记
        if (!existing.engines) existing.engines = [existing.engine];
        if (!existing.engines.includes(item.engine)) {
          existing.engines.push(item.engine);
        }
        
        // 取最大种子/下载数
        existing.maxSeeds = Math.max(existing.maxSeeds || existing.seeds, item.seeds);
        existing.maxLeechs = Math.max(existing.maxLeechs || item.leechs, item.leechs);
        
        // 取最早收录时间
        const itemTime = item.timestamp || new Date(item.date).getTime();
        const existTime = existing.timestamp || new Date(existing.date).getTime();
        if (itemTime < existTime) {
          existing.date = item.date;
          existing.timestamp = itemTime;
        }
        
        // 标记验证状态
        if (item.verified) existing.verified = true;
        
        // 补充文件列表（如果当前没有）
        if (!existing.files && item.files) {
          existing.files = item.files;
        }
      } else {
        seen.set(key, {
          ...item,
          engines: [item.engine],
          maxSeeds: item.seeds,
          maxLeechs: item.leechs,
          timestamp: item.timestamp || new Date(item.date).getTime(),
        });
      }
    }
    
    processed = Array.from(seen.values());
  }

  // 3. 智能排序
  processed.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'seeds':
        comparison = (b.maxSeeds || b.seeds) - (a.maxSeeds || a.seeds);
        break;
      case 'size':
        comparison = b.sizeBytes - a.sizeBytes;
        break;
      case 'date':
        comparison = (b.timestamp || 0) - (a.timestamp || 0);
        break;
      case 'relevance':
        // 综合评分：种子数权重 0.5 + 验证权重 0.3 + 时间权重 0.2
        const scoreA = ((a.maxSeeds || a.seeds) * 0.5) + (a.verified ? 300 : 0) + (Date.now() - (a.timestamp || 0)) * 0.0001;
        const scoreB = ((b.maxSeeds || b.seeds) * 0.5) + (b.verified ? 300 : 0) + (Date.now() - (b.timestamp || 0)) * 0.0001;
        comparison = scoreB - scoreA;
        break;
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  return processed;
}

export function filterResults(
  results: TorrentResult[],
  filters: {
    category?: string;
    minSize?: number;
    maxSize?: number;
    verifiedOnly?: boolean;
    timeRange?: 'all' | 'day' | 'week' | 'month' | 'year';
  } = {}
): TorrentResult[] {
  const { category, minSize, maxSize, verifiedOnly, timeRange } = filters;
  
  return results.filter(result => {
    // 分类过滤
    if (category && category !== 'all' && result.category !== category) return false;
    
    // 大小过滤
    if (minSize && result.sizeBytes < minSize) return false;
    if (maxSize && result.sizeBytes > maxSize) return false;
    
    // 验证过滤
    if (verifiedOnly && !result.verified) return false;
    
    // 时间范围过滤
    if (timeRange && timeRange !== 'all') {
      const now = Date.now();
      const thresholds: Record<string, number> = {
        day: 86400000,
        week: 604800000,
        month: 2592000000,
        year: 31536000000,
      };
      if (now - (result.timestamp || 0) > thresholds[timeRange]) {
        return false;
      }
    }
    
    return true;
  });
}
