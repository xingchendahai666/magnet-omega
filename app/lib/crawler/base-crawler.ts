/**
 * 爬虫基类：抽象通用逻辑、重试机制、代理管理、请求配置、速率控制
 * 所有具体引擎爬虫必须继承此类并实现 crawl 方法
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
  maxConcurrent?: number;
  enableLogging?: boolean;
}

export abstract class BaseCrawler {
  protected config: Required<CrawlerConfig>;
  protected agent: any;
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;
  protected activeRequests: number = 0;
  protected requestQueue: Array<() => void> = [];
  protected logger: (...args: any[]) => void;

  constructor(config: CrawlerConfig = {}) {
    this.config = {
      timeout: 15000,
      retries: 3,
      proxy: process.env.PROXY_URL || '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: {},
      delayBetweenRequests: 1000,
      maxConcurrent: 5,
      enableLogging: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.logger = this.config.enableLogging 
      ? (...args) => console.log(`[${this.constructor.name}]`, ...args)
      : () => {};

    if (this.config.proxy) {
      this.agent = new HttpsProxyAgent(this.config.proxy);
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async rateLimit(): Promise<void> {
    // 并发控制
    while (this.activeRequests >= this.config.maxConcurrent) {
      await new Promise<void>(resolve => this.requestQueue.push(resolve));
    }
    
    // 延迟控制
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
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

        this.logger(`✅ Fetch success: ${url} (${response.status})`);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger(`❌ Fetch attempt ${attempt + 1} failed: ${lastError.message}`);
        
        if (attempt < this.config.retries) {
          const backoff = Math.min(Math.pow(2, attempt) * 1000 + Math.random() * 500, 10000);
          this.logger(`⏳ Retrying in ${backoff.toFixed(0)}ms...`);
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

  updateConfig(newConfig: Partial<CrawlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.proxy && newConfig.proxy !== this.config.proxy) {
      this.agent = new HttpsProxyAgent(newConfig.proxy);
    }
    this.logger('🔄 Config updated');
  }

  destroy(): void {
    this.requestQueue = [];
    this.logger('🗑️ Crawler destroyed');
  }
           }
