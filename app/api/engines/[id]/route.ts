import { NextRequest, NextResponse } from 'next/server';
import { AdvancedCrawler } from '@/lib/crawler/AdvancedCrawler';
import { LRUCache } from '@/lib/cache';
import { RateLimiter } from '@/lib/crawler/rate-limiter';
import { ENGINE_REGISTRY } from '@/lib/engines/registry';

// 初始化引擎专用缓存和限流器
const engineStatsCache = new LRUCache<string, any>(50, 3600);
const testRateLimiter = new RateLimiter({ maxRequests: 5, timeWindow: 60000 }); // 每分钟每引擎限测5次

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: 获取特定引擎的详细状态和统计信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const engineId = params.id.toLowerCase();
  
  // 1. 验证引擎是否存在
  const engineConfig = ENGINE_REGISTRY.find(e => e.id.toLowerCase() === engineId);
  if (!engineConfig) {
    return NextResponse.json(
      { error: 'Engine not found', availableEngines: ENGINE_REGISTRY.map(e => e.id) },
      { status: 404 }
    );
  }

  // 2. 尝试从缓存获取统计信息
  const cachedStats = engineStatsCache.get(engineId);
  if (cachedStats) {
    return NextResponse.json({
      success: true,
      engine: engineConfig,
      stats: cachedStats,
      source: 'cache',
    });
  }

  // 3. 如果没有缓存，返回基础信息
  return NextResponse.json({
    success: true,
    engine: {
      ...engineConfig,
      baseUrl: undefined, // 隐藏敏感 baseUrl
    },
    stats: {
      totalSearches: 0,
      avgResponseTime: 0,
      successRate: 0,
      lastChecked: null,
      status: 'unknown',
    },
    source: 'live',
  });
}

// POST: 触发特定引擎的实时测试搜索
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const engineId = params.id.toLowerCase();
  const { query = 'ubuntu', timeout = 10000 } = await request.json();

  // 1. 限流检查
  try {
    await testRateLimiter.acquire();
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before testing again.', retryAfter: 60 },
      { status: 429 }
    );
  }

  // 2. 验证引擎
  const engineConfig = ENGINE_REGISTRY.find(e => e.id.toLowerCase() === engineId);
  if (!engineConfig) {
    return NextResponse.json({ error: 'Engine not found' }, { status: 404 });
  }

  const startTime = Date.now();
  const crawler = new AdvancedCrawler({ timeout, retries: 1 }); // 测试时减少重试以加快速度

  try {
    // 3. 动态调用爬虫方法
    const crawlMethod = (crawler as any)[`crawl${engineConfig.name.replace(/\s/g, '')}`];
    if (!crawlMethod) {
      throw new Error(`Crawler method not implemented for ${engineConfig.name}`);
    }

    const results = await crawlMethod.call(crawler, query);
    const responseTime = Date.now() - startTime;

    // 4. 更新统计缓存
    const stats = {
      totalSearches: 1,
      avgResponseTime: responseTime,
      successRate: 100,
      lastChecked: new Date().toISOString(),
      resultCount: results.length,
      status: 'healthy',
    };
    engineStatsCache.set(engineId, stats);

    return NextResponse.json({
      success: true,
      engine: engineConfig.name,
      query,
      resultsCount: results.length,
      responseTime,
      sampleResults: results.slice(0, 3), // 只返回前3个作为样本
      stats,
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // 记录失败统计
    engineStatsCache.set(engineId, {
      totalSearches: 1,
      avgResponseTime: responseTime,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      status: 'error',
      lastError: error.message,
    });

    return NextResponse.json(
      {
        success: false,
        engine: engineConfig.name,
        error: error.message,
        responseTime,
        status: 'unhealthy',
      },
      { status: 500 }
    );
  }
}

// DELETE: 软删除/禁用引擎 (模拟配置更新)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const engineId = params.id.toLowerCase();
  const engineConfig = ENGINE_REGISTRY.find(e => e.id.toLowerCase() === engineId);
  
  if (!engineConfig) {
    return NextResponse.json({ error: 'Engine not found' }, { status: 404 });
  }

  // 在实际生产中，这里应该更新数据库或配置文件
  // 这里我们只是清除缓存并返回消息
  engineStatsCache.delete(engineId);

  return NextResponse.json({
    success: true,
    message: `Engine ${engineConfig.name} configuration reset. Note: Permanent changes require env vars or DB update.`,
  });
  }
