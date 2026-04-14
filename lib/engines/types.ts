import { TorrentResult } from '@/lib/types';

export interface EnginePlugin {
  id: string;              // 唯一标识 (如 'piratebay')
  name: string;            // 显示名称
  tier: 1 | 2 | 3 | 4;     // 优先级分级
  enabled: boolean;        // 是否默认启用
  crawl(query: string, page?: number, sort?: string): Promise<TorrentResult[]>;
}
