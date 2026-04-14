import { NextRequest, NextResponse } from 'next/server';

// 内存中的统计数据
const stats = {
  totalSearches: 0,
  totalResults: 0,
  totalErrors: 0,
  engineStats: {} as Record<string, { searches: number; results: number; errors: number; avgResponseTime: number }>,
  lastUpdated: Date.now(),
  startTime: Date.now(),
};

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action') || 'get';
  const engine = request.nextUrl.searchParams.get('engine');

  switch (action) {
    case 'get':
      return NextResponse.json({
        success: true,
        data: {
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

      // 更新引擎统计
      if (!stats.engineStats[engine]) {
        stats.engineStats[engine] = { searches: 0, results: 0, errors: 0, avgResponseTime: 0 };
      }
      const engineStat = stats.engineStats[engine];
      engineStat.searches++;
      engineStat.results += results;
      if (!success) engineStat.errors++;

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
