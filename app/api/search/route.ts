import { NextRequest, NextResponse } from 'next/server';
import { AdvancedCrawler } from '@/lib/crawler/AdvancedCrawler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const ENABLED_ENGINES = [
  'piratebay',
  '1337x',
  'yts',
  'nyaa',
  'eztv',
  'torlock',
  'zooqle',
  'magnetdl',
];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const engine = request.nextUrl.searchParams.get('engine');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const crawler = new AdvancedCrawler({
    timeout: 15000,
    retries: 2,
  });

  try {
    let results = [];

    if (engine && engine !== 'all') {
      const engineMethods: Record<string, () => Promise<any[]>> = {
        'piratebay': () => crawler.crawlPirateBay(query),
        '1337x': () => crawler.crawl1337x(query),
        'yts': () => crawler.crawlYTS(query),
        'nyaa': () => crawler.crawlNyaa(query),
        'eztv': () => crawler.crawlEZTV(query),
        'torlock': () => crawler.crawlTorlock(query),
        'zooqle': () => crawler.crawlZooqle(query),
        'magnetdl': () => crawler.crawlMagnetDL(query),
      };

      const crawlMethod = engineMethods[engine];
      if (crawlMethod) {
        results = await crawlMethod();
      }
    } else {
      const promises = ENABLED_ENGINES.map(async (eng) => {
        try {
          const engineMethods: Record<string, () => Promise<any[]>> = {
            'piratebay': () => crawler.crawlPirateBay(query),
            '1337x': () => crawler.crawl1337x(query),
            'yts': () => crawler.crawlYTS(query),
            'nyaa': () => crawler.crawlNyaa(query),
            'eztv': () => crawler.crawlEZTV(query),
            'torlock': () => crawler.crawlTorlock(query),
            'zooqle': () => crawler.crawlZooqle(query),
            'magnetdl': () => crawler.crawlMagnetDL(query),
          };

          const crawlMethod = engineMethods[eng];
          if (crawlMethod) {
            return await crawlMethod();
          }
          return [];
        } catch (err) {
          console.error(`Engine ${eng} error:`, err);
          return [];
        }
      });

      const allResults = await Promise.all(promises);
      results = allResults.flat();
    }

    const uniqueResults = Array.from(
      new Map(results.map((item: any) => [item.infoHash, item])).values()
    );

    uniqueResults.sort((a: any, b: any) => (b.seeds || 0) - (a.seeds || 0));

    return NextResponse.json({
      results: uniqueResults,
      total: uniqueResults.length,
      query,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      total: 0,
    }, { status: 500 });
  }
}
