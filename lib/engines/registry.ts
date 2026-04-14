/**
 * 引擎注册表
 * 自动注册所有可用搜索引擎
 */

import { EngineConfig } from './types';

// 引擎配置列表
export const ENGINE_REGISTRY: EngineConfig[] = [
  {
    id: 'piratebay',
    name: 'PirateBay',
    baseUrl: 'https://apibay.org',
    enabled: true,
    category: 'magnet',
    tier: 1,
  },
  {
    id: '1337x',
    name: '1337x',
    baseUrl: 'https://1337x.to',
    enabled: true,
    category: 'magnet',
    tier: 2,
  },
  {
    id: 'yts',
    name: 'YTS',
    baseUrl: 'https://yts.mx',
    enabled: true,
    category: 'movie',
    tier: 1,
  },
  {
    id: 'nyaa',
    name: 'Nyaa.si',
    baseUrl: 'https://nyaa.si',
    enabled: true,
    category: 'anime',
    tier: 2,
  },
  {
    id: 'eztv',
    name: 'EZTV',
    baseUrl: 'https://eztvx.to',
    enabled: true,
    category: 'tv',
    tier: 2,
  },
  {
    id: 'torlock',
    name: 'TorLock',
    baseUrl: 'https://www.torlock2.com',
    enabled: true,
    category: 'magnet',
    tier: 3,
  },
  {
    id: 'zooqle',
    name: 'Zooqle',
    baseUrl: 'https://zooqle.com',
    enabled: true,
    category: 'magnet',
    tier: 3,
  },
  {
    id: 'magnetdl',
    name: 'MagnetDL',
    baseUrl: 'https://magnetdl.com',
    enabled: true,
    category: 'magnet',
    tier: 3,
  },
];

// 获取已启用的引擎
export const ENABLED_ENGINES = ENGINE_REGISTRY.filter(e => e.enabled);

// 根据 ID 获取引擎配置
export function getEngineById(id: string): EngineConfig | undefined {
  return ENGINE_REGISTRY.find(engine => engine.id === id);
}

// 获取所有引擎分类
export function getEngineCategories(): string[] {
  return Array.from(new Set(ENGINE_REGISTRY.map(e => e.category)));
  }
