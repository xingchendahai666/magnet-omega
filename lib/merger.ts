export interface TorrentResult {
  id: string;
  title: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  leechs: number;
  date: string;
  magnet: string;
  infoHash: string;
  engine: string;
  engineId: string;
  category?: string;
  quality?: string;
  verified: boolean;
  source: string;
  engines?: string[]; // 多源标记
  maxSeeds?: number;
  maxLeechs?: number;
  addedDate?: number;
}

export function mergeResults(results: TorrentResult[]): TorrentResult[] {
  const map = new Map<string, TorrentResult>();
  
  for (const item of results) {
    // 基于 infoHash 去重
    const key = item.infoHash.toLowerCase();
    
    if (map.has(key)) {
      const existing = map.get(key)!;
      // 合并多源标记
      if (!existing.engines) existing.engines = [existing.engine];
      if (!existing.engines.includes(item.engine)) {
        existing.engines.push(item.engine);
      }
      // 取最大种子数
      existing.maxSeeds = Math.max(existing.maxSeeds || existing.seeds, item.seeds);
      existing.maxLeechs = Math.max(existing.maxLeechs || existing.leechs, item.leechs);
      // 取最早日期
      const itemDate = new Date(item.date).getTime();
      const existDate = new Date(existing.date).getTime();
      if (itemDate < existDate) {
        existing.date = item.date;
        existing.addedDate = itemDate;
      }
      // 标记为已验证如果任一源已验证
      if (item.verified) existing.verified = true;
    } else {
      map.set(key, {
        ...item,
        engines: [item.engine],
        maxSeeds: item.seeds,
        maxLeechs: item.leechs,
        addedDate: new Date(item.date).getTime()
      });
    }
  }
  
  return Array.from(map.values()).sort((a, b) => (b.maxSeeds || b.seeds) - (a.maxSeeds || a.seeds));
}
