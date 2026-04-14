/**
 * 爬虫基类：抽象通用逻辑、重试机制、代理管理、请求配置
 */

import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface CrawlerConfig {
  timeout?: number;
  retries?: number;
  proxy?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  delayBetweenRequests?: number;
}

export abstract class BaseCrawler {
  protected config: Required<CrawlerConfig>;
  protected agent: any;
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;

  constructor(config: CrawlerConfig = {}) {
    this.config = {
      timeout: 15000,
      retries: 3,
      proxy: process.env.PROXY_URL || '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: {},
      delayBetweenRequests: 1000,
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
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.delayBetweenRequests) {
      await this.delay(this.config.delayBetweenRequests - elapsed);
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
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
            ...this.config.headers,
            ...options.headers,
          },
          agent: this.agent,
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await this.delay(backoff);
        }
      }
    }
    
    throw lastError || new Error('Unknown error');
  }

  abstract crawl(query: string, page?: number, sort?: string): Promise<any[]>;

  getStats(): { requestCount: number; lastRequestTime: number } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
      }
