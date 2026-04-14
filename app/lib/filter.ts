/**
 * 过滤器：高级过滤、范围查询、组合条件、预设模板、过滤统计
 */

import { TorrentResult } from '@/lib/types';

export interface FilterConfig {
  category?: string;
  minSize?: number;
  maxSize?: number;
  minSeeds?: number;
  maxSeeds?: number;
  minLeechs?: number;
  maxLeechs?: number;
  verifiedOnly?: boolean;
  timeRange?: 'all' | 'day' | 'week' | 'month' | 'year' | 'custom';
  customTimeStart?: number;
  customTimeEnd?: number;
  engines?: string[];
  quality?: string[];
  excludeKeywords?: string[];
  includeKeywords?: string[];
  excludeExtensions?: string[];
  includeExtensions?: string[];
}

export interface FilterResult {
  filtered: TorrentResult[];
  stats: {
    total: number;
    filtered: number;
    removed: number;
    removalReasons: Record<string, number>;
    filters: string[];
    timeMs: number;
  };
}

export function filterResults(
  results: TorrentResult[],
  config: FilterConfig
): FilterResult {
  const startTime = Date.now();
  
  if (results.length === 0) {
    return {
      filtered: [],
      stats: { total: 0, filtered: 0, removed: 0, removalReasons: {}, filters: [], timeMs: 0 },
    };
  }

  const filters: string[] = [];
  const removalReasons: Record<string, number> = {};
  let filtered = [...results];

  // 分类过滤
  if (config.category && config.category !== 'all') {
    const before = filtered.length;
    filtered = filtered.filter(r => r.category === config.category);
    if (filtered.length < before) {
      removalReasons['category'] = before - filtered.length;
      filters.push(`category:${config.category}`);
    }
  }

  // 大小过滤
  if (config.minSize !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(r => r.sizeBytes >= config.minSize!);
    if (filtered.length < before) {
      removalReasons['minSize'] = before - filtered.length;
      filters.push(`minSize:${config.minSize}`);
    }
  }
  if (config.maxSize !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(r => r.sizeBytes <= config.maxSize!);
    if (filtered.length < before) {
      removalReasons['maxSize'] = before - filtered.length;
      filters.push(`maxSize:${config.maxSize}`);
    }
  }

  // 种子数过滤
  if (config.minSeeds !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(r => (r.maxSeeds || r.seeds || 0) >= config.minSeeds!);
    if (filtered.length < before) {
      removalReasons['minSeeds'] = before - filtered.length;
      filters.push(`minSeeds:${config.minSeeds}`);
    }
  }
  if (config.maxSeeds !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(r => (r.maxSeeds || r.seeds || 0) <= config.maxSeeds!);
    if (filtered.length < before) {
      removalReasons['maxSeeds'] = before - filtered.length;
      filters.push(`maxSeeds:${config.maxSeeds}`);
    }
  }

  // 下载者数过滤
  if (config.minLeechs !== undefined) {
    const before = filtered.length;
    filtered = filtered.filter(r => (r.maxLeechs || r.leechs || 0) >= config.minLeechs!);
    if (filtered.length < before) {
      removalReasons['minLeechs'] = before - filtered.length;
      filters.push(`minLeechs:${config.minLeechs}`);
    }
  }

  // 验证过滤
  if (config.verifiedOnly) {
    const before = filtered.length;
    filtered = filtered.filter(r => r.verified);
    if (filtered.length < before) {
      removalReasons['verifiedOnly'] = before - filtered.length;
      filters.push('verifiedOnly');
    }
  }

  // 时间范围过滤
  if (config.timeRange && config.timeRange !== 'all') {
    const now = Date.now();
    let threshold: number;
    
    switch (config.timeRange) {
      case 'day': threshold = 86400000; break;
      case 'week': threshold = 604800000; break;
      case 'month': threshold = 2592000000; break;
      case 'year': threshold = 31536000000; break;
      case 'custom':
        threshold = (config.customTimeEnd || now) - (config.customTimeStart || 0);
        break;
      default: threshold = Infinity;
    }
    
    const before = filtered.length;
    filtered = filtered.filter(r => {
      const itemTime = r.timestamp || 0;
      if (config.timeRange === 'custom') {
        return itemTime >= (config.customTimeStart || 0) && itemTime <= (config.customTimeEnd || now);
      }
      return (now - itemTime) <= threshold;
    });
    if (filtered.length < before) {
      removalReasons['timeRange'] = before - filtered.length;
      filters.push(`timeRange:${config.timeRange}`);
    }
  }

  // 引擎过滤
  if (config.engines && config.engines.length > 0) {
    const before = filtered.length;
    filtered = filtered.filter(r => config.engines!.includes(r.engineId || r.engine));
    if (filtered.length < before) {
      removalReasons['engines'] = before - filtered.length;
      filters.push(`engines:${config.engines.join(',')}`);
    }
  }

  // 质量过滤
  if (config.quality && config.quality.length > 0) {
    const before = filtered.length;
    filtered = filtered.filter(r => r.quality && config.quality!.includes(r.quality));
    if (filtered.length < before) {
      removalReasons['quality'] = before - filtered.length;
      filters.push(`quality:${config.quality.join(',')}`);
    }
  }

  // 排除关键词
  if (config.excludeKeywords && config.excludeKeywords.length > 0) {
    const before = filtered.length;
    const excludes = config.excludeKeywords.map(k => k.toLowerCase());
    filtered = filtered.filter(r => {
      const title = r.title.toLowerCase();
      return !excludes.some(ex => title.includes(ex));
    });
    if (filtered.length < before) {
      removalReasons['excludeKeywords'] = before - filtered.length;
      filters.push(`exclude:${config.excludeKeywords.join(',')}`);
    }
  }

  // 包含关键词
  if (config.includeKeywords && config.includeKeywords.length > 0) {
    const before = filtered.length;
    const includes = config.includeKeywords.map(k => k.toLowerCase());
    filtered = filtered.filter(r => {
      const title = r.title.toLowerCase();
      return includes.some(inc => title.includes(inc));
    });
    if (filtered.length < before) {
      removalReasons['includeKeywords'] = before - filtered.length;
      filters.push(`include:${config.includeKeywords.join(',')}`);
    }
  }

  // 排除扩展名
  if (config.excludeExtensions && config.excludeExtensions.length > 0) {
    const before = filtered.length;
    const excludes = config.excludeExtensions.map(e => e.toLowerCase().replace(/^\./, ''));
    filtered = filtered.filter(r => {
      const title = r.title.toLowerCase();
      return !excludes.some(ext => title.endsWith(`.${ext}`));
    });
    if (filtered.length < before) {
      removalReasons['excludeExtensions'] = before - filtered.length;
      filters.push(`excludeExt:${config.excludeExtensions.join(',')}`);
    }
  }

  return {
    filtered,
    stats: {
      total: results.length,
      filtered: filtered.length,
      removed: results.length - filtered.length,
      removalReasons,
      filters,
      timeMs: Date.now() - startTime,
    },
  };
}

export function createFilter(config: FilterConfig) {
  return (results: TorrentResult[]): FilterResult => {
    return filterResults(results, config);
  };
}

export function getFilterPresets(): Record<string, FilterConfig> {
  return {
    highQuality: {
      minSeeds: 50,
      verifiedOnly: true,
      quality: ['1080p', '720p', '4K', '2160p', 'Bluray', 'Remux'],
      minSize: 500 * 1024 * 1024, // 500MB
    },
    recent: {
      timeRange: 'week',
      minSeeds: 10,
    },
    largeFiles: {
      minSize: 1024 * 1024 * 1024, // 1GB
      minSeeds: 20,
    },
    smallFiles: {
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    popular: {
      minSeeds: 100,
      verifiedOnly: true,
    },
    verified: {
      verifiedOnly: true,
      minSeeds: 5,
    },
    clean: {
      excludeKeywords: ['sample', 'proof', 'nfo', 'sfv'],
      excludeExtensions: ['nfo', 'sfv', 'txt', 'jpg', 'png'],
    },
  };
}

export function applyFilterPreset(results: TorrentResult[], presetName: string): FilterResult {
  const presets = getFilterPresets();
  const config = presets[presetName] || {};
  return filterResults(results, config);
}

export function getFilterStats(results: TorrentResult[]): {
  sizeRange: { min: number; max: number; avg: number };
  seedRange: { min: number; max: number; avg: number };
  dateRange: { oldest: number; newest: number };
  categoryDistribution: Record<string, number>;
  engineDistribution: Record<string, number>;
  verifiedCount: number;
} {
  if (results.length === 0) {
    return {
      sizeRange: { min: 0, max: 0, avg: 0 },
      seedRange: { min: 0, max: 0, avg: 0 },
      dateRange: { oldest: 0, newest: 0 },
      categoryDistribution: {},
      engineDistribution: {},
      verifiedCount: 0,
    };
  }

  const sizes = results.map(r => r.sizeBytes);
  const seeds = results.map(r => r.maxSeeds || r.seeds || 0);
  const timestamps = results.map(r => r.timestamp || 0).filter(t => t > 0);
  
  const categoryDist: Record<string, number> = {};
  const engineDist: Record<string, number> = {};
  let verifiedCount = 0;
  
  results.forEach(r => {
    categoryDist[r.category || 'Unknown'] = (categoryDist[r.category || 'Unknown'] || 0) + 1;
    engineDist[r.engine] = (engineDist[r.engine] || 0) + 1;
    if (r.verified) verifiedCount++;
  });

  return {
    sizeRange: {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
      avg: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    },
    seedRange: {
      min: Math.min(...seeds),
      max: Math.max(...seeds),
      avg: seeds.reduce((a, b) => a + b, 0) / seeds.length,
    },
    dateRange: {
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    },
    categoryDistribution: categoryDist,
    engineDistribution: engineDist,
    verifiedCount,
  };
}
