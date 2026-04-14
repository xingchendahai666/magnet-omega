/**
 * 引擎类型定义
 */

export interface EngineConfig {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  category: string;
  tier: 1 | 2 | 3 | 4;
  description?: string;
  timeout?: number;
}

export interface EngineStats {
  id: string;
  totalSearches: number;
  avgResponseTime: number;
  successRate: number;
  lastChecked?: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}
