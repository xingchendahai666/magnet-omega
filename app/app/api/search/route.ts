import { NextRequest } from 'next/server';
import { ENABLED_ENGINES } from '@/lib/engines/registry';
import { searchYTS } from '@/lib/engines/tier1/yts';
import { searchPirateBay } from '@/lib/engines/tier1/piratebay';
import { mergeResults } from '@/lib/merger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 引擎适配器映射
const ENGINE_ADAPTERS: Record<string, (q: string, cfg: any) => Promise<any[]>> = {
  'yts': searchYTS,
  'piratebay': searchPirateBay,
  // 其他引擎按需添加...
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) {
    return new Response('Missing query', { status: 400 });
  }

  // 创建 ReadableStream 实现 SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const results: any[] = [];
      const engineStatus: Record<string, string> = {};
      
      // 发送初始状态
      controller.enqueue(encoder.encode(`event: status\n ${JSON.stringify({ phase: 'start', query, engines: ENABLED_ENGINES.length })}\n\n`));

      // 并行搜索所有启用的引擎
      const promises = ENABLED_ENGINES.map(async (engine) => {
        engineStatus[engine.id] = 'searching';
        controller.enqueue(encoder.encode(`event: engine\n ${JSON.stringify({ id: engine.id, status: 'searching' })}\n\n`));
        
        try {
          const adapter = ENGINE_ADAPTERS[engine.id];
          if (!adapter) {
            engineStatus[engine.id] = 'skipped';
            return;
          }
          
          const engineResults = await adapter(query, engine);
          results.push(...engineResults);
          
          engineStatus[engine.id] = 'done';
          controller.enqueue(encoder.encode(`event: engine\n ${JSON.stringify({ id: engine.id, status: 'done', count: engineResults.length })}\n\n`));
          
          // 实时推送当前聚合结果
          const merged = mergeResults([...results]);
          controller.enqueue(encoder.encode(`event: results\n ${JSON.stringify({ results: merged.slice(0, 50), total: merged.length, engines: engineStatus })}\n\n`));
          
        } catch (error) {
          engineStatus[engine.id] = 'error';
          controller.enqueue(encoder.encode(`event: engine\n ${JSON.stringify({ id: engine.id, status: 'error', error: String(error) })}\n\n`));
        }
      });

      await Promise.allSettled(promises);
      
      // 发送最终结果
      const finalMerged = mergeResults(results);
      controller.enqueue(encoder.encode(`event: results\n ${JSON.stringify({ results: finalMerged, total: finalMerged.length, engines: engineStatus, done: true })}\n\n`));
      controller.enqueue(encoder.encode(`event: status\n ${JSON.stringify({ phase: 'done' })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
        }
