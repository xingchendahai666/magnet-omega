import type { EnginePlugin } from './types';
import * as enginePlugins from './plugins'; // 自动导入 plugins/index.ts 的所有导出

// 过滤并排序：Tier 1 优先 → 按 ID 字母排序
export const ENGINE_REGISTRY: EnginePlugin[] = Object.values(enginePlugins)
  .filter((p): p is EnginePlugin => typeof p === 'object' && p !== null && 'crawl' in p)
  .sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));

export const ENABLED_ENGINES = ENGINE_REGISTRY.filter(e => e.enabled);
