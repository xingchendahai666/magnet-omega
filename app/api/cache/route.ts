import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 简单的内存缓存（Vercel Serverless 环境）
const cache = new Map<string, { value: any; timestamp: number; ttl: number; hits: number }>();

function cleanupExpired() {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > item.ttl * 1000) {
      cache.delete(key);
      expiredCount++;
    }
  }
  
  return expiredCount;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action') || 'stats';
  const key = request.nextUrl.searchParams.get('key');

  switch (action) {
    case 'stats': {
      cleanupExpired();
      const now = Date.now();
      let validItems = 0;
      let expiredItems = 0;
      let totalHits = 0;
      
      for (const item of cache.values()) {
        if (now - item.timestamp < item.ttl * 1000) {
          validItems++;
          totalHits += item.hits;
        } else {
          expiredItems++;
        }
      }
      
      return NextResponse.json({
        success: true,
        stats: {
          total: cache.size,
          valid: validItems,
          expired: expiredItems,
          totalHits,
          keys: Array.from(cache.keys()).slice(0, 50), // 限制返回数量
        },
      });
    }

    case 'get': {
      if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
      }
      
      const item = cache.get(key);
      if (!item) {
        return NextResponse.json({ success: false, data: null, reason: 'not_found' });
      }
      
      if (Date.now() - item.timestamp > item.ttl * 1000) {
        cache.delete(key);
        return NextResponse.json({ success: false, data: null, reason: 'expired' });
      }
      
      item.hits++;
      return NextResponse.json({ success: true, data: item.value, hits: item.hits });
    }

    case 'clear': {
      const count = cache.size;
      cache.clear();
      return NextResponse.json({ success: true, message: `Cleared ${count} items` });
    }

    case 'cleanup': {
      const expired = cleanupExpired();
      return NextResponse.json({ success: true, expiredCount: expired });
    }

    default:
      return NextResponse.json({ error: 'Invalid action. Use: stats, get, clear, cleanup' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, value, ttl = 3600 } = body;

    if (action === 'set') {
      if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
      }
      
      cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl,
        hits: 0,
      });
      
      return NextResponse.json({ success: true, message: 'Item cached successfully' });
    }

    if (action === 'delete') {
      if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
      }
      
      const existed = cache.delete(key);
      return NextResponse.json({ success: true, deleted: existed });
    }

    if (action === 'setMany') {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
      }
      
      let count = 0;
      for (const item of body.items) {
        if (item.key) {
          cache.set(item.key, {
            value: item.value,
            timestamp: Date.now(),
            ttl: item.ttl || ttl,
            hits: 0,
          });
          count++;
        }
      }
      
      return NextResponse.json({ success: true, message: `Cached ${count} items` });
    }

    return NextResponse.json({ error: 'Invalid action. Use: set, delete, setMany' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  
  if (key) {
    const existed = cache.delete(key);
    return NextResponse.json({ success: true, deleted: existed });
  }
  
  const count = cache.size;
  cache.clear();
  return NextResponse.json({ success: true, message: `Cleared ${count} items` });
    }
