export interface TorrentResult {
  id: string;
  title: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  leechs: number;
  date: string;
  timestamp: number;
  magnet: string;
  infoHash: string;
  engine: string;
  engineId: string;
  category: string;
  uploader?: string;
  quality?: string;
  language?: string;
  verified: boolean;
  source: string;
  url: string;
  engines?: string[];
  maxSeeds?: number;
  maxLeechs?: number;
  addedDate?: number;
  files?: Array<{ name: string; size: number }>;
  linkStatus?: 'active' | 'inactive' | 'checking';
  downloadCount?: number;
  comments?: number;
}

export interface EngineConfig {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  baseUrl: string;
  enabled: boolean;
  icon?: string;
  color?: string;
  supportsStream?: boolean;
  timeout?: number;
}

export interface SearchFilters {
  sortBy: 'relevance' | 'seeds' | 'leechs' | 'size' | 'date' | 'quality';
  sortOrder: 'asc' | 'desc';
  category: string;
  minSize?: number;
  maxSize?: number;
  minSeeds?: number;
  timeRange?: 'all' | 'day' | 'week' | 'month' | 'year';
  quality?: string[];
  verifiedOnly?: boolean;
}

export interface MagnetLinkInfo {
  infoHash: string;
  name: string;
  length: number;
  files: Array<{
    name: string;
    length: number;
  }>;
  announce: string[];
}

export interface EngineStats {
  total: number;
  enabled: number;
  disabled: number;
  successRate: number;
  avgResponseTime: number;
  }
