import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { TorrentResult } from '@/lib/types';

export interface CrawlerConfig {
  timeout?: number;
  retries?: number;
  proxy?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  delayBetweenRequests?: number;
  maxConcurrent?: number;
}

export abstract class BaseCrawler {
  protected config: Required<CrawlerConfig>;
  protected agent: any;
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;
  protected activeRequests: number = 0;
  protected requestQueue: Array<() => void> = [];

  constructor(config: CrawlerConfig = {}) {
    this.config = {
      timeout: 15000,
      retries: 3,
      proxy: process.env.PROXY_URL || '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: {},
      delayBetweenRequests: 1000,
      maxConcurrent: 5,
      ...config,
    };

    if (this.config.proxy) {
      this.agent = new HttpsProxyAgent(this.config.proxy);
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async rateLimit(): Promise<void> {
    while (this.activeRequests >= this.config.maxConcurrent) {
      await new Promise<void>(resolve => this.requestQueue.push(resolve));
    }
    
    const now = Date.now();    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.delayBetweenRequests) {
      await this.delay(this.config.delayBetweenRequests - elapsed);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    this.activeRequests++;
  }

  protected releaseRequest(): void {
    this.activeRequests--;
    const next = this.requestQueue.shift();
    if (next) next();
  }

  protected async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    await this.rateLimit();

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...this.config.headers,
            ...options.headers,
          },
          agent: this.agent,
          signal: controller.signal,
          redirect: 'follow',
          compress: true,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries) {
          const backoff = Math.min(Math.pow(2, attempt) * 1000 + Math.random() * 500, 10000);
          await this.delay(backoff);
        }
      } finally {
        this.releaseRequest();
      }
    }
    
    throw lastError || new Error('Unknown error after retries');
  }

  abstract crawl(query: string, page?: number, sort?: string): Promise<any[]>;

  getStats(): { 
    requestCount: number; 
    lastRequestTime: number; 
    activeRequests: number; 
    queueLength: number;
    config: CrawlerConfig;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      config: this.config,
    };
  }

  destroy(): void {
    this.requestQueue = [];
  }
}

export class AdvancedCrawler extends BaseCrawler {
  async crawlPirateBay(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithRetry(url);
      const data: any[] = await response.json();

      if (!data || data.length === 0 || data[0]?.id === '0') return [];

      return data.map(item => ({        id: `pb_${item.id}`,
        title: this.decodeHtmlEntities(item.name),
        size: this.formatBytes(parseInt(item.size)),
        sizeBytes: parseInt(item.size),
        seeds: parseInt(item.seeders) || 0,
        leechs: parseInt(item.leechers) || 0,
        date: new Date(parseInt(item.added) * 1000).toISOString(),
        timestamp: parseInt(item.added) * 1000,
        magnet: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}`,
        infoHash: item.info_hash.toLowerCase(),
        engine: 'PirateBay',
        engineId: 'piratebay',
        category: this.getCategoryName(item.category),
        uploader: item.username,
        verified: item.status === 'vip' || item.status === 'trusted',
        source: 'api',
        url: `https://thepiratebay.org/description.php?id=${item.id}`,
      }));
    } catch (error) {
      console.error('PirateBay crawl error:', error);
      return [];
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/ /g, ' ');
  }

  private getCategoryName(catId: string): string {
    const categories: Record<string, string> = {
      '100': 'Audio', '200': 'Video', '300': 'Applications', '400': 'Games', '500': 'Porn', '600': 'Other',
    };
    return categories[catId] || 'Other';
  }

  async crawl(query: string, page?: number, sort?: string): Promise<any[]> {    return this.crawlPirateBay(query);
  }
}
