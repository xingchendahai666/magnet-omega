import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 内存中的统计数据（Vercel Serverless 环境，每次请求独立，此处使用全局变量模拟会话级统计）
// 生产环境建议替换为 Redis/数据库
const stats: {
  totalSearches: number;
  totalResults: number;
  totalErrors: number;
  engineStats: Record<string, { searches: number; results: number; errors: number; avgResponseTime: number }>;
  lastUpdated: number;
  startTime: number;
} = {
  totalSearches: 0,
  totalResults: 0,
  totalErrors: 0,
  engineStats: {},
  lastUpdated: Date.now(),
  startTime: Date.now(),
};

function updateEngineStats(engine: string, results: number, responseTime: number, success: boolean) {
  if (!stats.engineStats[engine]) {
    stats.engineStats[engine] = { searches: 0, results: 0, errors: 0, avgResponseTime: 0 };
  }
  
  const engineStat = stats.engineStats[engine];
  engineStat.searches++;
  engineStat.results += results;
  if (!success) engineStat.errors++;
  
  // 移动平均响应时间
  engineStat.avgResponseTime = engineStat.avgResponseTime === 0 
    ? responseTime 
    : (engineStat.avgResponseTime * 0.7 + responseTime * 0.3);
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action') || 'get';
  const engine = request.nextUrl.searchParams.get('engine');

  switch (action) {
    case 'get':
      return NextResponse.json({
        success: true,
         {
          ...stats,
          uptime: Math.floor((Date.now() - stats.startTime) / 1000),
          searchesPerSecond: stats.totalSearches / Math.max(1, (Date.now() - stats.startTime) / 1000),
        },
      });

    case 'engine':
      if (!engine) {
        return NextResponse.json({ error: 'Engine parameter is required' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        engine,
        stats: stats.engineStats[engine] || null,
      });

    case 'top-engines':
      const sorted = Object.entries(stats.engineStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.results - a.results)
        .slice(0, 10);
      return NextResponse.json({ success: true, data: sorted });

    default:
      return NextResponse.json({ error: 'Invalid action. Use: get, engine, top-engines' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, engine, results = 0, responseTime = 0, success = true } = body;

    if (action === 'record') {
      if (!engine) {
        return NextResponse.json({ error: 'Engine is required' }, { status: 400 });
      }
      
      stats.totalSearches++;
      stats.totalResults += results;
      if (!success) stats.totalErrors++;
      stats.lastUpdated = Date.now();
      
      updateEngineStats(engine, results, responseTime, success);
      
      return NextResponse.json({ success: true });
    }

    if (action === 'reset') {
      stats.totalSearches = 0;
      stats.totalResults = 0;
      stats.totalErrors = 0;
      stats.engineStats = {};
      stats.lastUpdated = Date.now();
      stats.startTime = Date.now();
      return NextResponse.json({ success: true, message: 'Stats reset successfully' });
    }

    return NextResponse.json({ error: 'Invalid action. Use: record, reset' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  stats.totalSearches = 0;
  stats.totalResults = 0;
  stats.totalErrors = 0;
  stats.engineStats = {};
  stats.lastUpdated = Date.now();
  stats.startTime = Date.now();
  
  return NextResponse.json({ success: true, message: 'All stats cleared' });
}
